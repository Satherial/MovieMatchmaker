import express, {
  type Express,
  Request,
  Response,
  NextFunction,
} from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWatchHistorySchema,
  insertPlaylistSchema,
  insertPlaylistItemSchema,
  InsertWatchHistory,
} from "@shared/schema";
import { setupAuth } from "./auth";
import { setupMCPRoutes } from "./mcp/routes";
import { trailerRouter } from "./api/trailer";
import * as streamingAvailability from "streaming-availability";

// Import our new API routers
import friendsRouter from "./api/friends";
import playlistSharesRouter from "./api/playlist-shares";
import sharedWatchesRouter from "./api/shared-watches";

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
    res.status(401).send("Unauthorized - Please log in");
  };

  // Define User interface type for TypeScript
  interface User {
    id: number;
    username: string;
    [key: string]: any; // For any additional properties
  }

  // Type assertion helper
  const getAuthUser = (req: Request): User => {
    return req.user as User;
  };

  // Get all categories
  apiRouter.get("/categories", async (req, res) => {
    try {
      // TMDB API configuration
      const TMDB_BASE_URL = "https://api.themoviedb.org/3";

      // Make request to TMDB API for genres list
      const tmdbResponse = await fetch(`${TMDB_BASE_URL}/genre/movie/list`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!tmdbResponse.ok) {
        throw new Error(`TMDB API error: ${tmdbResponse.status}`);
      }

      const tmdbData = await tmdbResponse.json();

      // Transform to match client-side structure
      const formattedCategories = tmdbData.genres.map(
        (genre: { id: number; name: string }) => ({
          id: genre.id.toString(),
          name: genre.name,
        })
      );

      res.json(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories from TMDB:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get movies (with filtering and pagination)
  apiRouter.get("/movies", async (req, res) => {
    try {
      const query = req.query;

      // Get watch history to exclude watched movies
      // If user is authenticated, only exclude their watched movies
      let watchedMovieIds: number[] = [];
      if (req.isAuthenticated()) {
        const userId = getAuthUser(req).id;
        const userWatchHistory = await storage.getWatchHistory(userId);
        watchedMovieIds = userWatchHistory.map((item) => item.movieId);
      }

      // TMDB API configuration
      const TMDB_BASE_URL = "https://api.themoviedb.org/3";
      const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

      // Build query parameters for TMDB API
      const queryParams = new URLSearchParams({
        include_adult: "false",
        include_video: "false",
        language: "en-US", // Default language
        page: (query.page as string) || "1",
        sort_by: (query.sort as string) || "primary_release_date.desc",
      });

      // Support language filter if provided
      if (query.language && query.language !== "all") {
        // Cast language to string and ensure it's a single value
        const langCode = String(query.language);

        // Override the default language with the user's selection for API responses
        // Format like "en-US", "fr-FR", etc.
        queryParams.set("language", `${langCode}-${langCode.toUpperCase()}`);

        // Filter movies in the chosen language
        // This finds movies where the original language matches the selected language
        queryParams.append("with_original_language", langCode);

        console.log(`🌐 Language filter applied: ${langCode}`);
      } else {
        // Default language handling - use English if no language specified
        // This provides localized content but doesn't filter by original language
        queryParams.set("language", "en-US");
      }

      // Add country of origin filter if provided
      if (query.country && query.country !== "Any") {
        // Filter movies by origin country
        queryParams.append("with_origin_country", query.country as string);
        console.log(`🌍 Country filter applied: ${query.country}`);
      }

      // Add year filter if provided
      if (query.yearFrom && query.yearFrom !== "Any") {
        queryParams.append(
          "primary_release_date.gte",
          `${query.yearFrom}-01-01`
        );
      }
      if (query.yearTo && query.yearTo !== "Any") {
        queryParams.append("primary_release_date.lte", `${query.yearTo}-12-31`);
      }

      // Add minimum rating filter if provided
      if (query.minRating) {
        console.log(`🌟 Using provided minimum rating: ${query.minRating}`);
        queryParams.append("vote_average.gte", query.minRating as string);
      } else {
        // Set default minimum rating to 8.0 if not specified
        console.log(`🌟 Using default minimum rating: 8.0`);
        queryParams.append("vote_average.gte", "8.0");
      }

      // Ensure we're always filtering for quality movies by adding a vote count filter
      queryParams.append("vote_count.gte", "100"); // Ensure movies have a minimum number of votes

      // Add genre/category filter if provided
      if (query.categories) {
        let categoryIds: number[] = [];
        if (typeof query.categories === "string") {
          try {
            // First try to parse as JSON
            const parsed = JSON.parse(query.categories);
            if (Array.isArray(parsed)) {
              categoryIds = parsed
                .map((id) => parseInt(id))
                .filter((id) => !isNaN(id));
            }
          } catch (e) {
            // If it fails to parse as JSON, try as a comma-separated list
            categoryIds = query.categories
              .split(",")
              .map((id) => parseInt(id))
              .filter((id) => !isNaN(id));
          }
        }
        if (categoryIds.length > 0) {
          queryParams.append("with_genres", categoryIds.join(","));
        }
      }

      console.log(`🔍 Query params: ${queryParams.toString()}`);

      // Make request to TMDB API
      const tmdbResponse = await fetch(
        `${TMDB_BASE_URL}/discover/movie?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!tmdbResponse.ok) {
        throw new Error(`TMDB API error: ${tmdbResponse.status}`);
      }

      const tmdbData = await tmdbResponse.json();

      // Transform TMDB response to match our app's format
      interface MovieResult {
        id: number;
        title: string;
        description: string;
        year: number;
        rating: number;
        imageUrl: string | null;
        backdropUrl: string | null;
        categories: string[];
      }

      const movies: MovieResult[] = tmdbData.results.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        year: new Date(movie.release_date).getFullYear(),
        rating: movie.vote_average,
        imageUrl: movie.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
          : null,
        backdropUrl: movie.backdrop_path
          ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
          : null,
        categories: [], // We'll fetch categories separately
      }));

      console.log(
        `📊 Movie ratings: ${movies
          .map((m: MovieResult) => m.rating)
          .join(", ")}`
      );

      // Filter out watched movies and ensure minimum rating
      const filteredMovies = movies.filter(
        (movie: { id: number; rating: number }) =>
          !watchedMovieIds.includes(movie.id) && movie.rating >= 8.0 // Double-check minimum rating on our side
      );

      // Get genres for each movie from TMDB
      const genresResponse = await fetch(`${TMDB_BASE_URL}/genre/movie/list`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!genresResponse.ok) {
        throw new Error(`TMDB Genres API error: ${genresResponse.status}`);
      }

      const genresData = await genresResponse.json();
      const genresMap = new Map(
        genresData.genres.map((g: any) => [g.id, g.name])
      );

      // Add categories to each movie
      const moviesWithCategories = filteredMovies.map((movie: any) => ({
        ...movie,
        categories: (
          tmdbData.results.find((m: any) => m.id === movie.id)?.genre_ids || []
        )
          .map((genreId: number) => genresMap.get(genreId))
          .filter(Boolean),
      }));

      // Return movies with pagination metadata
      res.json({
        movies: moviesWithCategories,
        pagination: {
          currentPage: Number(query.page) || 1,
          totalPages: tmdbData.total_pages,
          totalCount: tmdbData.total_results,
          hasNextPage: (Number(query.page) || 1) < tmdbData.total_pages,
          hasPrevPage: (Number(query.page) || 1) > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching movies from TMDB:", error);
      res.status(500).json({ error: "Failed to fetch movies" });
    }
  });

  // Get a single movie
  apiRouter.get("/movies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid movie ID" });
      }

      // TMDB API configuration
      const TMDB_BASE_URL = "https://api.themoviedb.org/3";
      const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

      // Make request to TMDB API for movie details
      const tmdbResponse = await fetch(`${TMDB_BASE_URL}/movie/${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!tmdbResponse.ok) {
        if (tmdbResponse.status === 404) {
          return res.status(404).json({ error: "Movie not found" });
        }
        throw new Error(`TMDB API error: ${tmdbResponse.status}`);
      }

      const tmdbMovie = await tmdbResponse.json();

      // Transform TMDB response to match our app's format
      const movie = {
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        description: tmdbMovie.overview,
        year: new Date(tmdbMovie.release_date).getFullYear(),
        rating: tmdbMovie.vote_average,
        imageUrl: tmdbMovie.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${tmdbMovie.poster_path}`
          : "",
        backdropUrl: tmdbMovie.backdrop_path
          ? `${TMDB_IMAGE_BASE_URL}${tmdbMovie.backdrop_path}`
          : null,
        categories: tmdbMovie.genres.map(
          (genre: { name: string }) => genre.name
        ),
        director: tmdbMovie.credits?.crew?.find(
          (person: { job: string }) => person.job === "Director"
        )?.name,
        duration: tmdbMovie.runtime,
        language: tmdbMovie.original_language,
        releaseDate: tmdbMovie.release_date,
      };

      res.json(movie);
    } catch (error) {
      console.error(`Error fetching movie ${req.params.id} from TMDB:`, error);
      res.status(500).json({ error: "Failed to fetch movie from TMDB" });
    }
  });

  // Get watch history (with option for user-specific data)
  apiRouter.get("/watch-history", async (req, res) => {
    try {
      // Determine which watch history to fetch
      let watchHistory;
      if (req.isAuthenticated()) {
        // If authenticated, get user-specific watch history
        const userId = getAuthUser(req).id;
        watchHistory = await storage.getWatchHistory(userId);
      } else {
        // Otherwise get all watch history
        watchHistory = await storage.getWatchHistory();
      }

      // Enhance watch history with movie details
      const enhancedHistory = await Promise.all(
        watchHistory.map(async (item) => {
          try {
            // Try to get movie from local database first
            let movie = await storage.getMovie(item.movieId);

            if (!movie) {
              // If not in local database, try to fetch from TMDB API
              const TMDB_BASE_URL = "https://api.themoviedb.org/3";
              const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

              const tmdbResponse = await fetch(
                `${TMDB_BASE_URL}/movie/${item.movieId}`,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
                    "Content-Type": "application/json",
                  },
                }
              ).then((res) => (res.ok ? res.json() : null));

              if (tmdbResponse) {
                movie = {
                  id: tmdbResponse.id,
                  title: tmdbResponse.title,
                  description: tmdbResponse.overview,
                  year: new Date(tmdbResponse.release_date).getFullYear(),
                  rating: tmdbResponse.vote_average,
                  imageUrl: tmdbResponse.poster_path
                    ? `${TMDB_IMAGE_BASE_URL}${tmdbResponse.poster_path}`
                    : "",
                  language: tmdbResponse.original_language || null,
                  director: null,
                  actors: null,
                  duration: tmdbResponse.runtime || null,
                  country: null,
                  releaseDate: tmdbResponse.release_date || null,
                };
              }
            }

            return {
              ...item,
              movie: movie || {
                id: item.movieId,
                title: item.notes || "Unknown Movie",
                imageUrl: null,
                description: null,
              },
            };
          } catch (error) {
            console.error(`Error fetching movie ${item.movieId}:`, error);
            return {
              ...item,
              movie: {
                id: item.movieId,
                title: item.notes || "Unknown Movie",
                imageUrl: null,
                description: null,
              },
            };
          }
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
      // Get data from request
      const { movieId, title, imageUrl, description, rating, notes } = req.body;

      // Check if required fields are provided
      if (!movieId || !title) {
        return res
          .status(400)
          .json({ error: "Movie ID and title are required" });
      }

      // Create watch history entry
      const watchHistoryData: InsertWatchHistory = {
        movieId: Number(movieId),
        userId: req.isAuthenticated() ? getAuthUser(req).id : 1, // Default to user 1 if not authenticated
        rating: rating || null,
        notes: notes || null,
      };

      // Validate the request data
      const validation = insertWatchHistorySchema.safeParse(watchHistoryData);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      // Add to watch history
      const result = await storage.addToWatchHistory(validation.data);

      // Return result with movie info
      res.status(201).json({
        ...result,
        movie: {
          id: movieId,
          title,
          imageUrl: imageUrl || null,
          description: description || null,
        },
      });
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
        await storage.clearWatchHistory(getAuthUser(req).id);
        res
          .status(200)
          .json({ message: "Your watch history cleared successfully" });
      } else {
        // Clear all watch history (should be restricted to admins in production)
        await storage.clearWatchHistory();
        res
          .status(200)
          .json({ message: "All watch history cleared successfully" });
      }
    } catch (error) {
      console.error("Error clearing watch history:", error);
      res.status(500).json({ error: "Failed to clear watch history" });
    }
  });

  // Delete a single watch history item
  apiRouter.delete("/watch-history/:id", async (req, res) => {
    try {
      const watchHistoryId = parseInt(req.params.id);

      if (isNaN(watchHistoryId)) {
        return res.status(400).json({ error: "Invalid watch history ID" });
      }

      // Remove the watch history entry
      await storage.removeWatchHistory(watchHistoryId);

      res
        .status(200)
        .json({ message: "Watch history item removed successfully" });
    } catch (error) {
      console.error("Error removing watch history item:", error);
      res.status(500).json({ error: "Failed to remove watch history item" });
    }
  });

  // Get movie recommendations based on user's watch history
  apiRouter.get("/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthUser(req).id;
      const limit = req.query.limit ? Number(req.query.limit) : 5;

      // Get recommendations
      const recommendedMovies = await storage.getRecommendedMovies(
        userId,
        limit
      );

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
            categories: categories.filter(Boolean) as string[],
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
      const userId = getAuthUser(req).id;
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
      const userId = getAuthUser(req).id;
      const { preferences } = req.body;

      // Convert to string if an object is provided
      const preferencesString =
        typeof preferences === "object"
          ? JSON.stringify(preferences)
          : preferences;

      const updatedUser = await storage.saveUserPreferences(
        userId,
        preferencesString
      );

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Playlist Routes - User-generated movie playlists

  // Get user playlists (authenticated user only)
  apiRouter.get("/playlists", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthUser(req).id;
      const playlists = await storage.getUserPlaylists(userId);

      // Enhance playlists with movie count
      const enhancedPlaylists = await Promise.all(
        playlists.map(async (playlist) => {
          const movies = await storage.getPlaylistMovies(playlist.id);
          return {
            ...playlist,
            movieCount: movies.length,
          };
        })
      );

      res.json(enhancedPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  // Get a single playlist with its movies
  apiRouter.get("/playlists/:id", async (req, res) => {
    try {
      const playlistId = Number(req.params.id);
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      // Check if the user has access to this playlist
      if (
        !playlist.isPublic &&
        req.isAuthenticated() &&
        playlist.userId !== getAuthUser(req).id
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to view this playlist" });
      }

      // Get playlist movies
      const movies = await storage.getPlaylistMovies(playlistId);

      // Get playlist items for additional metadata
      const playlistItems = await storage.getPlaylistItems(playlistId);

      // Map movies with their playlist item data (notes, sort order)
      const moviesWithPlaylistData = movies.map((movie) => {
        const playlistItem = playlistItems.find(
          (item) => item.movieId === movie.id
        );
        return {
          ...movie,
          playlistItem: playlistItem || null,
        };
      });

      // Get creator info
      const creator = await storage.getUser(playlist.userId);
      const creatorInfo = creator
        ? {
            id: creator.id,
            username: creator.username,
            fullName: creator.fullName,
            avatarUrl: creator.avatarUrl,
          }
        : null;

      res.json({
        ...playlist,
        movies: moviesWithPlaylistData,
        creator: creatorInfo,
      });
    } catch (error) {
      console.error(`Error fetching playlist ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  // Create a new playlist
  apiRouter.post("/playlists", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthUser(req).id;
      const { name, description, isPublic } = req.body;

      // Create a playlist object
      const playlistData = {
        userId,
        name,
        description: description || null,
        isPublic: isPublic === true,
      };

      // Validate the data
      const validation = insertPlaylistSchema.safeParse(playlistData);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      // Create the playlist
      const playlist = await storage.createPlaylist(validation.data);
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  // Update a playlist
  apiRouter.put("/playlists/:id", isAuthenticated, async (req, res) => {
    try {
      const playlistId = Number(req.params.id);
      const userId = getAuthUser(req).id;

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You don't have permission to edit this playlist" });
      }

      // Update the playlist
      const { name, description, isPublic } = req.body;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      const updatedPlaylist = await storage.updatePlaylist(
        playlistId,
        updateData
      );
      res.json(updatedPlaylist);
    } catch (error) {
      console.error(`Error updating playlist ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update playlist" });
    }
  });

  // Delete a playlist
  apiRouter.delete("/playlists/:id", isAuthenticated, async (req, res) => {
    try {
      const playlistId = Number(req.params.id);
      const userId = getAuthUser(req).id;

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You don't have permission to delete this playlist" });
      }

      // Delete the playlist
      await storage.deletePlaylist(playlistId);
      res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error) {
      console.error(`Error deleting playlist ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  // Add a movie to a playlist
  apiRouter.post("/playlists/:id/movies", isAuthenticated, async (req, res) => {
    try {
      const playlistId = Number(req.params.id);
      const userId = getAuthUser(req).id;
      const { movieId, notes } = req.body;

      if (!movieId) {
        return res.status(400).json({ error: "Movie ID is required" });
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You don't have permission to add to this playlist" });
      }

      // Fetch movie details from TMDB API first
      const TMDB_BASE_URL = "https://api.themoviedb.org/3";
      const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
      let movieData = null;

      const tmdbResponse = await fetch(`${TMDB_BASE_URL}/movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!tmdbResponse.ok) {
        return res
          .status(404)
          .json({ error: "Movie not found in TMDB database" });
      }

      const tmdbData = await tmdbResponse.json();
      movieData = {
        id: tmdbData.id,
        title: tmdbData.title,
        description: tmdbData.overview || "",
        year: new Date(tmdbData.release_date || Date.now()).getFullYear(),
        rating: tmdbData.vote_average || 0,
        imageUrl: tmdbData.poster_path
          ? `${TMDB_IMAGE_BASE_URL}${tmdbData.poster_path}`
          : "",
        director: null,
        actors: null,
        duration: tmdbData.runtime || null,
        country: null,
        language: tmdbData.original_language || null,
        releaseDate: tmdbData.release_date || null,
        categories: tmdbData.genres?.map((g: any) => g.name) || [],
      };

      // Save the movie to our local database if it doesn't already exist
      let existingMovie = await storage.getMovie(Number(movieId));
      let savedMovieId = Number(movieId);

      if (!existingMovie) {
        try {
          // Create an InsertMovie object from movieData
          const movieToSave = {
            title: movieData.title,
            description: movieData.description,
            year: movieData.year,
            rating: movieData.rating,
            imageUrl: movieData.imageUrl,
            director: movieData.director,
            actors: movieData.actors,
            duration: movieData.duration,
            country: movieData.country,
            language: movieData.language,
            releaseDate: movieData.releaseDate,
          };
          // Save the movie to our database
          const savedMovie = await storage.createMovie(movieToSave);
          savedMovieId = savedMovie.id; // Use the database-generated ID
          console.log(
            `Movie ${movieId} saved to database with ID ${savedMovieId}`
          );
        } catch (error) {
          console.error(`Failed to save movie ${movieId} to database:`, error);
          return res
            .status(500)
            .json({ error: "Failed to save movie to database" });
        }
      } else {
        savedMovieId = existingMovie.id;
      }

      // Check if the movie is already in the playlist
      const playlistItems = await storage.getPlaylistItems(playlistId);
      const exists = playlistItems.some(
        (item) => item.movieId === savedMovieId
      );

      if (exists) {
        return res
          .status(409)
          .json({ error: "Movie already exists in this playlist" });
      }

      // Add movie to playlist
      try {
        const sortOrder = playlistItems.length + 1;
        await storage.addMovieToPlaylist({
          playlistId,
          movieId: savedMovieId,
          notes: notes || undefined,
          sortOrder,
        });

        res.status(201).json({
          success: true,
          message: "Movie added to playlist",
          data: {
            playlistId,
            movieId: savedMovieId,
          },
        });
      } catch (error) {
        console.error("Error adding movie to playlist", playlistId, error);
        res.status(500).json({ error: "Failed to add movie to playlist" });
      }
    } catch (error) {
      console.error(`Error adding movie to playlist ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to add movie to playlist" });
    }
  });

  // Remove a movie from a playlist
  apiRouter.delete(
    "/playlists/:id/movies/:movieId",
    isAuthenticated,
    async (req, res) => {
      try {
        const playlistId = Number(req.params.id);
        const movieId = Number(req.params.movieId);
        const userId = getAuthUser(req).id;

        // Check if playlist exists and belongs to user
        const playlist = await storage.getPlaylist(playlistId);

        if (!playlist) {
          return res.status(404).json({ error: "Playlist not found" });
        }

        if (playlist.userId !== userId) {
          return res.status(403).json({
            error: "You don't have permission to modify this playlist",
          });
        }

        // Remove the movie from the playlist
        await storage.removeMovieFromPlaylist(playlistId, movieId);
        res
          .status(200)
          .json({ message: "Movie removed from playlist successfully" });
      } catch (error: any) {
        if (error.message === "Movie not found in playlist") {
          return res.status(404).json({ error: error.message });
        }

        console.error(`Error removing movie from playlist:`, error);
        res.status(500).json({ error: "Failed to remove movie from playlist" });
      }
    }
  );

  // Reorder movies in a playlist
  apiRouter.put("/playlists/:id/reorder", isAuthenticated, async (req, res) => {
    try {
      const playlistId = Number(req.params.id);
      const userId = getAuthUser(req).id;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res
          .status(400)
          .json({ error: "Valid array of item IDs is required" });
      }

      // Check if playlist exists and belongs to user
      const playlist = await storage.getPlaylist(playlistId);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You don't have permission to modify this playlist" });
      }

      // Reorder the playlist items
      await storage.reorderPlaylistItems(playlistId, itemIds);

      // Get the updated items
      const updatedItems = await storage.getPlaylistItems(playlistId);
      res.json(updatedItems);
    } catch (error) {
      console.error(`Error reordering playlist ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to reorder playlist" });
    }
  });

  // Mount the API router under /api
  app.use("/api", apiRouter);

  // Register our social feature routers
  apiRouter.use("/friends", friendsRouter);
  apiRouter.use("/playlist-shares", playlistSharesRouter);
  apiRouter.use("/shared-watches", sharedWatchesRouter);

  // Add the trailer endpoint
  app.use("/api/trailer", trailerRouter);

  // Add streaming availability endpoint
  apiRouter.get("/streaming/:id", async (req, res) => {
    try {
      const movieId = req.params.id;
      // Get country parameter with validation
      const country = req.query.country
        ? String(req.query.country).toLowerCase()
        : "us";

      // Validate the country code format (should be 2 letters)
      if (!/^[a-z]{2}$/.test(country)) {
        return res.status(400).json({
          error:
            "Invalid country code format. Please use a two-letter country code (e.g., us, gb, fr).",
        });
      }

      if (!movieId) {
        return res.status(400).json({ error: "Movie ID is required" });
      }

      // Check if we have a RAPID_API_KEY
      if (!process.env.RAPID_API_KEY) {
        return res
          .status(500)
          .json({ error: "RAPID_API_KEY is not configured" });
      }

      // Initialize the streaming availability client
      const client = new streamingAvailability.Client(
        new streamingAvailability.Configuration({
          apiKey: process.env.RAPID_API_KEY,
        })
      );

      // Format the ID for the Streaming Availability API
      // For TMDB movie IDs, use the "movie/{id}" format
      const formattedId = `movie/${movieId}`;

      // Fetch streaming info
      const streamingInfo = await client.showsApi.getShow({
        id: formattedId,
        country: country,
      });

      res.json(streamingInfo);
    } catch (error) {
      console.error("Error fetching streaming availability:", error);
      res.status(500).json({
        error: "Failed to fetch streaming availability",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Set up MCP routes for LLM interaction
  // Register MCP routes under /api/mcp
  const mcpRouter = setupMCPRoutes(apiRouter);

  // Also expose MCP routes directly at root level for better LLM access
  app.use("/mcp", mcpRouter);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
