import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, UserPlusIcon, XIcon, UserX2Icon, Users2Icon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Friend {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  createdAt: string;
  friend?: User;
}

interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

function FriendCard({ friend, onAccept, onReject, onRemove }: { 
  friend: Friend;
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
}) {
  const user = friend.friend || { 
    id: friend.friendId, 
    username: "Unknown User", 
    fullName: null, 
    email: null, 
    avatarUrl: null 
  };
  
  const initials = user.username.substring(0, 2).toUpperCase();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.fullName || user.username}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </div>
          </div>
          {friend.status === "pending" && (
            <Badge variant="outline">{friend.status}</Badge>
          )}
        </div>
      </CardHeader>
      <CardFooter className="pt-1 flex justify-end gap-2">
        {onAccept && onReject && (
          <>
            <Button variant="outline" size="sm" onClick={onReject}>
              <XIcon className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button size="sm" onClick={onAccept}>
              <CheckIcon className="h-4 w-4 mr-1" /> Accept
            </Button>
          </>
        )}
        {onRemove && (
          <Button variant="outline" size="sm" onClick={onRemove}>
            <UserX2Icon className="h-4 w-4 mr-1" /> Remove
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function SearchUserCard({ user, onAddFriend }: { 
  user: User;
  onAddFriend: () => void;
}) {
  const initials = user.username.substring(0, 2).toUpperCase();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.fullName || user.username}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="pt-1 flex justify-end">
        <Button size="sm" onClick={onAddFriend}>
          <UserPlusIcon className="h-4 w-4 mr-1" /> Add Friend
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");

  // Get friends
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const res = await fetch("/api/friends");
      return res.json();
    },
    enabled: !!user,
  });

  // Get friend requests
  const { data: friendRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/friends/requests"],
    queryFn: async () => {
      const res = await fetch("/api/friends/requests");
      return res.json();
    },
    enabled: !!user,
  });

  // Search for users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/friends/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.length >= 3,
  });

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("POST", "/api/friends/request", { friendId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request.",
        variant: "destructive",
      });
    },
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/friends/accept/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "The friend request has been accepted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept friend request.",
        variant: "destructive",
      });
    },
  });

  // Reject friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/friends/reject/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject friend request.",
        variant: "destructive",
      });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your friends list.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="friends" className="flex items-center">
            <Users2Icon className="h-4 w-4 mr-2" /> Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" /> Requests ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="find" className="flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" /> Find Friends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          {isLoadingFriends ? (
            <div className="text-center py-10">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">You don't have any friends yet.</p>
              <Button onClick={() => setActiveTab("find")}>Find Friends</Button>
            </div>
          ) : (
            friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onRemove={() => removeFriendMutation.mutate(friend.friendId)}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="requests">
          {isLoadingRequests ? (
            <div className="text-center py-10">Loading requests...</div>
          ) : friendRequests.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You don't have any pending friend requests.</p>
            </div>
          ) : (
            friendRequests.map((request) => (
              <FriendCard
                key={request.id}
                friend={request}
                onAccept={() => acceptRequestMutation.mutate(request.id)}
                onReject={() => rejectRequestMutation.mutate(request.id)}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="find">
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Enter at least 3 characters to search
            </p>
          </div>
          
          <Separator className="my-4" />
          
          {searchQuery.length < 3 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Enter at least 3 characters to search for users</p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-10">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
            </div>
          ) : (
            searchResults.map((user) => (
              <SearchUserCard
                key={user.id}
                user={user}
                onAddFriend={() => sendRequestMutation.mutate(user.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}