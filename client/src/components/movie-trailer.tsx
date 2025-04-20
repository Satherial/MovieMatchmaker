import { FC, useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "lucide-react";

interface MovieTrailerProps {
  movieTitle: string;
  movieYear?: number;
}

const MovieTrailer: FC<MovieTrailerProps> = ({ movieTitle, movieYear }) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Include year in search query if available for better results
        const searchQuery = movieYear 
          ? `${movieTitle} ${movieYear} official trailer`
          : `${movieTitle} official trailer`;
        
        const response = await fetch(`/api/movies/trailer?query=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trailer');
        }
        
        const data = await response.json();
        
        if (data && data.videoId) {
          setVideoId(data.videoId);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching trailer:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (movieTitle) {
      fetchTrailer();
    }
  }, [movieTitle, movieYear]);

  const opts = {
    height: '390',
    width: '100%',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Trailer</h2>
        <Card className="overflow-hidden">
          <Skeleton className="h-[390px] w-full" />
        </Card>
      </div>
    );
  }

  if (error || !videoId) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Trailer</h2>
        <Card className="overflow-hidden border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-500 h-[390px]">
          <Film size={48} className="mb-4 opacity-50" />
          <p>No trailer available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Trailer</h2>
      <Card className="overflow-hidden border border-gray-200">
        <YouTube
          videoId={videoId}
          opts={opts}
          className="w-full"
          onError={() => setError(true)}
        />
      </Card>
    </div>
  );
};

export default MovieTrailer;