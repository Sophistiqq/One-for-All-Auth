import Elysia, { t } from "elysia";
import { validator } from "./plugins/authValidator";
import { sqlite } from "./dbconfig";

export const applicants = new Elysia({ prefix: "/applicants" })
  .use(validator)
  .get("/", async ({ status }) => {
    try {
      const applicants = await sqlite`SELECT * FROM applicants`
      if (applicants.length === 0) return status("No Content")

      return { applicants }
    } catch (err) {
      return status("Internal Server Error", err)
    }
  }, {
    isAuth: true
  })

  .post("/apply", async ({ status, body }) => {
    try {
      const applicant = await sqlite`SELECT email FROM applicants WHERE email = ${body.email}`
      if (applicant.length !== 0) return status(422, "Already Applied")
      await sqlite`INSERT INTO applicants ${sqlite(body)}`

    } catch (err) {
      return status("Internal Server Error", err)
    }
  }, {
    body: t.Object({
      job_posting_id: t.Number(),
      first_name: t.String(),
      last_name: t.String(),
      email: t.String(),
      resume: t.String(),
      phone: t.String(),
      status: t.String({ default: "pending" }),
      years_of_experience: t.Number(),
      salary_expected: t.String(),
      education_level: t.String(),
      available_start_date: t.Optional(t.String()),
      current_employment_status: t.String(),
      willing_to_relocate: t.Boolean({ default: false }),
    })
  })
