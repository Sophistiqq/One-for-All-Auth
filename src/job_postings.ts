import { Elysia, t } from "elysia";
import { validator } from "./plugins/authValidator";
import { sqlite } from "./dbconfig";

const JobPosting = t.Partial(
  t.Object({
    title: t.String(),
    department: t.String(),
    salary_range: t.String(),
    description: t.String(),
    requirements: t.String(),
    application_status: t.String(),
    posted_date: t.String()
  })
)

export const job_postings = new Elysia({ prefix: "/job_postings" })
  .use(validator)
  .get("/", async ({ status }) => {
    try {
      const job_postings = await sqlite`SELECT * FROM job_postings`;
      if (job_postings.length === 0) return status(404, "Job Postings not found")
      return { job_postings }
    } catch (err) {
      return status(500, { message: "Internal Server Error" })
    }
  }, {
    isAuth: true
  })
  .post("/create", async ({ status, body }) => {
    try {
      const create = await sqlite`INSERT OR IGNORE INTO job_postings ${sqlite(body)}`.raw();
      console.log("Create: ", create);
      return status(200, { message: "Job Posting created successfully", job_posting: body })
    } catch (err) {
      return status(500, { message: "Internal Server Error", err })
    }
  }, {
    isAuth: true,
    body: JobPosting,
  })

  .get("/:id", async ({ params, status }) => {
    try {
      const job_posting = await sqlite`SELECT * FROM job_postings WHERE id = ${params.id}`;
      if (job_posting.length === 0) return status(404, "Job Posting not found")
      return { job_posting }
    } catch (err) {
      return status(500, { message: "Internal Server Error" })
    }

  }, {
    isAuth: true,
    params: t.Object({
      id: t.String()
    })
  })
  .patch("/:id/update", async ({ status, params, body }) => {
    try {
      const job_posting = await sqlite`SELECT * FROM job_postings WHERE id = ${params.id}`;
      if (job_posting.length === 0) return status(404, "Job Posting not found")
      job_posting[0] = { ...job_posting[0], ...body };
      await sqlite`UPDATE job_postings SET ${sqlite(job_posting[0])} WHERE id = ${params.id}`;

      return status(200, { message: "Job Posting updated successfully", job_posting })

    } catch (err) {
      return status(500, { message: "Internal Server Error", err })
    }
  }, {
    isAuth: true,
    params: t.Object({
      id: t.String()
    }),
    body: JobPosting
  })
  .delete("/:id", async ({ status, params }) => {
    try {
      const job_posting = await sqlite`SELECT * FROM job_postings WHERE id = ${params.id}`;
      if (job_posting.length === 0) return status(404, "Job Posting not found")
      await sqlite`DELETE FROM job_postings WHERE id = ${params.id}`;
      return status(200, { message: "Job Posting deleted successfully", job_posting })
    } catch (err) {
      return status(500, { message: "Internal Server Error", err })
    }
  }, {
    isAuth: true,
    params: t.Object({
      id: t.String()
    })
  })

