import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, UserPlusIcon, XIcon, UserX2Icon, Users2Icon, ChevronLeftIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { extractErrorMessage } from "@/lib/error-handler";

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

  // Determine badge color based on status
  let badgeVariant: "outline" | "default" | "secondary" | "destructive" = "outline";
  let badgeText = friend.status;
  
  if (friend.status === "pending") {
    badgeVariant = "secondary";
    badgeText = "Pending";
  } else if (friend.status === "accepted") {
    badgeVariant = "default";
    badgeText = "Friend";
  } else if (friend.status === "rejected") {
    badgeVariant = "destructive";
    badgeText = "Rejected";
  }

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
          <Badge variant={badgeVariant}>{badgeText}</Badge>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRemove} 
            title={friend.status === "pending" ? "Cancel Request" : "Remove Friend"}
          >
            <UserX2Icon className="h-4 w-4 mr-1" /> 
            {friend.status === "pending" ? "Cancel" : "Remove"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function SearchUserCard({ user, onAddFriend, isLoading, alreadyInvited }: { 
  user: User;
  onAddFriend: () => void;
  isLoading?: boolean;
  alreadyInvited: boolean;
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
        {alreadyInvited ? (
          <Button 
            size="sm" 
            variant="outline" 
            disabled={true}
          >
            <CheckIcon className="h-4 w-4 mr-1" /> Invitation Sent
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={onAddFriend} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 mr-1 animate-spin">⏳</span> Adding...
              </>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4 mr-1" /> Add Friend
              </>
            )}
          </Button>
        )}
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

  // Get friends (accepted)
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const res = await fetch("/api/friends");
      return res.json();
    },
    enabled: !!user,
  });

  // Get incoming friend requests
  const { data: friendRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/friends/requests"],
    queryFn: async () => {
      const res = await fetch("/api/friends/requests");
      return res.json();
    },
    enabled: !!user,
  });

  // Get outgoing friend requests
  const { data: sentRequests = [], isLoading: isLoadingSentRequests } = useQuery({
    queryKey: ["/api/friends/sent-requests"],
    queryFn: async () => {
      const res = await fetch("/api/friends/sent-requests");
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
      // Refresh all friendship-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent-requests"] });
    },
    onError: (error: any) => {
      toast({
        description: extractErrorMessage(error),
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
      // Refresh all friendship-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent-requests"] });
    },
    onError: (error: any) => {
      toast({
        description: extractErrorMessage(error),
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
      // Refresh all friendship-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent-requests"] });
    },
    onError: (error: any) => {
      toast({
        description: extractErrorMessage(error),
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
      // Refresh all friendship-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent-requests"] });
    },
    onError: (error: any) => {
      toast({
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/">
          <Button variant="outline">
            <ChevronLeftIcon className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Friends</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="friends" className="flex items-center">
            <Users2Icon className="h-4 w-4 mr-2" /> Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" /> Received ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" /> Sent ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="find" className="flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" /> Find
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
        
        <TabsContent value="sent">
          {isLoadingSentRequests ? (
            <div className="text-center py-10">Loading sent requests...</div>
          ) : sentRequests.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You haven't sent any friend requests.</p>
              <Button className="mt-4" onClick={() => setActiveTab("find")}>Find Friends</Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                These are your outgoing friend requests that are waiting for a response.
              </p>
              {sentRequests.map((request) => (
                <FriendCard
                  key={request.id}
                  friend={request}
                  onRemove={() => removeFriendMutation.mutate(request.friendId)}
                />
              ))}
            </>
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
            searchResults.map((user) => {
              // Check if this user is already in the sent requests
              const alreadyInvited = sentRequests.some(
                request => request.friendId === user.id
              );
              
              return (
                <SearchUserCard
                  key={user.id}
                  user={user}
                  isLoading={sendRequestMutation.isPending && sendRequestMutation.variables === user.id}
                  onAddFriend={() => sendRequestMutation.mutate(user.id)}
                  alreadyInvited={alreadyInvited}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}