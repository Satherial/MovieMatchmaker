import { FC } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { TMDbSearch } from '@/components/tmdb-search';

const AdminPage: FC = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If not loading and no user, redirect to auth page
  if (!isLoading && !user) {
    setLocation('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Movie Recommendation App</title>
      </Helmet>

      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="tmdb" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tmdb">TMDb Import</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="tmdb" className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Import Movies from TMDb</h2>
              <p className="text-muted-foreground mb-6">
                Search for movies in The Movie Database (TMDb) and import them into your local database.
              </p>
              <TMDbSearch />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Movie Statistics</h2>
              <p className="text-muted-foreground">
                This section will display various statistics about your movie database.
                Coming soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminPage;