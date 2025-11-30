import { Elysia, t } from "elysia"
import jwt from "@elysiajs/jwt";

// This is a macro that can be used to validate the auth cookie.
// Just simply add the `isAuth` property to your route and it will be validated.

export const validator = new Elysia()
  .use(jwt({
    name: "jwt_token",
    secret: "Roi",
    exp: 60 * 60 * 24 * 30,
  }))
  .macro("isAuth", {
    cookie: t.Object({
      auth_cookie: t.String()
    }),
    async resolve({ cookie: { auth_cookie }, status, jwt_token }) {
      const token = await jwt_token.verify(auth_cookie.value as string)
      if (!token) return status(401, "Unauthorized")

      return {
        user: token.sub
      }
    },
  })
