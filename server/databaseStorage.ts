import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  User, InsertUser, users,
  Movie, InsertMovie, movies,
  Category, InsertCategory, categories,
  MovieCategory, InsertMovieCategory, movieCategories,
  WatchHistory, InsertWatchHistory, watchHistory
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Movie operations
  async getMovies(filters: {
    categories?: number[];
    minRating?: number;
    yearFrom?: number;
    yearTo?: number;
    excludeIds?: number[];
    sort?: string;
  } = {}): Promise<Movie[]> {
    console.log("Database getMovies called with filters:", filters);
    
    // Build conditions array for the query
    const conditions = [];
    
    if (filters.minRating) {
      conditions.push(gte(movies.rating, filters.minRating));
    }

    if (filters.yearFrom && filters.yearFrom !== 0) {
      conditions.push(gte(movies.year, filters.yearFrom));
    }

    if (filters.yearTo && filters.yearTo !== 0) {
      conditions.push(lte(movies.year, filters.yearTo));
    }
    
    // Execute the query with all conditions
    let result;
    if (conditions.length > 0) {
      result = await db.select().from(movies).where(and(...conditions));
    } else {
      result = await db.select().from(movies);
    }

    // Filter by categories after fetching (since it requires a join/subquery)
    if (filters.categories && filters.categories.length > 0) {
      console.log("Filtering by categories:", filters.categories);
      
      try {
        // Get all movies that have any of the specified categories
        const categoryMovies = await db
          .select({ movieId: movieCategories.movieId })
          .from(movieCategories)
          .where(sql`${movieCategories.categoryId} IN (${filters.categories.join(', ')})`);
        
        const movieIdsWithCategories = new Set(categoryMovies.map(cm => cm.movieId));
        console.log("Movies with specified categories:", Array.from(movieIdsWithCategories));
        
        result = result.filter(movie => movieIdsWithCategories.has(movie.id));
      } catch (error) {
        console.error("Error filtering by categories:", error);
        // Don't filter if there's an error with the query
      }
    }

    // Filter out watched movies
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      result = result.filter(movie => !filters.excludeIds?.includes(movie.id));
    }

    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'rating_desc':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'year_desc':
          result.sort((a, b) => b.year - a.year);
          break;
        case 'title_asc':
          result.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }
    } else {
      // Default sort: rating (descending)
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    const [movie] = await db.select().from(movies).where(eq(movies.id, id));
    return movie || undefined;
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const [movie] = await db
      .insert(movies)
      .values(insertMovie)
      .returning();
    return movie;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(sql`LOWER(${categories.name})`, name.toLowerCase()));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  // Movie Category operations
  async getMovieCategories(movieId: number): Promise<MovieCategory[]> {
    return db
      .select()
      .from(movieCategories)
      .where(eq(movieCategories.movieId, movieId));
  }

  async addCategoryToMovie(insertMovieCategory: InsertMovieCategory): Promise<MovieCategory> {
    const [movieCategory] = await db
      .insert(movieCategories)
      .values(insertMovieCategory)
      .returning();
    return movieCategory;
  }

  // Watch History operations
  async getWatchHistory(): Promise<WatchHistory[]> {
    const history = await db
      .select()
      .from(watchHistory)
      .orderBy(desc(watchHistory.watchedAt));
    return history;
  }

  async addToWatchHistory(insertHistory: InsertWatchHistory): Promise<WatchHistory> {
    const [watchHistoryEntry] = await db
      .insert(watchHistory)
      .values(insertHistory)
      .returning();
    return watchHistoryEntry;
  }

  async clearWatchHistory(): Promise<void> {
    await db.delete(watchHistory);
  }
}