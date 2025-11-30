import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { auth } from "./auth";
import { validator } from "./plugins/authValidator";
import cors from "@elysiajs/cors";


const app = new Elysia()
  .use(cors())
  .use(auth)
  .use(validator)
  .use(swagger())
  .get("/", () => "Hello Elysia", { isAuth: true })

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
