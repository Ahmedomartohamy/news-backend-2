import dotenv from 'dotenv';
dotenv.config();
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      bio: 'System administrator',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create categories
  const categories = [
    { name: 'Technology', slug: 'technology', description: 'Tech news and updates' },
    { name: 'Business', slug: 'business', description: 'Business and finance' },
    { name: 'Sports', slug: 'sports', description: 'Sports news and events' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and more' },
    { name: 'Health', slug: 'health', description: 'Health and wellness' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✅ Categories created');

  // Create tags
  const tags = [
    { name: 'Breaking News', slug: 'breaking-news' },
    { name: 'Featured', slug: 'featured' },
    { name: 'Trending', slug: 'trending' },
    { name: 'Opinion', slug: 'opinion' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log('✅ Tags created');

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });