import { eq, and, or, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  User, InsertUser, users,
  Movie, InsertMovie, movies,
  Genre, InsertGenre, categories,
  MovieGenre, InsertMovieGenre, movieCategories,
  WatchHistory, InsertWatchHistory, watchHistory,
  Playlist, InsertPlaylist, playlists,
  PlaylistItem, InsertPlaylistItem, playlistItems,
  Friendship, InsertFriendship, friendships,
  PlaylistShare, InsertPlaylistShare, playlistShares,
  SharedWatch, InsertSharedWatch, sharedWatches
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
    page?: number;
    limit?: number;
  } = {}): Promise<{ movies: Movie[], totalCount: number, totalPages: number }> {
    console.log("Database getMovies called with filters:", filters);
    
    // Set pagination defaults
    const page = filters.page !== undefined ? filters.page : 1;
    const limit = filters.limit !== undefined ? filters.limit : 12;
    
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

    // Calculate total count and total pages
    const totalCount = result.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMovies = result.slice(startIndex, endIndex);
    
    console.log(`Pagination: page ${page}/${totalPages}, showing ${paginatedMovies.length} of ${totalCount} movies`);
    
    return {
      movies: paginatedMovies,
      totalCount,
      totalPages
    };
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

  // Playlist operations
  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.updatedAt));
  }

  async getPlaylist(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db
      .insert(playlists)
      .values(playlist)
      .returning();
    return newPlaylist;
  }

  async updatePlaylist(id: number, playlist: Partial<Playlist>): Promise<Playlist> {
    // Always update the updatedAt timestamp
    const updatedData = {
      ...playlist,
      updatedAt: new Date()
    };

    const [updatedPlaylist] = await db
      .update(playlists)
      .set(updatedData)
      .where(eq(playlists.id, id))
      .returning();
    return updatedPlaylist;
  }

  async deletePlaylist(id: number): Promise<void> {
    // The playlist items will be automatically deleted due to ON DELETE CASCADE
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  // Playlist Items operations
  async getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
    return db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(asc(playlistItems.sortOrder));
  }

  async getPlaylistMovies(playlistId: number): Promise<Movie[]> {
    // First get all playlist items
    const items = await this.getPlaylistItems(playlistId);
    
    if (items.length === 0) {
      return [];
    }

    // Get movie IDs from playlist items
    const movieIds = items.map(item => item.movieId);
    
    // Get all movies in the playlist
    const playlistMovies = await db
      .select()
      .from(movies)
      .where(inArray(movies.id, movieIds));
    
    // Sort movies in the order they appear in the playlist
    return items.map(item => {
      const movie = playlistMovies.find(m => m.id === item.movieId);
      return movie!;
    }).filter(Boolean);
  }

  async addMovieToPlaylist(playlistItem: InsertPlaylistItem): Promise<PlaylistItem> {
    // Check if the movie is already in the playlist
    const existingItems = await db
      .select()
      .from(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistItem.playlistId),
          eq(playlistItems.movieId, playlistItem.movieId)
        )
      );

    if (existingItems.length > 0) {
      throw new Error('Movie already exists in this playlist');
    }

    // Get the highest sort order
    const [lastItem] = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistItem.playlistId))
      .orderBy(desc(playlistItems.sortOrder))
      .limit(1);

    // Set the new sort order
    const newSortOrder = lastItem ? lastItem.sortOrder + 1 : 0;
    
    // Create the new playlist item
    const [newItem] = await db
      .insert(playlistItems)
      .values({
        ...playlistItem,
        sortOrder: playlistItem.sortOrder ?? newSortOrder
      })
      .returning();

    // Update the playlist's updatedAt timestamp
    await this.updatePlaylist(playlistItem.playlistId, {});
    
    return newItem;
  }

  async updatePlaylistItem(id: number, item: Partial<PlaylistItem>): Promise<PlaylistItem> {
    const [updatedItem] = await db
      .update(playlistItems)
      .set(item)
      .where(eq(playlistItems.id, id))
      .returning();
    
    // Update the playlist's updatedAt timestamp
    await this.updatePlaylist(updatedItem.playlistId, {});
    
    return updatedItem;
  }

  async removeMovieFromPlaylist(playlistId: number, movieId: number): Promise<void> {
    const [item] = await db
      .select()
      .from(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.movieId, movieId)
        )
      );

    if (!item) {
      throw new Error('Movie not found in playlist');
    }

    // Delete the playlist item
    await db
      .delete(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.movieId, movieId)
        )
      );

    // Re-order remaining items to ensure no gaps in sort order
    const remainingItems = await this.getPlaylistItems(playlistId);
    for (let i = 0; i < remainingItems.length; i++) {
      await db
        .update(playlistItems)
        .set({ sortOrder: i })
        .where(eq(playlistItems.id, remainingItems[i].id));
    }

    // Update the playlist's updatedAt timestamp
    await this.updatePlaylist(playlistId, {});
  }

  async reorderPlaylistItems(playlistId: number, itemIds: number[]): Promise<void> {
    // Verify all items exist and belong to the playlist
    const items = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));
    
    const itemsMap = new Map(items.map(item => [item.id, item]));
    
    for (const id of itemIds) {
      const item = itemsMap.get(id);
      if (!item || item.playlistId !== playlistId) {
        throw new Error(`Item with ID ${id} not found in playlist ${playlistId}`);
      }
    }
    
    // Update sort order for each item
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(playlistItems)
        .set({ sortOrder: i })
        .where(eq(playlistItems.id, itemIds[i]));
    }
    
    // Update the playlist's updatedAt timestamp
    await this.updatePlaylist(playlistId, {});
  }

  // Friendship operations
  async searchUsers(query: string, excludeUserId?: number): Promise<User[]> {
    // Search for users by username or full name
    let result = await db
      .select()
      .from(users)
      .where(
        or(
          sql`LOWER(${users.username}) LIKE ${`%${query.toLowerCase()}%`}`,
          sql`LOWER(${users.fullName}) LIKE ${`%${query.toLowerCase()}%`}`
        )
      );
    
    // Filter out the current user if excludeUserId is provided
    if (excludeUserId) {
      result = result.filter(user => user.id !== excludeUserId);
    }
    
    return result;
  }

  async getFriendships(userId: number, status?: string): Promise<Friendship[]> {
    let query = db
      .select()
      .from(friendships)
      .where(
        or(
          eq(friendships.userId, userId),
          eq(friendships.friendId, userId)
        )
      );
    
    // Filter by status if provided
    if (status) {
      query = query.where(eq(friendships.status, status));
    }
    
    return await query;
  }

  async getFriendshipRequests(userId: number): Promise<Friendship[]> {
    // Get all pending friendship requests where the user is the recipient
    return db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, "pending")
        )
      );
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    // Check if this friendship already exists
    const existingFriendships = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.userId, friendship.userId),
            eq(friendships.friendId, friendship.friendId)
          ),
          and(
            eq(friendships.userId, friendship.friendId),
            eq(friendships.friendId, friendship.userId)
          )
        )
      );
    
    if (existingFriendships.length > 0) {
      // Check the status of the existing friendship
      const existingFriendship = existingFriendships[0];
      
      if (existingFriendship.status === "pending") {
        throw new Error("You already have a pending friend request with this user");
      } else if (existingFriendship.status === "accepted") {
        throw new Error("You are already friends with this user");
      } else if (existingFriendship.status === "rejected") {
        throw new Error("This friend request was previously rejected");
      } else {
        throw new Error("A friendship connection already exists with this user");
      }
    }
    
    // Create the new friendship
    const [newFriendship] = await db
      .insert(friendships)
      .values(friendship)
      .returning();
    
    return newFriendship;
  }

  async updateFriendshipStatus(id: number, status: string): Promise<Friendship> {
    const [updatedFriendship] = await db
      .update(friendships)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(friendships.id, id))
      .returning();
    
    return updatedFriendship;
  }

  async deleteFriendship(userId: number, friendId: number): Promise<void> {
    await db
      .delete(friendships)
      .where(
        or(
          and(
            eq(friendships.userId, userId),
            eq(friendships.friendId, friendId)
          ),
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId)
          )
        )
      );
  }

  // Playlist Sharing operations
  async getSharedPlaylists(userId: number): Promise<Playlist[]> {
    const shares = await db
      .select({
        playlistId: playlistShares.playlistId
      })
      .from(playlistShares)
      .where(eq(playlistShares.sharedWithUserId, userId));
    
    if (shares.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(playlists)
      .where(inArray(playlists.id, shares.map(s => s.playlistId)));
  }

  async getPublicPlaylists(): Promise<Playlist[]> {
    return db
      .select()
      .from(playlists)
      .where(eq(playlists.isPublic, true))
      .orderBy(desc(playlists.updatedAt));
  }

  async sharePlaylistWithUser(share: InsertPlaylistShare): Promise<PlaylistShare> {
    const [newShare] = await db
      .insert(playlistShares)
      .values(share)
      .returning();
    
    return newShare;
  }

  async getPlaylistShares(playlistId: number): Promise<PlaylistShare[]> {
    return db
      .select()
      .from(playlistShares)
      .where(eq(playlistShares.playlistId, playlistId));
  }

  async removePlaylistShare(playlistId: number, userId: number): Promise<void> {
    await db
      .delete(playlistShares)
      .where(
        and(
          eq(playlistShares.playlistId, playlistId),
          eq(playlistShares.sharedWithUserId, userId)
        )
      );
  }

  // Shared Watching operations
  async getSharedWatches(userId: number): Promise<SharedWatch[]> {
    return db
      .select()
      .from(sharedWatches)
      .where(
        or(
          eq(sharedWatches.initiatedByUserId, userId),
          eq(sharedWatches.watchedWithUserId, userId)
        )
      )
      .orderBy(desc(sharedWatches.watchedAt));
  }

  async addSharedWatch(sharedWatch: InsertSharedWatch): Promise<SharedWatch> {
    const [newSharedWatch] = await db
      .insert(sharedWatches)
      .values(sharedWatch)
      .returning();
    
    return newSharedWatch;
  }

  async removeSharedWatch(id: number): Promise<void> {
    await db
      .delete(sharedWatches)
      .where(eq(sharedWatches.id, id));
  }
}