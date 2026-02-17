import { migrate } from './db.js';

try {
  migrate();
  console.log('Migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
