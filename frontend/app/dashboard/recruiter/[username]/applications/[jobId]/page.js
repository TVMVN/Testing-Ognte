'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { 
  Search, Clock, DollarSign, MapPin, ArrowLeft, Eye, Building, Calendar, 
  Hash, Briefcase, Star, X, CheckCircle, XCircle, Award, TrendingUp, Users, 
  Zap, FileText, Mail, Phone, University, User, Download, ExternalLink,
  Filter, SortAsc, UserCheck, UserX, MessageSquare, GraduationCap,
  Shield, Sparkles, Target, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:8000';

export default function JobApplicationsPage() {
  const { username, jobId } = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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
    fetchJobApplications();
  }, [jobId]);

  const fetchJobApplications = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/recruiters/jobs/${jobId}/applications/`, {
        method: 'GET',
      });

      if (response && response.data) {
        const data = response.data;
        setApplications(data.applications || data.results || data);
        
        // Extract job details from the first application or set separately
        if (data.applications && data.applications.length > 0) {
          setJobDetails(data.applications[0].job_post);
        } else if (data.job_details) {
          setJobDetails(data.job_details);
        }
      }
    } catch (err) {
      console.error('Error fetching job applications:', err);
      toast.error('Failed to fetch job applications');
    } finally {
      setLoading(false);
    }
  };

  // Accept application
  const acceptApplication = async (applicationId) => {
    setProcessingId(applicationId);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/recruiters/applications/${applicationId}/accept/`,
        {
          method: 'POST',
        }
      );

      if (response) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'accepted' }
              : app
          )
        );
        toast.success('🎉 Application accepted! Candidate has been notified.', {
          duration: 5000,
          description: "The candidate will now see your offer and can respond."
        });
      }
    } catch (err) {
      console.error('Error accepting application:', err);
      const errorMessage = err.response?.data?.message || 'Failed to accept application. Please try again.';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject application
  const rejectApplication = async (applicationId) => {
    const confirm = window.confirm("Are you sure you want to reject this application? This action cannot be undone.");
    if (!confirm) return;

    setProcessingId(applicationId);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/recruiters/applications/${applicationId}/reject/`,
        {
          method: 'POST',
        }
      );

      if (response) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'rejected' }
              : app
          )
        );
        toast.success('Application rejected successfully');
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reject application. Please try again.';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

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
    if (!salary || !salary.amount || salary.amount === "0.00" || salary.status === "unpaid") return 'Unpaid';
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
    return `${symbol}${parseFloat(salary.amount).toLocaleString()}`;
  };

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
        label: 'Under Review'
      },
      'accepted': {
        bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        icon: Award,
        label: 'Offer Extended'
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
        label: 'Offer Declined'
      },
      'rejected': {
        bg: 'bg-gradient-to-r from-red-100 to-pink-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: XCircle,
        label: 'Rejected'
      }
    };
    return configs[status] || configs.pending;
  };

  // Filter and sort applications
  const filteredAndSortedApplications = applications
    .filter((app) => {
      const candidateName = app.candidate;
      const searchFields = [
        candidateName,
        app.cover_letter,
        jobDetails?.required_skills?.join(' ')
      ];

      const matchesSearch = searchFields.some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.applied_at) - new Date(a.applied_at);
        case 'oldest':
          return new Date(a.applied_at) - new Date(b.applied_at);
        case 'name':
          const nameA = a.candidate || '';
          const nameB = b.candidate || '';
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

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
          <p className="text-2xl text-gray-800 font-bold tracking-wide animate-pulse">Loading Job Applications</p>
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

      {/* Navbar */}
      <nav className="relative px-8 h-20 w-full flex justify-between items-center sticky top-0 z-50 bg-black shadow-lg border-b border-gray-100">
        <Link href="/" className="group relative z-10">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-6">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent text-white transition-all duration-300">
              OG<span className="text-[#25d442]">nite</span>
            </h1>
          </div>
        </Link>

        <div className="relative z-10 flex items-center space-x-4">
          <div className="flex items-center space-x-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-3 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-400 transition-all duration-300 shadow-sm hover:shadow-md">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-gray-800 placeholder-gray-500 outline-none text-sm w-64 font-medium"
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

          <div className="flex items-center space-x-2 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-3">
            <Filter className="w-4 h-4 text-emerald-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-gray-800 text-sm font-medium outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Offer Extended</option>
              <option value="offer_accepted">Offer Accepted</option>
              <option value="offer_denied">Offer Declined</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-3">
            <SortAsc className="w-4 h-4 text-emerald-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-gray-800 text-sm font-medium outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </div>

        <Link href={`/dashboard/recruiter/${username}/applications`} className="group relative z-10">
          <button className="flex items-center space-x-3 text-gray-700 hover:text-emerald-700 transition-all duration-300 font-semibold px-6 py-3 rounded-2xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 group-hover:shadow-lg backdrop-blur-sm bg-white/50">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>All Applications</span>
          </button>
        </Link>
      </nav>

      {/* Job Details Header */}
      {jobDetails && (
        <div className="relative z-10 p-8 pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h1 className="text-3xl font-black text-blue-900 mb-2">{jobDetails.title}</h1>
                      <p className="text-blue-700 font-medium">Applications for this position</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">{jobDetails.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">{formatSalary(jobDetails.salary)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">{jobDetails.duration_of_internship} months</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">{jobDetails.number_of_slots} slot{jobDetails.number_of_slots !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-700 text-sm font-medium">Posted</div>
                  <div className="text-blue-900 font-bold">{timeAgo(jobDetails.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{applications.length}</p>
                    <p className="text-blue-600 text-sm font-medium">Total Applications</p>
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
                    <p className="text-amber-600 text-sm font-medium">Pending Review</p>
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
                    <p className="text-green-600 text-sm font-medium">Offers Extended</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">{applications.filter(a => a.status === 'offer_accepted').length}</p>
                    <p className="text-emerald-600 text-sm font-medium">Confirmed Hires</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border border-red-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">{applications.filter(a => a.status === 'rejected').length}</p>
                    <p className="text-red-600 text-sm font-medium">Rejected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Grid */}
      <main className="relative z-10 px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {filteredAndSortedApplications.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center mt-16">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  {searchQuery || statusFilter !== 'all' ? 'No matching applications found' : 'No applications yet'}
                </h3>
                <p className="text-gray-600 max-w-md">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search terms or filters to find applications.'
                    : 'Candidates will appear here when they apply to this job posting.'
                  }
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Clear filters & show all
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedApplications.map((app, index) => {
                const candidateName = app.candidate || 'Unknown Candidate';
                const statusConfig = getStatusConfig(app.status);
                const StatusIcon = statusConfig.icon;
                const isProcessing = processingId === app.id;
                const showContactDetails = app.status === 'offer_accepted';
                
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
                      {/* Candidate Header */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3 flex-1">
                            {/* Profile Picture Placeholder */}
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors duration-300 leading-tight">
                                {candidateName}
                              </h3>
                              <p className="text-emerald-400 font-semibold text-sm">
                                Candidate
                              </p>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-400 text-xs">{app.duration_of_internship} months duration</span>
                              </div>
                            </div>
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

                      {/* Application Info */}
                      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-medium text-sm">Applied {timeAgo(app.applied_at)}</span>
                          </div>
                          {app.resume && (
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-300 text-sm">Resume attached</span>
                            </div>
                          )}
                          {app.cover_letter && (
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-4 h-4 text-purple-400" />
                              <span className="text-purple-300 text-sm">Cover letter included</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Details for Confirmed Hires */}
                      {showContactDetails && (
                        <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 rounded-xl p-3 border border-emerald-600/30">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-300 font-medium text-sm">Contact Available</span>
                            </div>
                            <p className="text-emerald-200 text-xs">Contact details accessible in full view</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {/* View Details Button */}
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Application</span>
                        </button>

                        {/* Accept/Reject Buttons for Pending Applications */}
                        {app.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => acceptApplication(app.id)}
                              disabled={isProcessing}
                              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-3 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed text-sm"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => rejectApplication(app.id)}
                              disabled={isProcessing}
                              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-3 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed text-sm"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Detailed Application Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedApplication.candidate || 'Unknown Candidate'}
                    </h2>
                    <p className="text-emerald-600 font-semibold">
                      Application for {jobDetails?.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Status Badge in Modal */}
              <div className="mt-4">
                <div className={`${getStatusConfig(selectedApplication.status).bg} ${getStatusConfig(selectedApplication.status).border} border rounded-xl p-3 inline-flex items-center space-x-2`}>
                  {React.createElement(getStatusConfig(selectedApplication.status).icon, {
                    className: `w-5 h-5 ${getStatusConfig(selectedApplication.status).text}`
                  })}
                  <span className={`${getStatusConfig(selectedApplication.status).text} font-bold`}>
                    {getStatusConfig(selectedApplication.status).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Applied Job Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center space-x-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-blue-900">Applied Position</h3>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-gray-900">{jobDetails?.title}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">{jobDetails?.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Applied {timeAgo(selectedApplication.applied_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">{formatSalary(jobDetails?.salary)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">{selectedApplication.duration_of_internship} months duration</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm">{jobDetails?.description}</p>
                  </div>
                </div>
              </div>

              {/* Candidate Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-emerald-900">Candidate Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="text-gray-600 font-medium">Full Name</label>
                      <p className="text-gray-900 font-semibold">
                        {selectedApplication.candidate || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-medium">Application Status</label>
                      <p className="text-gray-900 font-semibold">
                        {getStatusConfig(selectedApplication.status).label}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-medium">Internship Duration</label>
                      <p className="text-gray-900 font-semibold">
                        {selectedApplication.duration_of_internship} months
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">Contact Information</h3>
                  </div>
                  {selectedApplication.status === 'offer_accepted' ? (
                    <div className="space-y-3 text-sm">
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <Phone className="w-8 h-8 text-purple-600" />
                          <div>
                            <p className="text-gray-900 font-semibold">Contact details available</p>
                            <p className="text-gray-600 text-xs">Full contact information will be provided via separate communication</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <Shield className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-gray-600 font-medium">Contact details available after offer acceptance</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Skills Section */}
              {jobDetails?.required_skills && jobDetails.required_skills.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-yellow-900">Required Skills for This Position</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.required_skills.map((skill, idx) => (
                      <span key={idx} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl font-semibold border border-yellow-200 text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover Letter */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-bold text-indigo-900">Cover Letter</h3>
                    </div>
                    {selectedApplication.cover_letter && (
                      <button
                        onClick={() => {
                          // Placeholder for viewing cover letter
                          toast.info('Cover letter viewing functionality will be implemented');
                        }}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                  {selectedApplication.cover_letter ? (
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {selectedApplication.cover_letter.substring(0, 150)}...
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">No cover letter provided</p>
                  )}
                </div>

                {/* Resume */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Download className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-green-900">Resume</h3>
                    </div>
                    {selectedApplication.resume && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // Placeholder for viewing resume
                            toast.info('Resume viewing functionality will be implemented');
                          }}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            // Placeholder for downloading resume
                            window.open(`${API_URL}${selectedApplication.resume}`, '_blank');
                          }}
                          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedApplication.resume ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">Resume.pdf</p>
                        <p className="text-gray-500 text-xs">PDF Document</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No resume uploaded</p>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      acceptApplication(selectedApplication.id);
                      setSelectedApplication(null);
                    }}
                    disabled={processingId === selectedApplication.id}
                    className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {processingId === selectedApplication.id ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        <span>Accept Application</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      rejectApplication(selectedApplication.id);
                      setSelectedApplication(null);
                    }}
                    disabled={processingId === selectedApplication.id}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    <UserX className="w-5 h-5" />
                    <span>Reject Application</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
      `}</style>
    </div>
  );
}