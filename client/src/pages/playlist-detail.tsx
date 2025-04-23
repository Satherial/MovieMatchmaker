import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link, useRoute } from "wouter";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Globe,
  Lock,
  Trash,
  Share,
  CalendarIcon,
  UsersIcon,
  GripVertical,
  ExternalLink,
  Copy,
  Pencil,
  Clock,
  Star,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Movie = {
  id: number;
  title: string;
  description: string;
  year: number;
  rating: number;
  imageUrl: string;
  categories: string[];
  director?: string;
  actors?: string;
  duration?: number;
  country?: string;
  language?: string;
  releaseDate?: string;
};

type PlaylistItem = {
  id: number;
  playlistId: number;
  movieId: number;
  notes: string | null;
  sortOrder: number;
  addedAt: string;
};

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  movies: (Movie & { playlistItem: PlaylistItem | null })[];
  creator: {
    id: number;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
};

export default function PlaylistDetailPage() {
  const [match, params] = useRoute("/playlists/:id");
  const playlistId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // State for movie notes dialog
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<
    (Movie & { playlistItem: PlaylistItem | null }) | null
  >(null);
  const [movieNotes, setMovieNotes] = useState("");

  // State for share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // State to track if list is being reordered
  const [isReordering, setIsReordering] = useState(false);

  // Fetch playlist details
  const {
    data: playlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/playlists/${playlistId}`],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch playlist");
      }
      return res.json();
    },
  });

  // Remove movie from playlist mutation
  const removeMovieMutation = useMutation({
    mutationFn: async (movieId: number) => {
      await apiRequest(
        "DELETE",
        `/api/playlists/${playlistId}/movies/${movieId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/playlists/${playlistId}`],
      });
      toast({
        title: "Movie removed",
        description: "Movie was removed from the playlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update movie notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({
      itemId,
      notes,
    }: {
      itemId: number;
      notes: string;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/playlists/${playlistId}/movies/${itemId}`,
        { notes }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/playlists/${playlistId}`],
      });
      setNotesDialogOpen(false);
      toast({
        title: "Notes updated",
        description: "Your notes for this movie have been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reorder playlist items mutation
  const reorderPlaylistMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      const res = await apiRequest(
        "PUT",
        `/api/playlists/${playlistId}/reorder`,
        { itemIds }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/playlists/${playlistId}`],
      });
      setIsReordering(false);
      toast({
        title: "Playlist reordered",
        description: "The order of movies has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      navigate("/playlists");
      toast({
        title: "Playlist deleted",
        description: "Your playlist has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination || !playlist) return;

    const items = Array.from(playlist.movies);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Extract playlist item IDs in the new order
    const newOrder = items
      .map((item) => item.playlistItem?.id)
      .filter((id) => id !== undefined) as number[];

    // Send reorder API request
    reorderPlaylistMutation.mutate(newOrder);
  };

  // Open notes dialog for a movie
  const handleEditNotes = (
    movie: Movie & { playlistItem: PlaylistItem | null }
  ) => {
    setSelectedMovie(movie);
    setMovieNotes(movie.playlistItem?.notes || "");
    setNotesDialogOpen(true);
  };

  // Save updated notes
  const handleSaveNotes = () => {
    if (!selectedMovie?.playlistItem?.id) return;

    updateNotesMutation.mutate({
      itemId: selectedMovie.playlistItem.id,
      notes: movieNotes,
    });
  };

  // Handle sharing playlist
  const handleShare = () => {
    const url = `${window.location.origin}/playlists/${playlistId}`;
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  // Copy share URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Playlist link copied to clipboard",
    });
  };

  // Confirm playlist deletion
  const confirmDeletePlaylist = () => {
    deletePlaylistMutation.mutate();
  };

  // Toggle reordering mode
  const toggleReorderMode = () => {
    setIsReordering(!isReordering);
  };

  // Check if user is the owner of the playlist
  const isOwner = user && playlist?.userId === user.id;

  // Set up share URL when playlist loads
  useEffect(() => {
    if (playlist) {
      setShareUrl(`${window.location.origin}/playlists/${playlistId}`);
    }
  }, [playlist, playlistId]);

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Separator className="my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Playlist not found</h2>
          <p className="text-muted-foreground">
            The playlist you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button asChild>
            <Link href="/playlists">Back to My Playlists</Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-center gap-2">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/playlists">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Back to Movies</Link>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {playlist.name}
                {playlist.isPublic ? (
                  <Badge
                    variant="outline"
                    className="ml-2 text-green-600 flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="ml-2 text-amber-600 flex items-center gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            {isOwner && (
              <>
                <Button
                  variant={isReordering ? "default" : "outline"}
                  onClick={toggleReorderMode}
                  disabled={!playlist.movies.length}
                >
                  {isReordering ? "Save Order" : "Reorder"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row text-sm text-muted-foreground gap-4">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Created on {new Date(playlist.createdAt).toLocaleDateString()}
          </div>
          {playlist.creator && (
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-1" />
              Created by{" "}
              {playlist.creator.fullName || playlist.creator.username}
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Updated {new Date(playlist.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {playlist.description && (
          <p className="text-muted-foreground">{playlist.description}</p>
        )}
      </div>

      <Separator className="my-6" />

      {/* Movie List */}
      {playlist.movies.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">
            No movies in this playlist
          </h3>
          <p className="text-muted-foreground mb-6">
            {isOwner
              ? "Start adding movies to your playlist from the movie details page"
              : "This playlist is empty"}
          </p>
          {isOwner && (
            <Button asChild>
              <Link href="/movies">Browse Movies</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {playlist.movies.length}{" "}
              {playlist.movies.length === 1 ? "Movie" : "Movies"}
            </h2>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="movies" isDropDisabled={!isReordering}>
              {(provided) => (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {playlist.movies.map((movie, index) => (
                    <Draggable
                      key={movie.id.toString()}
                      draggableId={movie.id.toString()}
                      index={index}
                      isDragDisabled={!isReordering}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`overflow-hidden transition-all ${
                            isReordering
                              ? "border-dashed border-2 cursor-grab"
                              : ""
                          }`}
                        >
                          <div className="relative">
                            <AspectRatio ratio={2 / 3}>
                              <img
                                src={movie.imageUrl}
                                alt={movie.title}
                                className="object-cover w-full h-full rounded-t-md"
                              />
                            </AspectRatio>
                            {isReordering && (
                              <div
                                className="absolute top-2 right-2 p-1 bg-background/80 rounded-md cursor-grab"
                                {...provided.dragHandleProps}
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg leading-tight">
                                {movie.title}
                              </h3>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>{movie.rating.toFixed(1)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {movie.categories?.slice(0, 3).map((category) => (
                                <Badge
                                  key={category}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {category}
                                </Badge>
                              ))}
                              {movie.categories &&
                                movie.categories.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{movie.categories.length - 3} more
                                  </Badge>
                                )}
                            </div>

                            {movie.playlistItem?.notes && (
                              <div className="mt-3 p-2 bg-muted rounded-md text-sm">
                                <p className="line-clamp-3">
                                  {movie.playlistItem.notes}
                                </p>
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="p-4 pt-0 flex justify-between">
                            <Button variant="secondary" size="sm" asChild>
                              <Link href={`/movies/${movie.id}`}>
                                View Details
                              </Link>
                            </Button>

                            {isOwner && !isReordering && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                    >
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="19" cy="12" r="1" />
                                      <circle cx="5" cy="12" r="1" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditNotes(movie)}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Notes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      removeMovieMutation.mutate(movie.id)
                                    }
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Remove from Playlist
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </CardFooter>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      {/* Movie Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Movie Notes</DialogTitle>
            <DialogDescription>
              Add your personal notes about "{selectedMovie?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={movieNotes}
                onChange={(e) => setMovieNotes(e.target.value)}
                placeholder="Write your thoughts about this movie..."
                className="resize-none"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Playlist</DialogTitle>
            <DialogDescription>
              {playlist?.isPublic
                ? "Share this playlist with others"
                : "Only you can see this private playlist"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!playlist?.isPublic ? (
              <div className="text-center p-4 bg-muted rounded-md">
                <Lock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">
                  This playlist is private. Make it public to share it with
                  others.
                </p>
                {isOwner && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      <Switch id="public-share" />
                      <Label htmlFor="public-share">Make playlist public</Label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={shareUrl}
                  readOnly
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {playlist?.isPublic && (
              <div className="flex flex-col space-y-2 mt-4">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      shareUrl
                    )}&text=Check out this movie playlist: ${encodeURIComponent(
                      playlist?.name
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                    </svg>
                    Share on Twitter
                  </a>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      shareUrl
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 16 16"
                    >
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                    </svg>
                    Share on Facebook
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{playlist?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePlaylist}
              disabled={deletePlaylistMutation.isPending}
            >
              {deletePlaylistMutation.isPending
                ? "Deleting..."
                : "Delete Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
