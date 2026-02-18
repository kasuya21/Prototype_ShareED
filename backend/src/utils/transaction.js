import { db } from '../database/db.js';

/**
 * Transaction Utility
 * Provides transaction wrapper functions with automatic rollback on errors
 * Requirements: 19.1, 19.2
 */

/**
 * Execute a function within a database transaction
 * Automatically rolls back on error and commits on success
 * 
 * Requirement 19.1: Rollback all changes on transaction failure
 * Requirement 19.2: Ensure atomic operations
 * 
 * @param {Function} fn - Function to execute within transaction
 * @returns {*} Result of the function execution
 * @throws {Error} Re-throws any error after rollback
 * 
 * @example
 * const result = withTransaction(() => {
 *   // Multiple database operations
 *   db.prepare('INSERT INTO users ...').run(...);
 *   db.prepare('UPDATE posts ...').run(...);
 *   return { success: true };
 * });
 */
export function withTransaction(fn) {
  // better-sqlite3 transaction method handles BEGIN, COMMIT, and ROLLBACK automatically
  const transaction = db.transaction(fn);
  return transaction();
}

/**
 * Execute an async function within a database transaction
 * Note: better-sqlite3 is synchronous, but this wrapper allows
 * for consistent API when mixing with async operations
 * 
 * @param {Function} fn - Async function to execute within transaction
 * @returns {Promise<*>} Result of the function execution
 * @throws {Error} Re-throws any error after rollback
 * 
 * @example
 * const result = await withTransactionAsync(async () => {
 *   // Multiple database operations
 *   db.prepare('INSERT INTO users ...').run(...);
 *   await someAsyncOperation();
 *   db.prepare('UPDATE posts ...').run(...);
 *   return { success: true };
 * });
 */
export async function withTransactionAsync(fn) {
  // For better-sqlite3, we need to ensure all DB operations are synchronous
  // This wrapper allows mixing async operations (like external API calls)
  // with synchronous database operations
  const transaction = db.transaction(() => {
    // Execute the async function synchronously for DB operations
    // Note: Any await inside fn will need to be handled carefully
    return fn();
  });
  
  try {
    const result = await transaction();
    return result;
  } catch (error) {
    // Transaction automatically rolled back by better-sqlite3
    throw error;
  }
}

/**
 * Execute multiple operations atomically
 * All operations succeed or all fail together
 * 
 * Requirement 19.2: Ensure atomic operations preventing partial updates
 * 
 * @param {Array<Function>} operations - Array of functions to execute
 * @returns {Array<*>} Array of results from each operation
 * @throws {Error} Re-throws any error after rollback
 * 
 * @example
 * const [user, post] = executeAtomic([
 *   () => db.prepare('INSERT INTO users ...').run(...),
 *   () => db.prepare('INSERT INTO posts ...').run(...)
 * ]);
 */
export function executeAtomic(operations) {
  return withTransaction(() => {
    const results = [];
    for (const operation of operations) {
      results.push(operation());
    }
    return results;
  });
}

/**
 * Retry a transaction operation with exponential backoff
 * Useful for handling transient database lock errors
 * 
 * @param {Function} fn - Function to execute within transaction
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 100)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 5000)
 * @returns {*} Result of the function execution
 * @throws {Error} Re-throws the last error if all retries fail
 * 
 * @example
 * const result = retryTransaction(() => {
 *   return db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(10, userId);
 * }, { maxRetries: 3 });
 */
export function retryTransaction(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000
  } = options;
  
  let lastError;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return withTransaction(fn);
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable (database locked, busy, etc.)
      const isRetryable = error.code === 'SQLITE_BUSY' || 
                         error.code === 'SQLITE_LOCKED' ||
                         error.message?.includes('database is locked');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const sleepTime = Math.min(delay, maxDelay);
      const start = Date.now();
      while (Date.now() - start < sleepTime) {
        // Busy wait (synchronous sleep)
      }
      
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError;
}

/**
 * Create a savepoint within a transaction for partial rollback
 * Note: better-sqlite3 doesn't support nested transactions,
 * but we can use savepoints for similar functionality
 * 
 * @param {string} name - Savepoint name
 * @returns {Object} Savepoint object with release and rollback methods
 * 
 * @example
 * withTransaction(() => {
 *   db.prepare('INSERT INTO users ...').run(...);
 *   
 *   const sp = createSavepoint('before_posts');
 *   try {
 *     db.prepare('INSERT INTO posts ...').run(...);
 *     sp.release();
 *   } catch (error) {
 *     sp.rollback();
 *     // User insert is preserved, post insert is rolled back
 *   }
 * });
 */
export function createSavepoint(name) {
  db.prepare(`SAVEPOINT ${name}`).run();
  
  return {
    release: () => {
      db.prepare(`RELEASE SAVEPOINT ${name}`).run();
    },
    rollback: () => {
      db.prepare(`ROLLBACK TO SAVEPOINT ${name}`).run();
    }
  };
}

/**
 * Check if currently inside a transaction
 * @returns {boolean} True if inside a transaction
 */
export function inTransaction() {
  return db.inTransaction;
}
