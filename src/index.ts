import { Elysia, t } from "elysia";
import swagger from "@elysiajs/swagger";
import { auth } from "./auth";
import { validator } from "./plugins/authValidator";


const app = new Elysia()
  .use(auth)
  .use(validator)
  .use(swagger())
  .get("/", () => "Hello Elysia", { isAuth: true })

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
