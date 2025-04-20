import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertWatchHistorySchema } from "@shared/schema";
import { setupAuth } from "./auth";
import * as tmdbClient from "./tmdb-client";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Create the API router
  const apiRouter = express.Router();
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Unauthorized - Please log in" });
  };
  
  // Get all categories
  apiRouter.get("/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Transform to match client-side structure
      const formattedCategories = categories.map(category => ({
        id: category.id.toString(),
        name: category.name
      }));
      
      res.json(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  // Get movies (with filtering)
  apiRouter.get("/movies", async (req, res) => {
    try {
      const query = req.query;
      
      // Get watch history to exclude watched movies
      // If user is authenticated, only exclude their watched movies
      let watchedMovieIds: number[] = [];
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        const userWatchHistory = await storage.getWatchHistory(userId);
        watchedMovieIds = userWatchHistory.map(item => item.movieId);
      } else {
        const watchHistory = await storage.getWatchHistory();
        watchedMovieIds = watchHistory.map(item => item.movieId);
      }
      
      // Parse filter parameters
      let categoryIds: number[] = [];
      if (query.categories) {
        // Log the raw categories parameter for debugging
        console.log("Raw categories parameter:", query.categories);
        
        if (typeof query.categories === 'string') {
          try {
            // First try to parse as JSON
            const parsed = JSON.parse(query.categories);
            if (Array.isArray(parsed)) {
              categoryIds = parsed.map(id => parseInt(id)).filter(id => !isNaN(id));
            } else if (parsed) {
              const parsedNum = parseInt(parsed);
              if (!isNaN(parsedNum)) {
                categoryIds = [parsedNum];
              }
            }
          } catch (e) {
            // If it fails to parse as JSON, try as a comma-separated list
            categoryIds = query.categories.split(',')
              .map(id => parseInt(id))
              .filter(id => !isNaN(id));
          }
        } else if (Array.isArray(query.categories)) {
          // Handle case where Express might parse it as an array already
          categoryIds = query.categories
            .map(id => parseInt(id.toString()))
            .filter(id => !isNaN(id));
        }
      }
      
      console.log("Processed category IDs:", categoryIds);
      
      const minRating = query.minRating ? Number(query.minRating) : 1;
      const yearFrom = query.yearFrom && query.yearFrom !== 'Any' ? Number(query.yearFrom) : 0;
      const yearTo = query.yearTo && query.yearTo !== 'Any' ? Number(query.yearTo) : 0;
      const sort = typeof query.sort === 'string' ? query.sort : 'rating_desc';
      
      // Get filtered movies
      const movies = await storage.getMovies({
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        minRating,
        yearFrom: yearFrom || undefined,
        yearTo: yearTo || undefined,
        excludeIds: watchedMovieIds,
        sort
      });
      
      // For each movie, get its categories
      const moviesWithCategories = await Promise.all(
        movies.map(async (movie) => {
          const movieCategories = await storage.getMovieCategories(movie.id);
          const categories = await Promise.all(
            movieCategories.map(async (mc) => {
              const cat = await storage.getCategory(mc.categoryId);
              return cat ? cat.name : null;
            })
          );
          
          return {
            ...movie,
            categories: categories.filter(Boolean) as string[]
          };
        })
      );
      
      res.json(moviesWithCategories);
    } catch (error) {
      console.error("Error fetching movies:", error);
      res.status(500).json({ error: "Failed to fetch movies" });
    }
  });
  
  // Get a single movie
  apiRouter.get("/movies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const movie = await storage.getMovie(id);
      
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }
      
      // Get movie categories
      const movieCategories = await storage.getMovieCategories(id);
      const categories = await Promise.all(
        movieCategories.map(async (mc) => {
          const cat = await storage.getCategory(mc.categoryId);
          return cat ? cat.name : null;
        })
      );
      
      res.json({
        ...movie,
        categories: categories.filter(Boolean)
      });
    } catch (error) {
      console.error(`Error fetching movie ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch movie" });
    }
  });
  
  // Get watch history (with option for user-specific data)
  apiRouter.get("/watch-history", async (req, res) => {
    try {
      // Determine which watch history to fetch
      let watchHistory;
      if (req.isAuthenticated()) {
        // If authenticated, get user-specific watch history
        const userId = req.user.id;
        watchHistory = await storage.getWatchHistory(userId);
      } else {
        // Otherwise get all watch history
        watchHistory = await storage.getWatchHistory();
      }
      
      // Enhance with movie details
      const enhancedHistory = await Promise.all(
        watchHistory.map(async (item) => {
          const movie = await storage.getMovie(item.movieId);
          
          if (movie) {
            // Get movie categories
            const movieCategories = await storage.getMovieCategories(item.movieId);
            const categories = await Promise.all(
              movieCategories.map(async (mc) => {
                const cat = await storage.getCategory(mc.categoryId);
                return cat ? cat.name : null;
              })
            );
            
            return {
              ...item,
              movie: {
                ...movie,
                categories: categories.filter(Boolean) as string[]
              }
            };
          }
          
          return item;
        })
      );
      
      res.json(enhancedHistory);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ error: "Failed to fetch watch history" });
    }
  });
  
  // Add to watch history
  apiRouter.post("/watch-history", async (req, res) => {
    try {
      // Get base data from request
      const { movieId, rating, notes } = req.body;
      
      if (!movieId) {
        return res.status(400).json({ error: "Movie ID is required" });
      }
      
      // Check if movie exists
      const movie = await storage.getMovie(Number(movieId));
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }
      
      // Create watch history entry
      let watchHistoryData: any = {
        movieId: Number(movieId),
        watchedAt: new Date(),
        rating: rating || null,
        notes: notes || null
      };
      
      // If authenticated, add userId
      if (req.isAuthenticated()) {
        watchHistoryData.userId = req.user.id;
      }
      
      // Validate the request data
      const validation = insertWatchHistorySchema.safeParse(watchHistoryData);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      // Add to watch history
      const result = await storage.addToWatchHistory(validation.data);
      
      // Return with movie details
      const watchHistoryWithMovie = {
        ...result,
        movie
      };
      
      res.status(201).json(watchHistoryWithMovie);
    } catch (error) {
      console.error("Error adding to watch history:", error);
      res.status(500).json({ error: "Failed to add to watch history" });
    }
  });
  
  // Clear watch history (user-specific if authenticated)
  apiRouter.delete("/watch-history", async (req, res) => {
    try {
      if (req.isAuthenticated()) {
        // Clear only the authenticated user's history
        await storage.clearWatchHistory(req.user.id);
        res.status(200).json({ message: "Your watch history cleared successfully" });
      } else {
        // Clear all watch history (should be restricted to admins in production)
        await storage.clearWatchHistory();
        res.status(200).json({ message: "All watch history cleared successfully" });
      }
    } catch (error) {
      console.error("Error clearing watch history:", error);
      res.status(500).json({ error: "Failed to clear watch history" });
    }
  });
  
  // Get movie recommendations based on user's watch history
  apiRouter.get("/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      
      // Get recommendations
      const recommendedMovies = await storage.getRecommendedMovies(userId, limit);
      
      // Enhance with categories
      const moviesWithCategories = await Promise.all(
        recommendedMovies.map(async (movie) => {
          const movieCategories = await storage.getMovieCategories(movie.id);
          const categories = await Promise.all(
            movieCategories.map(async (mc) => {
              const cat = await storage.getCategory(mc.categoryId);
              return cat ? cat.name : null;
            })
          );
          
          return {
            ...movie,
            categories: categories.filter(Boolean) as string[]
          };
        })
      );
      
      res.json(moviesWithCategories);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch movie recommendations" });
    }
  });
  
  // Get user preferences
  apiRouter.get("/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ error: "No preferences found" });
      }
      
      // Parse preferences if it's a JSON string
      try {
        const parsedPreferences = JSON.parse(preferences);
        return res.json(parsedPreferences);
      } catch (e) {
        // If it's not valid JSON, return as is
        return res.json({ preferences });
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });
  
  // Update user preferences
  apiRouter.put("/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;
      
      // Convert to string if an object is provided
      const preferencesString = typeof preferences === 'object' 
        ? JSON.stringify(preferences) 
        : preferences;
      
      const updatedUser = await storage.saveUserPreferences(userId, preferencesString);
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });
  
  // TMDb API integration endpoints

  // Search movies from TMDb
  apiRouter.get("/tmdb/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const results = await tmdbClient.searchMovies(query, page);
      res.json(results);
    } catch (error) {
      console.error("Error searching movies:", error);
      res.status(500).json({ error: "Failed to search movies" });
    }
  });
  
  // Get movie details from TMDb
  apiRouter.get("/tmdb/movies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid movie ID" });
      }
      
      const movie = await tmdbClient.getMovieDetails(id);
      res.json(movie);
    } catch (error) {
      console.error(`Error fetching TMDb movie ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch movie details" });
    }
  });
  
  // Get popular movies from TMDb
  apiRouter.get("/tmdb/popular", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const results = await tmdbClient.getPopularMovies(page);
      res.json(results);
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      res.status(500).json({ error: "Failed to fetch popular movies" });
    }
  });
  
  // Get movies by genre from TMDb
  apiRouter.get("/tmdb/genres/:id/movies", async (req, res) => {
    try {
      const genreId = Number(req.params.id);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      
      if (isNaN(genreId)) {
        return res.status(400).json({ error: "Invalid genre ID" });
      }
      
      const results = await tmdbClient.getMoviesByGenre(genreId, page);
      res.json(results);
    } catch (error) {
      console.error(`Error fetching movies for genre ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch movies by genre" });
    }
  });
  
  // Get all genres from TMDb
  apiRouter.get("/tmdb/genres", async (req, res) => {
    try {
      const genres = await tmdbClient.getGenres();
      res.json(genres);
    } catch (error) {
      console.error("Error fetching TMDb genres:", error);
      res.status(500).json({ error: "Failed to fetch genres" });
    }
  });
  
  // Import a movie from TMDb to the local database
  apiRouter.post("/tmdb/import", async (req, res) => {
    try {
      const { movieId } = req.body;
      
      if (!movieId) {
        return res.status(400).json({ error: "Movie ID is required" });
      }
      
      // Check if movie already exists in our database
      let movie = await storage.getMovie(Number(movieId));
      
      if (movie) {
        return res.status(409).json({ 
          message: "Movie already exists in database", 
          movie 
        });
      }
      
      // Fetch movie details from TMDb
      const tmdbMovie = await tmdbClient.getMovieDetails(Number(movieId));
      
      // Create the movie in our database
      movie = await storage.createMovie({
        title: tmdbMovie.title,
        description: tmdbMovie.description,
        year: tmdbMovie.year,
        imageUrl: tmdbMovie.imageUrl,
        rating: tmdbMovie.rating,
        director: tmdbMovie.director || null,
        actors: tmdbMovie.actors || null,
        duration: tmdbMovie.duration || null,
        country: tmdbMovie.country || null,
        language: tmdbMovie.language || null,
        releaseDate: tmdbMovie.releaseDate || null
      });
      
      // If the movie has categories, add them
      const tmdbCategories = tmdbMovie.categories || [];
      if (tmdbCategories.length > 0) {
        for (const categoryName of tmdbCategories) {
          // Check if category exists in our database
          let category = await storage.getCategoryByName(categoryName);
          
          // If not, create it
          if (!category) {
            category = await storage.createCategory({
              name: categoryName
            });
          }
          
          // Associate category with movie
          await storage.addCategoryToMovie({
            movieId: movie.id,
            categoryId: category.id
          });
        }
      }
      
      // Get movie with categories
      const movieCategories = await storage.getMovieCategories(movie.id);
      const categoryNames = await Promise.all(
        movieCategories.map(async (mc) => {
          const cat = await storage.getCategory(mc.categoryId);
          return cat ? cat.name : null;
        })
      );
      
      res.status(201).json({
        ...movie,
        categories: categoryNames.filter(Boolean)
      });
    } catch (error) {
      console.error("Error importing movie:", error);
      res.status(500).json({ error: "Failed to import movie" });
    }
  });

  // Mount the API router under /api
  app.use("/api", apiRouter);
  
  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
