import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

export function seedDatabase() {
  console.log('Seeding database...');

  // Seed achievements
  const achievements = [
    {
      id: uuidv4(),
      title: 'First Post',
      description: 'Create your first post',
      badge_image_url: '/badges/first-post.png',
      coin_reward: 10,
      criteria: JSON.stringify({ type: 'posts_created', targetValue: 1 })
    },
    {
      id: uuidv4(),
      title: 'Prolific Writer',
      description: 'Create 10 posts',
      badge_image_url: '/badges/prolific-writer.png',
      coin_reward: 50,
      criteria: JSON.stringify({ type: 'posts_created', targetValue: 10 })
    },
    {
      id: uuidv4(),
      title: 'Avid Reader',
      description: 'Read 50 posts',
      badge_image_url: '/badges/avid-reader.png',
      coin_reward: 30,
      criteria: JSON.stringify({ type: 'posts_read', targetValue: 50 })
    },
    {
      id: uuidv4(),
      title: 'Commentator',
      description: 'Make 25 comments',
      badge_image_url: '/badges/commentator.png',
      coin_reward: 25,
      criteria: JSON.stringify({ type: 'comments_made', targetValue: 25 })
    },
    {
      id: uuidv4(),
      title: 'Popular',
      description: 'Gain 100 followers',
      badge_image_url: '/badges/popular.png',
      coin_reward: 100,
      criteria: JSON.stringify({ type: 'followers_gained', targetValue: 100 })
    }
  ];

  const insertAchievement = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, title, description, badge_image_url, coin_reward, criteria)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const achievement of achievements) {
    insertAchievement.run(
      achievement.id,
      achievement.title,
      achievement.description,
      achievement.badge_image_url,
      achievement.coin_reward,
      achievement.criteria
    );
  }

  // Seed shop items
  const shopItems = [
    {
      id: uuidv4(),
      name: 'Dark Theme',
      description: 'A sleek dark theme for your profile',
      type: 'theme',
      price: 50,
      image_url: '/items/dark-theme.png'
    },
    {
      id: uuidv4(),
      name: 'Ocean Theme',
      description: 'A calming ocean-inspired theme',
      type: 'theme',
      price: 50,
      image_url: '/items/ocean-theme.png'
    },
    {
      id: uuidv4(),
      name: 'Gold Frame',
      description: 'A luxurious gold frame for your profile picture',
      type: 'frame',
      price: 100,
      image_url: '/items/gold-frame.png'
    },
    {
      id: uuidv4(),
      name: 'Silver Frame',
      description: 'An elegant silver frame',
      type: 'frame',
      price: 75,
      image_url: '/items/silver-frame.png'
    },
    {
      id: uuidv4(),
      name: 'Expert Badge',
      description: 'Show your expertise with this badge',
      type: 'badge',
      price: 150,
      image_url: '/items/expert-badge.png'
    }
  ];

  const insertShopItem = db.prepare(`
    INSERT OR IGNORE INTO shop_items (id, name, description, type, price, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of shopItems) {
    insertShopItem.run(
      item.id,
      item.name,
      item.description,
      item.type,
      item.price,
      item.image_url
    );
  }

  console.log('Database seeding completed');
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
