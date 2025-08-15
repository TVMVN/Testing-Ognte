'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search, Clock, DollarSign, MapPin, ArrowLeft, Eye, Building, Calendar, Hash, Briefcase, Star, X, CheckCircle, XCircle, Award, TrendingUp, Users, Zap, FileText } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:8000';

export default function ApplicationsPage() {
  const { username } = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingToOffer, setRespondingToOffer] = useState(null);

  // Authentication helper functions
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
      const res = await axios.post(`${API_URL}/api/auth/refresh/`, {
        refresh: refresh,
      });

      if (res.status === 200) {
        const data = res.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access);
        }
        return data.access;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('Session expired. Please log in again.');
      clearTokens();
      router.push('/login');
      return null;
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

    const config = {
      ...options,
      headers: {
        ...(!(options.data instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      let response = await axios(url, config);
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          try {
            const response = await axios(url, config);
            return response;
          } catch (retryError) {
            console.error('Retry request failed:', retryError);
            throw retryError;
          }
        } else {
          return null;
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, [username]);

  const fetchUserApplications = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/candidates/my-applications/`, {
        method: 'GET',
      });

      if (response && response.data) {
        setApplications(response.data.results || response.data);
      }
    } catch (err) {
      console.error('Error fetching user applications:', err);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId) => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;

    const confirm = window.confirm("Are you sure you want to withdraw this application?");
    if (!confirm) return;

    setWithdrawingId(applicationId);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/candidates/applications/${applicationId}/withdraw/`,
        {
          method: 'POST',
        }
      );

      if (response) {
        setApplications(prev => prev.filter(a => a.id !== applicationId));
        toast.success('Application withdrawn successfully');
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
      toast.error('Failed to withdraw application');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Accept offer
  const acceptOffer = async (applicationId) => {
  setRespondingToOffer(applicationId);
  
  try {
    console.log(`Attempting to accept offer for application ID: ${applicationId}`);
    
    const response = await makeAuthenticatedRequest(
      `${API_URL}/api/candidates/applications/${applicationId}/accept-offer/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add empty body if your backend expects it
        data: JSON.stringify({}),
      }
    );

    console.log('Accept offer response:', response);

    // Check for successful response
    if (response && (response.status === 200 || response.status === 201)) {
      // Update the application status in the local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'offer_accepted' }
            : app
        )
      );
      
      toast.success('🎉 Congratulations! You\'ve accepted the offer!', {
        duration: 5000,
        description: "Get ready for your new internship journey!"
      });
    } else {
      // Handle unexpected response status
      console.error('Unexpected response status:', response?.status);
      toast.error('Unexpected response from server. Please try again.');
    }
  } catch (err) {
    console.error('Error accepting offer - Full error:', err);
    console.error('Error response:', err.response);
    console.error('Error response data:', err.response?.data);
    console.error('Error response status:', err.response?.status);
    
    // Get more specific error message
    let errorMessage = 'Failed to accept offer. Please try again.';
    
    if (err.response?.data) {
      // Check for different error response formats
      if (typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      } else if (err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.data.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response.data.non_field_errors) {
        errorMessage = err.response.data.non_field_errors[0];
      } else {
        errorMessage = `Server error: ${JSON.stringify(err.response.data)}`;
      }
    } else if (err.response?.status) {
      switch (err.response.status) {
        case 400:
          errorMessage = 'Bad request. The application might not be in the correct state to accept the offer.';
          break;
        case 401:
          errorMessage = 'Authentication failed. Please log in again.';
          break;
        case 403:
          errorMessage = 'You don\'t have permission to accept this offer.';
          break;
        case 404:
          errorMessage = 'Application not found. It might have been withdrawn.';
          break;
        case 409:
          errorMessage = 'Conflict. The offer might have already been processed.';
          break;
        default:
          errorMessage = `Server error (${err.response.status}). Please try again.`;
      }
    }
    
    toast.error(errorMessage);
  } finally {
    setRespondingToOffer(null);
  }
};

  // Deny offer
  const denyOffer = async (applicationId) => {
    const confirm = window.confirm("Are you sure you want to deny this offer? This action cannot be undone.");
    if (!confirm) return;

    setRespondingToOffer(applicationId);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/candidates/applications/${applicationId}/deny-offer/`,
        {
          method: 'POST',
        }
      );

      if (response) {
        // Update the application status in the local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'offer_denied' }
              : app
          )
        );
        toast.success('Offer denied successfully');
      }
    } catch (err) {
      console.error('Error denying offer:', err);
      toast.error('Failed to deny offer. Please try again.');
    } finally {
      setRespondingToOffer(null);
    }
  };

  // Updated filter function
  const filteredApplications = applications.filter((application) => {
    const jobPost = application.job_post;
    const searchFields = [
      jobPost?.title,
      jobPost?.description,
      jobPost?.location,
      jobPost?.industry,
      jobPost?.required_skills?.join(' '),
      application.status
    ];

    return searchFields.some(field =>
      field?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Helper functions
  const timeAgo = (dateString) => {
    const now = new Date();
    const postedDate = new Date(dateString);
    const seconds = Math.floor((now - postedDate) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (seconds < 2592000) {
      const days = Math.floor(seconds / 86400);
      return days === 1 ? 'yesterday' : `${days} days ago`;
    }
    if (seconds < 31536000) {
      const months = Math.floor(seconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    const years = Math.floor(seconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  const formatSalary = (salary) => {
    if (!salary || !salary.amount || salary.amount === 0) return 'Unpaid';
    const currencySymbols = {
      'dollar': '$',
      'euro': '€',
      'pound': '£',
      'naira': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
    };
    const symbol = currencySymbols[salary.currency] || salary.currency;
    return `${symbol}${salary.amount.toLocaleString()}`;
  };

  const formatLocation = (location, isRemote) => {
    if (isRemote) return 'Remote';
    return location || 'Not specified';
  };

  // Add formatDate function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        bg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
        text: 'text-amber-800',
        border: 'border-amber-200',
        icon: Clock,
        label: 'Pending Review'
      },
      'accepted': {
        bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        icon: Award,
        label: 'Offer Received!'
      },
      'offer_accepted': {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: CheckCircle,
        label: 'Offer Accepted'
      },
      'offer_denied': {
        bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        icon: XCircle,
        label: 'Offer Denied'
      },
      'rejected': {
        bg: 'bg-gradient-to-r from-red-100 to-pink-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: XCircle,
        label: 'Not Selected'
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-white">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-r-4 border-emerald-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-24 w-24 border border-emerald-600 opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-2xl text-gray-800 font-bold tracking-wide animate-pulse">Loading Your Applications</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-200 to-green-100 rounded-full opacity-25 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Sophisticated Navbar */}
      <nav className="relative px-8 h-20 w-full flex justify-between items-center sticky top-0 z-50 bg-black shadow-lg border-b border-gray-100">
        <Link href="/" className="group relative z-10">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-6">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent text-white transition-all duration-300">
              OG<span className="text-[#25d442]">nite</span>
            </h1>
          </div>
        </Link>

        <div className="relative z-10 flex items-center space-x-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-3 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <Search className="w-5 h-5 text-emerald-600" />
          <input
            type="text"
            placeholder="Search applications, companies, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm w-48 sm:w-80 font-medium"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">×</div>
            </button>
          )}
        </div>

        <Link href={`/dashboard/${username}/`} className="group relative z-10">
          <button className="flex items-center space-x-3 text-gray-700 hover:text-emerald-700 transition-all duration-300 font-semibold px-6 py-3 rounded-2xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 group-hover:shadow-lg backdrop-blur-sm bg-white/50">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Dashboard</span>
          </button>
        </Link>
      </nav>

      {/* Header Stats */}
      <div className="relative z-10 p-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              My Applications
            </h1>
            <p className="text-gray-600 text-lg">Track your internship applications and manage offers</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{applications.length}</p>
                  <p className="text-emerald-600 text-sm font-medium">Total Applied</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{applications.filter(a => a.status === 'pending').length}</p>
                  <p className="text-amber-600 text-sm font-medium">Pending</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{applications.filter(a => a.status === 'accepted').length}</p>
                  <p className="text-green-600 text-sm font-medium">Offers</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{applications.filter(a => a.status === 'offer_accepted').length}</p>
                  <p className="text-blue-600 text-sm font-medium">Accepted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <main className="relative z-10 px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {filteredApplications.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center mt-16">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  {searchQuery ? 'No matching applications found' : 'No applications yet'}
                </h3>
                <p className="text-gray-600 max-w-md">
                  {searchQuery
                    ? 'Try adjusting your search terms to find your applications.'
                    : 'Start applying to internships to see your applications here.'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Clear search & show all
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredApplications.map((app, index) => {
                const jobPost = app.job_post;
                const statusConfig = getStatusConfig(app.status);
                const StatusIcon = statusConfig.icon;
                const isWithdrawing = withdrawingId === app.id;
                const isRespondingToOffer = respondingToOffer === app.id;
                
                return (
                  <div
                    key={app.id}
                    className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-700/50 hover:border-emerald-500/50 transform hover:-translate-y-1 hover:rotate-1"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 space-y-4">
                      {/* Header with status */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors duration-300 leading-tight line-clamp-2">
                              {jobPost?.title || 'Job Title Not Available'}
                            </h3>
                            <p className="text-emerald-400 font-semibold text-sm">
                              {typeof jobPost?.recruiter === 'object' 
                                ? jobPost.recruiter?.company_name || 'Company'
                                : jobPost?.recruiter || 'Company'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-lg">
                              {formatLocation(jobPost?.location, jobPost?.is_remote)}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-xl p-3`}>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                            <span className={`${statusConfig.text} font-bold text-sm`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                          <div className="flex items-center space-x-2 mb-1">
                            <Building className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-medium">Industry</span>
                          </div>
                          <span className="text-white font-semibold text-xs">{jobPost?.industry || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-medium">Applied</span>
                          </div>
                          <span className="text-white font-semibold text-xs">{timeAgo(app.applied_at)}</span>
                        </div>
                      </div>

                      {/* Salary Display */}
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-3 border border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 font-semibold text-sm">Salary</span>
                          </div>
                          <div className={`font-bold ${formatSalary(jobPost?.salary) === 'Unpaid' ? 'text-amber-400' : 'text-green-300'}`}>
                            {formatSalary(jobPost?.salary)}
                          </div>
                        </div>
                      </div>

                      {/* Skills Preview */}
                      {jobPost?.required_skills && jobPost.required_skills.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 text-sm font-semibold">Skills</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {jobPost.required_skills.slice(0, 2).map((skill, idx) => (
                              <span
                                key={idx}
                                className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 text-emerald-300 px-2 py-1 rounded-lg text-xs border border-emerald-500/30 font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {jobPost.required_skills.length > 2 && (
                              <span className="text-emerald-400 text-xs font-medium bg-emerald-600/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                +{jobPost.required_skills.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-2">
                        {/* Offer Response Buttons (only show if status is 'accepted') */}
                        {app.status === 'accepted' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => acceptOffer(app.id)}
                              disabled={isRespondingToOffer}
                              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-bold rounded-xl py-3 px-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                            >
                              {isRespondingToOffer ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => denyOffer(app.id)}
                              disabled={isRespondingToOffer}
                              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-bold rounded-xl py-3 px-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                            >
                              {isRespondingToOffer ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span>Deny</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Withdraw Button (only show if status is 'pending') */}
                        {app.status === 'pending' && (
                          <button
                            onClick={() => withdrawApplication(app.id)}
                            disabled={isWithdrawing}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-bold rounded-xl py-3 px-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                          >
                            {isWithdrawing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Withdrawing...</span>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                <span>Withdraw</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 hover:from-gray-900 hover:via-gray-800 hover:to-gray-900 text-white text-sm font-bold rounded-xl py-3 px-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-600/50"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                          <Zap className="w-4 h-4 animate-pulse" />
                        </button>
                      </div>
                    </div>

                    {/* Floating decorative elements */}
                    <div className="absolute top-3 right-3 w-2 h-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full group-hover:scale-150 transition-transform duration-300 opacity-70"></div>
                    <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full group-hover:scale-125 transition-transform duration-300 opacity-60"></div>
                    
                    {/* Status indicator line */}
                    <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl ${
                      app.status === 'accepted' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                      app.status === 'offer_accepted' ? 'bg-gradient-to-r from-blue-500 to-green-600' :
                      app.status === 'offer_denied' ? 'bg-gradient-to-r from-gray-500 to-slate-600' :
                      app.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                      'bg-gradient-to-r from-amber-500 to-yellow-600'
                    }`}></div>

                    {/* Pulsing ring for offers */}
                    {app.status === 'accepted' && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Application Details Modal */}
      {selectedApplication && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-auto"
          onClick={(e) => {
            // Close modal if clicking on the backdrop
            if (e.target === e.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          <div 
            className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl max-w-5xl w-full relative border border-gray-200/50 max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
          >
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-green-50/30 rounded-3xl pointer-events-none"></div>
            
            {/* Close button */}
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute top-6 right-6 z-10 text-gray-400 hover:text-gray-700 text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/80 transition-all duration-200 shadow-lg border border-gray-200/50 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative z-10 p-8 space-y-8">
              {/* Premium Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 via-green-50/30 to-emerald-100/50 rounded-3xl"></div>
                <div className="relative p-8 space-y-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                          <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                            {selectedApplication.job_post?.title || 'Job Title Not Available'}
                          </h2>
                          <p className="text-2xl text-emerald-600 font-bold mt-1">
                            {typeof selectedApplication.job_post?.recruiter === 'object' 
                              ? selectedApplication.job_post.recruiter?.company_name || 'Company'
                              : selectedApplication.job_post?.recruiter || 'Company'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium">Applied {timeAgo(selectedApplication.applied_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium">Deadline: {timeAgo(selectedApplication.job_post?.application_deadline)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 items-end">
                      {/* Status Badge */}
                      <div className={`${getStatusConfig(selectedApplication.status).bg} ${getStatusConfig(selectedApplication.status).border} border-2 rounded-2xl p-4 shadow-lg`}>
                        <div className="flex items-center space-x-3">
                          {React.createElement(getStatusConfig(selectedApplication.status).icon, {
                            className: `w-6 h-6 ${getStatusConfig(selectedApplication.status).text}`
                          })}
                          <span className={`${getStatusConfig(selectedApplication.status).text} font-bold text-lg`}>
                            {getStatusConfig(selectedApplication.status).label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg text-center">
                          {selectedApplication.job_post?.is_remote ? 'Remote' : selectedApplication.job_post?.location || 'Location not specified'}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-center">
                          {selectedApplication.job_post?.industry || 'Industry not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Offers */}
              {selectedApplication.status === 'accepted' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border-2 border-green-200 shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Award className="w-8 h-8 text-green-600" />
                      <h3 className="text-2xl font-bold text-green-800">🎉 Congratulations! You received an offer!</h3>
                    </div>
                    <p className="text-green-700 font-medium mb-6">
                      The company is interested in having you as an intern. Please respond to this offer.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => acceptOffer(selectedApplication.id)}
                        disabled={respondingToOffer === selectedApplication.id}
                        className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl py-4 px-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
                      >
                        {respondingToOffer === selectedApplication.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Accepting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-6 h-6" />
                            <span>Accept Offer</span>
                            <Zap className="w-5 h-5 animate-pulse" />
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => denyOffer(selectedApplication.id)}
                        disabled={respondingToOffer === selectedApplication.id}
                        className="flex items-center justify-center space-x-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-2xl py-4 px-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
                      >
                        {respondingToOffer === selectedApplication.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Denying...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6" />
                            <span>Deny Offer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Job Description */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-200 shadow-lg">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Job Description</h3>
                    </div>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                        {selectedApplication.job_post?.description || 'No description available'}
                      </p>
                    </div>
                  </div>

                  {/* Skills Section */}
                  {selectedApplication.job_post?.required_skills && selectedApplication.job_post.required_skills.length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-200 shadow-lg">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">Required Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-4 mb-6">
                        {selectedApplication.job_post.required_skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-6 py-3 rounded-2xl text-base font-semibold border-2 border-emerald-200 shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      {/* Skills Match Analysis */}
                      <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <Star className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-lg font-bold text-gray-800">Skills Analysis</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-blue-700 font-semibold text-sm">Total Skills Required</span>
                            </div>
                            <p className="text-2xl font-black text-blue-800">{selectedApplication.job_post.required_skills.length}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="text-purple-700 font-semibold text-sm">Skill Categories</span>
                            </div>
                            <p className="text-2xl font-black text-purple-800">
                              {Math.min(selectedApplication.job_post.required_skills.length, 3)}+
                            </p>
                          </div>
                        </div>
                        
                        {/* Quick Tips */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mt-0.5">
                              <span className="text-white text-xs font-bold">💡</span>
                            </div>
                            <div className="flex-1">
                              <h5 className="text-emerald-800 font-bold text-sm mb-1">Pro Tip</h5>
                              <p className="text-emerald-700 text-sm leading-relaxed">
                                {selectedApplication.status === 'pending' ? 
                                  "While waiting for a response, consider strengthening these skills through online courses or personal projects." :
                                  selectedApplication.status === 'accepted' ?
                                  "Your skills matched perfectly! The company is excited to have you demonstrate these abilities." :
                                  selectedApplication.status === 'offer_accepted' ?
                                  "Congratulations! Start preparing to apply these skills in your new internship role." :
                                  "Keep developing these skills - they're valuable for future opportunities."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Insights Section */}
                  {/* <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-8 border border-indigo-200 shadow-lg">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Application Insights</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <span className="text-indigo-700 font-semibold">Days Since Applied</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-800">
                          {Math.floor((new Date() - new Date(selectedApplication.applied_at)) / (1000 * 60 * 60 * 24))}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <Hash className="w-5 h-5 text-indigo-600" />
                          <span className="text-indigo-700 font-semibold">Competition Level</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-800">
                          {selectedApplication.job_post?.number_of_slots > 5 ? 'Low' : 
                           selectedApplication.job_post?.number_of_slots > 2 ? 'Medium' : 'High'}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <Award className="w-5 h-5 text-indigo-600" />
                          <span className="text-indigo-700 font-semibold">Opportunity Score</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-800">
                          {selectedApplication.job_post?.salary?.amount > 0 ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐'}
                        </p>
                      </div>
                    </div>

                    {/* Status-based motivational message */}
                    <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🚀</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">Your Journey</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedApplication.status === 'pending' && (
                          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-amber-800 font-semibold text-sm">Stay Positive!</p>
                              <p className="text-amber-700 text-sm">Your application is under review. Companies typically take 1-2 weeks to respond.</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.status === 'accepted' && (
                          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-green-800 font-semibold text-sm">Amazing News! 🎉</p>
                              <p className="text-green-700 text-sm">You've received an offer! Take your time to review the details and make the best decision for your career.</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.status === 'offer_accepted' && (
                          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-blue-800 font-semibold text-sm">Congratulations! 🎊</p>
                              <p className="text-blue-700 text-sm">You're all set for your internship! Start preparing and get ready for an amazing learning experience.</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.status === 'rejected' && (
                          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-purple-800 font-semibold text-sm">Keep Going Strong! 💪</p>
                              <p className="text-purple-700 text-sm">This is just one opportunity. Your perfect internship is out there - keep applying and improving!</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedApplication.status === 'offer_denied' && (
                          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                            <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-gray-800 font-semibold text-sm">Your Choice Matters 🎯</p>
                              <p className="text-gray-700 text-sm">You made a thoughtful decision. The right opportunity that aligns with your goals is still out there!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  {/* </div> */} 
                </div>

                <div className="space-y-6">
                  {/* Salary Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border-2 border-green-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Compensation</h3>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-black ${formatSalary(selectedApplication.job_post?.salary) === 'Unpaid' ? 'text-amber-600' : 'text-green-600'}`}>
                        {formatSalary(selectedApplication.job_post?.salary)}
                      </div>
                      {formatSalary(selectedApplication.job_post?.salary) !== 'Unpaid' && (
                        <div className="text-gray-600 font-medium">Monthly</div>
                      )}
                    </div>
                  </div>

                  {/* Job Details Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 border border-gray-200 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Application Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Hash className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Available Spots</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedApplication.job_post?.number_of_slots || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Duration</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedApplication.job_post?.duration_of_internship ? `${selectedApplication.job_post.duration_of_internship} months` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Work Type</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedApplication.job_post?.is_remote ? 'Remote' : 'On-site'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Applied</span>
                        </div>
                        <span className="text-gray-900 font-bold text-sm">{formatDate(selectedApplication.applied_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Application Status Timeline */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-200 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Application Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-semibold text-gray-800">Application Submitted</p>
                          <p className="text-sm text-gray-600">{formatDate(selectedApplication.applied_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          selectedApplication.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <p className={`font-semibold ${selectedApplication.status !== 'pending' ? 'text-gray-800' : 'text-gray-400'}`}>
                            Status: {getStatusConfig(selectedApplication.status).label}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedApplication.status === 'pending' ? 'Waiting for review...' : 'Status updated'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
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

        /* Custom scrollbar for the modal */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
      `}</style>
    </div>
  );
}