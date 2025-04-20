import express, { Request, Response } from 'express';
import axios from 'axios';

export const trailerRouter = express.Router();

// Define interface for the TMDB response
interface TMDBVideo {
  id: string;
  key: string;
  site: string;
  type: string;
  name: string;
}

// Get movie trailer endpoint
trailerRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // TMDB API for searching movies
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.error('TMDB_API_KEY not found in environment');
      return res.status(500).json({ error: 'API configuration issue' });
    }
    
    const searchQuery = encodeURIComponent(query);
    
    // First try to use TMDB to get official trailers
    const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${searchQuery}`;
    
    console.log(`Searching for movie: ${searchQuery}`);
    const searchResponse = await axios.get(tmdbSearchUrl);
    
    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      // Get the first movie result
      const movieId = searchResponse.data.results[0].id;
      
      if (!movieId) {
        console.error('No movie ID found in search results');
        return res.status(404).json({ error: 'No trailer found' });
      }
      
      console.log(`Found movie ID: ${movieId}, fetching videos`);
      
      // Get the videos for that movie
      const videosUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${tmdbApiKey}`;
      const videosResponse = await axios.get(videosUrl);
      
      if (videosResponse.data.results && videosResponse.data.results.length > 0) {
        // Filter for YouTube trailers
        const trailers = videosResponse.data.results.filter(
          (video: TMDBVideo) => 
            video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
        );
        
        if (trailers.length > 0) {
          console.log(`Found trailer: ${trailers[0].key}`);
          // Return the first trailer's YouTube ID
          return res.json({ videoId: trailers[0].key });
        } else {
          console.log('No trailers found among videos');
        }
      } else {
        console.log('No videos found for movie ID');
      }
    } else {
      console.log('No search results found for query');
    }
    
    // Fallback: if we can't find a trailer through TMDB, return not found
    return res.status(404).json({ error: 'No trailer found' });
    
  } catch (error) {
    console.error('Error fetching movie trailer:', error);
    res.status(500).json({ error: 'Failed to fetch movie trailer' });
  }
});