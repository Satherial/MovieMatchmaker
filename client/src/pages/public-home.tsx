import { FC } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Film, 
  Users, 
  Star, 
  Share2, 
  ListPlus, 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Heart, 
  Clock,
  Check,
  Sparkles
} from "lucide-react";

const PublicHome: FC = () => {
  return (
    <PublicLayout>
      <Helmet>
        <title>MovieMatch - Find Your Perfect Movie with Friends</title>
        <meta name="description" content="MovieMatch helps you discover your next favorite movie with personalized recommendations, track your watch history, and share your movie experiences with friends." />
        <meta name="keywords" content="movie recommendations, movie app, watch with friends, social movies, movie tracking" />
        <meta property="og:title" content="MovieMatch - Find Your Perfect Movie with Friends" />
        <meta property="og:description" content="Discover, track and share your favorite movies with friends using intelligent recommendations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://moviematch.replit.app" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background pt-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Find Your Perfect Movie <span className="text-primary">With Friends</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Discover, track, and share your movie experiences with personalized recommendations 
                that get better the more you use the app.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="px-8">
                  <Link href="/auth">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-tr from-primary/30 via-primary/20 to-background p-6 rounded-2xl shadow-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg" 
                      alt="Movie poster" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300 translate-y-8">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" 
                      alt="Movie poster" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300 translate-y-4">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg" 
                      alt="Movie poster" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300 -translate-y-4">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/rktDFB0ONS298jjLlrxHdRRobA6.jpg" 
                      alt="Movie poster" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-background rounded-full p-4 shadow-lg border border-border">
                <div className="flex items-center gap-2 text-primary">
                  <Star className="h-8 w-8 fill-primary text-primary" />
                  <span className="text-2xl font-bold">4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need For Your Movie Journey
            </h2>
            <p className="text-lg text-muted-foreground">
              MovieMatch combines powerful recommendation technology with social features 
              to create the ultimate movie discovery platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Recommendations</CardTitle>
                <CardDescription>
                  Our algorithm learns from your watch history to suggest movies you'll love.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Personalized movie suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Filter by genre, rating, and year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Continually improves as you use it</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Social Features</CardTitle>
                <CardDescription>
                  Connect with friends and share your movie experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Add friends and see their activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Share playlists with your network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Record collaborative watch sessions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ListPlus className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Custom Playlists</CardTitle>
                <CardDescription>
                  Create and organize collections of your favorite movies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Create unlimited playlists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Organize by genre, mood, or occasion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Add personal notes to each movie</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Eye className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Watch History</CardTitle>
                <CardDescription>
                  Keep track of everything you've watched in one place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Automatically track what you watch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>See watch history by date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Never forget if you've seen a movie</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Movie Reactions</CardTitle>
                <CardDescription>
                  Express how you feel about movies with emoji reactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>React with emotions to any movie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>See how friends reacted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Compare reactions with the community</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Share2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Social Sharing</CardTitle>
                <CardDescription>
                  Share your favorite movies across social media platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Share to major social platforms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Generate shareable links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Invite friends to watch together</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How MovieMatch Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes and begin your personalized movie journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create an Account</h3>
              <p className="text-muted-foreground mb-4">
                Sign up for a free account to start tracking your movie preferences and connecting with friends.
              </p>
              <Link href="/auth">
                <a className="inline-flex items-center text-primary hover:underline">
                  Sign up now <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track What You Watch</h3>
              <p className="text-muted-foreground mb-4">
                Start marking movies as watched to build your history and help the recommendation algorithm learn your tastes.
              </p>
              <Link href="/auth">
                <a className="inline-flex items-center text-primary hover:underline">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect With Friends</h3>
              <p className="text-muted-foreground mb-4">
                Invite friends, share your favorite movies, and discover what movies you both want to watch together.
              </p>
              <Link href="/auth">
                <a className="inline-flex items-center text-primary hover:underline">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary/10 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Discover Your Next Favorite Movie?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join MovieMatch today and start your personalized movie journey. Connect with friends, 
                create playlists, and never run out of great movies to watch.
              </p>
              <Button asChild size="lg" className="px-8">
                <Link href="/auth">Get Started for Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PublicHome;