export interface Movie {
  id: number;
  title: string;
  description: string;
  year: number;
  rating: number;
  imageUrl: string;
  categories: string[]; // Keep this as 'categories' for now for backend compatibility
}

export interface WatchedMovie {
  id: number;
  movieId: number;
  watchedAt: string;
  movie?: Movie;
}

// Rename from Category to Genre
export interface Genre {
  id: string;
  name: string;
}

// For backwards compatibility
export type Category = Genre;

export interface FilterState {
  categories: string[]; // Keep this as 'categories' for now for backend compatibility
  minRating: number;
  yearFrom: string;
  yearTo: string;
}
