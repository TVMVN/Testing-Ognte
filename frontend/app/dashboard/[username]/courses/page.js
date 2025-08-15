'use client'
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft, Clock, Play, ExternalLink, Search, Filter, BookOpen, Star, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

const YouTubeVideos = () => {
  const { username } = useParams();
  const router = useRouter();
  const BACKEND_URL = "http://localhost:8000/"

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [editValues, setEditValues] = useState({
    title: ''
  });

  // Token management functions
  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  };

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userType');
    }
  };

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      toast.error('No refresh token found. Please log in again.');
      clearTokens();
      router.push('/login');
      return null;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access);
        }
        return data.access;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Token refresh failed:', errorData);
        toast.error('Session expired. Please log in again.');
        clearTokens();
        router.push('/login');
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      toast.error('Authentication error. Please log in again.');
      clearTokens();
      router.push('/login');
      return null;
    }
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      toast.error('Please log in to continue.');
      router.push('/login');
      return null;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        
        if (token) {
          response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          return null;
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  // ✅ Fetch user profile and update title
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/profile/`, {
          method: "GET",
        });

        if (!res) {
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error ${res.status}:`, errorText);
          throw new Error(`HTTP error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('Profile data:', data);
        
        setEditValues(prev => ({
          ...prev,
          title: data.professional_title || ''
        }));
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        toast.error("Failed to fetch user data. Please try logging in again.");
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
        
        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
          setVideos([]);
          setLoading(false);
          return;
        }
        
        const videoIds = data.items.map(item => item.id.videoId);

        const videoDetailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=contentDetails,snippet&id=${videoIds.join(",")}`
        );
        
        if (!videoDetailsResponse.ok) {
          throw new Error(`YouTube API error: ${videoDetailsResponse.status}`);
        }
        
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
        setFilteredVideos(videoData);
      } catch (error) {
        console.error("Error fetching YouTube videos:", error);
        toast.error("Failed to load video recommendations");
      } finally {
        setLoading(false);
      }
    };

    if (editValues.title) {
      const searchQuery = `${editValues.title}, tutorial, full video, full course`;
      fetchYouTubeVideos(searchQuery);
    }
  }, [editValues.title]);

  // Search functionality
  useEffect(() => {
    const filtered = videos.filter(video =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVideos(filtered);
  }, [searchTerm, videos]);

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

  // Loading skeleton component
  const VideoSkeleton = () => (
    <div className="animate-pulse bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-2xl"></div>
      <div className="p-6">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-3"></div>
        <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg mb-2"></div>
        <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-3/4"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-12">
          <Link href={`/dashboard/${username}`}>
            <div className="inline-flex items-center mb-8 text-green-600 hover:text-green-700 transition-colors duration-200 group bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg">
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Dashboard</span>
            </div>
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-green-700 bg-clip-text text-transparent mb-4">
              Learning Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Master new skills with curated video courses for{" "}
              <span className="text-green-600 font-semibold bg-green-100/50 px-2 py-1 rounded-lg">
                {editValues.title || "your field"}
              </span>
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                {loading ? '...' : filteredVideos.length}
              </p>
              <p className="text-gray-600 font-medium">Available Courses</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">
                {loading ? '...' : Math.round(filteredVideos.reduce((acc, video) => acc + video.duration, 0) / 60)}h
              </p>
              <p className="text-gray-600 font-medium">Total Content</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-2xl p-6 shadow-xl text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                100%
              </p>
              <p className="text-gray-600 font-medium">Free Access</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses by title or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div>
            <div className="flex flex-col items-center justify-center mb-12">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-green-200 rounded-full animate-spin border-t-green-600"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-green-400"></div>
              </div>
              <p className="mt-6 text-gray-600 text-lg font-medium">
                Curating amazing courses for you...
              </p>
              <p className="mt-2 text-gray-500 text-sm">
                Finding the best learning resources
              </p>
            </div>
            
            {/* Loading Skeleton Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <VideoSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          /* Courses Grid */
          <div>
            {/* Results Header */}
            {searchTerm && (
              <div className="mb-8 text-center">
                <p className="text-gray-600">
                  Found <span className="font-semibold text-green-600">{filteredVideos.length}</span> courses
                  {searchTerm && (
                    <>
                      {" "}matching "<span className="font-semibold text-green-600">{searchTerm}</span>"
                    </>
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video, index) => (
                <div
                  key={index}
                  className="group bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl shadow-xl hover:shadow-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-green-300"
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
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-2xl">
                          <Play className="w-8 h-8 text-green-600 fill-current" />
                        </div>
                      </div>
                      {/* Duration Badge */}
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(video.duration)}</span>
                      </div>
                      {/* Quality Badge */}
                      <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                        <Star className="w-3 h-3" />
                        <span>HD</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 leading-tight group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                        {video.description.slice(0, 120)}...
                      </p>
                      
                      {/* Action Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500 font-medium">Free Course</span>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600 text-sm font-semibold group-hover:text-green-700 transition-colors">
                          <span>Watch Now</span>
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredVideos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <BookOpen className="w-16 h-16 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {searchTerm ? 'No courses found' : 'No courses available'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg leading-relaxed">
              {searchTerm 
                ? `We couldn't find any courses matching "${searchTerm}". Try adjusting your search terms.`
                : "We couldn't find any courses for your current professional title. Try updating your profile or check back later."
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default YouTubeVideos;