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
  // User profile operations
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async saveUserPreferences(userId: number, preferences: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ preferences })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async getUserPreferences(userId: number): Promise<string | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    return user ? user.preferences : null;
  }
  
  // User-specific watch history operations
  async getUserWatchedMovieIds(userId: number): Promise<number[]> {
    const result = await db
      .select({ movieId: watchHistory.movieId })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));
    
    return result.map(item => item.movieId);
  }
  
  // User recommendations based on watch history
  async getRecommendedMovies(userId: number, limit: number = 10): Promise<Movie[]> {
    // 1. Get user's watch history
    const watchedMovies = await this.getWatchHistory(userId);
    const watchedMovieIds = watchedMovies.map(item => item.movieId);
    
    // 2. Find the most watched genres by the user
    const genreCounts: Record<number, number> = {};
    
    for (const historyItem of watchedMovies) {
      const movieGenres = await this.getMovieCategories(historyItem.movieId);
      
      for (const genre of movieGenres) {
        genreCounts[genre.categoryId] = (genreCounts[genre.categoryId] || 0) + 1;
      }
    }
    
    // Sort genres by count (most popular first)
    const favoriteGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) // Take top 3 genres
      .map(([genreId]) => parseInt(genreId));
    
    // 3. Find movies with these genres that the user hasn't watched
    const recommendedMovies = await this.getMovies({
      categories: favoriteGenres,
      excludeIds: watchedMovieIds,
      minRating: 7.0, // Only high-rated movies
      sort: 'rating_desc'
    });
    
    return recommendedMovies.slice(0, limit);
  }
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
  async getWatchHistory(userId?: number): Promise<WatchHistory[]> {
    let query = db
      .select()
      .from(watchHistory)
      .orderBy(desc(watchHistory.watchedAt));
    
    // If userId is provided, filter by user
    if (userId) {
      query = query.where(eq(watchHistory.userId, userId));
    }
    
    return await query;
  }

  async addToWatchHistory(insertHistory: InsertWatchHistory): Promise<WatchHistory> {
    const [watchHistoryEntry] = await db
      .insert(watchHistory)
      .values(insertHistory)
      .returning();
    return watchHistoryEntry;
  }

  async clearWatchHistory(userId?: number): Promise<void> {
    // If userId is provided, only clear that user's history
    if (userId) {
      await db.delete(watchHistory).where(eq(watchHistory.userId, userId));
    } else {
      // Otherwise clear all history
      await db.delete(watchHistory);
    }
  }
}