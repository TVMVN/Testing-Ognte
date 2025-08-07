'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {toast} from "sonner";
import Link from 'next/link';
import { Search, Clock, DollarSign, Users, MapPin, ArrowLeft, ArrowRight, Trash2, Eye, Building, Calendar, Hash, Briefcase, Star, Edit3, Power, PowerOff } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';

// Enhanced time ago formatting function
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

// Currency formatting function
const formatSalary = (salary, currency = 'USD') => {
  if (!salary || salary === 0 || salary === '0') return 'Unpaid';
  
  // Currency symbols mapping
  const currencySymbols = {
    'dollar': '$',
    'euro': '€',
    'pound': '£',
    'naira': '₦',
   
  };
  
  const symbol = currencySymbols[currency] || currency;
  const amount = typeof salary === 'string' ? salary : salary.toLocaleString();
  
  return `${symbol}${amount}`;
};

// Location/Remote formatting
const formatLocation = (location, isRemote) => {
  if (isRemote) return 'Remote';
  return location || 'Not specified';
};

// Authentication utils
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

const refreshAccessToken = async (router) => {
  const refresh = getRefreshToken();
  if (!refresh) {
    ErrorHandler.showErrorToast({ response: { status: 401 } }, 'Token refresh - no refresh token');
    clearTokens();
    router.push('/login');
    return null;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access);
      return data.access;
    } else {
      throw { response: { status: res.status } };
    }
  } catch (error) {
    ErrorHandler.showErrorToast(error, 'Token refresh failed');
    clearTokens();
    router.push('/login');
    return null;
  }
};

const makeAuthenticatedRequest = async (url, options = {}, router) => {
  let token = getAccessToken();
  if (!token) {
    
    console.warn("🔒 No token found. Redirecting to login.");
    router.push('/login');
    return null;
  }
  try {
    let response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 401) {
      console.log('🔁 Token expired, refreshing...');
      token = await refreshAccessToken(router);
      if (!token) return null;
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    }
    return response;
  } catch (err) {
    console.error("❌ Request failed:", err);
    return null;
  }
};

class ErrorHandler {
  static showErrorToast(error, context = '') {
    console.error(`⚠️ ${context} - API Error:`, error);
  }
}

export default function ListingsPage() {
  const router = useRouter();
  const { username } = useParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch jobs from API
  const fetchJobs = async () => {
    setLoading(true);
    const response = await makeAuthenticatedRequest(
      `${BACKEND_URL}/api/recruiters/jobs/`,
      { method: 'GET' },
      router
    );
    if (!response) return;
    if (!response.ok) {
      ErrorHandler.showErrorToast({ response }, 'Fetching jobs');
      setLoading(false);
      return;
    }
    const data = await response.json();
    const jobsData = (data.results || []).map(job => ({
      id: job.id,
      jobTitle: job.title,
      jobDescription: job.description,
      skills: job.required_skills || [],
      createdAt: job.created_at,
      salary_from: job.salary?.amount || 0,
      currency: job.salary?.currency || 'USD',
      location: job.location,
      isRemote: job.is_remote || false,
      availableSpots: job.number_of_slots || 1,
      duration: job.duration || 'Not specified',
      industry: job.industry || 'Technology',
      payment_frequency: job.salary?.payment_frequency || 'Monthly',
      duration: job.duration_of_internship || 'Not specified',
      is_active: job.is_active !== undefined ? job.is_active : true, // Add active status
    }));
    setJobs(jobsData);
    setLoading(false);
  };

  // Toggle job active status
  const toggleJobStatus = async (jobId, currentStatus) => {
    const response = await makeAuthenticatedRequest(
      `${BACKEND_URL}/api/recruiters/jobs/${jobId}/toggle-active/`,
      { method: 'POST' },
      router
    );
    
    if (response && response.ok) {
      // Update the job status in the local state
      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, is_active: !currentStatus }
          : job
      ));
      
      // Update selected job if it's the one being toggled
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, is_active: !currentStatus });
      }

      toast.success(
        `Job ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
        {
          duration: 4000,
          description: `Your job posting is now ${!currentStatus ? 'visible to candidates' : 'hidden from candidates'}.`
        }
      );
    } else {
      toast.error('Failed to update job status', {
        duration: 4000,
        description: 'Please try again later.'
      });
      ErrorHandler.showErrorToast({ response }, 'Toggling job status');
    }
  };

  // Handle edit job - redirect to edit page using the Django URL
  const handleEditJob = (job) => {
    // Navigate to the edit page using the Django edit endpoint URL pattern
    router.push(`/dashboard/recruiter/${username}/edit-job/${job.id}`);
  };

  // Delete job
  const deleteJob = async (jobId) => {
    const response = await makeAuthenticatedRequest(
      `${BACKEND_URL}/api/recruiters/jobs/${jobId}/`,
      { method: 'DELETE' },
      router
    );
    if (response && response.ok) {
      setJobs(jobs.filter(job => job.id !== jobId));
      setSelectedJob(null);

      toast.success("Internship post deleted successfully!",{
        duration: 5000,
        description: "Your internship post has been successfully deleted! It is no longer visible to candidates" 
      });
    } else {
      ErrorHandler.showErrorToast({ response }, 'Deleting job');
    }
  };

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job =>
    [job.jobTitle, job.skills.join(', '), job.jobDescription]
      .some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Loading state
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
          <p className="text-2xl text-gray-800 font-bold tracking-wide animate-pulse">Loading Your Job Listings</p>
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
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-gradient-to-br from-green-200 to-emerald-100 rounded-full opacity-35 animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Sophisticated Navbar */}
      <nav className="relative px-8 h-20 w-full flex justify-between items-center sticky top-0 z-50 bg-black  shadow-lg border-b border-gray-100">
        
        <Link href="/" className="group relative z-10">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-6">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-black   bg-clip-text text-transparent text-white transition-all duration-300">
              OG<span className="text-[#25d442]">nite</span>
            </h1>
          </div>
        </Link>

        <div className="relative z-10 flex items-center space-x-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-3 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <Search className="w-5 h-5 text-emerald-600" />
          <input
            type="text"
            placeholder="Search jobs, skills, descriptions..."
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

        <Link href={`/dashboard/recruiter/${username}/`} className="group relative z-10">
          <button className="flex items-center space-x-3 text-gray-700 hover:text-emerald-700 transition-all duration-300 font-semibold px-6 py-3 rounded-2xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 group-hover:shadow-lg backdrop-blur-sm bg-white/50">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Dashboard</span>
          </button>
        </Link>
      </nav>

      {/* Enhanced Job Cards Grid */}
      <main className="relative z-10 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 min-h-[calc(100vh-80px)]">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center mt-32">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                <Briefcase className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {searchQuery ? 'No matching jobs found' : 'No job postings yet'}
              </h3>
              <p className="text-gray-600 max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all available positions.' 
                  : 'Your job listings will appear here once you create them.'
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
          filteredJobs.map((job, index) => (
            <div
              key={job.id}
              className={`group relative ${job.is_active ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-600 via-gray-500 to-gray-600 opacity-75'} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border ${job.is_active ? 'border-gray-700/50 hover:border-emerald-500/50' : 'border-gray-500/50'} transform hover:-translate-y-2 hover:rotate-1`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Status indicator */}
              <div className={`absolute top-4 right-4 w-3 h-3 ${job.is_active ? 'bg-green-500' : 'bg-red-500'} rounded-full ${job.is_active ? 'animate-pulse' : ''}`}></div>
              
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
              
              <div className="relative z-10 space-y-4">
                {/* Header with premium indicator */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors duration-300 leading-tight line-clamp-2">
                        {job.jobTitle}
                        {!job.is_active && <span className="text-red-400 text-sm ml-2">(Inactive)</span>}
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{timeAgo(job.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {formatLocation(job.location, job.isRemote)}
                      </span>
                      <span className="bg-gray-700/80 text-gray-300 px-2 py-1 rounded-lg text-xs border border-gray-600">
                        {job.industry}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Job Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <Hash className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-medium">Spots</span>
                    </div>
                    <span className="text-white font-semibold">{job.availableSpots}</span>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-medium">Duration</span>
                    </div>
                    <span className="text-white font-semibold text-xs">{job.duration} months</span>
                  </div>
                </div>

                {/* Premium Skills Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 text-sm font-semibold">Required Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.length > 0 ? (
                      job.skills.slice(0, 3).map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 text-emerald-300 px-3 py-1 rounded-full text-xs border border-emerald-500/30 backdrop-blur-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs italic">Skills not specified</span>
                    )}
                    {job.skills.length > 3 && (
                      <span className="text-emerald-400 text-xs font-medium bg-emerald-600/10 px-2 py-1 rounded-full border border-emerald-500/20">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Premium Salary Display */}
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-semibold">Salary</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${job.salary_from === 0 || job.salary_from === '0' ? 'text-amber-400' : 'text-green-300'}`}>
                        {formatSalary(job.salary_from, job.currency)}
                      </div>
                      <div className="text-xs text-gray-400">{job.payment_frequency}</div>
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                    {job.jobDescription}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-4">
                  {/* Toggle and Edit buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleJobStatus(job.id, job.is_active)}
                      className={`flex-1 ${job.is_active 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                      } text-white text-sm font-bold rounded-2xl py-3 px-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105 transform`}
                      title={job.is_active ? 'Deactivate Job' : 'Activate Job'}
                    >
                      {job.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      <span>{job.is_active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button
                      onClick={() => handleEditJob(job)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-2xl py-3 px-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 group-hover:scale-105 transform"
                      title="Edit Job"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 text-white text-sm font-bold rounded-2xl py-4 px-4 shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3 group-hover:scale-105 transform"
                    aria-label={`View details for ${job.jobTitle}`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Details</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
              <div className="absolute top-1/2 left-0 w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-600 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))
        )}
      </main>

      {/* Ultra-Premium Job Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4 overflow-auto"
          aria-modal="true"
          role="dialog"
          aria-labelledby="job-modal-title"
          tabIndex={-1}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full p-8 relative text-gray-800 border border-gray-200/50 max-h-[90vh] overflow-y-auto">
            {/* Premium close button */}
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200 shadow-sm"
              aria-label="Close job details"
            >
              ×
            </button>

            <div className="space-y-8">
              {/* Premium Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl"></div>
                <div className="relative p-6 space-y-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <h2 id="job-modal-title" className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {selectedJob.jobTitle}
                        </h2>
                        <div className={`w-3 h-3 ${selectedJob.is_active ? 'bg-green-500' : 'bg-red-500'} rounded-full ${selectedJob.is_active ? 'animate-pulse' : ''}`}></div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          selectedJob.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedJob.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Posted {timeAgo(selectedJob.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg text-center">
                        {formatLocation(selectedJob.location, selectedJob.isRemote)}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-center">
                        {selectedJob.industry}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Content Grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Skills Section */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Required Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedJob.skills.length > 0 ? (
                        selectedJob.skills.map((skill, index) => (
                          <span key={index} className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-200 shadow-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic bg-gray-100 px-4 py-2 rounded-xl">No specific skills listed</span>
                      )}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Job Description</h3>
                    </div>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                        {selectedJob.jobDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Compensation Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Compensation</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className={`text-3xl font-black ${selectedJob.salary_from === 0 || selectedJob.salary_from === '0' ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatSalary(selectedJob.salary_from, selectedJob.currency)}
                        </div>
                        <div className="text-gray-600 font-medium">{selectedJob.payment_frequency}</div>
                      </div>
                    </div>
                  </div>

                  {/* Job Details Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border  border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Job Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Hash className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Available Spots</span>
                        </div>
                        <span className="text-gray-900 font-bold">{selectedJob.availableSpots}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Duration</span>
                        </div>
                        <span className="text-gray-900 font-bold text-sm">{selectedJob.duration}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Industry</span>
                        </div>
                        <span className="text-gray-900 font-bold text-sm">{selectedJob.industry}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                          {selectedJob.is_active ? (
                            <Power className="w-5 h-5 text-green-600" />
                          ) : (
                            <PowerOff className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-gray-700 font-medium">Status</span>
                        </div>
                        <span className={`font-bold text-sm ${selectedJob.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedJob.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-200">
                        <div className="text-2xl font-black text-emerald-600">{selectedJob.skills.length}</div>
                        <div className="text-xs text-gray-600 font-medium">Skills Required</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-200">
                        <div className="text-2xl font-black text-emerald-600">{Math.ceil(Math.random() * 50 + 10)}</div>
                        <div className="text-xs text-gray-600 font-medium">Applications</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Toggle Status Button */}
                  <button
                    onClick={() => toggleJobStatus(selectedJob.id, selectedJob.is_active)}
                    className={`${selectedJob.is_active 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    } px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 text-white flex items-center space-x-3 hover:shadow-2xl transform hover:-translate-y-1`}
                  >
                    {selectedJob.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                    <span>{selectedJob.is_active ? 'Deactivate Job' : 'Activate Job'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditJob(selectedJob)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 text-white flex items-center space-x-3 hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Edit Job</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 text-white flex items-center space-x-3 hover:shadow-2xl transform hover:-translate-y-1"
                    onClick={() => deleteJob(selectedJob.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Job Listing</span>
                  </button>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-2xl shadow-lg font-bold transition-all duration-300 border border-gray-300 hover:shadow-xl"
                  >
                    Close
                  </button>
                  
                  <Link
                    href={`/dashboard/recruiter/${username}/`}
                    className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 text-white flex items-center space-x-3 hover:shadow-2xl transform hover:-translate-y-1"
                    onClick={() => setSelectedJob(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                  </Link>

                  <Link
                    href={`/dashboard/recruiter/${username}/applications`}
                    className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 text-white flex items-center space-x-3 hover:shadow-2xl transform hover:-translate-y-1"
                    onClick={() => setSelectedJob(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>View Applications</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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