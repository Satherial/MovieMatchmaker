import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PublicHome from "@/pages/public-home";
import MovieDetail from "@/pages/movie-detail";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import PlaylistsPage from "@/pages/playlists-page";
import PlaylistDetailPage from "@/pages/playlist-detail";
import FriendsPage from "@/pages/friends-page";
import SharedPlaylistsPage from "@/pages/shared-playlists-page";
import SharedWatchesPage from "@/pages/shared-watches-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/home" component={PublicHome} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/movies/:id" component={MovieDetail} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/playlists" component={PlaylistsPage} />
      <ProtectedRoute path="/playlists/:id" component={PlaylistDetailPage} />
      <ProtectedRoute path="/friends" component={FriendsPage} />
      <ProtectedRoute path="/shared-playlists" component={SharedPlaylistsPage} />
      <ProtectedRoute path="/shared-watches" component={SharedWatchesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
