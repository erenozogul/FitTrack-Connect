import "dotenv/config";
import { neon } from '@neondatabase/serverless';

async function test() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set.");
      return;
    }
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 as connected`;
    console.log("Database connection successful:", result);
  } catch(e) {
    console.error("Database connection failed:", e);
  }
}
test();
