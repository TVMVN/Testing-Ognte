'use client';

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Bell, ChevronDown, TrendingUp, MapPin, DollarSign, Clock, Play, ExternalLink, Star, Award, Target, Briefcase } from "lucide-react";
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
  const params  = useParams();
  const username = params.username
  const [profilePic, setProfilePic] = useState(null);
  const [email, setEmail] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [title, setTitle] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileScore, setProfileScore] = useState(0);
const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [profileSuggestions, setProfileSuggestions] = useState([]);
  const [NumberOfApplications, setNumberOfApplications] = useState(0);
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
  const [initialLoad, setInitialLoad] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [resumeLoading, setResumeLoading] = useState(true);

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
        const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/matching/candidate/matches/`, {
          method: 'GET',
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
        console.log('Matched jobs data:', data);
        
        let sortedJobs = Array.isArray(data) ? data : (data.matches || data.jobs || []);
        
        if (sortedJobs.length > 0) {
          sortedJobs = sortedJobs.sort((a, b) => {
            const scoreA = a.match_score || a.compatibility_score || a.score || 0;
            const scoreB = b.match_score || b.compatibility_score || b.score || 0;
            return scoreB - scoreA;
          });
          
          setMatchedJobs(sortedJobs.slice(0, 5));
        } else {
          setMatchedJobs([]);
        }
        
      } catch (error) {
        console.error("Error fetching matched jobs:", error);
        toast.error("Failed to fetch job recommendations");

      } finally {
        setJobsLoading(false);
      }
    };

    fetchMatchedJobs();
  }, [username]);

  //Fetch Number of applications
 useEffect(() => {
    const fetchNumberOfApplications = async () => {
      if (!username) return;
      
      setApplicationsLoading(true);
      try {
        const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/my-applications/`, {
          method: 'GET',
        });

        if (!res) {
          setApplicationsLoading(false);
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error ${res.status}:`, errorText);
          throw new Error(`HTTP error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('Applications data:', data);
        
        // Handle different possible response structures
        if (Array.isArray(data)) {
          setNumberOfApplications(data.length);
        } else if (data.count !== undefined) {
          setNumberOfApplications(data.count);
        } else if (data.applications && Array.isArray(data.applications)) {
          setNumberOfApplications(data.applications.length);
        } else if (data.total !== undefined) {
          setNumberOfApplications(data.total);
        } else {
          // If we can't determine the count, default to 0
          setNumberOfApplications(0);
        }
        
      } catch (error) {
        console.error("Error fetching number of applications:", error);
        toast.error("Failed to fetch number of applications");
        // Set default value on error
        setNumberOfApplications(0);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchNumberOfApplications();
  }, [username]);


  //Fetch Resume Score
  useEffect(() => {
    const fetchResumeScore = async () => {
      if (!username) return;
      
      setResumeLoading(true);
      try {
        const res = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/resume-analysis/`, {
          method: 'GET',
        });

        if (!res) {
          setResumeLoading(false);
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error ${res.status}:`, errorText);
          throw new Error(`HTTP error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('Resume analysis data:', data);
        
        // Handle different possible response structures for resume score
        if (data.score !== undefined) {
          // If score is a percentage (0-100), use as is
          // If score is a decimal (0-1), convert to percentage
          const score = data.score > 1 ? Math.round(data.score) : Math.round(data.score * 100);
          setResumeScore(Math.min(100, Math.max(0, score))); // Ensure it's between 0-100
        } else if (data.resume_score !== undefined) {
          const score = data.resume_score > 1 ? Math.round(data.resume_score) : Math.round(data.resume_score * 100);
          setResumeScore(Math.min(100, Math.max(0, score)));
        } else if (data.analysis && data.analysis.score !== undefined) {
          const score = data.analysis.score > 1 ? Math.round(data.analysis.score) : Math.round(data.analysis.score * 100);
          setResumeScore(Math.min(100, Math.max(0, score)));
        } else if (data.overall_score !== undefined) {
          const score = data.overall_score > 1 ? Math.round(data.overall_score) : Math.round(data.overall_score * 100);
          setResumeScore(Math.min(100, Math.max(0, score)));
        } else {
          // If we can't find a score, set default
          setResumeScore(75); // Default score
        }
        
      } catch (error) {
        console.error("Error fetching resume score:", error);
        toast.error("Failed to fetch your resume score");
        // Set default value on error
        setResumeScore(75);
      } finally {
        setResumeLoading(false);
      }
    };

        fetchResumeScore();
  }, [username]);


  // Calculate profile completeness score
// Calculate profile completeness and strength scores
const calculateProfileScores = (data) => {
  if (!data) return { completeness: 0, strength: 0, suggestions: [] };
  
  const checks = [
    {
      field: 'user.first_name',
      completenessWeight: 8,
      strengthWeight: 5,
      label: 'First Name',
      suggestion: 'Add your first name to personalize your profile'
    },
    {
      field: 'user.last_name',
      completenessWeight: 7,
      strengthWeight: 5,
      label: 'Last Name',
      suggestion: 'Add your last name for a complete profile'
    },
    {
      field: 'professional_title',
      completenessWeight: 12,
      strengthWeight: 15,
      label: 'Professional Title',
      suggestion: 'Add your professional title to showcase your career focus'
    },
    {
      field: 'phone',
      completenessWeight: 8,
      strengthWeight: 10,
      label: 'Phone Number',
      suggestion: 'Add your phone number for recruiters to contact you'
    },
    {
      field: 'city',
      completenessWeight: 6,
      strengthWeight: 8,
      label: 'Location',
      suggestion: 'Add your city to help with location-based job matching'
    },
    {
      field: 'degree',
      completenessWeight: 10,
      strengthWeight: 12,
      label: 'Education Degree',
      suggestion: 'Add your degree to highlight your educational background'
    },
    {
      field: 'university_name',
      completenessWeight: 8,
      strengthWeight: 8,
      label: 'University',
      suggestion: 'Add your university to complete your education details'
    },
    {
      field: 'graduation_year',
      completenessWeight: 5,
      strengthWeight: 3,
      label: 'Graduation Year',
      suggestion: 'Add your graduation year for timeline context'
    },
    {
      field: 'skills',
      completenessWeight: 15,
      strengthWeight: 25,
      label: 'Skills',
      suggestion: 'Add your skills to improve job matching and visibility'
    },
    {
      field: 'profile_picture',
      completenessWeight: 6,
      strengthWeight: 8,
      label: 'Profile Picture',
      suggestion: 'Add a professional profile picture to make a great first impression'
    },
    {
      field: 'resume',
      completenessWeight: 12,
      strengthWeight: 18,
      label: 'Resume',
      suggestion: 'Upload your resume to showcase your experience and qualifications'
    },
    {
      field: 'languages',
      completenessWeight: 5,
      strengthWeight: 7,
      label: 'Languages',
      suggestion: 'Add languages you speak to highlight your communication abilities'
    },
    {
      field: 'date_of_birth',
      completenessWeight: 4,
      strengthWeight: 2,
      label: 'Date of Birth',
      suggestion: 'Add your date of birth to complete your personal information'
    },
    {
      field: 'gender',
      completenessWeight: 4,
      strengthWeight: 2,
      label: 'Gender',
      suggestion: 'Add your gender information if you\'re comfortable sharing'
    }
  ];

  let totalCompleteness = 0;
  let totalStrength = 0;
  const suggestions = [];

  checks.forEach(check => {
    const fieldPath = check.field.split('.');
    let value = data;
    
    // Navigate through nested object properties
    for (const path of fieldPath) {
      value = value && value[path];
    }
    
    // Check if field has a meaningful value
    const hasValue = value !== null && value !== undefined && value !== '' && 
                    (Array.isArray(value) ? value.length > 0 : true);
    
    if (hasValue) {
      totalCompleteness += check.completenessWeight;
      totalStrength += check.strengthWeight;
    } else {
      suggestions.push({
        field: check.label,
        suggestion: check.suggestion,
        completenessWeight: check.completenessWeight,
        strengthWeight: check.strengthWeight,
        totalWeight: check.completenessWeight + check.strengthWeight
      });
    }
  });

  // Sort suggestions by total weight (importance) in descending order
  suggestions.sort((a, b) => b.totalWeight - a.totalWeight);

  return {
    completeness: Math.min(100, Math.round(totalCompleteness)),
    strength: Math.min(100, Math.round(totalStrength)),
    suggestions: suggestions.slice(0, 5) // Show top 5 suggestions
  };
};
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
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`HTTP error ${res.status}:`, errorText);
        throw new Error(`HTTP error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Profile data:', data);
      
      setProfilePic(data.profile_picture);
      setEmail(data.user.email);
      setFirstName(data.user.first_name);
      setTitle(data.professional_title);
      
      // Update user skills from API
      if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        // Convert skills array to object format for display
        const skillsObj = {};
        data.skills.forEach((skill, index) => {
          // Assign random skill levels between 2-5 for display purposes
          // You might want to modify this based on your actual skill level system
          skillsObj[skill] = Math.floor(Math.random() * 4) + 2;
        });
        setUserSkills(skillsObj);
      } else {
        // Keep default skills if no skills in API
        setUserSkills({
          HTML: 2,
          CSS: 2,
          JavaScript: 3,
          React: 2,
          Git: 2,
        });
      }

    // Inside the fetchUserProfile function, after setting the profile data, replace the profile score calculation with:

const profileScoreData = calculateProfileScores(data);
setProfileCompleteness(profileScoreData.completeness);
setProfileScore(profileScoreData.strength);
setProfileSuggestions(profileScoreData.suggestions);
setProfileData(data);

// Update user skills from API
if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
  const skillsObj = {};
  data.skills.forEach((skill) => {
    // Assign random skill levels between 2-5 for display purposes
    skillsObj[skill] = Math.floor(Math.random() * 4) + 2;
  });
  setUserSkills(skillsObj);
} else {
  // Keep default skills if no skills in API, but empty for calculation purposes
  setUserSkills({});
}
      
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      toast.error("Failed to fetch user data. Please try logging in again.");
    } finally {
      setProfileLoading(false);
      setInitialLoad(false);
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

  // Loading skeleton components
  const ProfileSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-6 bg-gradient-to-r from-green-200 to-green-300 rounded-lg mb-2"></div>
      <div className="h-8 bg-gradient-to-r from-green-300 to-green-400 rounded-lg mb-2"></div>
      <div className="h-4 bg-gradient-to-r from-green-100 to-green-200 rounded-lg"></div>
    </div>
  );

  const JobSkeleton = () => (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-l-4 border-green-200 pl-4 pb-3">
          <div className="h-5 bg-gradient-to-r from-green-200 to-green-300 rounded-lg mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-1/2"></div>
            <div className="h-6 bg-gradient-to-r from-green-100 to-green-200 rounded-full w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const VideoSkeleton = () => (
    <div className="animate-pulse">
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-3"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2"></div>
      <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
    </div>
  );

  if (!username || initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        {/* Navbar Skeleton */}
        <nav className="px-8 h-[70px] flex justify-between items-center bg-gradient-to-r from-black to-gray-900 shadow-2xl">
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gradient-to-r from-green-400 to-green-500 rounded-lg"></div>
          </div>
          <div className="flex items-center space-x-4 animate-pulse">
            <div className="h-8 w-16 bg-gray-700 rounded-lg"></div>
            <div className="h-8 w-20 bg-gray-700 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
            <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full"></div>
          </div>
        </nav>
        
        {/* Content Skeleton */}
        <div className="px-8 pt-8">
          <div className="text-center mb-12 animate-pulse">
            <div className="h-12 w-96 bg-gradient-to-r from-green-300 to-green-400 rounded-2xl mx-auto mb-4"></div>
            <div className="h-6 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl animate-pulse">
                <div className="h-6 bg-gradient-to-r from-green-200 to-green-300 rounded-lg mb-4"></div>
                <div className="h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
            <span className="text-green-700 font-medium">Setting up your personalized dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const SHEET_SIDES = ["right"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Enhanced Navbar */}
      <nav className="px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-md shadow-2xl border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <Link href={"/"}>
            <h1 className="text-2xl font-extrabold text-3xl text-white">
              OG<span className="text-green-400">nite</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link href={`/dashboard/${username}/courses`}>
            <button className="relative px-4 py-2 text-green-400 font-medium hover:text-green-300 transition-all duration-300 group">
              <span className="relative z-10">Courses</span>
              <div className="absolute inset-0 bg-green-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </button>
          </Link>
          <Link href={`/dashboard/${username}/internships`}>
            <button className="relative px-4 py-2 text-green-400 font-medium hover:text-green-300 transition-all duration-300 group">
              <span className="relative z-10">Internships</span>
              <div className="absolute inset-0 bg-green-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </button>
          </Link>
          <Link href={`/dashboard/${username}/notifications`}>
            <button className="relative p-3 text-green-100 hover:text-green-300 transition-all duration-300 group">
              <div className="absolute flex size-2 top-1 right-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
              </div>
              <Bell className="w-5 h-5" />
              <div className="absolute inset-0 bg-green-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </button>
          </Link>

          <div>
            {SHEET_SIDES.map((side) => (
              <Sheet key={side}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className=" border-green-400 bg-transparent hover:bg-transparent transition-all duration-300 shadow-lg hover:shadow-xl p-1"
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold">
                        {firstName?.[0] || username?.[0] || 'U'}
                      </div>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-gradient-to-br  from-white via-green-50 to-green-100 border-l-2 border-green-200 w-[350px] rounded-l-3xl">
                  <SheetHeader className="border-b border-green-200 pb-6 mb-6">
                    <div className="flex items-center space-x-4">
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-4 border-green-300 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {firstName?.[0] || username?.[0] || 'U'}
                        </div>
                      )}
                      <div>
                        <SheetTitle className="text-gray-800 text-xl">
                          Hello, <span className="text-green-600 font-bold">{firstName || username}</span>
                        </SheetTitle>
                        <SheetDescription className="text-green-600 font-semibold">
                          <span className="text-gray-600">Aspiring</span> {title || 'Professional'}
                        </SheetDescription>
                        <SheetDescription className="text-gray-500 text-sm">
                          {email}
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>
                  
                  <div className="space-y-3">
                    {[
                      { href: "/", label: "Home" },
                      { href: `/dashboard/${username}/profile`, label: "Edit Profile"},
                      { href: `/dashboard/${username}/applications`, label: "My Applications"},
                      { href: `/dashboard/${username}/resume-analysis`, label: "Analyze Resume"},
                      { href: `/dashboard/${username}/settings`, label: "Settings"},
                      { href: `/dashboard/${username}/safety-tips`, label: "Safety Tips"},
                    ].map((item, index) => (
                      <Link key={index} href={item.href}>
                        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-green-200/50 transition-all duration-300 cursor-pointer group">
                          <span className="text-gray-700 font-medium group-hover:text-green-700">{item.label}</span>
                        </div>
                      </Link>
                    ))}
                    
                    <div 
                      onClick={handleLogoutWithConfirmation}
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-100 transition-all duration-300 cursor-pointer group mt-6 border-t border-green-200 pt-6"
                    >
                      <span className="text-gray-700 font-medium group-hover:text-red-600">Logout</span>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="px-8 pt-12 pb-8">
        <div className="text-left mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-green-700 bg-clip-text text-transparent mb-4">
            Welcome back, {firstName || username}!
          </h1>
          <p className="text-md text-left text-gray-600 max-w-2xl">
            Your personalized career dashboard is ready. Explore opportunities, enhance skills, and accelerate your growth.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Resume Score Card */}
          <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            {profileLoading ? (
              <ProfileSkeleton />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">{resumeScore}%</p>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Resume Score</h3>
                <p className="text-gray-600">Based on skill match with job requirements</p>
                <div className="mt-4 w-full bg-green-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full w-[80%] transition-all duration-1000"></div>
                </div>
              </>
            )}
          </div>

          {/* Applications Card */}
          <div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">{NumberOfApplications}</p>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Active Applications</h3>
            <p className="text-gray-600">Applications submitted this month</p>
            <Link href={`/dashboard/${username}/applications`}>
              <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 group">
                <span>View All</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

        {/* Profile Strength Card */}
<div className="bg-white/70 backdrop-blur-sm border border-green-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group">
  <div className="flex items-center justify-between mb-4">
    <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
      <Award className="w-8 h-8 text-purple-600" />
    </div>
    <div className="text-right">
      <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
        {profileLoading ? '...' : `${profileScore}%`}
      </p>
    </div>
  </div>
  <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Strength</h3>
  <p className="text-gray-600 mb-4">Based on profile quality and job market relevance</p>
  
  {/* Progress Bar */}
  <div className="mb-4 w-full bg-purple-100 rounded-full h-3">
    <div 
      className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000"
      style={{ width: `${profileScore}%` }}
    ></div>
  </div>
  
  {/* Top Suggestions */}
  {!profileLoading && profileSuggestions.length > 0 && (
    <div className="mb-4">
      <p className="text-sm text-gray-700 font-medium mb-2">
        Top improvements for stronger profile:
      </p>
      <div className="space-y-1">
        {profileSuggestions.slice(0, 2).map((suggestion, index) => (
          <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
            <span className="text-purple-500 font-bold">•</span>
            <span>{suggestion.suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  )}
  
  <Link href={`/dashboard/${username}/profile`}>
    <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-full text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-1">
      <span>Enhance Profile</span>
      <TrendingUp className="w-4 h-4" />
    </button>
  </Link>
</div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Matched Jobs Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <span>Top Matched Opportunities</span>
              </h2>
              {!jobsLoading && matchedJobs.length > 0 && (
                <Link href={`/dashboard/${username}/internships`}>
                  <button className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1 group">
                    <span>View All</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              )}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {jobsLoading ? (
                <JobSkeleton />
              ) : matchedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-12 h-12 text-green-600" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium mb-2">No matched jobs found yet</p>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Complete your profile and add more skills to get personalized job recommendations
                  </p>
                  <Link href={`/dashboard/${username}/profile`}>
                    <button className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                      Complete Profile
                    </button>
                  </Link>
                </div>
              ) : (
                matchedJobs.map((job, index) => (
                  <div key={job.id || index} className="group bg-gradient-to-r from-white to-green-50 border border-green-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg mb-1 group-hover:text-green-700 transition-colors">
                          {job.job_title || job.jobTitle || job.title || 'Job Title Not Available'}
                        </h3>
                        <p className="text-gray-600 flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.company_name || job.company || 'Company Not Specified'}</span>
                        </p>
                      </div>
                      {(job.match_score || job.compatibility_score || job.score) && (
                        <div className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{Math.round((job.match_score || job.compatibility_score || job.score) * 100)}% Match</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{job.salary || job.salary_from || job.salary_range || "Negotiable"}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        {job.job_category || job.category || job.job_type || "Full-time"}
                      </div>
                    </div>
                    
                    {job.description && (
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {job.description.length > 120 
                          ? `${job.description.substring(0, 120)}...` 
                          : job.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Posted 2 days ago</span>
                      </div>
                      <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg">
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Professional Details Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Career Insights</h2>
            </div>

            {profileLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                <div className="h-6 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg"></div>
                <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Professional Title</h3>
                  <p className="text-lg text-blue-700 font-medium">{title || 'Add your professional title'}</p>
                </div>



                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-gray-800">Profile Completeness</h3>
    <span className="text-purple-700 font-semibold text-lg">
      {profileLoading ? '...' : `${profileCompleteness}%`}
    </span>
  </div>
  
  <div className="flex items-center space-x-3 mb-4">
    <div className="flex-1 bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-1000"
        style={{ width: `${profileCompleteness}%` }}
      ></div>
    </div>
  </div>
  
  <p className="text-sm text-gray-600 mb-3">
    {profileCompleteness >= 90 
      ? "Excellent! Your profile is nearly complete." 
      : profileCompleteness >= 70 
      ? "Good progress! A few more details will boost your visibility." 
      : profileCompleteness >= 50 
      ? "You're halfway there! Keep adding details to improve your chances." 
      : "Let's build your profile! Adding more information will help recruiters find you."
    }
  </p>
  
  {!profileLoading && profileSuggestions.length > 0 && profileCompleteness < 100 && (
    <div className="space-y-2">
      <p className="text-sm text-gray-700 font-medium">Missing information:</p>
      {profileSuggestions.slice(0, 3).map((suggestion, index) => (
        <div key={index} className="bg-white border border-purple-200 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-700 font-medium">{suggestion.field}</span>
            <span className="text-xs text-gray-500">+{suggestion.completenessWeight}%</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{suggestion.suggestion}</p>
        </div>
      ))}
      
      <Link href={`/dashboard/${username}/profile`}>
        <button className="w-full mt-2 bg-purple-500 text-white py-2 px-4 rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors">
          Complete Profile
        </button>
      </Link>
    </div>
  )}
  
  {profileCompleteness === 100 && (
    <div className="text-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
      <p className="text-green-700 font-semibold text-sm">🎉 Profile 100% Complete!</p>
      <p className="text-green-600 text-xs mt-1">You're maximizing your job opportunities</p>
    </div>
  )}
</div>
              </div>
            )}
          </div>
        </div>

        {/* Learning Resources Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                <Play className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Learning Resources for {title || 'Your Career'}
              </h2>
            </div>
            <Link href={`/dashboard/${username}/courses`}>
              <button className="text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1 group">
                <span>Explore All</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <VideoSkeleton key={i} />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-12 h-12 text-orange-600" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">No learning resources available</p>
              <p className="text-gray-400 text-sm">
                Complete your profile to get personalized learning recommendations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <a
                  key={index}
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02]"
                >
                  <div className="relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3">
                        <Play className="w-8 h-8 text-gray-800" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Video Course</span>
                      </div>
                      <div className="flex items-center space-x-1 text-orange-600 text-xs font-medium">
                        <span>Watch Now</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;