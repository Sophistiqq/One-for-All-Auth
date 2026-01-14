import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { auth } from "./auth";
import { validator } from "./plugins/authValidator";
import cors from "@elysiajs/cors";
import { routes } from "./routes";
import { terminals } from "./terminals";
import { vehicles } from "./vehicles";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(auth)
  .use(routes)
  .use(terminals)
  .use(vehicles)
  .use(validator)
  .get("/health", ({ status }) => {
    console.log('health hit: ', Date.now())
    return status(200)
  })
  .get("/", () => "Hello Elysia", { isAuth: true })


  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
