import { sql, SQL } from "bun";

const sqlite = new SQL("sqlite://database.db", {
  adapter: "sqlite",
  create: true,
});

const adminUser = {
  username: "admin",
  password: await Bun.password.hash("password"),
  role: "admin",
  email: "admin@example.com",
}

// Initialize database schema
await sqlite`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL
  );
`;

await sqlite`
  INSERT OR IGNORE INTO users ${sql(adminUser)}
`

export { sqlite };
