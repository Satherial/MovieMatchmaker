import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Globe, Lock, Pencil, Trash, Film } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  movieCount?: number;
};

export default function PlaylistsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  // Form state for creating/editing playlists
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistIsPublic, setPlaylistIsPublic] = useState(false);

  // Fetch user's playlists
  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlist: { name: string; description?: string; isPublic: boolean }) => {
      const res = await apiRequest("POST", "/api/playlists", playlist);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setCreateDialogOpen(false);
      toast({
        title: "Playlist created",
        description: "Your playlist has been created successfully.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating playlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async (playlist: { id: number; name: string; description?: string; isPublic: boolean }) => {
      const res = await apiRequest("PUT", `/api/playlists/${playlist.id}`, {
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setEditDialogOpen(false);
      toast({
        title: "Playlist updated",
        description: "Your playlist has been updated successfully.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating playlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: number) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setConfirmDeleteDialogOpen(false);
      toast({
        title: "Playlist deleted",
        description: "Your playlist has been deleted successfully.",
      });
      setSelectedPlaylist(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting playlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form fields
  const resetForm = () => {
    setPlaylistName("");
    setPlaylistDescription("");
    setPlaylistIsPublic(false);
  };

  // Handle form submission for creating a playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) {
      toast({
        title: "Playlist name required",
        description: "Please enter a name for your playlist.",
        variant: "destructive",
      });
      return;
    }

    createPlaylistMutation.mutate({
      name: playlistName,
      description: playlistDescription || undefined,
      isPublic: playlistIsPublic,
    });
  };

  // Handle form submission for updating a playlist
  const handleUpdatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaylist) return;
    
    if (!playlistName.trim()) {
      toast({
        title: "Playlist name required",
        description: "Please enter a name for your playlist.",
        variant: "destructive",
      });
      return;
    }

    updatePlaylistMutation.mutate({
      id: selectedPlaylist.id,
      name: playlistName,
      description: playlistDescription || undefined,
      isPublic: playlistIsPublic,
    });
  };

  // Open edit dialog with playlist data
  const handleEditPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistName(playlist.name);
    setPlaylistDescription(playlist.description || "");
    setPlaylistIsPublic(playlist.isPublic);
    setEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setConfirmDeleteDialogOpen(true);
  };

  // Confirm playlist deletion
  const confirmDeletePlaylist = () => {
    if (selectedPlaylist) {
      deletePlaylistMutation.mutate(selectedPlaylist.id);
    }
  };

  // If the user is not authenticated, redirect to the auth page
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Playlists</h1>
          <p className="text-muted-foreground mt-1">Create and manage your movie playlists</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Playlist
        </Button>
      </div>

      <Separator className="my-6" />

      {isLoadingPlaylists ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist: Playlist) => (
            <Card key={playlist.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">{playlist.name}</CardTitle>
                  <div className="text-xs font-medium rounded-full px-2 py-1 bg-muted">
                    {playlist.isPublic ? (
                      <div className="flex items-center text-green-600">
                        <Globe className="mr-1 h-3 w-3" /> Public
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <Lock className="mr-1 h-3 w-3" /> Private
                      </div>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {new Date(playlist.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {playlist.description || "No description provided."}
                </p>
                <div className="flex items-center mt-3 text-muted-foreground text-sm">
                  <Film className="h-4 w-4 mr-1" /> 
                  <span>{playlist.movieCount || 0} movies</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-3 border-t">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/playlists/${playlist.id}`}>View Playlist</Link>
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEditPlaylist(playlist)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteClick(playlist)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Film className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No playlists yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first playlist to start organizing your favorite movies
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Playlist
          </Button>
        </div>
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreatePlaylist}>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
              <DialogDescription>
                Create a new playlist to organize your favorite movies
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="My Favorite Movies"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="A collection of my favorite movies"
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={playlistIsPublic}
                  onCheckedChange={setPlaylistIsPublic}
                />
                <Label htmlFor="public">Make playlist public</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPlaylistMutation.isPending}>
                {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Playlist Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdatePlaylist}>
            <DialogHeader>
              <DialogTitle>Edit Playlist</DialogTitle>
              <DialogDescription>
                Make changes to your playlist
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-public"
                  checked={playlistIsPublic}
                  onCheckedChange={setPlaylistIsPublic}
                />
                <Label htmlFor="edit-public">Make playlist public</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlaylistMutation.isPending}>
                {updatePlaylistMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlaylist?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setConfirmDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePlaylist}
              disabled={deletePlaylistMutation.isPending}
            >
              {deletePlaylistMutation.isPending ? "Deleting..." : "Delete Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}