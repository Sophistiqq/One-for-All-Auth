import { SQL } from "bun";

const sqlite = new SQL("sqlite://database.db", {
  adapter: "sqlite",
  create: true,
  onconnect: () => console.log("Database connected successfully"),
});

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


await sqlite`INSERT OR IGNORE INTO users ${sqlite(adminUser)}`

export { sqlite };
