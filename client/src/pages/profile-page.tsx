import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, History, Film } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WatchedMovie, Movie } from "@/lib/types";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

// Profile update schema
const profileSchema = z.object({
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  avatarUrl: z.string().url({
    message: "Avatar URL must be a valid URL.",
  }).optional().or(z.literal(''))
});

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Please confirm your new password.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, isLoading, updateProfileMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch user watch history
  const { data: watchHistory = [], isLoading: isHistoryLoading } = useQuery<WatchedMovie[]>({
    queryKey: ['/api/watch-history'],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Get recommended movies based on watch history
  const { data: recommendedMovies = [], isLoading: isRecommendationsLoading } = useQuery<Movie[]>({
    queryKey: ['/api/recommendations'],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Clear watch history mutation
  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/watch-history', {});
    },
    onSuccess: () => {
      toast({
        title: "History Cleared",
        description: "Your watch history has been cleared successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to clear watch history: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // If still loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no user, redirect to auth
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  // Profile form handler
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
      email: user.email || "",
      avatarUrl: user.avatarUrl || "",
    },
  });
  
  // Password form handler
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Handle profile update
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      
      // Reset the form
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>View and update your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <History size={14} />
                  Watch History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-4">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="johndoe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/avatar.jpg" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a URL to an image to use as your profile picture
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {profileForm.watch("avatarUrl") && (
                      <div className="mt-2 flex justify-center">
                        <img 
                          src={profileForm.watch("avatarUrl")} 
                          alt="Avatar preview" 
                          className="w-24 h-24 rounded-full object-cover border" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Avatar';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="password" className="mt-4">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={passwordForm.formState.isSubmitting}
                      >
                        {passwordForm.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              {/* New Watch History Tab */}
              <TabsContent value="history" className="mt-4">
                <div className="space-y-6">
                  {/* Watch History Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History size={18} className="text-primary" />
                        Your Watch History
                      </h3>
                      {watchHistory.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to clear your watch history? This cannot be undone.")) {
                              clearHistory();
                            }
                          }}
                          className="text-xs"
                        >
                          Clear History
                        </Button>
                      )}
                    </div>
                    
                    {isHistoryLoading ? (
                      <div className="py-6 text-center text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Loading watch history...</p>
                      </div>
                    ) : watchHistory.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 border rounded-md">
                        <Film className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>You haven't watched any movies yet.</p>
                        <Link href="/">
                          <Button variant="link" className="mt-2">Browse movies</Button>
                        </Link>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <div className="space-y-4">
                          {watchHistory.map((item) => (
                            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                              <div className="flex-shrink-0">
                                <Link href={`/movie/${item.movieId}`}>
                                  <img 
                                    src={item.movie?.imageUrl} 
                                    alt={item.movie?.title || "Movie"} 
                                    className="w-16 h-20 object-cover rounded-md hover:opacity-80 transition-opacity cursor-pointer" 
                                  />
                                </Link>
                              </div>
                              <div className="flex-1">
                                <Link href={`/movie/${item.movieId}`}>
                                  <h4 className="text-base font-medium hover:text-primary transition-colors cursor-pointer">
                                    {item.movie?.title || "Unknown Movie"}
                                  </h4>
                                </Link>
                                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                  {item.movie?.categories?.map((category, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Watched on {format(new Date(item.watchedAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                  
                  {/* Recommendations Section Based on Watch History */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-5 h-5 text-primary"
                      >
                        <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
                        <circle cx="17" cy="7" r="5" />
                      </svg>
                      Recommendations for You
                    </h3>
                    
                    {isRecommendationsLoading ? (
                      <div className="py-6 text-center text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Finding recommendations for you...</p>
                      </div>
                    ) : watchHistory.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 border rounded-md">
                        <p>Watch some movies to get personalized recommendations.</p>
                      </div>
                    ) : recommendedMovies.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 border rounded-md">
                        <p>No recommendations available yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {recommendedMovies.slice(0, 6).map((movie: Movie) => (
                          <Link key={movie.id} href={`/movie/${movie.id}`}>
                            <div className="relative group cursor-pointer">
                              <img 
                                src={movie.imageUrl} 
                                alt={movie.title} 
                                className="w-full aspect-[2/3] object-cover rounded-md group-hover:opacity-75 transition-opacity" 
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-md">
                                <h4 className="text-white text-sm font-medium line-clamp-1">{movie.title}</h4>
                                <div className="flex items-center mt-1">
                                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-white text-xs ml-1">{movie.rating.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Username: <span className="font-medium">{user.username}</span> · 
              Joined: <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}