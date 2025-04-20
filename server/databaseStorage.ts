import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  User, InsertUser, users,
  Movie, InsertMovie, movies,
  Genre, InsertGenre, categories,
  MovieGenre, InsertMovieGenre, movieCategories,
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
    
    // The minRating filter should always be applied with a default of 1 if not specified
    const effectiveMinRating = typeof filters.minRating === 'number' ? filters.minRating : 1;
    conditions.push(gte(movies.rating, effectiveMinRating));
    console.log("Applying minimum rating filter:", effectiveMinRating);

    // Apply year filters if specified
    if (filters.yearFrom && filters.yearFrom !== 0) {
      conditions.push(gte(movies.year, filters.yearFrom));
      console.log("Applying year from filter:", filters.yearFrom);
    }

    if (filters.yearTo && filters.yearTo !== 0) {
      conditions.push(lte(movies.year, filters.yearTo));
      console.log("Applying year to filter:", filters.yearTo);
    }
    
    // Execute the query with all conditions
    let result;
    if (conditions.length > 0) {
      result = await db.select().from(movies).where(and(...conditions));
    } else {
      result = await db.select().from(movies);
    }

    // Filter by categories/genres using SQL IN clause
    if (filters.categories && filters.categories.length > 0) {
      console.log("Filtering by categories/genres:", filters.categories);
      
      try {
        // Use a raw SQL IN clause for filtering by category IDs
        const categoryIdsStr = filters.categories.join(',');
        const movieQuery = db
          .select({ 
            movieId: movieCategories.movieId 
          })
          .from(movieCategories)
          .where(sql`${movieCategories.categoryId} IN (${categoryIdsStr})`);
        
        const categoryMovies = await movieQuery;
        
        // Create a set of movie IDs for faster lookup
        const movieIdsWithCategories = new Set(categoryMovies.map(cm => cm.movieId));
        console.log("Movies with specified genres:", Array.from(movieIdsWithCategories));
        
        // Filter the results to only include movies with the specified categories
        result = result.filter(movie => movieIdsWithCategories.has(movie.id));
      } catch (error) {
        console.error("Error filtering by categories/genres:", error);
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

  // Genre operations (renamed from Category)
  async getCategories(): Promise<Genre[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Genre | undefined> {
    const [genre] = await db.select().from(categories).where(eq(categories.id, id));
    return genre || undefined;
  }

  async getCategoryByName(name: string): Promise<Genre | undefined> {
    const [genre] = await db
      .select()
      .from(categories)
      .where(eq(sql`LOWER(${categories.name})`, name.toLowerCase()));
    return genre || undefined;
  }

  async createCategory(insertGenre: InsertGenre): Promise<Genre> {
    const [genre] = await db
      .insert(categories)
      .values(insertGenre)
      .returning();
    return genre;
  }

  // Movie Genre operations (renamed from Movie Category)
  async getMovieCategories(movieId: number): Promise<MovieGenre[]> {
    return db
      .select()
      .from(movieCategories)
      .where(eq(movieCategories.movieId, movieId));
  }

  async addCategoryToMovie(insertMovieGenre: InsertMovieGenre): Promise<MovieGenre> {
    const [movieGenre] = await db
      .insert(movieCategories)
      .values(insertMovieGenre)
      .returning();
    return movieGenre;
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