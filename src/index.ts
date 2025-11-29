import { Elysia, t } from "elysia";
import swagger from "@elysiajs/swagger";
import { auth } from "./auth";


const app = new Elysia()
  .use(auth)
  .use(swagger())
  .get("/", () => "Hello Elysia")

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
