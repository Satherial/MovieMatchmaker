import express, { Request, Response } from "express";
import axios from "axios";

export const trailerRouter = express.Router();

// Define interfaces for TMDB API responses
interface TMDBVideo {
  id: string;
  key: string;
  site: string;
  type: string;
  name: string;
}

interface TrailerResponse {
  videoId: string;
  title: string;
  type: string;
  youtubeUrl: string;
  thumbnailUrl: string;
}

/**
 * GET /api/trailer
 * Fetches a movie trailer using TMDB API given a movie ID
 * Query params:
 * - query: string (required) - The TMDB movie ID
 * Returns:
 * - TrailerResponse object containing video details and URLs
 */
trailerRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    console.log("🔍 Movie ID:", query);

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Movie ID is required",
        message: "Please provide a valid TMDB movie ID",
      });
    }

    // Get TMDB API key from environment
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.error("❌ TMDB_API_KEY not found in environment variables");
      return res.status(500).json({
        error: "API configuration issue",
        message: "Server configuration error - TMDB API key not found",
      });
    }

    // Step 1: Directly fetch videos for the provided movie ID
    const movieId = query.trim();
    console.log(`🎬 Fetching videos for movie ID: ${movieId}`);

    const videosUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${tmdbApiKey}`;
    const videosResponse = await axios.get(videosUrl);

    if (!videosResponse.data.results?.length) {
      console.log(`❌ No videos found for movie ID: ${movieId}`);
      return res.status(404).json({
        error: "No videos found",
        message: `No videos available for movie ID: ${movieId}`,
      });
    }

    // Step 2: Filter for YouTube trailers
    const trailers = videosResponse.data.results.filter(
      (video: TMDBVideo) => video.site === "YouTube" && video.type === "Trailer"
    );

    if (!trailers.length) {
      console.log(`❌ No trailers found for movie ID: ${movieId}`);
      return res.status(404).json({
        error: "No trailer found",
        message: `No trailer available for movie ID: ${movieId}`,
      });
    }

    // Select the first available trailer
    const selectedTrailer = trailers[0];
    console.log(`✅ Found trailer: "${selectedTrailer.name}"`);

    // Step 3: Construct response with YouTube URLs
    const response: TrailerResponse = {
      videoId: selectedTrailer.key,
      title: selectedTrailer.name,
      type: selectedTrailer.type,
      youtubeUrl: `https://www.youtube.com/watch?v=${selectedTrailer.key}`,
      thumbnailUrl: `https://img.youtube.com/vi/${selectedTrailer.key}/maxresdefault.jpg`,
    };

    return res.json(response);
  } catch (error) {
    console.error("❌ Error fetching movie trailer:", error);
    return res.status(500).json({
      error: "Server error",
      message: "Failed to fetch movie trailer. Please try again later.",
    });
  }
});
