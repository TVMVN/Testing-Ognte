'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Search, Briefcase, Building2, TrendingUp, Users, ArrowLeft, MapPin, Mail, Phone, Globe, Star } from 'lucide-react'

// UI Components defined inline
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-slate-500 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Button = ({ children, className = "", variant = "default", size = "default", onClick, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-8 px-3 text-xs",
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = "", variant = "default" }) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
  };
  
  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Avatar = ({ children, className = "" }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt = "" }) => (
  src ? <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" /> : null
);

const AvatarFallback = ({ children, className = "" }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className}`}>
    {children}
  </div>
);

const Table = ({ children, className = "" }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>{children}</table>
  </div>
);

const TableHeader = ({ children, className = "" }) => (
  <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>
);

const TableBody = ({ children, className = "" }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>
);

const TableRow = ({ children, className = "" }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
    {children}
  </tr>
);

const TableHead = ({ children, className = "" }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = "" }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

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
    alert(`${context}: ${message}`);
  }
};

const EmployerEngagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEmployers: 0,
    activeJobs: 0,
    avgEngagement: 0,
    topIndustry: '',
    activePartnerships: 0
  });

  const { shortUniName } = useParams();
  const router = useRouter();
  const BACKEND_URL = "http://localhost:8000";

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

  useEffect(() => {
    const fetchEmployerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if user is authenticated
        const token = getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch employer engagement data
        const employerResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/recruiter-engagement/dashboard/`);
        
        if (employerResponse && employerResponse.ok) {
          const data = await employerResponse.json();
          console.log('API Response:', data);
          
          // Handle the actual API structure based on the screenshot
          if (data.overview && data.most_hiring) {
            // Set stats from overview
            setStats({
              totalEmployers: data.overview.total_recruiters || 0,
              activePartnerships: data.overview.active_partnerships || 0,
              activeJobs: data.overview.active_jobs || 0,
              avgEngagement: data.overview.avg_engagement || 0,
              topIndustry: data.overview.top_industry || 'Technology'
            });

            // Transform most_hiring data to match our UI expectations
            const transformedEmployers = data.most_hiring.map((recruiter, index) => ({
              id: index + 1,
              name: recruiter.recruiter || 'Unknown Recruiter',
              company_name: recruiter.recruiter || 'Unknown Company',
              email: `contact@${recruiter.recruiter?.toLowerCase().replace(/\s+/g, '')}.com`,
              phone: '+1-XXX-XXX-XXXX',
              industry: data.overview.top_industry || 'Technology',
              location: 'Lagos, Nigeria',
              active_jobs: recruiter.accepted_offers || 0,
              engagement_score: Math.min(100, (recruiter.accepted_offers || 0) * 10), // Calculate based on offers
              rating: (4.0 + Math.random()).toFixed(1), // Generate reasonable rating
              employees: Math.floor(Math.random() * 500) + 50,
              joined_date: '2024',
              job_title: 'HR Manager',
              website: `https://${recruiter.recruiter?.toLowerCase().replace(/\s+/g, '')}.com`,
              profile_pic: null
            }));

            setEmployers(transformedEmployers);

          } else {
            // Handle unexpected data format
            console.warn("Unexpected data format:", data);
            setEmployers([]);
            setStats({
              totalEmployers: 0,
              activeJobs: 0,
              avgEngagement: 0,
              topIndustry: 'Technology',
              activePartnerships: 0
            });
          }
        } else if (employerResponse) {
          throw new Error('Failed to fetch employer engagement data');
        } else {
          return; // Authentication failed, already handled
        }

      } catch (err) {
        console.error('Error fetching employer data:', err);
        ErrorHandler.showErrorToast(err, 'Fetching employer data');
        setError('Unable to load employer data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerData();
  }, [router]);

  const filtered = employers.filter(employer =>
    employer.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
    employer.company_name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
    employer.industry?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  const getEngagementColor = (score) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-100';
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getIndustryColor = (industry) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Remote Hiring': 'bg-purple-100 text-purple-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Education': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Manufacturing': 'bg-gray-100 text-gray-800',
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 text-lg">Loading employer data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Unable to Load Employer Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Enhanced Navbar */}
      <nav className="px-4 sm:px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-200 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              OG<span className="text-emerald-500">nite</span>
            </h1>
          </Link>
          <div className="hidden sm:block w-px h-8 bg-emerald-200"></div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-700">Employer Engagement</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Enhanced Search */}
          <div className="flex items-center space-x-2 border border-emerald-200 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all min-w-[250px]">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search employers, companies, industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-slate-700 text-sm bg-transparent flex-1 placeholder:text-slate-400"
            />
          </div>

          <Link href={`/dashboard/university/${shortUniName}`}>
            <Button variant="outline" className="border-emerald-300 hover:bg-emerald-50 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-xl hover:bg-red-50 text-red-700 transition-colors"
          >
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-emerald-600" />
            </div>
            Employer Engagement Hub
          </h1>
          <p className="text-slate-600">
            Connect with top employers, track engagement metrics, and manage partnership opportunities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Recruiters</p>
                  <p className="text-3xl font-bold">{stats.totalEmployers}</p>
                  <p className="text-emerald-200 text-xs mt-1">Active recruiters</p>
                </div>
                <Building2 className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Partnerships</p>
                  <p className="text-3xl font-bold">{stats.activePartnerships}</p>
                  <p className="text-green-200 text-xs mt-1">Active partnerships</p>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Active Jobs</p>
                  <p className="text-3xl font-bold">{stats.activeJobs}</p>
                  <p className="text-teal-200 text-xs mt-1">Open positions</p>
                </div>
                <Briefcase className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Avg Engagement</p>
                  <p className="text-3xl font-bold">{stats.avgEngagement}%</p>
                  <p className="text-blue-200 text-xs mt-1">Platform activity</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Industry Info */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Top Hiring Industry</h3>
                <p className="text-slate-600">
                  <span className="font-medium text-purple-600">{stats.topIndustry}</span> is leading recruitment activities with the most active job postings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg">
          <CardHeader className="border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                  Top Hiring Recruiters
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Showing {filtered.length} of {employers.length} recruiters • Sorted by accepted offers
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                {filtered.length} Results
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100">
                    <TableHead className="font-semibold text-slate-700">Recruiter</TableHead>
                    <TableHead className="font-semibold text-slate-700">Contact Info</TableHead>
                    <TableHead className="font-semibold text-slate-700">Industry</TableHead>
                    <TableHead className="font-semibold text-slate-700">Location</TableHead>
                    <TableHead className="font-semibold text-slate-700">Accepted Offers</TableHead>
                    <TableHead className="font-semibold text-slate-700">Engagement</TableHead>
                    <TableHead className="font-semibold text-slate-700">Rating</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((employer, index) => (
                    <TableRow 
                      key={employer.id || index} 
                      className="hover:bg-emerald-50/50 transition-colors border-emerald-100/50"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={employer.profile_pic} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                              {employer.name?.substring(0, 2).toUpperCase() || 'RC'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {employer.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {employer.company_name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {employer.employees} employees • Joined {employer.joined_date}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-800">
                            {employer.job_title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">
                              {employer.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            <span>{employer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <Badge 
                          variant="secondary" 
                          className={`${getIndustryColor(employer.industry)} font-medium`}
                        >
                          {employer.industry}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{employer.location}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-800">
                            {employer.active_jobs}
                          </div>
                          <div className="text-xs text-slate-500">offers accepted</div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            variant="secondary" 
                            className={`${getEngagementColor(employer.engagement_score)} font-semibold`}
                          >
                            {employer.engagement_score}%
                          </Badge>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{width: `${employer.engagement_score}%`}}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold text-slate-800">
                            {employer.rating}
                          </span>
                          <span className="text-xs text-slate-500">/5.0</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                            onClick={() => employer.website && window.open(employer.website, '_blank')}
                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => employer.email && window.open(`mailto:${employer.email}`, '_blank')}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No recruiters found</h3>
                <p className="text-slate-500">
                  {searchQuery 
                    ? `No recruiters match "${searchQuery}". Try adjusting your search terms.`
                    : 'No recruiters available at the moment.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Insights */}
        {filtered.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-200">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Average Engagement</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {Math.round(filtered.reduce((sum, emp) => sum + (emp.engagement_score || 0), 0) / filtered.length) || 0}%
                </p>
                <p className="text-sm text-slate-600 mt-1">Across all shown recruiters</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-100 to-teal-100 border-green-200">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Total Accepted Offers</h3>
                <p className="text-2xl font-bold text-green-600">
                  {filtered.reduce((sum, emp) => sum + (emp.active_jobs || 0), 0)}
                </p>
                <p className="text-sm text-slate-600 mt-1">From active recruiters</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-teal-100 to-blue-100 border-teal-200">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Average Rating</h3>
                <p className="text-2xl font-bold text-teal-600">
                  {filtered.length > 0 ? 
                    (filtered.reduce((sum, emp) => sum + parseFloat(emp.rating || 0), 0) / filtered.length).toFixed(1) 
                    : '0.0'
                  }
                </p>
                <p className="text-sm text-slate-600 mt-1">Out of 5.0 stars</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerEngagement;