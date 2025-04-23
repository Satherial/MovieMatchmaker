import { useQuery } from "@tanstack/react-query";
import { FC, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/use-language";

// Define language to country code mapping for streaming services
const languageToCountry: Record<string, string> = {
  en: "us", // English -> United States
  es: "es", // Spanish -> Spain
  fr: "fr", // French -> France
  de: "de", // German -> Germany
  it: "it", // Italian -> Italy
  ja: "jp", // Japanese -> Japan
  ko: "kr", // Korean -> South Korea
  pt: "pt", // Portuguese -> Portugal
  ru: "ru", // Russian -> Russia
  zh: "cn", // Chinese -> China
  all: "us", // Default to US for "all languages"
};

// Define the types for the streaming availability response
interface StreamingOption {
  service: string;
  streamingType: string;
  quality: string;
  link: string;
  audios?: string[];
  subtitles?: string[];
  price?: {
    amount: string;
    currency: string;
    formatted: string;
  };
  leaving?: number;
}

interface StreamingAvailability {
  title: string;
  streamingOptions: {
    [country: string]: StreamingOption[];
  };
}

interface StreamingAvailabilityProps {
  movieId: number;
  country?: string; // Optional override
}

export const StreamingAvailability: FC<StreamingAvailabilityProps> = ({
  movieId,
  country, // Optional override
}) => {
  // Get user's language preference
  const { language } = useLanguage();

  // Derive country from language, but allow override via props
  const derivedCountry = country || languageToCountry[language] || "us";

  // Use the derived country code for API requests
  const {
    data: streamingData,
    isLoading,
    isError,
    error,
  } = useQuery<StreamingAvailability>({
    queryKey: [`streaming-${movieId}`, { country: derivedCountry }],
    queryFn: async () => {
      const response = await fetch(
        `/api/streaming/${movieId}?country=${derivedCountry}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch streaming data");
      }
      const data = await response.json();
      // Add debug logging for the structure
      console.log("Raw streaming data structure:", data);
      if (data.streamingOptions && data.streamingOptions[derivedCountry]) {
        console.log(
          "Service types:",
          data.streamingOptions[derivedCountry].map(
            (opt: any) => `${opt.service} (${typeof opt.service})`
          )
        );
      }
      return data;
    },
    enabled: !!movieId,
  });

  // Helper function to get platform logo or name
  const getPlatformIcon = (platform: string | any) => {
    // Handle complex platform object
    let serviceName: string;

    if (typeof platform === "string") {
      serviceName = platform;
    } else if (typeof platform === "object" && platform) {
      // Try to get the name from the object
      serviceName = (platform as any).name || "";

      // If we have a complex object with themeColorCode, we could use that for styling
      if (!serviceName) {
        console.warn(
          `Platform object without name property: ${JSON.stringify(platform)}`
        );
        return <i className="fas fa-play mr-2"></i>;
      }
    } else {
      console.warn(
        `Platform is not a string or object: ${JSON.stringify(platform)}`
      );
      return <i className="fas fa-play mr-2"></i>;
    }

    // Normalize platform name to lowercase
    const normalizedName = serviceName.toLowerCase();

    // Map of platform names to their icon classes (using font-awesome)
    const platformIcons: Record<string, string> = {
      netflix: "fab fa-netflix",
      "amazon prime": "fab fa-amazon",
      disney: "fab fa-disney-plus",
      "apple tv": "fab fa-apple",
      hulu: "fas fa-tv",
      "hbo max": "fas fa-film",
      max: "fas fa-film",
      youtube: "fab fa-youtube",
    };

    // Find matching platform name
    for (const [key, value] of Object.entries(platformIcons)) {
      if (normalizedName.includes(key)) {
        return <i className={`${value} mr-2`}></i>;
      }
    }

    // Default icon if no match
    return <i className="fas fa-play mr-2"></i>;
  };

  // Function to determine badge color based on streaming type
  const getStreamingTypeBadge = (type: string | any) => {
    // Check if type is a string
    if (typeof type !== "string") {
      console.warn(`Streaming type is not a string: ${JSON.stringify(type)}`);
      return "bg-gray-100 text-gray-800"; // Default style
    }

    const types: Record<string, string> = {
      subscription: "bg-green-100 text-green-800",
      buy: "bg-purple-100 text-purple-800",
      rent: "bg-blue-100 text-blue-800",
      free: "bg-teal-100 text-teal-800",
      addon: "bg-orange-100 text-orange-800",
    };

    return types[type.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="my-6">
        <h2 className="text-xl font-semibold mb-3">Where to Watch</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="my-6">
        <h2 className="text-xl font-semibold mb-3">Where to Watch</h2>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Sorry, we couldn't load streaming availability information at this
            time.
          </p>
          <p className="text-sm text-red-500">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </Card>
      </div>
    );
  }

  // If we have data but no streaming options for the requested country
  if (
    !streamingData?.streamingOptions ||
    typeof streamingData.streamingOptions !== "object" ||
    !streamingData.streamingOptions[derivedCountry] ||
    !Array.isArray(streamingData.streamingOptions[derivedCountry]) ||
    streamingData.streamingOptions[derivedCountry].length === 0
  ) {
    return (
      <div className="my-6">
        <h2 className="text-xl font-semibold mb-3">Where to Watch</h2>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No streaming options available for this movie in{" "}
            {derivedCountry.toUpperCase()}.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h2 className="text-xl font-semibold mb-3">Where to Watch</h2>
      <Card className="p-6">
        <div className="space-y-4">
          {(() => {
            try {
              // Log full details of streaming options for debugging
              console.log(
                `Rendering streaming options for country: ${derivedCountry}`
              );
              console.log(
                "All available streaming options:",
                streamingData?.streamingOptions
              );

              return streamingData.streamingOptions[derivedCountry].map(
                (option, index) => {
                  // Log each option for debugging
                  console.log(`Option ${index}:`, option);

                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg"
                    >
                      <div className="flex items-center mb-2 sm:mb-0">
                        {getPlatformIcon(option.service)}
                        <span className="font-medium">
                          {typeof option.service === "string"
                            ? option.service
                            : typeof option.service === "object" &&
                              option.service
                            ? (option.service as any).name ||
                              JSON.stringify(option.service)
                            : "Unknown Service"}
                        </span>
                        {option.streamingType && (
                          <Badge
                            className={`ml-2 ${getStreamingTypeBadge(
                              option.streamingType
                            )}`}
                            variant="outline"
                          >
                            {typeof option.streamingType === "string"
                              ? option.streamingType
                              : "Unknown"}
                          </Badge>
                        )}
                        {option.quality && (
                          <Badge className="ml-2" variant="outline">
                            {typeof option.quality === "string"
                              ? option.quality
                              : "HD"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        {option.price && (
                          <span className="text-sm font-medium">
                            {typeof option.price === "object" &&
                            option.price.formatted
                              ? option.price.formatted
                              : typeof option.price === "string"
                              ? option.price
                              : ""}
                          </span>
                        )}
                        <Button
                          size="sm"
                          className="ml-auto sm:ml-0"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={
                              typeof option.link === "string"
                                ? option.link
                                : "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Watch <ExternalLink className="ml-1 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                }
              );
            } catch (error) {
              console.error("Error rendering streaming options:", error);
              return (
                <div className="p-4 border border-red-200 rounded-md bg-red-50">
                  <p className="text-red-500">
                    Error displaying streaming options. Please try again later.
                  </p>
                </div>
              );
            }
          })()}
        </div>
      </Card>
    </div>
  );
};

export default StreamingAvailability;
