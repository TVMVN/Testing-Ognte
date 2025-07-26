'use client'
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft, Clock, Play, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const YouTubeVideos = () => {
  const { username } = useParams();
  const router = useRouter();
  const BACKEND_URL = "http://localhost:8000/"

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState({
    title: ''
  });

  // ✅ Fetch user profile and update title
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          toast.error("No token found. Please log in.");
          router.push('/login');
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/candidates/profile/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setEditValues(prev => ({
            ...prev,
            title: data.professional_title || ''
          }));
        } else {
          toast.error("Failed to load profile.");
        }
      } catch (err) {
        toast.error("Failed to fetch user data. Please log in.");
      }
    };

    if (username) fetchUserProfile();
  }, [username]);

  // ✅ Fetch YouTube videos based on title
  useEffect(() => {
    const fetchYouTubeVideos = async (searchQuery) => {
      const API_KEY = "AIzaSyDlLVjpyUnrTI9NCqFB9IyU5JTPXRTU6ao";
      const maxResults = 41;

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${encodeURIComponent(searchQuery)}&part=snippet&type=video&maxResults=${maxResults}`
        );
        const data = await response.json();
        const videoIds = data.items.map(item => item.id.videoId);

        const videoDetailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=contentDetails,snippet&id=${videoIds.join(",")}`
        );
        const videoDetailsData = await videoDetailsResponse.json();

        const videoData = videoDetailsData.items.map(item => {
          const duration = item.contentDetails.duration;
          const durationInMinutes = parseDurationToMinutes(duration);
          if (durationInMinutes <= 120) {
            return {
              title: item.snippet.title,
              description: item.snippet.description,
              videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
              thumbnail: item.snippet.thumbnails.high.url,
              duration: durationInMinutes,
            };
          }
          return null;
        }).filter(Boolean);

        setVideos(videoData);
      } catch (error) {
        console.error("Error fetching YouTube videos:", error);
        toast.error("Error fetching YouTube videos.");
      } finally {
        setLoading(false);
      }
    };

    if (editValues.title) {
      const searchQuery = `${editValues.title}, tutorial, full video, full course`;
      fetchYouTubeVideos(searchQuery);
    }
  }, [editValues.title]);

  // ✅ Parse ISO 8601 duration string to minutes
  const parseDurationToMinutes = (duration) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    return hours * 60 + minutes + Math.floor(seconds / 60);
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <Link href={`/dashboard/${username}`}>
            <div className="inline-flex items-center mb-6 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200 group">
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Dashboard</span>
            </div>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                 Micro Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Curated learning content for{" "}
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  {editValues.title || "your field"}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Play className="w-4 h-4" />
              <span>{videos.length} courses available</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-green-200 dark:border-green-800 rounded-full animate-spin border-t-green-600 dark:border-t-green-400"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-green-400 dark:border-t-green-300"></div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg font-medium">
              Discovering amazing courses for you...
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              This might take a moment
            </p>
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* Thumbnail Container */}
                  <div className="relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-green-600 dark:bg-green-500 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                      {video.description.slice(0, 120)}...
                    </p>
                    
                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center space-x-1">
                        <span>Watch Course</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              We couldn't find any courses for your current professional title. Try updating your profile or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeVideos;