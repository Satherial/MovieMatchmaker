import express, { Request, Response } from 'express';
import axios from 'axios';

export const movieTrailerRouter = express.Router();

// YouTube Data API key will come from environment variables
// Define interface for the YouTube search response
interface YouTubeSearchResponse {
  items: {
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
    };
  }[];
}

// Get movie trailer endpoint
movieTrailerRouter.get('/trailer', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // TMDB API for searching movies
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const searchQuery = encodeURIComponent(query);
    
    // First try to use TMDB to get official trailers
    const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${searchQuery}`;
    
    const searchResponse = await axios.get(tmdbSearchUrl);
    
    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      // Get the first movie result
      const movieId = searchResponse.data.results[0].id;
      
      // Get the videos for that movie
      const videosUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${tmdbApiKey}`;
      const videosResponse = await axios.get(videosUrl);
      
      if (videosResponse.data.results && videosResponse.data.results.length > 0) {
        // Filter for YouTube trailers
        const trailers = videosResponse.data.results.filter(
          (video: any) => 
            video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
        );
        
        if (trailers.length > 0) {
          // Return the first trailer's YouTube ID
          return res.json({ videoId: trailers[0].key });
        }
      }
    }
    
    // Fallback: if we can't find a trailer through TMDB, return not found
    return res.status(404).json({ error: 'No trailer found' });
    
  } catch (error) {
    console.error('Error fetching movie trailer:', error);
    res.status(500).json({ error: 'Failed to fetch movie trailer' });
  }
});