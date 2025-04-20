import { db } from './db';
import {
  movies, categories, movieCategories, watchHistory, users
} from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { sql } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

// Function to hash passwords securely
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if we already have data
    const [userCount] = await db
      .select({ count: sql`count(*)` })
      .from(users);
      
    // If there's existing data, skip seeding
    if (userCount && parseInt(userCount.count.toString()) > 0) {
      console.log('Database already contains users, skipping full re-seed');
      return;
    }
    
    // Only clear existing data if we're starting fresh
    await db.delete(watchHistory);
    await db.delete(movieCategories);
    await db.delete(movies);
    await db.delete(categories);
    await db.delete(users);
    
    // Add categories
    console.log('Adding categories...');
    const categoryNames = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Thriller", "Documentary"];
    const categoryIds: Record<string, number> = {};
    
    for (const name of categoryNames) {
      const [category] = await db.insert(categories).values({ name }).returning();
      categoryIds[name] = category.id;
    }
    
    console.log('Categories added:', categoryIds);
    
    // Add movies
    console.log('Adding movies...');
    const sampleMovies = [
      {
        title: "Superbad",
        description: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.",
        year: 2007,
        rating: 8.0,
        imageUrl: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      },
      {
        title: "Bridesmaids",
        description: "Competition between the maid of honor and a bridesmaid, over who is the bride's best friend, threatens to upend the life of an out-of-work pastry chef.",
        year: 2011,
        rating: 7.8,
        imageUrl: "https://image.tmdb.org/t/p/w500/xLxgVxFWvb9hhUyCDDXxRPPnFck.jpg",
      },
      {
        title: "Anchorman",
        description: "Ron Burgundy is San Diego's top-rated newsman in the male-dominated broadcasting of the 1970s, but that's all about to change.",
        year: 2004,
        rating: 7.5,
        imageUrl: "https://image.tmdb.org/t/p/w500/9VbfYc9fQkuyKN3vuLXygVNJqGj.jpg",
      },
      {
        title: "Knocked Up",
        description: "For fun-loving party animal Ben Stone, the last thing he ever expected was for his one-night stand to show up on his doorstep eight weeks later to tell him she's pregnant.",
        year: 2007,
        rating: 7.2,
        imageUrl: "https://image.tmdb.org/t/p/w500/8kSerJrhrJWKLk1LViesGcnrUPE.jpg",
      },
      {
        title: "Step Brothers",
        description: "Two aimless middle-aged losers still living at home are forced against their will to become roommates when their parents marry.",
        year: 2008,
        rating: 7.1,
        imageUrl: "https://image.tmdb.org/t/p/w500/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg",
      },
      {
        title: "The Hangover",
        description: "Three buddies wake up from a bachelor party completely disoriented, with no memory of what happened the night before and the bachelor missing.",
        year: 2009,
        rating: 7.0,
        imageUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      },
      {
        title: "21 Jump Street",
        description: "A pair of underachieving cops are sent back to a local high school to blend in and bring down a synthetic drug ring.",
        year: 2012,
        rating: 7.2,
        imageUrl: "https://image.tmdb.org/t/p/w500/8P67mXu92TtYvEfgLFP3XFj6Jue.jpg",
      },
      {
        title: "Inception",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        year: 2010,
        rating: 8.8,
        imageUrl: "https://image.tmdb.org/t/p/w500/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg",
      },
      {
        title: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        year: 2008,
        rating: 9.0,
        imageUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      },
      {
        title: "Parasite",
        description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        year: 2019,
        rating: 8.6,
        imageUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
      },
      {
        title: "The Shawshank Redemption",
        description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        year: 1994,
        rating: 9.3,
        imageUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      },
      {
        title: "Pulp Fiction",
        description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        year: 1994,
        rating: 8.9,
        imageUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      },
      {
        title: "The Matrix",
        description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
        year: 1999,
        rating: 8.7,
        imageUrl: "https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
      },
      {
        title: "Goodfellas",
        description: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito in the Italian-American crime syndicate.",
        year: 1990,
        rating: 8.7,
        imageUrl: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
      },
      {
        title: "Get Out",
        description: "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.",
        year: 2017,
        rating: 8.0,
        imageUrl: "https://image.tmdb.org/t/p/w500/qbaIHX3LKdG1t9HBYSVS6GJPm1Q.jpg",
      }
    ];
    
    // Insert movies and store their IDs
    const movieIds: Record<string, number> = {};
    for (const movieData of sampleMovies) {
      const [movie] = await db.insert(movies).values(movieData).returning();
      movieIds[movie.title] = movie.id;
    }
    
    console.log('Movies added, starting to connect with categories...');
    
    // Connect movies to categories
    const movieCategoryMap: Record<string, string[]> = {
      "Superbad": ["Comedy"],
      "Bridesmaids": ["Comedy", "Romance"],
      "Anchorman": ["Comedy"],
      "Knocked Up": ["Comedy", "Romance"],
      "Step Brothers": ["Comedy"],
      "The Hangover": ["Comedy"],
      "21 Jump Street": ["Comedy", "Action"],
      "Inception": ["Sci-Fi", "Action", "Thriller"],
      "The Dark Knight": ["Action", "Thriller"],
      "Parasite": ["Drama", "Thriller"],
      "The Shawshank Redemption": ["Drama"],
      "Pulp Fiction": ["Drama", "Thriller", "Action"],
      "The Matrix": ["Sci-Fi", "Action"],
      "Goodfellas": ["Drama", "Thriller"],
      "Get Out": ["Horror", "Thriller"]
    };
    
    // Connect movies with categories
    for (const [movieTitle, categoryNameList] of Object.entries(movieCategoryMap)) {
      const movieId = movieIds[movieTitle];
      
      for (const categoryName of categoryNameList) {
        const categoryId = categoryIds[categoryName];
        
        await db.insert(movieCategories).values({
          movieId,
          categoryId
        });
      }
    }
    
    console.log('Added movie-category connections');
    
    // Create default users
    console.log('Creating users...');
    
    // Create an admin user
    const adminPassword = await hashPassword('admin1234');
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      email: 'admin@example.com',
      fullName: 'System Administrator',
      avatarUrl: null,
      createdAt: new Date(),
      preferences: JSON.stringify({
        favoriteGenres: ['Action', 'Sci-Fi'],
        darkMode: true,
        showRecommendations: true
      })
    }).returning();
    
    // Create a regular user
    const userPassword = await hashPassword('password123');
    const [regularUser] = await db.insert(users).values({
      username: 'moviefan',
      password: userPassword,
      email: 'user@example.com',
      fullName: 'Movie Fan',
      avatarUrl: null,
      createdAt: new Date(),
      preferences: JSON.stringify({
        favoriteGenres: ['Comedy', 'Drama'],
        darkMode: false,
        showRecommendations: true
      })
    }).returning();
    
    console.log('Users created:', { adminId: adminUser.id, regularUserId: regularUser.id });
    
    // Add watch history for users
    const samplesToMarkAsWatchedByAdmin = ["The Dark Knight", "Inception"];
    const samplesToMarkAsWatchedByUser = ["The Hangover", "Knocked Up", "Bridesmaids"];
    
    // Add admin's watch history
    for (const movieTitle of samplesToMarkAsWatchedByAdmin) {
      const movieId = movieIds[movieTitle];
      if (movieId) {
        // Create a watch entry from 1-5 days ago
        const daysAgo = Math.floor(Math.random() * 5) + 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        await db.insert(watchHistory).values({
          movieId,
          userId: adminUser.id,
          watchedAt: date,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 star rating
          notes: `Watched on ${date.toLocaleDateString()}`
        });
      }
    }
    
    // Add regular user's watch history
    for (const movieTitle of samplesToMarkAsWatchedByUser) {
      const movieId = movieIds[movieTitle];
      if (movieId) {
        // Create a watch entry from 1-3 days ago
        const daysAgo = Math.floor(Math.random() * 3) + 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        await db.insert(watchHistory).values({
          movieId,
          userId: regularUser.id,
          watchedAt: date,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 star rating
          notes: null
        });
      }
    }
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// We'll export this so it can be run from index.ts
export default seed;