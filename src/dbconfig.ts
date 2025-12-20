import { sql, SQL } from "bun";

const sqlite = new SQL("sqlite://database.db", {
  adapter: "sqlite",
  create: true,
  onconnect: () => console.log("Database connected successfully"),
});
// -- Create admin user
const adminUser = {
  first_name: "admin",
  last_name: "admin",
  email: "admin@example.com",
  username: "admin",
  password: await Bun.password.hash("password"),
  role: "admin"
}

// Initialize database schema for users table
await sqlite`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// Insert admin user into database
await sqlite`INSERT OR IGNORE INTO users ${sqlite(adminUser)}`

// ----- [ Job Postings Table ] -----

await sqlite`
  CREATE TABLE IF NOT EXISTS job_postings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    salary_range TEXT,
    description TEXT,
    requirements TEXT,
    application_status TEXT DEFAULT 'draft',
    posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`
const job_posting = {
  title: "Test Job Posting",
  department: "Test Department",
  salary_range: "Test Salary Range",
  description: "Test Description",
  requirements: "Test Requirements",
  application_status: "draft",
  posted_date: new Date().toISOString(),
}

const job_postings2 = {
  title: "Test Job Posting 2",
  department: "Test Department 2",
  salary_range: "Test Salary Range 2",
  description: "Test Description 2",
  requirements: "Test Requirements 2",
  application_status: "draft",
  posted_date: new Date().toISOString(),
}


await sqlite`INSERT OR IGNORE INTO job_postings ${sqlite(job_posting)}`

// ----- [ Applicants Table ] -----

await sqlite`
  CREATE TABLE IF NOT EXISTS applicants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_posting_id INTEGER NOT NULL REFERENCES job_postings(id),

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT N phone TEXT NOT NULL,
  resume BLOB NOT NULL,
  status TEXT DEFAULT 'pending',
  phone TEXT,

  years_of_experience INTEGER,
  salary_expected INTEGER,
  education_level TEXT,
  available_start_date TEXT,
  current_employment_status TEXT,
  willing_to_relocate BOOLEAN DEFAULT FALSE,
  
  access_token TEXT UNIQUE,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`




export { sqlite };
