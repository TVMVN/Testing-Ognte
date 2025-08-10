'use client';
import * as React from "react"
import { TrendingUp, Users, Briefcase, Award, BarChart3, Activity } from "lucide-react"
import { Label, Pie, PieChart, Bar, BarChart, ResponsiveContainer } from "recharts"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
import TopPerforming from "@/components/TopPerforming";

// Updated chart config with more subtle greens
const chartConfig = {
  employed: {
    label: "Employed",
    color: "#16a34a", // More muted green
  },
  seeking: {
    label: "Seeking",
    color: "#22c55e", // Softer green
  },
  zeroResumeScore: {
    label: "Zero Resume Score",
    color: "#15803d", // Deeper muted green
  },
  zeroProfileScore: {
    label: "Zero Profile Score",
    color: "#166534", // Dark muted green
  },
  desktop: {
    label: "Engagement",
    color: "#16a34a",
  },
  mobile: {
    label: "Engagement",
    color: "#22c55e",
  },
}

const StudentDashboard = () => {
  const [pieChartData, setPieChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [studentProgressData, setStudentProgressData] = useState(null);
  const [engagementData, setEngagementData] = useState([]);
  const BACKEND_URL = 'http://localhost:8000'; 
  const { shortUniName } = useParams();
  const [profilePic, setProfilePic] = useState(null);
  const [email, setEmail] = useState(null);
  const [universityName, setUniversityName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [site, setSite] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [form, setForm] = useState({ employer: '' });
  const [username, setUsername] = useState(shortUniName);
  
  const router = useRouter();

  // Token management functions (keeping existing logic)
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

  const ErrorHandler = {
    showErrorToast: (error, context) => {
      console.error(`${context}:`, error);
    }
  };

  const handleLogoutWithConfirmation = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
      const token = getAccessToken();
      clearTokens();
      
      if (token) {
        fetch(`${BACKEND_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(err => console.error('Background logout error:', err));
      }
      
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      ErrorHandler.showErrorToast({ response: { status: 401 } }, 'Token refresh - no refresh token');
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
      ErrorHandler.showErrorToast({ response: { status: 401 } }, 'No authentication token');
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

  // Demo API fallback data
  const getDemoData = () => ({
    dashboardStats: {
      total_applications: 147,
      accepted_applications: 89,
      rejected_applications: 23,
      pending_applications: 35,
      total_candidates: 290,
      average_match_score: 0.78,
      total_jobs: 145,
      active_jobs: 67
    },
    industryData: [
      { industry: "Technology", jobs: 45, color: "#16a34a" },
      { industry: "Healthcare", jobs: 32, color: "#15803d" },
      { industry: "Finance", jobs: 28, color: "#22c55e" },
      { industry: "Education", jobs: 22, color: "#65a30d" },
      { industry: "Marketing", jobs: 18, color: "#166534" },
    ],
    engagementData: [
      { month: 'Jan', engagement: 65, applications: 28 },
      { month: 'Feb', engagement: 72, applications: 32 },
      { month: 'Mar', engagement: 68, applications: 35 },
      { month: 'Apr', engagement: 85, applications: 42 },
      { month: 'May', engagement: 91, applications: 48 },
      { month: 'Jun', engagement: 88, applications: 45 },
      { month: 'Jul', engagement: 95, applications: 52 },
      { month: 'Aug', engagement: 102, applications: 58 },
      { month: 'Sep', engagement: 88, applications: 51 },
      { month: 'Oct', engagement: 76, applications: 44 },
      { month: 'Nov', engagement: 82, applications: 39 },
      { month: 'Dec', engagement: 79, applications: 41 },
    ],
    studentProgress: {
      topPerformers: [
        { id: 1, name: "Sarah Johnson", score: 95, applications: 12, hired: true },
        { id: 2, name: "Michael Chen", score: 91, applications: 8, hired: true },
        { id: 3, name: "Emily Davis", score: 88, applications: 15, hired: false },
        { id: 4, name: "David Wilson", score: 85, applications: 6, hired: true },
        { id: 5, name: "Lisa Anderson", score: 83, applications: 9, hired: false },
      ],
      totalStudents: 290,
      activeStudents: 245,
      graduatedStudents: 45
    }
  });

  // University data fetching (keeping existing logic)
  useEffect(() => {
    if (!shortUniName) {
      setLoading(false);
      return;
    }

    const fetchUniversityData = async () => {
      setLoading(true);
      
      try {
        const token = getAccessToken();
        let response;
        
        if (token) {
          response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/profile/`, { method: 'GET' });
        }
        
        if (!response || !response.ok) {
          console.log('Trying public endpoint...');
          response = await fetch(`${BACKEND_URL}/api/universities/profile`);
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch university data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('University data received:', data);
        
        let universityData = null;
        
        if (Array.isArray(data)) {
          universityData = data.find((uni) => {
            const uniUsername = uni?.user?.username?.toLowerCase();
            const uniName = uni?.name?.toLowerCase();
            const searchName = shortUniName.toLowerCase();
            
            return uniUsername === searchName || 
                   uniName === searchName ||
                   uniName?.includes(searchName) ||
                   searchName.includes(uniName);
          });
        } else if (data.user) {
          universityData = data;
        }
        
        if (universityData) {
          console.log('Matched university:', universityData);
          setProfilePic(universityData.logo);
          setEmail(universityData.user?.email || universityData.email);
          setUniversityName(universityData.name || universityData.company_name);
          setSite(universityData.website);
          setFirstName(universityData.user?.first_name);
          setCompanyName(universityData.company_name);
          setType(universityData.user?.type || universityData.type);
          
          setForm(prev => ({ 
            ...prev, 
            employer: universityData.company_name || universityData.name || '' 
          }));
        } else {
          console.warn("University not found for:", shortUniName);
          ErrorHandler.showErrorToast({ response: { status: 404 } }, 'University not found');
        }
        
      } catch (err) {
        console.error("Error fetching university:", err);
        ErrorHandler.showErrorToast(err, 'Fetching university data');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityData();
  }, [shortUniName, router]);

  // Fetch all dashboard data from APIs with fallbacks
  useEffect(() => {
    const fetchAllDashboardData = async () => {
      if (loading) return;

      const demoData = getDemoData();

      try {
        // Fetch dashboard stats
        const statsResponse = await makeAuthenticatedRequest(
          `${BACKEND_URL}/api/universities/dashboard/stats`,
          { method: 'GET' }
        );

        if (statsResponse && statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
          setTotalVisitors(statsData.total_candidates || demoData.dashboardStats.total_candidates);

          // Set pie chart data from API
          const pieData = [
            { name: "Accepted Applications", value: statsData.accepted_applications || 0, fill: chartConfig.employed.color },
            { name: "Rejected Applications", value: statsData.rejected_applications || 0, fill: chartConfig.seeking.color },
            { name: "Pending Applications", value: (statsData.total_applications || 0) - (statsData.accepted_applications || 0) - (statsData.rejected_applications || 0), fill: chartConfig.zeroResumeScore.color },
          ];
          setPieChartData(pieData);
        } else {
          // Use demo data for dashboard stats
          setDashboardStats(demoData.dashboardStats);
          setTotalVisitors(demoData.dashboardStats.total_candidates);
          
          const pieData = [
            { name: "Employed", value: 156, fill: chartConfig.employed.color },
            { name: "Seeking", value: 89, fill: chartConfig.seeking.color },
            { name: "In Progress", value: 45, fill: chartConfig.zeroResumeScore.color },
          ];
          setPieChartData(pieData);
        }

        // Fetch industry data
        const industryResponse = await makeAuthenticatedRequest(
          `${BACKEND_URL}/api/universities/dashboard/industries`,
          { method: 'GET' }
        );

        if (industryResponse && industryResponse.ok) {
          const industryApiData = await industryResponse.json();
          if (industryApiData.top_industries && Array.isArray(industryApiData.top_industries)) {
            const industryChartData = industryApiData.top_industries.map((industry, index) => ({
              industry: industry.job_post__industry || `Industry ${index + 1}`,
              jobs: industry.count || 0,
              color: `hsl(${120 + index * 15}, 45%, ${40 + index * 8}%)` // More muted colors
            }));
            setIndustryData(industryChartData);
          } else {
            setIndustryData(demoData.industryData);
          }
        } else {
          setIndustryData(demoData.industryData);
        }

        // Fetch engagement trends
        const engagementResponse = await makeAuthenticatedRequest(
          `${BACKEND_URL}/api/universities/dashboard/engagement`,
          { method: 'GET' }
        );

        if (engagementResponse && engagementResponse.ok) {
          const engagementApiData = await engagementResponse.json();
          setLineChartData(engagementApiData.monthly_data || demoData.engagementData);
        } else {
          setLineChartData(demoData.engagementData);
        }

        // Fetch student progress data
        const studentProgressResponse = await makeAuthenticatedRequest(
          `${BACKEND_URL}/api/universities/dashboard/student-progress`,
          { method: 'GET' }
        );

        if (studentProgressResponse && studentProgressResponse.ok) {
          const progressData = await studentProgressResponse.json();
          setStudentProgressData(progressData);
        } else {
          setStudentProgressData(demoData.studentProgress);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        
        // Use all demo data as fallback
        setDashboardStats(demoData.dashboardStats);
        setTotalVisitors(demoData.dashboardStats.total_candidates);
        
        const pieData = [
          { name: "Employed", value: 156, fill: chartConfig.employed.color },
          { name: "Seeking", value: 89, fill: chartConfig.seeking.color },
          { name: "In Progress", value: 45, fill: chartConfig.zeroResumeScore.color },
        ];
        setPieChartData(pieData);
        setIndustryData(demoData.industryData);
        setLineChartData(demoData.engagementData);
        setStudentProgressData(demoData.studentProgress);
      }
    };

    fetchAllDashboardData();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-400/60 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const SHEET_SIDES = ["right"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
      {/* Dark Navbar */}
      <nav className="px-4 sm:px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-slate-900 backdrop-blur-lg border-b border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href={"/"}>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              OG<span className="text-green-400">nite</span>
            </h1>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <div className="flex items-center space-x-2 border border-slate-600 rounded-xl px-4 py-2 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/60 transition-all">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="outline-none text-slate-200 text-sm bg-transparent w-32 placeholder:text-slate-500"
            />
          </div>
          <Link href={`/dashboard/university/${shortUniName}/student-activity`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors font-medium">
              <Users className="w-4 h-4" />
              Students
            </button>
          </Link>
          <Link href={`/dashboard/university/${shortUniName}/employer-engagement`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors font-medium">
              <Briefcase className="w-4 h-4" />
              Employers
            </button>
          </Link>
          <Link href={`/dashboard/university/${shortUniName}/notifications`}>
            <button className="relative p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors">
              <Bell className="w-5 h-5 text-slate-300" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </Link>
        </div>

        {/* Profile Menu Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="border-slate-600 bg-slate-800 hover:bg-slate-700">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                  {universityName?.charAt(0) || 'U'}
                </div>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[350px]">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-xl">
                {universityName || 'University'}
              </SheetTitle>
              <SheetDescription>
                {email} • {type} University
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2">
              <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700">Home</span>
              </Link>
              <Link href={`/dashboard/university/${shortUniName}/profile`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-700">Edit Profile</span>
              </Link>
              <Link href={`/dashboard/university/${shortUniName}/student-activity`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-slate-700">Student Activity</span>
              </Link>
              <Link href={`/dashboard/university/${shortUniName}/employer-engagement`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-slate-700">Employer Engagement</span>
              </Link>
              <div className="pt-4 border-t">
                <button 
                  onClick={handleLogoutWithConfirmation}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-600">Logout</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
      
      {/* Enhanced Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back, {firstName || 'University Admin'}! 👋
          </h2>
          <p className="text-slate-600">
            Here's what's happening at {universityName || 'your university'} today
          </p>
        </div>

        {/* Stats Overview Cards with softer colors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">{totalVisitors}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Applications</p>
                  <p className="text-3xl font-bold">{dashboardStats?.total_applications || '147'}</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">{dashboardStats ? `${(dashboardStats.average_match_score * 100).toFixed(0)}%` : '78%'}</p>
                </div>
                <Award className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Active Jobs</p>
                  <p className="text-3xl font-bold">{industryData.reduce((sum, item) => sum + item.jobs, 0)}</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Application Statistics */}
          <Card className="bg-white/70 backdrop-blur-sm border-green-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600/80" />
                    Application Overview
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Student application breakdown
                  </CardDescription>
                </div>
                <Link href={`./${shortUniName}/student-activity`}>
                  <Button className="bg-green-600/80 hover:bg-green-700/80 text-white">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-800 text-3xl font-bold">
                                {totalVisitors.toLocaleString()}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-slate-500 text-sm">
                                Total Students
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingUp className="h-4 w-4 text-green-600/80" />
                <span>12% increase from last month</span>
              </div>
            </CardFooter>
          </Card>

          {/* Industry Distribution */}
          <Card className="bg-white/70 backdrop-blur-sm border-green-200/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600/80" />
                    Top Hiring Industries
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Where your students are getting hired
                  </CardDescription>
                </div>
                <Link href={`./${shortUniName}/employer-engagement`}>
                  <Button className="bg-emerald-600/80 hover:bg-emerald-700/80 text-white">
                    Explore
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {industryData.slice(0, 5).map((item, index) => (
                  <div key={item.industry} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50/60 to-emerald-50/60 border border-green-100/60">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium text-slate-700">{item.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-800">{item.jobs}</span>
                      <span className="text-sm text-slate-500">jobs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Award className="h-4 w-4 text-green-600/80" />
                <span>Technology leads with {industryData[0]?.jobs || 0} opportunities</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Engagement Trends */}
        <Card className="bg-white/70 backdrop-blur-sm border-green-200/60 mb-8">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600/80" />
              Monthly Engagement Trends
            </CardTitle>
            <CardDescription className="text-slate-600">
              Student and employer activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart data={lineChartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16a34a20" />
                <XAxis dataKey="month" tickLine={true} axisLine={true} tickMargin={8} />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                  dataKey="engagement"
                  type="monotone"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ fill: "#16a34a", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: "#16a34a", strokeWidth: 2, fill: "#ffffff" }}
                />
                <Line
                  dataKey="applications"
                  type="monotone"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/80 rounded-full"></div>
                <span>Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400/80 rounded-full"></div>
                <span>Applications</span>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600/80 ml-auto" />
            </div>
          </CardFooter>
        </Card>

        {/* Top Performing Students Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-green-200/60">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600/80" />
              Student Performance Overview
            </CardTitle>
            <CardDescription className="text-slate-600">
              Detailed breakdown of student achievements and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopPerforming 
              studentProgressData={studentProgressData}
              dashboardStats={dashboardStats}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;