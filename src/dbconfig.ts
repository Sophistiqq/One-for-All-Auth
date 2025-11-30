import { sql, SQL } from "bun";

const sqlite = new SQL("sqlite://database.db", {
  adapter: "sqlite",
  create: true,
});

const adminUser = {
  first_name: "admin",
  last_name: "admin",
  email: "admin@example.com",
  username: "admin",
  password: await Bun.password.hash("password"),
}

// Initialize database schema for users table
await sqlite`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`;

// Initialize admin/hr users table
await sqlite`
  CREATE TABLE IF NOT EXISTS admin_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`;

await sqlite`INSERT OR IGNORE INTO admin_table ${sqlite(adminUser)}`

export { sqlite };
