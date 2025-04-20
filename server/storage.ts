import { 
  users, type User, type InsertUser,
  movies, type Movie, type InsertMovie,
  categories, type Category, type InsertCategory,
  movieCategories, type MovieCategory, type InsertMovieCategory,
  watchHistory, type WatchHistory, type InsertWatchHistory
} from "@shared/schema";

// Define storage interface for all needed operations
export interface IStorage {
  // User operations (keeping from existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Movie operations
  getMovies(filters?: {
    categories?: number[];
    minRating?: number;
    yearFrom?: number;
    yearTo?: number;
    excludeIds?: number[];
    sort?: string;
  }): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Movie Category operations
  getMovieCategories(movieId: number): Promise<MovieCategory[]>;
  addCategoryToMovie(movieCategory: InsertMovieCategory): Promise<MovieCategory>;
  
  // Watch History operations
  getWatchHistory(): Promise<WatchHistory[]>;
  addToWatchHistory(history: InsertWatchHistory): Promise<WatchHistory>;
  clearWatchHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private movies: Map<number, Movie>;
  private categories: Map<number, Category>;
  private movieCategories: Map<number, MovieCategory>;
  private watchHistory: Map<number, WatchHistory>;
  
  private userCounter: number;
  private movieCounter: number;
  private categoryCounter: number;
  private movieCategoryCounter: number;
  private watchHistoryCounter: number;
  
  constructor() {
    this.users = new Map();
    this.movies = new Map();
    this.categories = new Map();
    this.movieCategories = new Map();
    this.watchHistory = new Map();
    
    this.userCounter = 1;
    this.movieCounter = 1;
    this.categoryCounter = 1;
    this.movieCategoryCounter = 1;
    this.watchHistoryCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // User operations (keeping from existing)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
    let movies = Array.from(this.movies.values());
    
    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      console.log("Applying category filter with:", filters.categories);
      
      const moviesWithCategories = new Set<number>();
      
      // Get all movie IDs that have any of the specified categories
      const movieCategoryEntries = Array.from(this.movieCategories.values());
      
      for (const entry of movieCategoryEntries) {
        // Compare as strings to ensure consistent comparison
        if (filters.categories.map(String).includes(String(entry.categoryId))) {
          moviesWithCategories.add(entry.movieId);
        }
      }
      
      console.log("Movies with matching categories:", Array.from(moviesWithCategories));
      
      // Filter movies to only include those with matching categories
      movies = movies.filter(movie => moviesWithCategories.has(movie.id));
    }
    
    // Apply minimum rating filter
    if (filters.minRating) {
      movies = movies.filter(movie => movie.rating >= filters.minRating);
    }
    
    // Apply year range filter
    if (filters.yearFrom && filters.yearFrom !== 0) {
      movies = movies.filter(movie => movie.year >= filters.yearFrom);
    }
    
    if (filters.yearTo && filters.yearTo !== 0) {
      movies = movies.filter(movie => movie.year <= filters.yearTo);
    }
    
    // Exclude already watched movies
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      movies = movies.filter(movie => !filters.excludeIds?.includes(movie.id));
    }
    
    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'rating_desc':
          movies.sort((a, b) => b.rating - a.rating);
          break;
        case 'year_desc':
          movies.sort((a, b) => b.year - a.year);
          break;
        case 'title_asc':
          movies.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }
    } else {
      // Default sort by rating (descending)
      movies.sort((a, b) => b.rating - a.rating);
    }
    
    return movies;
  }
  
  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }
  
  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = this.movieCounter++;
    const movie: Movie = { ...insertMovie, id };
    this.movies.set(id, movie);
    return movie;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Movie Category operations
  async getMovieCategories(movieId: number): Promise<MovieCategory[]> {
    return Array.from(this.movieCategories.values()).filter(
      (mc) => mc.movieId === movieId,
    );
  }
  
  async addCategoryToMovie(insertMovieCategory: InsertMovieCategory): Promise<MovieCategory> {
    const id = this.movieCategoryCounter++;
    const movieCategory: MovieCategory = { ...insertMovieCategory, id };
    this.movieCategories.set(id, movieCategory);
    return movieCategory;
  }
  
  // Watch History operations
  async getWatchHistory(): Promise<WatchHistory[]> {
    const history = Array.from(this.watchHistory.values());
    // Sort by most recent first
    return history.sort((a, b) => {
      return new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
    });
  }
  
  async addToWatchHistory(insertHistory: InsertWatchHistory): Promise<WatchHistory> {
    const id = this.watchHistoryCounter++;
    const watchHistory: WatchHistory = {
      ...insertHistory,
      id,
      watchedAt: new Date().toISOString(),
    };
    this.watchHistory.set(id, watchHistory);
    return watchHistory;
  }
  
  async clearWatchHistory(): Promise<void> {
    this.watchHistory.clear();
  }
  
  // Helper to initialize sample data
  private async initializeSampleData() {
    // Add sample categories
    const categoryNames = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Thriller", "Documentary"];
    for (const name of categoryNames) {
      await this.createCategory({ name });
    }
    
    // Add sample movies
    const sampleMovies: InsertMovie[] = [
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
    
    for (const movieData of sampleMovies) {
      await this.createMovie(movieData);
    }
    
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
    
    const allMovies = Array.from(this.movies.values());
    const allCategories = Array.from(this.categories.values());
    
    for (const movie of allMovies) {
      const categories = movieCategoryMap[movie.title] || [];
      for (const categoryName of categories) {
        const category = allCategories.find(c => c.name === categoryName);
        if (category) {
          await this.addCategoryToMovie({
            movieId: movie.id,
            categoryId: category.id
          });
        }
      }
    }
    
    // Add sample watch history
    const watchedMovies = [
      { title: "Barbie", year: 2023, imageUrl: "https://image.tmdb.org/t/p/w200/1E5baAaEse26fej7uHcjOgEE2t2.jpg" },
      { title: "The Super Mario Bros. Movie", year: 2023, imageUrl: "https://image.tmdb.org/t/p/w200/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg" },
      { title: "Mission: Impossible", year: 2023, imageUrl: "https://image.tmdb.org/t/p/w200/NNxYkU70HPurnNCSiCjYAmacwm.jpg" }
    ];
    
    for (const watched of watchedMovies) {
      // Create the movie
      const movie = await this.createMovie({
        title: watched.title,
        description: "Recently watched movie.",
        year: watched.year,
        rating: 7.0,
        imageUrl: watched.imageUrl
      });
      
      // Add to watch history with a slightly different date for each
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 10));
      
      const watchHistoryEntry: WatchHistory = {
        id: this.watchHistoryCounter++,
        movieId: movie.id,
        watchedAt: date.toISOString()
      };
      
      this.watchHistory.set(watchHistoryEntry.id, watchHistoryEntry);
    }
  }
}

import { DatabaseStorage } from "./databaseStorage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
