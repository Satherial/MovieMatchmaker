import { Movie, Genre, WatchHistory } from "@shared/schema";

// MCP API Response Types
export interface MCPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MCPMovieListResponse {
  movies: Movie[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
}

export interface MCPGenreListResponse {
  genres: Genre[];
}

export interface MCPWatchHistoryResponse {
  watchHistory: WatchHistory[];
}

// MCP API Request Types
export interface MCPMovieFilterRequest {
  categories?: string[];
  minRating?: number;
  yearFrom?: string;
  yearTo?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface MCPAddToWatchHistoryRequest {
  movieId: number;
  rating?: number;
  notes?: string;
}

// TMDb-related types have been removed

// MCP API Authentication Types
export interface MCPLoginRequest {
  username: string;
  password: string;
}

export interface MCPRegisterRequest {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
}