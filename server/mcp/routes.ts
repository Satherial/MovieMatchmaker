import { Router } from "express";
import { MCPController } from "./controller";

/**
 * Set up MCP routes that allow AI models to interact with the application API
 * These routes follow a standardized format for consistency
 */
export function setupMCPRoutes(router: Router) {
  const mcpController = new MCPController();
  const mcpRouter = Router();
  
  // Movie endpoints
  mcpRouter.post("/movies", mcpController.getMovies.bind(mcpController));
  mcpRouter.get("/movies/:id", mcpController.getMovie.bind(mcpController));
  
  // Genre endpoints
  mcpRouter.get("/genres", mcpController.getGenres.bind(mcpController));
  
  // Watch history endpoints
  mcpRouter.get("/watch-history", mcpController.getWatchHistory.bind(mcpController));
  mcpRouter.post("/watch-history", mcpController.addToWatchHistory.bind(mcpController));
  mcpRouter.delete("/watch-history", mcpController.clearWatchHistory.bind(mcpController));
  
  // Playlist endpoints
  mcpRouter.get("/playlists", mcpController.getUserPlaylists.bind(mcpController));
  mcpRouter.get("/playlists/:id", mcpController.getPlaylist.bind(mcpController));
  mcpRouter.post("/playlists", mcpController.createPlaylist.bind(mcpController));
  mcpRouter.put("/playlists/:id", mcpController.updatePlaylist.bind(mcpController));
  mcpRouter.delete("/playlists/:id", mcpController.deletePlaylist.bind(mcpController));
  mcpRouter.post("/playlists/add-movie", mcpController.addMovieToPlaylist.bind(mcpController));
  mcpRouter.delete("/playlists/:playlistId/movies/:movieId", mcpController.removeMovieFromPlaylist.bind(mcpController));
  mcpRouter.post("/playlists/:id/reorder", mcpController.reorderPlaylistItems.bind(mcpController));
  
  // Friend endpoints
  mcpRouter.get("/friends", mcpController.getFriends.bind(mcpController));
  mcpRouter.get("/friends/requests", mcpController.getFriendRequests.bind(mcpController));
  mcpRouter.get("/friends/sent-requests", mcpController.getSentFriendRequests.bind(mcpController));
  mcpRouter.get("/friends/search", mcpController.searchUsers.bind(mcpController));
  mcpRouter.post("/friends/request", mcpController.sendFriendRequest.bind(mcpController));
  mcpRouter.post("/friends/accept/:id", mcpController.acceptFriendRequest.bind(mcpController));
  mcpRouter.post("/friends/reject/:id", mcpController.rejectFriendRequest.bind(mcpController));
  mcpRouter.delete("/friends/:friendId", mcpController.deleteFriendship.bind(mcpController));
  
  // Playlist sharing endpoints
  mcpRouter.get("/playlist-shares/:playlistId", mcpController.getPlaylistShares.bind(mcpController));
  mcpRouter.get("/shared-playlists", mcpController.getSharedPlaylists.bind(mcpController));
  mcpRouter.get("/public-playlists", mcpController.getPublicPlaylists.bind(mcpController));
  mcpRouter.post("/playlist-shares", mcpController.sharePlaylist.bind(mcpController));
  mcpRouter.delete("/playlist-shares/:playlistId/:userId", mcpController.removePlaylistShare.bind(mcpController));
  
  // Shared watches endpoints
  mcpRouter.get("/shared-watches", mcpController.getSharedWatches.bind(mcpController));
  mcpRouter.post("/shared-watches", mcpController.addSharedWatch.bind(mcpController));
  mcpRouter.delete("/shared-watches/:id", mcpController.removeSharedWatch.bind(mcpController));
  
  // User preferences endpoints
  mcpRouter.get("/preferences", mcpController.getUserPreferences.bind(mcpController));
  mcpRouter.put("/preferences", mcpController.updateUserPreferences.bind(mcpController));
  
  // Auth endpoints
  mcpRouter.post("/auth/login", mcpController.login.bind(mcpController));
  mcpRouter.post("/auth/register", mcpController.register.bind(mcpController));
  mcpRouter.post("/auth/logout", mcpController.logout.bind(mcpController));
  mcpRouter.get("/auth/user", mcpController.getCurrentUser.bind(mcpController));
  
  // Recommendation endpoints
  mcpRouter.get("/recommendations", mcpController.getRecommendedMovies.bind(mcpController));
  
  // Mount the MCP router
  router.use("/mcp", mcpRouter);
}