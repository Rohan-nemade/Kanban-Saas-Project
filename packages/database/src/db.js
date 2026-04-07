import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Rohan@18",
  database: process.env.DB_NAME || "saas_project",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.DB_HOST?.includes('aivencloud.com')
    ? { rejectUnauthorized: false }
    : undefined
});