import { Elysia, t } from "elysia"
import jwt from "@elysiajs/jwt";

export const validator = new Elysia()
  .use(jwt({
    name: "auth",
    secret: "Roi",
    exp: 60 * 60 * 24 * 30,
  }))
  .macro("isAuth", {
    cookie: t.Object({
      cookie: t.String()
    }),
    beforeHandle({ cookie: { cookie }, status, auth }) {
      const token = auth.verify(cookie.value as string)
      if (!token) return status(401, "Unauthorized")
    }
  })
