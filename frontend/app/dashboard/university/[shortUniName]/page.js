'use client';
import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
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
import axios from "axios"
import TopPerforming from "@/components/TopPerforming";

const chartConfig = {
  employed: {
    label: "Employed",
    color: "#28a745", // Green for Employed
  },
  seeking: {
    label: "Seeking",
    color: "#B2D3C2", // Yellow for Seeking
  },
  zeroResumeScore: {
    label: "Zero Resume Score",
    color: "#728C69", // Red for Zero Resume Score
  },
  zeroProfileScore: {
    label: "Zero Profile Score",
    color: "#6c757d", // Gray for Zero Profile Score
  },
  desktop: {
    label: "Engagement",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Engagement",
    color: "hsl(var(--chart-2))",
  },
}

const StudentDashboard = () => {
  const [pieChartData, setPieChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const BACKEND_URL = 'http://localhost:8000'; 
  const { shortUniName } = useParams();
  const [profilePic, setProfilePic] = useState(null);
  const [email, setEmail] = useState(null);
  const [universityName, setUniversityName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null);
  // Add missing state variables
  const [profileLoading, setProfileLoading] = useState(false);
  const [site, setSite] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [form, setForm] = useState({ employer: '' });
  const [username, setUsername] = useState(shortUniName); // Set username from params
  
  const router = useRouter();

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

  // Error handler placeholder (you'll need to implement this)
  const ErrorHandler = {
    showErrorToast: (error, context) => {
      console.error(`${context}:`, error);
      // Implement your error toast logic here
    }
  };

  // Updated logout function to prevent unauthorized errors

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

  // Consolidated university data fetching
  useEffect(() => {
    if (!shortUniName) {
      setLoading(false);
      return;
    }

    const fetchUniversityData = async () => {
      setLoading(true);
      
      try {
        // Try authenticated request first
        const token = getAccessToken();
        let response;
        
        if (token) {
          response = await makeAuthenticatedRequest(
            `${BACKEND_URL}/api/universities/profile/`, 
            { method: 'GET' }
          );
        }
        
        // If authenticated request fails or no token, try public endpoint
        if (!response || !response.ok) {
          console.log('Trying public endpoint...');
          response = await fetch(`${BACKEND_URL}/api/universities/profile`);
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch university data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('University data received:', data);
        
        // Handle different response formats
        let universityData = null;
        
        if (Array.isArray(data)) {
          // If it's an array, find matching university
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
          // If it's a single object (authenticated response)
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
          
          // Auto-fill employer in form
          setForm(prev => ({ 
            ...prev, 
            employer: universityData.company_name || universityData.name || '' 
          }));
        } else {
          console.warn("University not found for:", shortUniName);
          ErrorHandler.showErrorToast(
            { response: { status: 404 } }, 
            'University not found'
          );
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

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const formattedData = [
          { name: "Employed", value: 200, fill: chartConfig.employed.color },
          { name: "Seeking", value: 20, fill: chartConfig.seeking.color },
          { name: "Zero Resume Score", value: 50, fill: chartConfig.zeroResumeScore.color },
        ];

        setPieChartData(formattedData);
        setTotalVisitors(formattedData.reduce((acc, curr) => acc + curr.value, 0));
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchChartData();
  }, []);

  // Fetch line chart data
  useEffect(() => {
    const fetchEmployerEngagementData = async () => {
      try {
        // Generate realistic mock employer engagement data
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const mockEngagementData = months.map(month => ({
          month,
          desktop: Math.floor(Math.random() * 150) + 50, // 50-200 engagement points
        }));

        console.log('Mock employer engagement data generated:', mockEngagementData);
        setLineChartData(mockEngagementData);
      } catch (err) {
        console.error("Failed to generate mock employer engagement data:", err);
      }
    };

    // Simulate API delay
    const timer = setTimeout(() => {
      fetchEmployerEngagementData();
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center bg-black">
        Loading...
      </div>
    );
  }

  const SHEET_SIDES = ["right"];

  return (
    <div>
      <div className="text-black bg-[#f0f0f0]">
        <nav className="Navbar px-4 sm:px-8 h-[60px] flex justify-between items-center sticky top-0 z-50 bg-black shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-2">
            <Link href={"/"}>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                OG<span className="text-[#25d442]">nite</span>
              </h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 ml-[25%]">
            <div className="flex items-center space-x-1 border rounded-md px-3 py-1 group">
              <span className="text-white mr-2 group-focus-within:hidden">
                <Search className="w-[24px] h-[24px]" />
              </span>
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-white text-sm bg-transparent w-32"
              />
            </div>
            <Link href={`/dashboard/university/${shortUniName}/student-activity`}>
              <button className="border-none cursor-pointer text-green-500 px-4 py-1 rounded font-medium hover:bg-green-100 whitespace-nowrap">
                Student Activity
                <ChevronDown className="w-[16px] h-[16px] inline-block ml-1" />
              </button>
            </Link>
            <Link href={`/dashboard/university/${shortUniName}/employer-engagement`}>
              <button className="border-none cursor-pointer text-green-500 px-4 py-1 rounded font-medium hover:bg-green-100 whitespace-nowrap">
                Employer Engagement
                <ChevronDown className="w-[16px] h-[16px] inline-block ml-1" />
              </button>
            </Link>
            <Link href={`/dashboard/university/${shortUniName}/notifications`}>
              <button className="relative cursor-pointer border-none text-green-100 px-1 py-1 rounded font-medium">
                <span className="absolute flex size-2 left-4.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                </span>
                <Bell />
              </button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Search */}
            <div className="hidden sm:flex items-center space-x-1 border rounded-md px-2 py-1 group">
              <span className="text-white group-focus-within:hidden">
                <Search className="w-[20px] h-[20px]" />
              </span>
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-white text-sm bg-transparent w-20"
              />
            </div>
            
            {/* Mobile Search Icon (for very small screens) */}
            <button className="sm:hidden text-green-500 p-1">
              <Search className="w-[20px] h-[20px]" />
            </button>
            
            {/* Mobile Notifications */}
            <Link href={`/dashboard/university/${shortUniName}/notifications`}>
              <button className="relative cursor-pointer border-none text-green-100 px-1 py-1 rounded font-medium">
                <span className="absolute flex size-2 left-4.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                </span>
                <Bell className="w-[20px] h-[20px]" />
              </button>
            </Link>
          </div>
          
          {/* Profile Menu */}
          <div>
            {SHEET_SIDES.map((side) => (
              <Sheet key={side}>
                <SheetTrigger asChild className="bg-black border-[1.5px] border-green-500 py-1 hover:bg-black cursor-pointer">
                  <Button variant="outline">
                    {profilePic && (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer object-cover border border-gray-500"
                      />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className={`rounded-bl-full w-[80%] sm:w-[60%] md:w-[50%] lg:w-[30%] ${side}`}>
                  <SheetHeader>
                    <SheetTitle className="text-green-500">
                      {universityName || 'University'}
                    </SheetTitle>
                    <SheetDescription>{`${email} | ${type} University`}</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 flex flex-col gap-4 pt-2">
                    <div className="mt-5 text-right">
                      <ul className="flex flex-col gap-7 text-right">
                        <Link href="/">
                          <li className="hover:text-green-500 transition-colors">Home</li>
                        </Link>
                        <Link href={`/dashboard/university/${shortUniName}/profile`}>
                          <li className="hover:text-green-500 transition-colors">Edit Profile</li>
                        </Link>
                        <Link href={`/dashboard/university/${shortUniName}/student-activity`}>
                          <li className="hover:text-green-500 transition-colors">Student Activity</li>
                        </Link>
                        <Link href={`/dashboard/university/${shortUniName}/employer-engagement`}>
                          <li className="hover:text-green-500 transition-colors">Employer Engagement</li>
                        </Link>
                        <Link href={`/dashboard/university/${shortUniName}/settings`}>
                          <li className="hover:text-green-500 transition-colors">Edit Preferences</li>
                        </Link>
                        <Link href={`/dashboard/university/${shortUniName}/safety-tips`}>
                          <li className="hover:text-green-500 transition-colors">Safety Tips</li>
                        </Link>
                        {/* <Link href={`/dashboard/university/${shortUniName}/mentorship`}>
                          <li className="hover:text-green-500 transition-colors">Mentorship</li>
                        </Link> */}
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
        </nav>
      </div>
      
      <div className="flex w-full h-full mt-4 items-center justify-center">
        <div className="md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 w-[95%] md:gap-8">
          <Card className="flex flex-col w-full">
            <CardHeader className="flex flex-wrap items-center justify-between">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-[#028A0F]">Placement Statistics</CardTitle>
                <CardDescription>Breakdown of student placement data</CardDescription>
              </div>
              <Link href={`./${shortUniName}/student-activity`}>
                <button className="bg-[#728c69] px-2 py-1 rounded-lg font-semibold text-green-100 cursor-pointer">
                  View Details
                </button>
              </Link>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalVisitors.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Visitors
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
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="leading-none text-muted-foreground">
                Showing total statistics of students from <span className="text-[#253e1d] font-semibold">
                  {universityName || 'University'}
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-[#98bf6436] mt-4 md:mt-0 lg:mt-0 xl:mt-0 w-full">
            <CardHeader className="flex flex-wrap items-center justify-between">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-[#028A0F]">Employer Engagement</CardTitle>
                <CardDescription>Live employer engagement</CardDescription>
              </div>
              <Link href={`./${shortUniName}/employer-engagement`}>
                <button className="bg-[#98bf64e1] px-2 py-1 rounded-lg font-semibold text-green-950 cursor-pointer">
                  View Details
                </button>
              </Link>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <LineChart
                  accessibilityLayer
                  data={lineChartData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={true}
                    axisLine={true}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Line
                    dataKey="desktop"
                    type="natural"
                    stroke="#728C69"
                    strokeWidth={3}
                    dot={{
                      fill: "#728C69"
                    }}
                    activeDot={{
                      r: 6
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="leading-none text-muted-foreground">
                Rate at which employers are engaging with students from <span className="text-[#253e1d] font-semibold">
                  {universityName || 'University'}
                </span>
              </div>
            </CardFooter>
          </Card>
          
          <div className="col-span-2 mt-4 md:mt-0 lg:mt-0 xl:mt-0">
            <TopPerforming className="col-span-2"/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;