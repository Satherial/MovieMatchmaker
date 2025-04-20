import { Movie, Genre, WatchHistory, Playlist, PlaylistItem, Friendship, PlaylistShare, SharedWatch } from "@shared/schema";

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

export interface MCPPlaylistListResponse {
  playlists: Playlist[];
}

export interface MCPPlaylistResponse {
  playlist: Playlist;
  movies: (Movie & { playlistItem: PlaylistItem | undefined })[];
  creator?: {
    id: number;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface MCPFriendListResponse {
  friends: (Friendship & { user: { id: number, username: string, fullName: string | null } })[];
}

export interface MCPFriendRequestsResponse {
  requests: (Friendship & { user: { id: number, username: string, fullName: string | null } })[];
}

export interface MCPUserSearchResponse {
  users: { id: number, username: string, fullName: string | null, avatarUrl: string | null }[];
}

export interface MCPPlaylistSharesResponse {
  shares: (PlaylistShare & { 
    user: { id: number, username: string, fullName: string | null },
    playlist: Playlist 
  })[];
}

export interface MCPSharedWatchesResponse {
  sharedWatches: (SharedWatch & {
    movie: Movie,
    initiatedByUser: { id: number, username: string },
    watchedWithUser: { id: number, username: string }
  })[];
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

export interface MCPCreatePlaylistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface MCPUpdatePlaylistRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface MCPAddToPlaylistRequest {
  playlistId: number;
  movieId: number;
  notes?: string;
  sortOrder?: number;
}

export interface MCPUpdatePlaylistItemRequest {
  notes?: string;
  sortOrder?: number;
}

export interface MCPReorderPlaylistItemsRequest {
  itemIds: number[];
}

export interface MCPFriendRequestRequest {
  friendId: number;
}

export interface MCPSharePlaylistRequest {
  playlistId: number;
  sharedWithUserId: number;
  canEdit?: boolean;
}

export interface MCPSharedWatchRequest {
  movieId: number;
  watchedWithUserId: number;
  rating?: number;
  notes?: string;
}

export interface MCPUserPreferencesRequest {
  preferences: string | object;
}

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