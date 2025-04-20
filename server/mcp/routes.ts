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
  
  // TMDb endpoints
  mcpRouter.post("/tmdb/search", mcpController.searchTMDb.bind(mcpController));
  mcpRouter.post("/tmdb/import", mcpController.importFromTMDb.bind(mcpController));
  
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