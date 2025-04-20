import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  PlusCircle, 
  Check, 
  ChevronDown, 
  Globe, 
  Lock 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
};

type Movie = {
  id: number;
  title: string;
  description: string;
  year: number;
  rating: number;
  imageUrl: string;
};

interface AddToPlaylistProps {
  movie: Movie;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function AddToPlaylist({ movie, variant = "default", className = "" }: AddToPlaylistProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [notes, setNotes] = useState("");
  const [showAddNotes, setShowAddNotes] = useState(false);

  // Fetch user playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ["/api/playlists"],
    enabled: !!user && isDialogOpen,
  });

  // Add to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, movieId, notes }: { playlistId: number; movieId: number; notes?: string }) => {
      const res = await apiRequest("POST", `/api/playlists/${playlistId}/movies`, {
        movieId,
        notes: notes || undefined
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Added to playlist",
        description: `"${movie.title}" has been added to your playlist.`,
      });
      
      // Invalidate the playlist cache to update UI
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${variables.playlistId}`] });
      
      // Reset state and close dialog
      setSelectedPlaylist(null);
      setNotes("");
      setShowAddNotes(false);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      // Check if it's an existing movie error
      if (error.message.includes("already exists")) {
        toast({
          title: "Already in playlist",
          description: `"${movie.title}" is already in this playlist.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add movie to playlist. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Handle adding movie to a playlist
  const handleAddToPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowAddNotes(true);
  };

  // Submit the add to playlist request
  const handleSubmit = () => {
    if (!selectedPlaylist) return;
    
    addToPlaylistMutation.mutate({
      playlistId: selectedPlaylist.id,
      movieId: movie.id,
      notes: notes.trim() || undefined
    });
  };

  // Skip notes and add directly
  const skipAndAdd = () => {
    if (!selectedPlaylist) return;
    
    addToPlaylistMutation.mutate({
      playlistId: selectedPlaylist.id,
      movieId: movie.id
    });
  };

  if (!user) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link href="/auth">
          <PlusCircle className="h-4 w-4 mr-2" />
          Sign in to save
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add to Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Add "{movie.title}" to one of your playlists or create a new one.
          </DialogDescription>
        </DialogHeader>

        {showAddNotes && selectedPlaylist ? (
          <div className="py-4">
            <div className="mb-4">
              <h4 className="font-medium mb-1">Adding to: {selectedPlaylist.name}</h4>
              <p className="text-sm text-muted-foreground">Add optional notes about this movie in your playlist.</p>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What do you think about this movie? (optional)"
              className="resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddNotes(false)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={addToPlaylistMutation.isPending}>
                {addToPlaylistMutation.isPending ? "Adding..." : "Add Movie"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : playlists && playlists.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {playlists.map((playlist: Playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => handleAddToPlaylist(playlist)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{playlist.name}</div>
                        {playlist.isPublic ? (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">You don't have any playlists yet.</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center py-4">
              <Button asChild variant="outline">
                <Link href="/playlists" onClick={() => setIsDialogOpen(false)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Playlist
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!playlists || playlists.length === 0}>
                    Quick Add <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {playlists && playlists.slice(0, 5).map((playlist: Playlist) => (
                    <DropdownMenuItem 
                      key={playlist.id}
                      onClick={() => {
                        setSelectedPlaylist(playlist);
                        skipAndAdd();
                      }}
                    >
                      <div className="flex items-center">
                        {playlist.name}
                        <Check className="ml-2 h-4 w-4 opacity-0 group-data-[highlighted]:opacity-100" />
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}