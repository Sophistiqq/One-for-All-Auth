import { Elysia, t } from "elysia";
import { validator } from "./plugins/authValidator";
import { prisma } from "../lib/prisma";

// src/routes.ts
export const routes = new Elysia({ prefix: "/routes" })
  .use(validator)

  // Get all routes
  .get('/', async ({ status }) => {
    try {
      const routes = await prisma.route.findMany({
        where: { isActive: true },
        include: {
          vehicles: {
            where: {
              status: 'active',
              isActive: true
            },
            select: {
              id: true,
              plateNumber: true,
              currentLat: true,
              currentLng: true,
              lastUpdate: true
            }
          },
          stops: {
            include: {
              terminal: true
            },
            orderBy: {
              sequence: 'asc'
            }
          }
        }
      });

      return status(200, routes);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  })

  // Get single route with all details
  .get('/:id', async ({ params, status }) => {
    try {
      const route = await prisma.route.findUnique({
        where: { id: parseInt(params.id) },
        include: {
          vehicles: {
            where: { status: 'active' }
          },
          stops: {
            include: {
              terminal: true
            },
            orderBy: {
              sequence: 'asc'
            }
          }
        }
      });

      if (!route) {
        return status(404, { message: "Route not found" });
      }

      return status(200, route);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  })

  // Create new route (admin only)
  .post('/', async ({ body, status }) => {
    try {
      const route = await prisma.route.create({
        data: body
      });

      return status(201, route);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  }, {
    body: t.Object({
      name: t.String(),
      code: t.String(),
      fare: t.Number(),
      startTerminal: t.String(),
      endTerminal: t.String(),
      color: t.Optional(t.String()),
      description: t.Optional(t.String()),
      operatingHours: t.Optional(t.String())
    }),
    isAuth: true
  });
