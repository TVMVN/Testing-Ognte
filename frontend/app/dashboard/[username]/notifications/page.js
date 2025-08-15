"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { 
  BellIcon, 
  ArrowLeft, 
  Building2, 
  Search, 
  Users, 
  Briefcase, 
  Settings, 
  X, 
  Menu,
  CheckCircle,
  Circle,
  GraduationCap
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ✅ Enable relative time
dayjs.extend(relativeTime);

const NotificationPage = () => {
  const params = useParams();
  const router = useRouter();
  const username = params.username || "default";
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "1";
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allRead, setAllRead] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Candidate profile states - Updated to match API structure
  const [candidateData, setCandidateData] = useState(null);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [universityName, setUniversityName] = useState('');
  const [city, setCity] = useState('');
  const [shortUsername, setShortUsername] = useState('');
  
  const BACKEND_URL = 'http://localhost:8000'; 

  // Error handler
  const ErrorHandler = {
    showErrorToast: (error, context) => {
      let message = 'An unexpected error occurred';
      
      if (error?.response?.status) {
        switch (error.response.status) {
          case 401:
            message = 'Authentication failed. Please log in again.';
            break;
          case 403:
            message = 'You do not have permission to access this resource.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          default:
            message = `Error ${error.response.status}: Unable to complete request.`;
        }
      } else if (error?.name === 'AbortError') {
        message = 'Request timed out. Please check your connection.';
      } else if (error?.message) {
        message = error.message;
      }
      
      console.error(`${context}:`, error);
      alert(`${context}: ${message}`);
    }
  };

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

  const handleLogoutWithConfirmation = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      clearTokens();
      router.push('/login');
    }
  };

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      ErrorHandler.showErrorToast(
        { response: { status: 401 } }, 
        'Token refresh - no refresh token'
      );
      clearTokens();
      router.push('/login');
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access);
        }
        return data.access;
      } else {
        throw { response: { status: res.status } };
      }
    } catch (error) {
      ErrorHandler.showErrorToast(error, 'Token refresh');
      clearTokens();
      router.push('/login');
      return null;
    }
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      ErrorHandler.showErrorToast(
        { response: { status: 401 } }, 
        'No authentication token'
      );
      router.push('/login');
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        
        if (token) {
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
          
          response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              Authorization: `Bearer ${token}`,
            },
            signal: retryController.signal,
          });
          
          clearTimeout(retryTimeoutId);
        } else {
          return null;
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Generate short username for routing
  const generateShortUsername = (username) => {
    if (!username) return '';
    return username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
  };

  // Fetch notifications and candidate profile
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch candidate profile
      const profileResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/profile/`);
      if (profileResponse && profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Candidate profile data received:', profileData);
        
        // Set profile data correctly based on the provided API response structure
        setCandidateData(profileData);
        setUserFirstName(profileData.user?.first_name || '');
        setUserLastName(profileData.user?.last_name || '');
        setEmail(profileData.user?.email || '');
        setProfilePicture(profileData.profile_picture);
        setUniversityName(profileData.university_name || '');
        setCity(profileData.city || '');
        setShortUsername(generateShortUsername(profileData.user?.username || username));
      } else {
        console.warn('Failed to fetch candidate profile data');
        // Set fallback values
        setUserFirstName('Candidate');
        setUserLastName('User');
        setEmail('candidate@example.com');
        setShortUsername(generateShortUsername(username));
      }

      // Fetch notifications
      const notificationResponse = await makeAuthenticatedRequest(
        `${BACKEND_URL}/api/auth/notifications/`,
        { method: 'GET' }
      );
      
      if (!notificationResponse) {
        return;
      }
      
      if (!notificationResponse.ok) {
        throw new Error(`Failed to fetch notifications: ${notificationResponse.status}`);
      }
      
      const notificationData = await notificationResponse.json();
      console.log('Notifications received:', notificationData);
      
      let notificationArray = [];
      
      // Handle different response formats
      if (Array.isArray(notificationData)) {
        notificationArray = notificationData;
      } else if (notificationData.results && Array.isArray(notificationData.results)) {
        notificationArray = notificationData.results;
      } else if (notificationData.notifications && Array.isArray(notificationData.notifications)) {
        notificationArray = notificationData.notifications;
      } else if (notificationData.data && Array.isArray(notificationData.data)) {
        notificationArray = notificationData.data;
      } else {
        console.warn("Unexpected notification data format:", notificationData);
        notificationArray = [];
      }
      
      // Transform notifications to consistent format
      const transformedNotifications = notificationArray.map(notification => ({
        id: notification.id || Math.random().toString(36).substr(2, 9),
        title: notification.title || notification.subject || notification.name || 'Notification',
        description: notification.message || notification.description || notification.body || notification.content || 'No description',
        read: notification.read || notification.is_read || notification.read_status || false,
        createdAt: notification.created_at || notification.createdAt || notification.timestamp || notification.date_created || new Date().toISOString(),
        type: notification.type || notification.notification_type || notification.category || 'general',
        priority: notification.priority || 'normal',
        ...notification
      }));
      
      // Sort by creation date (newest first)
      transformedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(transformedNotifications);
      setFilteredNotifications(transformedNotifications);
      setAllRead(transformedNotifications.every(n => n.read));
      
    } catch (err) {
      console.error("Error fetching data:", err);
      ErrorHandler.showErrorToast(err, 'Fetching data');
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredNotifications(notifications);
      return;
    }
    
    const filtered = notifications.filter(notification => 
      notification.title.toLowerCase().includes(query.toLowerCase()) ||
      notification.description.toLowerCase().includes(query.toLowerCase()) ||
      notification.type.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredNotifications(filtered);
  };

  // Effect to handle search when notifications change
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredNotifications(notifications);
    }
  }, [notifications, searchQuery]);

  const toggleReadStatus = async () => {
    const newReadStatus = !allRead;
    setAllRead(newReadStatus);
    
    const updated = notifications.map((n) => ({ ...n, read: newReadStatus }));
    setNotifications(updated);
    
    try {
      const response = await makeAuthenticatedRequest(
        `${BACKEND_URL}/api/auth/notifications/read-all/`,
        {
          method: 'POST',
          body: JSON.stringify({ read: newReadStatus })
        }
      );
      
      if (!response || !response.ok) {
        console.warn('Failed to update notification status on server');
        // Revert on failure
        setAllRead(!newReadStatus);
        const revertedNotifications = notifications.map((n) => ({ ...n, read: !newReadStatus }));
        setNotifications(revertedNotifications);
      }
    } catch (err) {
      console.error('Error updating notification status:', err);
      // Revert on error
      setAllRead(!newReadStatus);
      const revertedNotifications = notifications.map((n) => ({ ...n, read: !newReadStatus }));
      setNotifications(revertedNotifications);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Optimistically update UI
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      const response = await makeAuthenticatedRequest(
        `${BACKEND_URL}/api/auth/notifications/${notificationId}/read/`,
        { method: 'POST' }
      );
      
      if (!response || !response.ok) {
        console.warn('Failed to mark notification as read on server');
        // Could revert here if needed
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Display name for the user/candidate
  const displayName = userFirstName && userLastName 
    ? `${userFirstName} ${userLastName}` 
    : 'Candidate Dashboard';

  // Get profile initial
  const profileInitial = userFirstName ? userFirstName.charAt(0).toUpperCase() : 
                        candidateData?.user?.username?.charAt(0).toUpperCase() || 'C';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 text-lg">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Navigation Bar */}
      <nav className="px-4 sm:px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-200 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-3xl font-extrabold sm:text-2xl text-black">
              OG<span className="text-green-400">nite</span>
            </h1>
          </Link>
          <div className="hidden sm:block w-px h-8 bg-emerald-200"></div>
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-700">Notifications</h2>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center space-x-6">
          <div className="flex items-center space-x-2 border border-emerald-200 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="outline-none text-slate-700 text-sm bg-transparent w-40 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Back to Dashboard Button */}
          <Link href={`/dashboard/${shortUsername || username}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>

          {/* Profile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="border-green-400 transition-all duration-300 shadow-lg hover:shadow-xl p-1"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold">
                    {profileInitial}
                  </div>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right"
              className="bg-gradient-to-br from-white via-green-50 to-green-100 border-l-2 border-green-200 w-[350px] rounded-l-3xl"
            >
              <SheetHeader className="border-b border-green-200 pb-6 mb-6">
                <div className="flex items-center space-x-4">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-4 border-green-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {profileInitial}
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-gray-800 text-xl">
                      {displayName}
                    </SheetTitle>
                    <SheetDescription className="text-green-600 font-semibold">
                      {candidateData?.professional_title || 'Candidate Dashboard'}
                    </SheetDescription>
                    <SheetDescription className="text-gray-500 text-sm">
                      {email}
                    </SheetDescription>
                    {/* {universityName && (
                      <SheetDescription className="text-gray-500 text-xs">
                        {universityName}
                      </SheetDescription>
                    )}
                    {city && (
                      <SheetDescription className="text-gray-500 text-xs">
                        {city}
                      </SheetDescription>
                    )} */}
                  </div>
                </div>
              </SheetHeader>
              
              <div className="space-y-3">
                {[
                  { 
                    href: "/", 
                    label: "Home",
                    icon: <Building2 className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}`, 
                    label: "Dashboard",
                    icon: <Building2 className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/applications`, 
                    label: "My Applications",
                    icon: <Briefcase className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/courses`, 
                    label: "Courses",
                    icon: <GraduationCap className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/internships`, 
                    label: "Internships",
                    icon: <Briefcase className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/profile`, 
                    label: "Edit Profile",
                    icon: <Users className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/resume-analysis`, 
                    label: "Resume Analysis",
                    icon: <Users className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/safety-tips`, 
                    label: "Safety Tips",
                    icon: <Users className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/${shortUsername || username}/settings`, 
                    label: "Settings",
                    icon: <Settings className="w-4 h-4" />
                  },
                ].map((item, index) => (
                  <Link key={index} href={item.href}>
                    <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-green-200/50 transition-all duration-300 cursor-pointer group">
                      <span className="text-green-600 group-hover:text-green-700">
                        {item.icon}
                      </span>
                      <span className="text-gray-700 font-medium group-hover:text-green-700">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
                
                <div 
                  onClick={handleLogoutWithConfirmation}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-100 transition-all duration-300 cursor-pointer group mt-6 border-t border-green-200 pt-6"
                >
                  <span className="text-red-600 group-hover:text-red-700">
                    <X className="w-4 h-4" />
                  </span>
                  <span className="text-gray-700 font-medium group-hover:text-red-600">
                    Logout
                  </span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-emerald-300 hover:bg-emerald-50">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[350px] bg-gradient-to-br from-white via-emerald-50 to-green-50"
            >
              <SheetHeader className="pb-6 border-b border-emerald-200">
                <div className="flex items-center space-x-3">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {profileInitial}
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-left">{displayName}</SheetTitle>
                    <SheetDescription className="text-left">{email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="space-y-2 mt-6">
                {/* Mobile Search */}
                <div className="flex items-center space-x-2 border border-emerald-200 rounded-lg px-3 py-2 bg-white/60 backdrop-blur-sm mb-4">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="outline-none text-slate-700 text-sm bg-transparent flex-1 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Home</span>
                </Link>
                <Link href={`/dashboard/${shortUsername || username}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-emerald-600" />
                  <span>Back to Dashboard</span>
                </Link>
                <Link href={`/dashboard/${shortUsername || username}/applications`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <span>My Applications</span>
                </Link>
                <Link href={`/dashboard/${shortUsername || username}/courses`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <span>Courses</span>
                </Link>
                <Link href={`/dashboard/${shortUsername || username}/internships`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <span>Internships</span>
                </Link>
                <Link href={`/dashboard/${shortUsername || username}/profile`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Profile</span>
                </Link>
                <Link href={`/dashboard/${shortUsername || username}/settings`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>Settings</span>
                </Link>
                <button 
                  onClick={handleLogoutWithConfirmation}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-red-700 w-full text-left border-t border-emerald-200 mt-4 pt-4"
                >
                  <X className="w-5 h-5 text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <BellIcon className="w-8 h-8 text-emerald-500" />
              <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
            </div>
          </div>
          <p className="text-slate-600">
            Stay up to date with your latest activities and announcements
          </p>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4 p-4 bg-white/50 backdrop-blur-sm border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Found <span className="font-semibold text-emerald-600">{filteredNotifications.length}</span> result{filteredNotifications.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              </div>
              <button
                onClick={() => handleSearch('')}
                className="text-emerald-600 hover:text-emerald-800 transition-colors text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        {filteredNotifications.length > 0 && (
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {filteredNotifications.filter(n => !n.read).length} unread of {filteredNotifications.length} {searchQuery ? 'filtered' : 'total'} notifications
            </div>
            <Button
              onClick={toggleReadStatus}
              variant="outline"
              className="border-emerald-300 hover:bg-emerald-50 text-emerald-700"
            >
              {allRead ? (
                <>
                  <Circle className="w-4 h-4 mr-2" />
                  Mark all as Unread
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark all as Read
                </>
              )}
            </Button>
          </div>
        )}

        {/* Notifications Content */}
        {filteredNotifications.length === 0 && searchQuery ? (
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200">
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
              <CardTitle className="text-xl text-slate-700 mb-2">No notifications found</CardTitle>
              <CardDescription className="text-slate-500 mb-4">
                We couldn't find any notifications matching "{searchQuery}". Try adjusting your search terms.
              </CardDescription>
              <Button 
                onClick={() => handleSearch('')}
                variant="outline" 
                className="border-emerald-300 hover:bg-emerald-50 text-emerald-700"
              >
                Clear search
              </Button>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200">
            <CardContent className="text-center py-12">
              <BellIcon className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
              <CardTitle className="text-xl text-slate-700 mb-2">No notifications yet</CardTitle>
              <CardDescription className="text-slate-500">
                You'll see notifications here when there are updates for your account.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotifications.map((note) => (
              <Card
                key={note.id}
                onClick={() => !note.read && markAsRead(note.id)}
                className={`transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  note.read
                    ? "bg-white/50 backdrop-blur-sm border-gray-200"
                    : "bg-white/80 backdrop-blur-sm border-emerald-300 shadow-md"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className={`text-lg ${
                      note.read ? "text-gray-600" : "text-emerald-700"
                    }`}>
                      {searchQuery ? (
                        <span dangerouslySetInnerHTML={{
                          __html: note.title.replace(
                            new RegExp(`(${searchQuery})`, 'gi'),
                            '<mark class="bg-emerald-200 text-emerald-800 px-1 rounded">$1</mark>'
                          )
                        }} />
                      ) : (
                        note.title
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!note.read && (
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      )}
                      {note.type && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          note.type === 'urgent' || note.priority === 'high' ? 'bg-red-100 text-red-700' :
                          note.type === 'important' || note.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          note.type === 'info' || note.type === 'announcement' ? 'bg-blue-100 text-blue-700' :
                          note.type === 'academic' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className={`text-sm mb-3 line-clamp-3 ${
                    note.read ? "text-gray-500" : "text-slate-600"
                  }`}>
                    {searchQuery ? (
                      <span dangerouslySetInnerHTML={{
                        __html: note.description.replace(
                          new RegExp(`(${searchQuery})`, 'gi'),
                          '<mark class="bg-emerald-200 text-emerald-800 px-1 rounded">$1</mark>'
                        )
                      }} />
                    ) : (
                      note.description
                    )}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-emerald-600 font-medium">
                      {dayjs(note.createdAt).fromNow()}
                    </div>
                    {note.priority && note.priority !== 'normal' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        note.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-200' :
                        note.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {note.priority} priority
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;