import { Elysia, t } from "elysia"
import { sqlite } from "./dbconfig";
import { validator } from "./plugins/authValidator";


export const auth = new Elysia()
  .use(validator)
  .post("/auth/login", async ({ body, status, auth, cookie: { cookie } }) => {
    const { username, password } = body;
    try {
      const users = await sqlite`SELECT id, username, role, password, email FROM users WHERE username = ${username}`;
      const user = users[0];
      if (!user) {
        return status(404, "User not found")
      }

      const isValid = await Bun.password.verify(password, user.password);
      if (!isValid) {
        return status(401, "Invalid credentials");
      }

      const token = await auth.sign({
        sub: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
      })

      cookie.set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return status(200, { message: "Login Success" });
    } catch (err) {
      return status(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      username: t.String({ minLength: 1 }),
      password: t.String({ minLength: 1 })
    })
  })
  .get('/auth/me', async ({ auth, cookie: { cookie }, status }) => {
    try {
      const profile: any = await auth.verify(cookie.value as string)
      const user = await sqlite`SELECT id, username, role, email FROM users WHERE id = ${profile.sub}`

      if (!user) return status(401, { message: "User not found" })

      return status(200, user[0])
    } catch (err) {
      return status(401, "Invalid token")
    }
  }, {
    isAuth: true,
    cookie: t.Object({
      cookie: t.String()
    })
  })
  .get('/auth/logout', async ({ cookie: { cookie }, status }) => {
    cookie.remove()
    return status(200, { message: "Logout Success" })
  }, {
    isAuth: true
  })

