import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FilmIcon, Share2Icon, GlobeIcon, UsersIcon, EyeIcon, Lock } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface Movie {
  id: number;
  title: string;
  imageUrl: string;
  year: number;
  rating: number;
  categories: string[];
}

interface PlaylistItem {
  id: number;
  playlistId: number;
  movieId: number;
  order: number;
  notes: string | null;
  movie: Movie;
}

interface Playlist {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  user?: User;
  items?: PlaylistItem[];
  canEdit?: boolean;
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const thumbnails = playlist.items?.slice(0, 3).map(item => item.movie.imageUrl) || [];
  
  const userInitials = playlist.user?.username.substring(0, 2).toUpperCase() || "NA";
  const movieCount = playlist.items?.length || 0;
  
  const { toast } = useToast();
  
  const copyPlaylistLink = () => {
    const url = `${window.location.origin}/playlists/${playlist.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied",
        description: "Playlist link copied to clipboard",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    });
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="line-clamp-1">{playlist.title}</CardTitle>
          <Badge variant={playlist.isPublic ? "secondary" : "outline"}>
            {playlist.isPublic ? (
              <><GlobeIcon className="h-3 w-3 mr-1" /> Public</>
            ) : (
              <><Lock className="h-3 w-3 mr-1" /> Shared</>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={playlist.user?.avatarUrl || ""} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <span>@{playlist.user?.username || "unknown"}</span>
        </div>
        
        {playlist.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {playlist.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        {thumbnails.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {thumbnails.map((imageUrl, i) => (
              <div 
                key={i} 
                className="aspect-[2/3] rounded-md bg-muted overflow-hidden"
              >
                <img 
                  src={imageUrl} 
                  alt="Movie thumbnail" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-md bg-muted flex items-center justify-center text-muted-foreground">
            <FilmIcon className="h-8 w-8" />
          </div>
        )}
        
        <div className="mt-2 text-sm flex items-center">
          <FilmIcon className="h-4 w-4 mr-1" />
          <span>{movieCount} {movieCount === 1 ? "movie" : "movies"}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex space-x-2">
        <Button asChild className="flex-1">
          <Link to={`/playlists/${playlist.id}`}>
            View
          </Link>
        </Button>
        <Button variant="outline" size="icon" onClick={copyPlaylistLink}>
          <Share2Icon className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SharedPlaylistsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("shared-with-me");
  
  // Get playlists shared with me
  const { data: sharedPlaylists = [], isLoading: isLoadingShared } = useQuery({
    queryKey: ["/api/playlist-shares"],
    queryFn: async () => {
      const res = await fetch("/api/playlist-shares");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Get public playlists
  const { data: publicPlaylists = [], isLoading: isLoadingPublic } = useQuery({
    queryKey: ["/api/playlist-shares/public"],
    queryFn: async () => {
      const res = await fetch("/api/playlist-shares/public");
      return res.json();
    },
  });
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Discover Playlists</h1>
        <div className="mt-4 md:mt-0">
          <Link to="/playlists">
            <Button variant="outline">
              My Playlists
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="shared-with-me" className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-2" /> Shared With Me ({sharedPlaylists.length})
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center">
            <GlobeIcon className="h-4 w-4 mr-2" /> Public Playlists ({publicPlaylists.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared-with-me">
          {!user ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">You need to be logged in to see playlists shared with you.</p>
              <Button asChild>
                <Link to="/auth">Login / Register</Link>
              </Button>
            </div>
          ) : isLoadingShared ? (
            <div className="text-center py-10">Loading shared playlists...</div>
          ) : sharedPlaylists.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No playlists have been shared with you yet.</p>
              <p className="text-muted-foreground">Ask your friends to share their playlists with you!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public">
          {isLoadingPublic ? (
            <div className="text-center py-10">Loading public playlists...</div>
          ) : publicPlaylists.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No public playlists available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}