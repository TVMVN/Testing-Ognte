'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { 
  Search, Users, Briefcase, Award, TrendingUp, Activity, Building2,
  Bell, ChevronDown, BarChart3, Eye, Mail, Settings, X, Menu
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'

// Enhanced Error Handler
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
    // You can replace this with your preferred toast notification system
    alert(`${context}: ${message}`);
  }
};

const UniversityDashboard = () => {
  const { shortUniName } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // API Data States
  const [dashboardStats, setDashboardStats] = useState(null)
  const [studentProgress, setStudentProgress] = useState(null)
  const [activityData, setActivityData] = useState(null)
  const [notificationCount, setNotificationCount] = useState(0)

  
  // University Profile States
  const [universityName, setUniversityName] = useState('')
  const [email, setEmail] = useState('')
  const [profilePic, setProfilePic] = useState(null)
  const BACKEND_URL = "http://localhost:8000"

  // Token management functions
  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

    const handleLogoutWithConfirmation = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      clearTokens();
      router.push('/login');
    }
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
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

  // Enhanced API request function
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
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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

  // Fetch all dashboard data with authentication
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check if user is authenticated
        const token = getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch dashboard stats
        const statsResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/dashboard/stats/`)
        if (statsResponse && statsResponse.ok) {
          const statsData = await statsResponse.json()
          setDashboardStats(statsData)
        } else if (statsResponse) {
          throw new Error('Failed to fetch dashboard stats')
        } else {
          return; // Authentication failed, already handled
        }

        // Fetch student progress
        const progressResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/student-progress/`)
        if (progressResponse && progressResponse.ok) {
          const progressData = await progressResponse.json()
          setStudentProgress(progressData)
        } else {
          console.warn('Student progress data not available')
        }

        // Fetch student activity overview
        const activityResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/student-overview/student_activity_dashboard/`)
        if (activityResponse && activityResponse.ok) {
          const activityApiData = await activityResponse.json()
          setActivityData(activityApiData)
        } else {
          console.warn('Activity data not available')
        }

        // Fetch university profile
        const profileResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/profile/`)
        if (profileResponse && profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUniversityName(profileData.name || 'University Dashboard')
          setEmail(profileData.email || '')
          setProfilePic(profileData.profile_pic)
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        ErrorHandler.showErrorToast(err, 'Fetching dashboard data')
        setError('Unable to load dashboard data. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  // Mock university profile for demo (fallback)
  useEffect(() => {
    if (!universityName) {
      setUniversityName('University of Lagos')
      setEmail('admin@unilag.edu.ng')
    }
  }, [universityName])

  // Prepare chart data
  const preparePieChartData = () => {
    if (!dashboardStats) return []
    
    return [
      { 
        name: 'Accepted Applications', 
        value: dashboardStats.accepted_applications || 0,
        color: '#16a34a'
      },
      { 
        name: 'Rejected Applications', 
        value: dashboardStats.rejected_applications || 0,
        color: '#dc2626'
      },
      { 
        name: 'Pending Applications', 
        value: (dashboardStats.total_applications || 0) - (dashboardStats.accepted_applications || 0) - (dashboardStats.rejected_applications || 0),
        color: '#f59e0b'
      }
    ]
  }

  const prepareIndustryData = () => {
    if (!dashboardStats?.top_industries) return []
    
    return dashboardStats.top_industries.map((industry, index) => ({
      name: industry.job_post__industry || `Industry ${index + 1}`,
      value: industry.count || 0,
      color: `hsl(${120 + index * 30}, 60%, 50%)`
    }))
  }

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const SHEET_SIDES= "right"

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Retry
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="border-red-300 hover:bg-red-50 text-red-700"
            >
              Login Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const pieData = preparePieChartData()
  const industryData = prepareIndustryData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Navigation Bar */}
      <nav className="px-4 sm:px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-200 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              OG<span className="text-black">nite</span>
            </h1>
          </Link>
          <div className="hidden sm:block w-px h-8 bg-emerald-200"></div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-700">University Dashboard</h2>
          </div>
        </div>
        
             <div className="hidden lg:flex items-center space-x-6">
          <div className="flex items-center space-x-2 border border-emerald-200 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search..."
              className="outline-none text-slate-700 text-sm bg-transparent w-32 placeholder:text-slate-400"
            />
          </div>
          <Link href={`/dashboard/university/${shortUniName}/student-activity`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </Button>
          </Link>
          <Link href={`/dashboard/university/${shortUniName}/employer-engagement`}>
            <Button variant="outline" className="border-emerald-300 hover:bg-emerald-50 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employers
            </Button>
          </Link>
          <Link href={`/dashboard/university/${shortUniName}/notifications`}>
            <Button variant="outline" className="border-emerald-300 hover:bg-emerald-50 relative">
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Profile Menu - Fixed */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-gradient-to-r from-green-500 to-green-600 border-green-400 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl p-1"
              >
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold">
                    {universityName?.charAt(0) || 'U'}
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
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-4 border-green-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {universityName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-gray-800 text-xl">
                      {universityName}
                    </SheetTitle>
                    <SheetDescription className="text-green-600 font-semibold">
                      University Dashboard
                    </SheetDescription>
                    <SheetDescription className="text-gray-500 text-sm">
                      {email}
                    </SheetDescription>
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
                    href: `/dashboard/university/${shortUniName}/profile`, 
                    label: "Edit Profile",
                    icon: <Users className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/university/${shortUniName}/settings`, 
                    label: "Settings",
                    icon: <Settings className="w-4 h-4" />
                  },
                  { 
                    href: `/dashboard/university/${shortUniName}/notifications`, 
                    label: "Notifications",
                    icon: <Bell className="w-4 h-4" />
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

                {/* Mobile Menu - Hamburger Style */}
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
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {universityName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-left">{universityName || 'University Dashboard'}</SheetTitle>
                    <SheetDescription className="text-left">{email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="space-y-2 mt-6">
                <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Home</span>
                </Link>
                <Link href={`/dashboard/university/${shortUniName}/student-activity`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Student Activity</span>
                </Link>
                <Link href={`/dashboard/university/${shortUniName}/employer-engagement`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <span>Employer Engagement</span>
                </Link>
                <Link href={`/dashboard/university/${shortUniName}/profile`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Profile</span>
                </Link>
                <Link href={`/dashboard/university/${shortUniName}/settings`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>Settings</span>
                </Link>
                <Link href={`/dashboard/university/${shortUniName}/notifications`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors relative">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <span>Notifications</span>
                  {notificationCount > 0 && (
                    <span className="absolute right-3 top-3 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </Link>
                <button 
                  onClick={handleLogout}
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

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-slate-600">
            Here's what's happening at {universityName} today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Candidates</p>
                  <p className="text-3xl font-bold">{dashboardStats?.total_candidates || 0}</p>
                  <p className="text-emerald-200 text-xs mt-1">Registered students</p>
                </div>
                <Users className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Applications</p>
                  <p className="text-3xl font-bold">{dashboardStats?.total_applications || 0}</p>
                  <p className="text-green-200 text-xs mt-1">Total submitted</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">
                    {dashboardStats ? `${Math.round((dashboardStats.accepted_applications / Math.max(dashboardStats.total_applications, 1)) * 100) || 0}%` : '0%'}
                  </p>
                  <p className="text-teal-200 text-xs mt-1">Applications accepted</p>
                </div>
                <Award className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Match Score</p>
                  <p className="text-3xl font-bold">
                    {dashboardStats ? `${Math.round((dashboardStats.average_match_score || 0) * 100)}%` : '0%'}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">Average compatibility</p>
                </div>
                <Activity className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Application Status Chart */}
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Application Status
              </CardTitle>
              <CardDescription>
                Current application breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm text-slate-600">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Industries Chart */}
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Top Industries
              </CardTitle>
              <CardDescription>
                Most popular job sectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Progress Overview */}
        {studentProgress && (
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Student Progress Overview
                  </CardTitle>
                  <CardDescription>
                    Current student statistics and performance
                  </CardDescription>
                </div>
                <Link href={`/dashboard/university/${shortUniName}/student-activity`}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {studentProgress.summary.total_students_visible}
                  </div>
                  <div className="text-sm text-slate-600">Total Students</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {studentProgress.summary.accepted_jobs}
                  </div>
                  <div className="text-sm text-slate-600">Jobs Accepted</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  <div className="text-2xl font-bold text-teal-600 mb-1">
                    {studentProgress.summary.with_resume}
                  </div>
                  <div className="text-sm text-slate-600">With Resume</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {studentProgress.summary.still_seeking_jobs}
                  </div>
                  <div className="text-sm text-slate-600">Still Seeking</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Summary */}
        {activityData && (
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Performance Summary
              </CardTitle>
              <CardDescription>
                Student achievement breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {activityData.summary.top_performers}
                  </div>
                  <div className="text-lg font-semibold text-slate-700 mb-1">Top Performers</div>
                  <div className="text-sm text-slate-600">Excellent progress</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {activityData.summary.average_performers}
                  </div>
                  <div className="text-lg font-semibold text-slate-700 mb-1">Average Performers</div>
                  <div className="text-sm text-slate-600">Steady progress</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl border border-amber-200">
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    {activityData.summary.needs_support}
                  </div>
                  <div className="text-lg font-semibold text-slate-700 mb-1">Need Support</div>
                  <div className="text-sm text-slate-600">Require assistance</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-800">Overall Success Rate</div>
                    <div className="text-sm text-slate-600">
                      {activityData.summary.success_rate} of students have been successfully placed
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {activityData.summary.success_rate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default UniversityDashboard