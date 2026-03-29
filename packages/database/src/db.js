import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Rohan@18",
  database: process.env.DB_NAME || "saas_project",
  waitForConnections: true,
  connectionLimit: 10,
});