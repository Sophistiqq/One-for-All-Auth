import { Elysia, t } from "elysia"
import { sqlite } from "./dbconfig";
import { validator } from "./plugins/authValidator";


export const auth = new Elysia()
  // The auth middleware is required for all routes that require authentication, just apply isAuth: true
  .use(validator)
  .post('/auth/register', async ({ body, status }) => {
    const { username, password, email } = body;
    try {
      const user = await sqlite`SELECT id FROM users WHERE username = ${username}`;
      if (user[0]) return status(409, "User already exists");

      const hashedPassword = await Bun.password.hash(password);
      const newUser = {
        username,
        password: hashedPassword,
        email
      }
      await sqlite`INSERT INTO users ${sqlite(newUser)}`
      return status(201, { message: "Register Success" });
    } catch (err) {
      return status(500, { message: "Internal Server Error" });
    }
  }, {
    body: t.Object({
      username: t.String({ minLength: 6 }),
      password: t.String({ minLength: 6 }),
      email: t.String({ format: "email" })
    })
  })
  .post("/auth/login", async ({ body, status, jwt_token, cookie: { auth_cookie } }) => {
    const { username, password } = body;
    try {
      const users = await sqlite`SELECT id, username, password, email FROM admin_table WHERE username = ${username}`;
      const user = users[0];
      if (!user) {
        return status(404, "User not found")
      }

      const isValid = await Bun.password.verify(password, user.password);
      if (!isValid) {
        return status(401, "Invalid credentials");
      }

      const token = await jwt_token.sign({
        sub: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
      })

      auth_cookie.set({
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

  // user is from the auth middleware, it contains user's id - Check the middleware authValidator for more info
  .get('/auth/me', async ({ status, user }) => {
    try {
      const users = await sqlite`SELECT id, username, email FROM admin_table WHERE id = ${user}`
      if (!users[0]) return status(401, { message: "User not found" })

      return status(200, users[0])
    } catch (err) {
      return status(401, "Invalid token")
    }
  }, {
    isAuth: true,
    cookie: t.Object({
      auth_cookie: t.String()
    }),
  })
  .post('/auth/logout', async ({ cookie: { auth_cookie }, status }) => {
    auth_cookie.remove()
    return status(200, { message: "Logout Success" })
  }, {
    isAuth: true
  })
