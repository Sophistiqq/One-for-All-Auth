// src/vehicles.ts
import { Elysia, t, sse } from "elysia"
import { validator } from "./plugins/authValidator";
import { prisma } from "../lib/prisma";

export const vehicles = new Elysia({ prefix: "/vehicles" })
  .use(validator)

  // SSE endpoint for real-time vehicle positions
  .get('/stream', async function*({ query }) {
    const { routeId } = query;

    // Send initial vehicle data immediately
    const initialVehicles = await prisma.vehicle.findMany({
      where: {
        isActive: true,
        status: 'active',
        ...(routeId && { routeId: parseInt(routeId) })
      },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true
          }
        }
      }
    });

    yield sse({
      event: 'initial',
      data: JSON.stringify(initialVehicles)
    });

    // Poll database every 3 seconds for updates
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const vehicles = await prisma.vehicle.findMany({
          where: {
            isActive: true,
            status: 'active',
            ...(routeId && { routeId: parseInt(routeId) })
          },
          include: {
            route: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true
              }
            }
          }
        });

        yield sse({
          event: 'update',
          data: JSON.stringify(vehicles)
        });
      } catch (err) {
        yield sse({
          event: 'error',
          data: JSON.stringify({ message: 'Failed to fetch vehicles' })
        });
      }
    }
  }, {
    query: t.Object({
      routeId: t.Optional(t.String())
    })
  })

  // Get all active vehicles with their current locations
  .get('/', async ({ status, query }) => {
    try {
      const { routeId } = query;

      const vehicles = await prisma.vehicle.findMany({
        where: {
          isActive: true,
          status: 'active',
          ...(routeId && { routeId: parseInt(routeId) })
        },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          lastUpdate: 'desc'
        }
      });

      return status(200, vehicles);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  }, {
    query: t.Object({
      routeId: t.Optional(t.String())
    })
  })

  // Get single vehicle details
  .get('/:id', async ({ params, status }) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: parseInt(params.id) },
        include: {
          route: true,
          driver: true
        }
      });

      if (!vehicle) {
        return status(404, { message: "Vehicle not found" });
      }

      return status(200, vehicle);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  })

  // Update vehicle location (for GPS tracker/driver app)
  .post('/:id/location', async ({ params, body, status }) => {
    try {
      const { latitude, longitude, heading, speed } = body;

      // Update vehicle current location
      const vehicle = await prisma.vehicle.update({
        where: { id: parseInt(params.id) },
        data: {
          currentLat: latitude,
          currentLng: longitude,
          heading,
          speed,
          lastUpdate: new Date()
        }
      });

      // Save to location history
      await prisma.vehicleLocation.create({
        data: {
          vehicleId: vehicle.id,
          latitude,
          longitude,
          heading,
          speed
        }
      });

      return status(200, { message: "Location updated", vehicle });
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  }, {
    body: t.Object({
      latitude: t.Number(),
      longitude: t.Number(),
      heading: t.Optional(t.Number()),
      speed: t.Optional(t.Number())
    }),
    isAuth: true
  })

  // Create new vehicle (admin only)
  .post('/', async ({ body, status }) => {
    try {
      const vehicle = await prisma.vehicle.create({
        data: body
      });

      return status(201, vehicle);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  }, {
    body: t.Object({
      plateNumber: t.String(),
      type: t.String(),
      capacity: t.Number(),
      routeId: t.Optional(t.Number())
    }),
    isAuth: true
  });


