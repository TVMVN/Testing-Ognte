'use client'
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner"; // Optional: Assuming you're using react-toastify

const YouTubeVideos = () => {
  const { username } = useParams();
  const router = useRouter();

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

        const res = await fetch("http://localhost:8000/api/candidates/profile/", {
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

  return (
    <div className="container bg-black w-full px-4 mr-0 py-8">
      <Link href={`/dashboard/${username}`}>
        <div className="flex items-center mb-6 text-green-700 hover:text-green-300">
          <ArrowLeft className="mr-2" />
          <span>Back to Dashboard</span>
        </div>
      </Link>

      <h2 className="text-3xl font-semibold text-green-700 mb-8">YouTube Micro Courses</h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-400 border-solid"></div>
          <p className="mt-4 text-gray-700">Loading Courses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 border-2 rounded-2xl p-4 border-green-500">
          {videos.map((video, index) => (
            <div key={index} className="bg-green-800 rounded-lg border-white shadow-lg overflow-hidden transition-transform transform hover:scale-105">
              <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="border-green-500 hover:shadow-lg transition duration-300"
>
                <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover rounded-t-lg" />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-green-300">{video.title}</h3>
                  <p className="text-sm text-gray-200 mt-2">{video.description.slice(0, 100)}...</p>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubeVideos;
