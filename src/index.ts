import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import { auth } from "./auth";
import { validator } from "./plugins/authValidator";
import { job_postings } from "./job_postings";
import cors from "@elysiajs/cors";
import { applicants } from "./applicants";

const app = new Elysia()
  .use(cors({
    origin: "http://localhost:5173"
  }))
  .use(swagger())
  .use(auth)
  .use(validator)
  .use(job_postings)
  .use(applicants)
  .get("/", () => "Hello Elysia", { isAuth: true })

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
