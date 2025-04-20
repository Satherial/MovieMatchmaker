export interface Movie {
  id: number;
  title: string;
  description: string;
  year: number;
  rating: number;
  imageUrl: string;
  categories: string[];
}

export interface WatchedMovie {
  id: number;
  movieId: number;
  watchedAt: string;
  movie?: Movie;
}

export interface Category {
  id: string;
  name: string;
}

export interface FilterState {
  categories: string[];
  minRating: number;
  yearFrom: string;
  yearTo: string;
}
