import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './data/database.sqlite';
const dbDir = dirname(dbPath);

// Create data directory if it doesn't exist
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run migrations
export function migrate() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement);
    }
  }
  
  console.log('Database migration completed successfully');
}

// Initialize database on first import
migrate();

export { db };
export default db;
