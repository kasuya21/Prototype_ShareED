import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '../database/db.js';
import {
  withTransaction,
  withTransactionAsync,
  executeAtomic,
  retryTransaction,
  createSavepoint,
  inTransaction
} from '../utils/transaction.js';

describe('Transaction Utilities', () => {
  beforeEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-transaction%');
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('test-transaction%');
  });

  describe('withTransaction', () => {
    test('should commit successful transaction', () => {
      const userId = 'test-tx-user-1';
      
      const result = withTransaction(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId, 'test-transaction-1@example.com', 'Test User 1', 'member');
        
        return { success: true, userId };
      });

      expect(result.success).toBe(true);
      
      // Verify data was committed
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      expect(user).toBeDefined();
      expect(user.email).toBe('test-transaction-1@example.com');
    });

    test('should rollback failed transaction', () => {
      const userId = 'test-tx-user-2';
      
      expect(() => {
        withTransaction(() => {
          db.prepare(`
            INSERT INTO users (id, email, name, role)
            VALUES (?, ?, ?, ?)
          `).run(userId, 'test-transaction-2@example.com', 'Test User 2', 'member');
          
          // Throw error to trigger rollback
          throw new Error('Transaction failed');
        });
      }).toThrow('Transaction failed');

      // Verify data was rolled back
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      expect(user).toBeUndefined();
    });

    test('should handle multiple operations atomically', () => {
      const userId1 = 'test-tx-user-3';
      const userId2 = 'test-tx-user-4';
      
      withTransaction(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId1, 'test-transaction-3@example.com', 'Test User 3', 'member');
        
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId2, 'test-transaction-4@example.com', 'Test User 4', 'member');
      });

      // Verify both users were created
      const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId1);
      const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId2);
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
    });

    test('should rollback all operations on partial failure', () => {
      const userId1 = 'test-tx-user-5';
      const userId2 = 'test-tx-user-6';
      
      expect(() => {
        withTransaction(() => {
          db.prepare(`
            INSERT INTO users (id, email, name, role)
            VALUES (?, ?, ?, ?)
          `).run(userId1, 'test-transaction-5@example.com', 'Test User 5', 'member');
          
          // This will fail due to duplicate email
          db.prepare(`
            INSERT INTO users (id, email, name, role)
            VALUES (?, ?, ?, ?)
          `).run(userId2, 'test-transaction-5@example.com', 'Test User 6', 'member');
        });
      }).toThrow();

      // Verify neither user was created
      const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId1);
      const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId2);
      expect(user1).toBeUndefined();
      expect(user2).toBeUndefined();
    });
  });

  describe('withTransactionAsync', () => {
    test('should handle async operations', async () => {
      const userId = 'test-tx-async-1';
      
      const result = await withTransactionAsync(async () => {
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId, 'test-transaction-async-1@example.com', 'Test Async User', 'member');
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        
        return { success: true, userId };
      });

      expect(result.success).toBe(true);
      
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      expect(user).toBeDefined();
    });

    test('should rollback on async error', async () => {
      const userId = 'test-tx-async-2';
      
      await expect(async () => {
        await withTransactionAsync(async () => {
          db.prepare(`
            INSERT INTO users (id, email, name, role)
            VALUES (?, ?, ?, ?)
          `).run(userId, 'test-transaction-async-2@example.com', 'Test Async User 2', 'member');
          
          await new Promise(resolve => setTimeout(resolve, 10));
          
          throw new Error('Async operation failed');
        });
      }).rejects.toThrow('Async operation failed');

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      expect(user).toBeUndefined();
    });
  });

  describe('executeAtomic', () => {
    test('should execute all operations atomically', () => {
      const userId1 = 'test-atomic-1';
      const userId2 = 'test-atomic-2';
      
      const results = executeAtomic([
        () => db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId1, 'test-atomic-1@example.com', 'Atomic User 1', 'member'),
        () => db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId2, 'test-atomic-2@example.com', 'Atomic User 2', 'member')
      ]);

      expect(results).toHaveLength(2);
      
      const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId1);
      const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId2);
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
    });

    test('should rollback all operations on any failure', () => {
      const userId1 = 'test-atomic-3';
      const userId2 = 'test-atomic-4';
      
      expect(() => {
        executeAtomic([
          () => db.prepare(`
            INSERT INTO users (id, email, name, role)
            VALUES (?, ?, ?, ?)
          `).run(userId1, 'test-atomic-3@example.com', 'Atomic User 3', 'member'),
          () => {
            throw new Error('Second operation failed');
          }
        ]);
      }).toThrow('Second operation failed');

      const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId1);
      expect(user1).toBeUndefined();
    });
  });

  describe('createSavepoint', () => {
    test('should create and release savepoint', () => {
      const userId1 = 'test-savepoint-1';
      const userId2 = 'test-savepoint-2';
      
      withTransaction(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId1, 'test-savepoint-1@example.com', 'Savepoint User 1', 'member');
        
        const sp = createSavepoint('test_sp');
        
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId2, 'test-savepoint-2@example.com', 'Savepoint User 2', 'member');
        
        sp.release();
      });

      const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId1);
      const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId2);
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
    });

    test('should rollback to savepoint', () => {
      const userId1 = 'test-savepoint-3';
      const userId2 = 'test-savepoint-4';
      
      withTransaction(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId1, 'test-savepoint-3@example.com', 'Savepoint User 3', 'member');
        
        const sp = createSavepoint('test_sp2');
        
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId2, 'test-savepoint-4@example.com', 'Savepoint User 4', 'member');
        
        // Rollback to savepoint
        sp.rollback();
      });

      const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId1);
      const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(userId2);
      expect(user1).toBeDefined();
      expect(user2).toBeUndefined(); // Should be rolled back
    });
  });

  describe('inTransaction', () => {
    test('should return false outside transaction', () => {
      expect(inTransaction()).toBe(false);
    });

    test('should return true inside transaction', () => {
      withTransaction(() => {
        expect(inTransaction()).toBe(true);
      });
    });
  });

  describe('retryTransaction', () => {
    test('should succeed on first attempt', () => {
      const userId = 'test-retry-1';
      
      const result = retryTransaction(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, role)
          VALUES (?, ?, ?, ?)
        `).run(userId, 'test-retry-1@example.com', 'Retry User 1', 'member');
        
        return { success: true };
      });

      expect(result.success).toBe(true);
      
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      expect(user).toBeDefined();
    });

    test('should throw non-retryable errors immediately', () => {
      expect(() => {
        retryTransaction(() => {
          throw new Error('Non-retryable error');
        });
      }).toThrow('Non-retryable error');
    });
  });
});
