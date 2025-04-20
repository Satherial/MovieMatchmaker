import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertWatchHistorySchema } from "@shared/schema";
import { setupAuth } from "./auth";

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
      const watchHistory = await storage.getWatchHistory();
      const watchedMovieIds = watchHistory.map(item => item.movieId);
      
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
  
  // Get watch history
  apiRouter.get("/watch-history", async (req, res) => {
    try {
      const watchHistory = await storage.getWatchHistory();
      
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
      // Validate the request body
      const validation = insertWatchHistorySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }
      
      // Check if movie exists
      const movie = await storage.getMovie(validation.data.movieId);
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
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
  
  // Clear watch history
  apiRouter.delete("/watch-history", async (req, res) => {
    try {
      await storage.clearWatchHistory();
      res.status(200).json({ message: "Watch history cleared successfully" });
    } catch (error) {
      console.error("Error clearing watch history:", error);
      res.status(500).json({ error: "Failed to clear watch history" });
    }
  });
  
  // Mount the API router under /api
  app.use("/api", apiRouter);
  
  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
