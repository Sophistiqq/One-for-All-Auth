import { Elysia, t } from "elysia";
import { validator } from "./plugins/authValidator";
import { prisma } from "../lib/prisma";

// src/terminals.ts
export const terminals = new Elysia({ prefix: "/terminals" })
  .use(validator)

  // Get all terminals
  .get('/', async ({ status }) => {
    try {
      const terminals = await prisma.terminal.findMany({
        where: { isActive: true },
        include: {
          routeStops: {
            include: {
              route: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        }
      });

      return status(200, terminals);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  })

  // Create terminal (admin only)
  .post('/', async ({ body, status }) => {
    try {
      const terminal = await prisma.terminal.create({
        data: body
      });

      return status(201, terminal);
    } catch (err) {
      return status(500, { message: "Internal Server Error: " + err });
    }
  }, {
    body: t.Object({
      name: t.String(),
      latitude: t.Number(),
      longitude: t.Number(),
      address: t.Optional(t.String()),
      type: t.Optional(t.String())
    }),
    isAuth: true
  });

