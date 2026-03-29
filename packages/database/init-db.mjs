import fs from "fs";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Rohan@18",
  database: "saas_project"
});

const schema = fs.readFileSync("./schema.sql", "utf-8");

await db.query(schema);

console.log("MySQL DB initialized ✅");