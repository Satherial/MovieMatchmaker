import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2Icon, UsersIcon, CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface Friend {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  createdAt: string;
  friend?: User;
}

interface Movie {
  id: number;
  title: string;
  imageUrl: string;
  year: number;
  rating: number;
  description: string;
  categories: string[];
}

interface SharedWatchModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

export default function SharedWatchModal({ movie, isOpen, onClose }: SharedWatchModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [watchDate, setWatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Get friends list
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const res = await fetch("/api/friends");
      return res.json();
    },
    enabled: isOpen,
  });
  
  // Add shared watch
  const addSharedWatchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/shared-watches", {
        movieId: movie.id,
        watchedWithUserId: parseInt(selectedFriendId),
        watchedAt: new Date(watchDate).toISOString(),
        notes: notes || null
      });
    },
    onSuccess: () => {
      toast({
        title: "Watch activity shared",
        description: "The movie has been added to both your watch histories.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watch-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-watches"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share watch activity.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setSelectedFriendId("");
    setNotes("");
    setWatchDate(new Date().toISOString().split('T')[0]);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId) {
      toast({
        title: "Error",
        description: "Please select a friend to share with.",
        variant: "destructive",
      });
      return;
    }
    addSharedWatchMutation.mutate();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Watch Activity</DialogTitle>
          <DialogDescription>
            Record that you watched "{movie.title}" together with a friend.
            This will add the movie to both your watch histories.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <img 
                src={movie.imageUrl} 
                alt={movie.title} 
                className="h-20 w-14 object-cover rounded-md"
              />
              <div>
                <h3 className="font-semibold">{movie.title}</h3>
                <p className="text-sm text-muted-foreground">{movie.year} • {movie.categories.join(', ')}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="friend">Who did you watch with?</Label>
              <Select 
                value={selectedFriendId} 
                onValueChange={setSelectedFriendId}
              >
                <SelectTrigger id="friend">
                  <SelectValue placeholder="Select a friend" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFriends ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                      Loading friends...
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      You don't have any friends yet. Add friends to share watch activity.
                    </div>
                  ) : (
                    friends.map((friend) => {
                      const user = friend.friend || { 
                        id: friend.friendId, 
                        username: "Unknown User", 
                        fullName: null,
                        avatarUrl: null
                      };
                      const initials = user.username.substring(0, 2).toUpperCase();
                      
                      return (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatarUrl || ""} />
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <span>{user.fullName || user.username}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="watch-date">When did you watch it?</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <Input
                  id="watch-date"
                  type="date"
                  value={watchDate}
                  onChange={(e) => setWatchDate(e.target.value)}
                  className="rounded-l-none"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about your watch experience..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={addSharedWatchMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!selectedFriendId || addSharedWatchMutation.isPending}
            >
              {addSharedWatchMutation.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Record Shared Watch
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}