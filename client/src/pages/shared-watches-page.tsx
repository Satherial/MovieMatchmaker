import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  FilmIcon, 
  CalendarIcon, 
  UsersIcon, 
  TrashIcon, 
  MessageSquareTextIcon, 
  ExternalLinkIcon,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

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

interface SharedWatch {
  id: number;
  userId: number;
  movieId: number;
  watchedWithUserId: number;
  watchedAt: string;
  notes: string | null;
  movie: Movie;
  watchedWith: User;
}

function SharedWatchCard({ sharedWatch, onDelete }: { 
  sharedWatch: SharedWatch; 
  onDelete: () => void;
}) {
  const { movie, watchedWith, watchedAt, notes } = sharedWatch;
  const watchDate = new Date(watchedAt);
  const formattedDate = format(watchDate, "MMMM d, yyyy");
  
  const userInitials = watchedWith.username.substring(0, 2).toUpperCase();
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-14 rounded-md overflow-hidden">
              <img 
                src={movie.imageUrl} 
                alt={movie.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <CardTitle>{movie.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formattedDate}
              </CardDescription>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-sm">{movie.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground ml-2">{movie.categories.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-muted/50 rounded-md p-3 flex items-center gap-3">
          <Avatar>
            <AvatarImage src={watchedWith.avatarUrl || ""} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{watchedWith.fullName || watchedWith.username}</p>
            <p className="text-sm text-muted-foreground">@{watchedWith.username}</p>
          </div>
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {notes && (
          <div className="mt-3">
            <div className="flex items-center gap-1 mb-1">
              <MessageSquareTextIcon className="h-3 w-3" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-sm bg-muted/30 p-2 rounded-md">{notes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/movies/${movie.id}`}>
            <ExternalLinkIcon className="h-4 w-4 mr-1" /> Movie Details
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <TrashIcon className="h-4 w-4 mr-1" /> Remove
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SharedWatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWatchId, setSelectedWatchId] = useState<number | null>(null);
  
  // Get shared watches
  const { data: sharedWatches = [], isLoading } = useQuery({
    queryKey: ["/api/shared-watches"],
    queryFn: async () => {
      const res = await fetch("/api/shared-watches");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Delete shared watch mutation
  const deleteSharedWatchMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/shared-watches/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Record deleted",
        description: "The shared watch record has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-watches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record.",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (id: number) => {
    setSelectedWatchId(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedWatchId !== null) {
      deleteSharedWatchMutation.mutate(selectedWatchId);
      setDeleteDialogOpen(false);
      setSelectedWatchId(null);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Shared Watches</h1>
        <div className="mt-4 md:mt-0">
          <Link to="/friends">
            <Button variant="outline">
              <UsersIcon className="h-4 w-4 mr-2" /> Manage Friends
            </Button>
          </Link>
        </div>
      </div>
      
      <Separator className="mb-6" />
      
      {!user ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You need to be logged in to see your shared watch activity.</p>
          <Button asChild>
            <Link to="/auth">Login / Register</Link>
          </Button>
        </div>
      ) : isLoading ? (
        <div className="text-center py-10">Loading shared watch history...</div>
      ) : sharedWatches.length === 0 ? (
        <div className="text-center py-10">
          <FilmIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">You haven't recorded any shared watch activity yet.</p>
          <p className="text-muted-foreground mb-6">
            When you watch movies with friends, record it here to keep track of your shared experiences.
          </p>
          <Button asChild>
            <Link to="/">Browse Movies</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sharedWatches.map((sharedWatch) => (
            <SharedWatchCard
              key={sharedWatch.id}
              sharedWatch={sharedWatch}
              onDelete={() => handleDeleteClick(sharedWatch.id)}
            />
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the shared watch record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}