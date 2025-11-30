import { Elysia, t } from "elysia"
import { sqlite } from "./dbconfig";
import { validator } from "./plugins/authValidator";


export const auth = new Elysia()
  .use(validator)
  .post("/auth/login", async ({ body, status, jwt_token, cookie: { auth_cookie } }) => {
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
  .get('/auth/me', async ({ jwt_token, cookie: { auth_cookie }, status }) => {
    try {
      const profile: any = await jwt_token.verify(auth_cookie.value as string)
      const user = await sqlite`SELECT id, username, role, email FROM users WHERE id = ${profile.sub}`

      if (!user[0]) return status(401, { message: "User not found" })

      return status(200, user[0])
    } catch (err) {
      return status(401, "Invalid token")
    }
  }, {
    isAuth: true,
    cookie: t.Object({
      auth_cookie: t.String()
    })
  })
  .get('/auth/logout', async ({ cookie: { auth_cookie }, status }) => {
    auth_cookie.remove()
    return status(200, { message: "Logout Success" })
  }, {
    isAuth: true
  })
  .post('/auth/register', async ({ body, status }) => {
    const { username, password, email } = body;
    try {
      const user = await sqlite`SELECT id FROM users WHERE username = ${username}`;
      if (user[0]) return status(409, "User already exists");

      const hashedPassword = await Bun.password.hash(password);
      console.log(hashedPassword)
      const newUser = {
        username,
        password: hashedPassword,
        role: "user",
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
