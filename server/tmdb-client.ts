import axios from 'axios';
import { Movie as AppMovie, Genre as DbGenre, InsertMovie } from '@shared/schema';

// Define our own custom Genre type for TMDB responses
export interface Genre {
  id: string;
  name: string;
}

// Define a modified movie type that includes categories array for TMDb integration
interface MovieWithCategories extends Omit<InsertMovie, 'id'> {
  id: number;
  categories: string[];
}

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  spoken_languages?: { english_name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
}

interface TMDbSearchResponse {
  results: TMDbMovie[];
  total_results: number;
  total_pages: number;
  page: number;
}

interface TMDbGenresResponse {
  genres: { id: number; name: string }[];
}

/**
 * Converts a TMDb movie object to our application's movie format with categories
 */
function mapTMDbMovieToAppMovie(tmdbMovie: TMDbMovie, genresList: { id: number; name: string }[] = []): MovieWithCategories {
  // Extract director from crew
  const director = tmdbMovie.credits?.crew?.find(person => person.job === 'Director')?.name || null;
  
  // Extract top cast members (up to 5)
  const actors = tmdbMovie.credits?.cast
    ?.sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map(actor => actor.name)
    .join(', ') || null;
    
  // Extract detailed cast information (up to 10 members)
  const cast = tmdbMovie.credits?.cast
    ?.sort((a, b) => a.order - b.order)
    .slice(0, 10)
    .map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      profilePath: actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : null
    })) || [];
  
  // Get genre names either from the movie object or by mapping ids to the genres list
  let genreNames: string[] = [];
  if (tmdbMovie.genres) {
    genreNames = tmdbMovie.genres.map(g => g.name);
  } else if (tmdbMovie.genre_ids && genresList.length > 0) {
    genreNames = tmdbMovie.genre_ids
      .map(id => genresList.find(g => g.id === id)?.name)
      .filter(name => !!name) as string[];
  }
  
  // Get release year
  const releaseYear = tmdbMovie.release_date 
    ? new Date(tmdbMovie.release_date).getFullYear() 
    : new Date().getFullYear();
  
  // Get primary spoken language
  const language = tmdbMovie.spoken_languages && tmdbMovie.spoken_languages.length > 0
    ? tmdbMovie.spoken_languages[0].english_name
    : null;
  
  // Get primary production country
  const country = tmdbMovie.production_countries && tmdbMovie.production_countries.length > 0
    ? tmdbMovie.production_countries[0].name
    : null;
  
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title,
    description: tmdbMovie.overview,
    year: releaseYear,
    imageUrl: tmdbMovie.poster_path 
      ? `${IMAGE_BASE_URL}${tmdbMovie.poster_path}`
      : 'https://via.placeholder.com/500x750?text=No+Image+Available',
    backdropUrl: tmdbMovie.backdrop_path
      ? `${IMAGE_BASE_URL}${tmdbMovie.backdrop_path}`
      : null,
    rating: Math.round(tmdbMovie.vote_average * 10) / 10, // Convert to 1 decimal place
    director: director,
    actors: actors,
    cast: cast,
    duration: tmdbMovie.runtime || null,
    language: language,
    country: country,
    releaseDate: tmdbMovie.release_date || null,
    categories: genreNames
  };
}

export async function searchMovies(query: string, page: number = 1): Promise<{
  movies: MovieWithCategories[];
  totalPages: number;
  totalResults: number;
  page: number;
}> {
  try {
    // First get genres to use for mapping
    const genresResponse = await axios.get<TMDbGenresResponse>(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
    );
    const genres = genresResponse.data.genres;
    
    // Then search for movies
    const response = await axios.get<TMDbSearchResponse>(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`
    );
    
    const movies = response.data.results.map(movie => mapTMDbMovieToAppMovie(movie, genres));
    
    return {
      movies,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results,
      page: response.data.page
    };
  } catch (error) {
    console.error('Error searching TMDb:', error);
    throw new Error('Failed to search movies');
  }
}

export async function getMovieDetails(movieId: number): Promise<MovieWithCategories> {
  try {
    const response = await axios.get<TMDbMovie>(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits&language=en-US`
    );
    
    return mapTMDbMovieToAppMovie(response.data);
  } catch (error) {
    console.error(`Error fetching movie details for ${movieId}:`, error);
    throw new Error('Failed to fetch movie details');
  }
}

export async function getPopularMovies(page: number = 1): Promise<{
  movies: MovieWithCategories[];
  totalPages: number;
  page: number;
}> {
  try {
    // First get genres to use for mapping
    const genresResponse = await axios.get<TMDbGenresResponse>(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
    );
    const genres = genresResponse.data.genres;
    
    // Then get popular movies
    const response = await axios.get<TMDbSearchResponse>(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}&language=en-US`
    );
    
    const movies = response.data.results.map(movie => mapTMDbMovieToAppMovie(movie, genres));
    
    return {
      movies,
      totalPages: response.data.total_pages,
      page: response.data.page
    };
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw new Error('Failed to fetch popular movies');
  }
}

export async function getMoviesByGenre(genreId: number, page: number = 1): Promise<{
  movies: MovieWithCategories[];
  totalPages: number;
  page: number;
}> {
  try {
    // First get all genres to use for mapping
    const genresResponse = await axios.get<TMDbGenresResponse>(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
    );
    const genres = genresResponse.data.genres;
    
    // Then get movies by genre
    const response = await axios.get<TMDbSearchResponse>(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&language=en-US&sort_by=popularity.desc`
    );
    
    const movies = response.data.results.map(movie => mapTMDbMovieToAppMovie(movie, genres));
    
    return {
      movies,
      totalPages: response.data.total_pages,
      page: response.data.page
    };
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    throw new Error('Failed to fetch movies by genre');
  }
}

export async function getGenres(): Promise<Genre[]> {
  try {
    const response = await axios.get<TMDbGenresResponse>(
      `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
    );
    
    return response.data.genres.map(genre => ({
      id: genre.id.toString(),
      name: genre.name
    }));
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw new Error('Failed to fetch genres');
  }
}