'use client';

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const StudentDashboard = () => {
  const router = useRouter();
  const { username } = useParams();
  const [profilePic, setProfilePic] = useState(null);
  const [email, setEmail] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [title, setTitle] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const BACKEND_URL = "http://localhost:8000/";

  const [resumeScore, setResumeScore] = useState(0);
  const [userSkills, setUserSkills] = useState({
    HTML: 2,
    CSS: 2,
    JavaScript: 3,
    React: 2,
    Git: 2,
  });
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

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

  const handleLogoutWithConfirmation = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
      const token = getAccessToken();
      
      // Clear tokens immediately
      clearTokens();
      
      // Notify server in background (don't wait for response)
      if (token) {
        fetch(`${BACKEND_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(err => console.error('Background logout error:', err));
      }
      
      // Redirect immediately
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Force redirect even if there's an error
      router.push('/login');
    }
  };

  // Enhanced API request function with automatic token refresh
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      toast.error('Please log in to continue.');
      router.push('/login');
      return null;
    }

    // First attempt with current token
    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      // If unauthorized, try to refresh token and retry
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        
        if (token) {
          // Retry the request with new token
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

  // Fetch matched jobs for the candidate
  useEffect(() => {
    const fetchMatchedJobs = async () => {
      if (!username) return;
      
      setJobsLoading(true);
      try {
        const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/matching/match/candidate`, {
          method: 'GET',
        });

        if (!res) {
          // makeAuthenticatedRequest already handled the error
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error ${res.status}:`, errorText);
          throw new Error(`HTTP error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('Matched jobs data:', data);
        
        // Assuming the API returns an array of matched jobs
        // Sort by match score (if available) and take top 5
        let sortedJobs = Array.isArray(data) ? data : (data.matches || data.jobs || []);
        
        if (sortedJobs.length > 0) {
          // Sort by match_score or compatibility_score if available
          sortedJobs = sortedJobs.sort((a, b) => {
            const scoreA = a.match_score || a.compatibility_score || a.score || 0;
            const scoreB = b.match_score || b.compatibility_score || b.score || 0;
            return scoreB - scoreA; // Descending order
          });
          
          // Take only the top 5 jobs
          setMatchedJobs(sortedJobs.slice(0, 5));
        } else {
          setMatchedJobs([]);
        }
        
      } catch (error) {
        console.error("Error fetching matched jobs:", error);
        toast.error("Failed to fetch job recommendations");
        
        // Fallback to mock API if matching API fails
        try {
          const fallbackRes = await fetch("https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/recruiters/1/jobs");
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            setMatchedJobs(fallbackData.slice(0, 5));
          }
        } catch (fallbackError) {
          console.error("Fallback API also failed:", fallbackError);
          setMatchedJobs([]);
        }
      } finally {
        setJobsLoading(false);
      }
    };

    fetchMatchedJobs();
  }, [username]);

  // Fetch user profile
  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          toast.warn("No token found. Please log in.");
          router.push('/login');
          return;
        }

        const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/profile/`, {
          method: 'GET',
        });

        if (!res) {
          // makeAuthenticatedRequest already handled the error
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error ${res.status}:`, errorText);
          throw new Error(`HTTP error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        setProfilePic(data.profile_picture);
        setEmail(data.user.email);
        setFirstName(data.user.first_name);
        setTitle(data.professional_title);
        
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        toast.error("Failed to fetch user data. Please try logging in again.");
        // Don't redirect immediately, let user try again
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, router]);

  // Fetch YouTube videos when title changes
  useEffect(() => {
    if (title) {
      const searchQuery = `${title}, tutorial, full video, full course`;
      fetchYouTubeVideos(searchQuery);
    }
  }, [title]);

  const fetchYouTubeVideos = async (searchQuery) => {
    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const maxResults = 6;
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
      
      const videoIds = data.items.map((item) => item.id.videoId);

      const videoDetailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=contentDetails,snippet&id=${videoIds.join(",")}`
      );
      
      if (!videoDetailsResponse.ok) {
        throw new Error(`YouTube API error: ${videoDetailsResponse.status}`);
      }
      
      const videoDetailsData = await videoDetailsResponse.json();

      const videoData = videoDetailsData.items
        .map((item) => {
          return {
            title: item.snippet.title,
            description: item.snippet.description,
            videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
            thumbnail: item.snippet.thumbnails.high.url,
          };
        })
        .filter((item) => item !== null);

      setVideos(videoData);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      toast.error("Failed to load video recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!username) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center bg-black">
        Loading...
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center bg-black">
        Loading profile...
      </div>
    );
  }

  const SHEET_SIDES = ["right"];

  return (
    <div className="text-white bg-green-50 min-h-screen pb-16">
      {/* NAVBAR */}
      <nav className="Navbar px-8 h-[60px] flex justify-between items-center sticky top-0 z-50 bg-black shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2">
          <Link href={"/"}>
            <h1 className="text-xl font-bold text-white">
              OG<span className="text-[#25d442]">nite</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/${username}/courses`}>
            <button className="border-none text-green-500 px-4 cursor-pointer py-1 rounded font-medium hover:bg-green-100">
              Courses
            </button>
          </Link>
          <Link href={`/dashboard/${username}/internships`}>
            <button className="border-none text-green-500 cursor-pointer px-4 py-1 rounded font-medium hover:bg-green-100">
              Internships
            </button>
          </Link>
          <Link href={`/dashboard/${username}/notifications`}>
            <button className="relative border-none cursor-pointer text-green-100 px-1 py-1 rounded font-medium">
              <span className="absolute flex size-2 left-4.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
              </span>
              <Bell />
            </button>
          </Link>

          <div className="">
            {SHEET_SIDES.map((side) => (
              <Sheet key={side}>
                <SheetTrigger asChild className="bg-black border-[1.5px] border-green-500 py-1 hover:bg-green-950 cursor-pointer">
                  <Button variant="outline">
                    {profilePic && (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-gray-500"
                      />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className={`rounded-bl-full bg-white w-[30%]} side={side}`}>
                  <SheetHeader>
                    <SheetTitle className={`text-black`}>
                      Hello, {<span className="text-[#25d442] font-bold">{username}</span>}
                    </SheetTitle>
                    <SheetDescription className={`text-[#25d442] text-sm font-bold`}>
                      <span className="text-black">Aspiring</span> {title}
                    </SheetDescription>
                    <SheetDescription className="text-gray-700 text-sm font-semibold">
                      {email}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-4 flex flex-col gap-4 pt-2">
                    <div className="mt-5 text-right">
                      <ul className="flex flex-col  gap-7 text-gray-900 text-right">
                        <Link href="/">
                          <li className="">Home</li>
                        </Link>
                        <Link href={`/dashboard/${username}/profile`}>
                          <li className="cursor-pointer">Edit Profile</li>
                        </Link>
                        <Link href={`/dashboard/${username}/applications`}>
                          <li className="cursor-pointer">My Applications</li>
                        </Link>
                        <Link href={`/dashboard/${username}/resume-analysis`}>
                          <li className="cursor-pointer">Analyze resume</li>
                        </Link>
                        <Link href={`/dashboard/${username}/settings`}>
                          <li className="cursor-pointer">Edit Preferences</li>
                        </Link>
                        <Link href={`/dashboard/${username}/safety-tips`}>
                          <li className="cursor-pointer">Safety tips</li>
                        </Link>
                        <li 
                          onClick={handleLogoutWithConfirmation} 
                          className="  text-black dark:text-white hover:text-red-600 cursor-pointer"
                        >
                          Logout
                        </li>
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </div>
      </nav>

      <div className="grid px-10 gap-8 grid-cols-2">
        <div className="mt-6 bg-white border-white border-1 p-6 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-semibold text-green-800 mb-2">{firstName}</h2>
          <h2 className="text-xl font-semibold text-green-500 mb-2">Your Resume Score</h2>
          <p className="text-2xl font-bold text-green-600">80%</p>
          <p className="text-sm text-gray-600 mt-1">Based on skill match with job requirements.</p>
          <p className="text-green-700">{title}</p>
        </div>
        
        <div className="mt-6 bg-white border p-6 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Top Matched Job Opportunities</h2>
          {jobsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-500">Loading matched jobs...</span>
            </div>
          ) : matchedJobs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-2">No matched jobs found at the moment.</p>
              <p className="text-xs text-gray-400">Try updating your skills and preferences to get better matches.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {matchedJobs.map((job, index) => (
                <li key={job.id || index} className="border-l-4 border-green-500 pl-4 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-green-800 text-lg">
                        {job.job_title || job.jobTitle || job.title || 'Job Title Not Available'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {job.company_name || job.company || 'Company Not Specified'}
                      </p>
                    </div>
                    {(job.match_score || job.compatibility_score || job.score) && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {Math.round((job.match_score || job.compatibility_score || job.score) * 100)}% Match
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <span>Salary: {job.salary || job.salary_from || job.salary_range || "Not specified"}</span>
                      {job.location && <span className="ml-3">📍 {job.location}</span>}
                    </div>
                    <span className="text-green-700 bg-green-50 px-3 py-1 text-xs rounded-full">
                      {job.job_category || job.category || job.job_type || "Job"}
                    </span>
                  </div>
                  {job.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                      {job.description.length > 100 
                        ? `${job.description.substring(0, 100)}...` 
                        : job.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!jobsLoading && matchedJobs.length > 0 && (
            <div className="mt-4 text-center">
              <Link href={`/dashboard/${username}/internships`}>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  View All Matched Jobs →
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Video Recommendations */}
      <div className="mt-10 px-10">
        <h2 className="text-xl text-green-400 font-semibold mb-4">
          Courses for {title}
        </h2>
        {loading ? (
          <p className="text-white">Loading videos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <a
                key={index}
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300"
              >
                <img src={video.thumbnail} alt={video.title} className="w-full rounded-md mb-3" />
                <h3 className="font-semibold text-lg">{video.title}</h3>
                <p className="text-sm text-gray-600 truncate">{video.description}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;