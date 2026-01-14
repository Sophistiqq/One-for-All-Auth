// src/vehicles.ts
import { Elysia, t, sse } from "elysia";
import { validator } from "./plugins/authValidator";
import { prisma } from "../lib/prisma";
import { Vehicle } from "../generated/prisma/client";

type VehicleLocationData = {
  vehicleId: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
};

// In-memory storage for real-time updates (SSE uses this)
export const latestVehicles = new Map<number, Vehicle & { route: any }>();

// Track which vehicles need DB update
export const pendingDBUpdates = new Set<number>();

// Event emitter for real-time SSE updates
type UpdateListener = (vehicles: (Vehicle & { route: any })[]) => void;
const updateListeners = new Set<UpdateListener>();

function notifyVehicleUpdate(vehicle: Vehicle & { route: any }) {
  const updates = [vehicle];
  updateListeners.forEach(listener => listener(updates));
}

// =========================
// Background: Batch DB Persistence (every 20 seconds)
// =========================
setInterval(async () => {
  if (pendingDBUpdates.size === 0) return;

  const vehicleIds = Array.from(pendingDBUpdates);
  pendingDBUpdates.clear();

  console.log(`💾 Batch persisting ${vehicleIds.length} vehicles to database...`);

  try {
    for (const vehicleId of vehicleIds) {
      const vehicle = latestVehicles.get(vehicleId);
      if (!vehicle) continue;

      // Update vehicle table with latest position
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          currentLat: vehicle.currentLat,
          currentLng: vehicle.currentLng,
          heading: vehicle.heading,
          speed: vehicle.speed,
          lastUpdate: vehicle.lastUpdate,
        },
      });

      // Save to location history
      if (vehicle.currentLat && vehicle.currentLng) {
        await prisma.vehicleLocation.create({
          data: {
            vehicleId: vehicle.id,
            latitude: vehicle.currentLat,
            longitude: vehicle.currentLng,
            heading: vehicle.heading,
            speed: vehicle.speed,
            timestamp: vehicle.lastUpdate || new Date(),
          },
        });
      }
    }

    console.log(`✅ Persisted ${vehicleIds.length} vehicles at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error("❌ Error persisting vehicles:", error);
    // Re-add failed updates to retry next cycle
    vehicleIds.forEach(id => pendingDBUpdates.add(id));
  }
}, 20000); // Every 20 seconds

export const vehicles = new Elysia({ prefix: "/vehicles" })
  .use(validator)

  // =========================
  // SSE: Vehicle stream
  // =========================
  .get(
    "/stream",
    async function*({ query }) {
      const { routeId } = query;
      const parsedRouteId = routeId ? Number(routeId) : undefined;

      // Initial payload from database
      const initialVehicles = await prisma.vehicle.findMany({
        where: {
          isActive: true,
          status: "active",
          ...(parsedRouteId && { routeId: parsedRouteId }),
        },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
        },
      });

      // Populate in-memory cache
      for (const vehicle of initialVehicles) {
        latestVehicles.set(vehicle.id, vehicle);
      }

      yield sse({
        event: "initial",
        data: JSON.stringify(initialVehicles),
      });

      // Create update queue for this connection
      const updateQueue: (Vehicle & { route: any })[] = [];

      // Register listener for real-time updates
      const listener: UpdateListener = (vehicles) => {
        const filtered = vehicles.filter(v =>
          !parsedRouteId || v.routeId === parsedRouteId
        );

        if (filtered.length > 0) {
          updateQueue.push(...filtered);
        }
      };

      updateListeners.add(listener);

      try {
        // Poll queue and send updates
        while (true) {
          if (updateQueue.length > 0) {
            const toSend = [...updateQueue];
            updateQueue.length = 0;

            yield sse({
              event: "update",
              data: JSON.stringify(toSend),
            });
          }

          await new Promise((r) => setTimeout(r, 500));
        }
      } finally {
        updateListeners.delete(listener);
      }
    },
    {
      query: t.Object({
        routeId: t.Optional(t.String()),
      }),
    }
  )

  // =========================
  // Get active vehicles
  // =========================
  .get(
    "/",
    async ({ status, query }) => {
      try {
        const parsedRouteId = query.routeId ? Number(query.routeId) : undefined;

        const vehicles = await prisma.vehicle.findMany({
          where: {
            isActive: true,
            status: "active",
            ...(parsedRouteId && { routeId: parsedRouteId }),
          },
          include: {
            route: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { lastUpdate: "desc" },
        });

        return status(200, vehicles);
      } catch (err) {
        return status(500, { message: String(err) });
      }
    },
    {
      query: t.Object({
        routeId: t.Optional(t.String()),
      }),
    }
  )

  // =========================
  // Get single vehicle
  // =========================
  .get("/:id", async ({ params, status }) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: Number(params.id) },
        include: { route: true, driver: true },
      });

      if (!vehicle) return status(404, { message: "Vehicle not found" });

      return status(200, vehicle);
    } catch (err) {
      return status(500, { message: String(err) });
    }
  })

  // =========================
  // Update vehicle location (IN-MEMORY ONLY, batch persist later)
  // =========================
  .post(
    "/:id/location",
    async ({ params, body, status }) => {
      try {
        const { latitude, longitude, heading, speed } = body;
        const vehicleId = Number(params.id);

        // Get existing vehicle data from memory or DB
        let vehicle = latestVehicles.get(vehicleId);

        if (!vehicle) {
          // Load from DB if not in memory
          vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: {
              route: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
                },
              },
            },
          });

          if (!vehicle) {
            return status(404, { message: "Vehicle not found" });
          }
        }

        // Update in-memory vehicle
        const updatedVehicle = {
          ...vehicle,
          currentLat: latitude,
          currentLng: longitude,
          heading: heading ?? vehicle.heading,
          speed: speed ?? vehicle.speed,
          lastUpdate: new Date(),
        };

        // Update in-memory cache
        latestVehicles.set(vehicleId, updatedVehicle);

        // Mark for batch DB update
        pendingDBUpdates.add(vehicleId);

        // Notify SSE listeners immediately
        notifyVehicleUpdate(updatedVehicle);

        return status(200, { message: "Location updated" });
      } catch (err) {
        return status(500, { message: String(err) });
      }
    },
    {
      body: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
        heading: t.Optional(t.Number()),
        speed: t.Optional(t.Number()),
      }),
    }
  )

  // =========================
  // Create vehicle (admin)
  // =========================
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const vehicle = await prisma.vehicle.create({ data: body });
        return status(201, vehicle);
      } catch (err) {
        return status(500, { message: String(err) });
      }
    },
    {
      body: t.Object({
        plateNumber: t.String(),
        type: t.String(),
        capacity: t.Number(),
        routeId: t.Optional(t.Number()),
      }),
      isAdmin: true,
    }
  );
