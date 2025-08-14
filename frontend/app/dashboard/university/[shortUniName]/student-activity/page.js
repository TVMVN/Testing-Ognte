'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { 
  Search, Users, Award, TrendingUp, Filter, ArrowLeft, Eye, 
  Mail, Phone, Globe, MapPin, Calendar, CheckCircle, XCircle,
  Clock, User, BookOpen, Code, Briefcase, Star
} from 'lucide-react'

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

const StudentActivityDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [studentProgress, setStudentProgress] = useState(null)
  const [activitySummary, setActivitySummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { shortUniName } = useParams()
  const router = useRouter()
  
  const BACKEND_URL = "http://localhost:8000"

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

  // Fetch student data with authentication
  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if user is authenticated
        const token = getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch student progress data
        const progressResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/student-progress/`)
        if (progressResponse && progressResponse.ok) {
          const progressData = await progressResponse.json()
          setStudentProgress(progressData)
        } else if (progressResponse) {
          throw new Error('Failed to fetch student progress data')
        } else {
          return; // Authentication failed, already handled
        }

        // Fetch student activity overview
        const activityResponse = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/student-overview/student_activity_dashboard/`)
        if (activityResponse && activityResponse.ok) {
          const activityData = await activityResponse.json()
          setActivitySummary(activityData)
        } else {
          console.warn('Activity summary not available')
          // Set empty activity data structure to prevent errors
          setActivitySummary({
            summary: {
              total_students: 0,
              top_performers: 0,
              average_performers: 0,
              needs_support: 0,
              success_rate: '0%',
              performance_rate: '0%'
            },
            students: {
              top_performing_students: [],
              average_students: [],
              below_average_students: []
            }
          })
        }

      } catch (err) {
        console.error('Error fetching student data:', err)
        ErrorHandler.showErrorToast(err, 'Fetching student data')
        setError('Unable to load student data. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [router])

  const getStudentsByFilter = () => {
    if (!studentProgress) return []
    
    if (activeFilter === 'all') {
      return studentProgress.breakdown || []
    }
    
    if (!activitySummary) return []
    
    switch (activeFilter) {
      case 'top':
        return activitySummary.students.top_performing_students.map(student => {
          const fullStudent = studentProgress.breakdown.find(s => 
            s.name.toLowerCase().includes(student.name.toLowerCase())
          )
          return fullStudent ? { ...fullStudent, ...student, performance: 'top' } : { ...student, performance: 'top' }
        })
      case 'average':
        return activitySummary.students.average_students.map(student => {
          const fullStudent = studentProgress.breakdown.find(s => 
            s.name.toLowerCase().includes(student.name.toLowerCase())
          )
          return fullStudent ? { ...fullStudent, ...student, performance: 'average' } : { ...student, performance: 'average' }
        })
      case 'below':
        return activitySummary.students.below_average_students.map(student => {
          const fullStudent = studentProgress.breakdown.find(s => 
            s.name.toLowerCase().includes(student.name.toLowerCase())
          )
          return fullStudent ? { ...fullStudent, ...student, performance: 'below' } : { ...student, performance: 'below' }
        })
      default:
        return studentProgress.breakdown || []
    }
  }

  const filteredStudents = getStudentsByFilter().filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'top': return 'bg-emerald-50 border-emerald-200'
      case 'average': return 'bg-blue-50 border-blue-200' 
      case 'below': return 'bg-amber-50 border-amber-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 text-lg">Loading student activity...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Unable to Load Student Data</h2>
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
    )
  }

  const filterOptions = [
    { 
      id: 'all', 
      label: 'All Students', 
      count: studentProgress?.summary?.total_students_visible || 0, 
      color: 'bg-slate-100 text-slate-700' 
    },
    { 
      id: 'top', 
      label: 'Top Performers', 
      count: activitySummary?.summary?.top_performers || 0, 
      color: 'bg-emerald-100 text-emerald-700' 
    },
    { 
      id: 'average', 
      label: 'Average', 
      count: activitySummary?.summary?.average_performers || 0, 
      color: 'bg-green-100 text-green-700' 
    },
    { 
      id: 'below', 
      label: 'Needs Support', 
      count: activitySummary?.summary?.needs_support || 0, 
      color: 'bg-amber-100 text-amber-700' 
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50'>
      {/* Enhanced Navbar */}
      <nav className="px-4 sm:px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-200 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              OG<span className="text-black">nite</span>
            </h1>
          </Link>
          <div className="hidden sm:block w-px h-8 bg-emerald-200"></div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-700">Student Activity</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Enhanced Search */}
          <div className="flex items-center space-x-2 border border-emerald-200 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all min-w-[200px]">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-slate-700 text-sm bg-transparent flex-1 placeholder:text-slate-400"
            />
          </div>
          
          <Link href={`/dashboard/university/${shortUniName}`}>
            <button className="flex items-center gap-2 px-4 py-2 border border-emerald-300 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
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
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            Student Activity Dashboard
          </h1>
          <p className="text-slate-600">
            Monitor student performance, track progress, and identify students who need support
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold">{studentProgress?.summary?.total_students_visible || 0}</p>
                <p className="text-emerald-200 text-xs mt-1">Active this semester</p>
              </div>
              <Users className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Job Offers</p>
                <p className="text-3xl font-bold">{studentProgress?.summary?.accepted_jobs || 0}</p>
                <p className="text-green-200 text-xs mt-1">Successfully placed</p>
              </div>
              <Award className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">With Skills</p>
                <p className="text-3xl font-bold">{studentProgress?.summary?.with_skills || 0}</p>
                <p className="text-teal-200 text-xs mt-1">Profile completed</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 hover:shadow-lg transition-shadow p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Still Seeking</p>
                <p className="text-3xl font-bold">{studentProgress?.summary?.still_seeking_jobs || 0}</p>
                <p className="text-amber-200 text-xs mt-1">Need assistance</p>
              </div>
              <Eye className="w-8 h-8 text-amber-200" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                  activeFilter === option.id 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : `${option.color} hover:shadow-md`
                }`}
              >
                <span className="font-medium">{option.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeFilter === option.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/60'
                }`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Performance Indicator */}
        {activitySummary && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Overall Performance</h3>
                    <p className="text-slate-600 text-sm">
                      Success Rate: {activitySummary.summary.success_rate}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">
                    {activitySummary.summary.performance_rate}
                  </p>
                  <p className="text-slate-500 text-sm">Performance Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Lists */}
        <div className="bg-white/70 backdrop-blur-sm border border-emerald-200 hover:shadow-lg transition-shadow rounded-xl">
          <div className="border-b border-emerald-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-800">
                    {activeFilter === 'all' ? 'All Students' : 
                     activeFilter === 'top' ? 'Top Performing Students' :
                     activeFilter === 'average' ? 'Average Performing Students' :
                     'Students Needing Support'}
                  </h2>
                  <p className="text-slate-600 text-sm">
                    {activeFilter === 'all' ? 'Complete overview of all students' :
                     activeFilter === 'top' ? 'Students with excellent academic and career progress' :
                     activeFilter === 'average' ? 'Students showing steady progress' :
                     'Students who may benefit from additional guidance'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {filteredStudents.length} students
              </span>
            </div>
          </div>

          <div className="p-0">
            {filteredStudents.length > 0 ? (
              <div className="space-y-4 p-6">
                {filteredStudents.map((student, index) => (
                  <div 
                    key={student.id || student.name || index} 
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getPerformanceColor(student.performance)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-slate-800">{student.name || 'Unknown Student'}</h3>
                            {student.job_status && (
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.job_status)}`}>
                                {getStatusIcon(student.job_status)}
                                {student.job_status === 'accepted' ? 'Hired' : 
                                 student.job_status === 'rejected' ? 'Rejected' :
                                 student.job_status === 'pending' ? 'Pending' : 'Seeking'}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {student.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Mail className="w-4 h-4" />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              
                              {student.course && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <BookOpen className="w-4 h-4" />
                                  <span>{student.course}</span>
                                </div>
                              )}
                              
                              {student.job_title && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{student.job_title}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <User className="w-4 h-4" />
                                <span>Resume: {student.resume === 'yes' ? 'Complete' : 'Incomplete'}</span>
                              </div>
                              
                              {student.skills && student.skills !== 'none' && Array.isArray(student.skills) && (
                                <div className="flex items-start gap-2 text-sm text-slate-600">
                                  <Code className="w-4 h-4 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {student.skills.slice(0, 3).map((skill, skillIndex) => (
                                      <span key={skillIndex} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                    {student.skills.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                        +{student.skills.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {student.status !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="text-slate-600">Status Score: </span>
                                  <span className="font-bold text-slate-800">{student.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {student.email && (
                          <button className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 transition-colors">
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No students found</h3>
                <p className="text-slate-500">
                  {searchQuery 
                    ? `No students match "${searchQuery}". Try adjusting your search terms.`
                    : 'No students in this category at the moment.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentActivityDashboard