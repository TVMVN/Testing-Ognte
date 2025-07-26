'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search, Clock, DollarSign, Users, MapPin, ArrowLeft, ArrowRight, Eye, Building, Calendar, Hash, Briefcase, Star, Upload, X, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:8000/';

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

// Calculate days until deadline
const getDaysUntilDeadline = (deadlineString) => {
  const now = new Date();
  const deadline = new Date(deadlineString);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
};

export default function ListingsPage() {
  const { username } = useParams();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [applying, setApplying] = useState(false);
  
  // Manual application form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [newSkills, setNewSkills] = useState(['']);
  const [selectedDuration, setSelectedDuration] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Quick apply duration modal state
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [quickApplyDuration, setQuickApplyDuration] = useState('');

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

    // Configure axios request
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      // First attempt with current token
      let response = await axios(url, config);
      return response;
    } catch (error) {
      // If unauthorized, try to refresh token and retry
      if (error.response?.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        
        if (token) {
          // Retry the request with new token
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
    // Check authentication on component mount
    const token = getAccessToken();
    if (!token) {
      toast.error('Please log in to view job listings.');
      router.push('/login');
      return;
    }
    
    fetchJobs();
  }, [username, router]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Make authenticated request to get jobs directly
      const jobsRes = await makeAuthenticatedRequest(`${API_URL}/api/applications/jobs/`, {
        method: 'GET',
      });

      if (!jobsRes) {
        // Authentication failed, makeAuthenticatedRequest already handled redirect
        return;
      }

      console.log('Jobs API response:', jobsRes.data);

      // Handle paginated response structure
      let jobsData = [];
      
      if (jobsRes.data && jobsRes.data.results && Array.isArray(jobsRes.data.results)) {
        // Paginated response with results array
        jobsData = jobsRes.data.results;
      } else if (jobsRes.data && Array.isArray(jobsRes.data)) {
        // Direct array response
        jobsData = jobsRes.data;
      } else {
        console.error('Unexpected response format:', jobsRes.data);
        toast.error('Unexpected response format from server.');
        setJobs([]);
        return;
      }

      // Transform the data to match the expected format for the UI
      const transformedJobs = jobsData.map(job => ({
        id: job.id,
        jobTitle: job.title,
        skills: job.required_skills || [],
        jobDescription: job.description,
        createdAt: job.created_at,
        salary_from: job.salary?.amount || 0,
        currency: job.salary?.currency || 'USD',
        company_name: job.recruiter?.company_name || 'Company not specified',
        location: job.location,
        isRemote: job.is_remote,
        industry: job.industry,
        availableSpots: job.number_of_slots,
        duration: job.duration_of_internship,
        application_deadline: job.application_deadline,
        is_active: job.is_active,
        recruiter: job.recruiter,
        payment_frequency: job.salary?.payment_frequency || 'Monthly',
      }));

      console.log('Transformed jobs data:', transformedJobs);
      setJobs(transformedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      if (err.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        clearTokens();
        router.push('/login');
      } else {
        toast.error('Failed to fetch job listings. Please try again.');
      }
      setJobs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAutoApply = async (jobId) => {
    if (!jobId) {
      toast.error('Job ID is missing.');
      return;
    }

    if (!quickApplyDuration) {
      toast.error('Please select your preferred duration.');
      return;
    }

    setApplying(true);
    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/applications/apply/`, {
        method: 'POST',
        data: {
          job_id: jobId,
          application_type: 'automatic',
          preferred_duration: quickApplyDuration,
        },
      });

      if (response && response.status === 201) {
        toast.success('Application submitted successfully!', {
          duration: 5000,
          description: "Your application has been sent to the recruiter!"
        });
        setShowQuickApplyModal(false);
        setShowModal(false);
        setSelectedJob(null);
        setApplyingJob(null);
        setQuickApplyDuration('');
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'You may have already applied to this job.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        clearTokens();
        router.push('/login');
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleManualApply = async () => {
    if (!applyingJob?.id) {
      toast.error('Job ID is missing.');
      return;
    }

    if (!selectedFile) {
      toast.error('Please upload a resume.');
      return;
    }

    if (!selectedDuration) {
      toast.error('Please select your preferred duration.');
      return;
    }

    // Filter out empty skills
    const validSkills = newSkills.filter(skill => skill.trim() !== '');

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('job_id', applyingJob.id);
      formData.append('application_type', 'manual');
      formData.append('resume', selectedFile);
      formData.append('preferred_duration', selectedDuration);
      if (validSkills.length > 0) {
        formData.append('additional_skills', JSON.stringify(validSkills));
      }

      const response = await makeAuthenticatedRequest(`${API_URL}/api/applications/apply/`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response && response.status === 201) {
        toast.success('Manual application submitted successfully!', {
          duration: 5000,
          description: "Your custom application has been sent to the recruiter!"
        });
        setShowManualModal(false);
        setShowModal(false);
        setSelectedJob(null);
        setApplyingJob(null);
        // Reset form
        setSelectedFile(null);
        setNewSkills(['']);
        setSelectedDuration('');
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Application failed. Please check your details.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        clearTokens();
        router.push('/login');
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  // File upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.includes('document')) {
        setSelectedFile(file);
      } else {
        toast.error('Please upload a PDF or document file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.type.includes('document')) {
        setSelectedFile(file);
      } else {
        toast.error('Please upload a PDF or document file.');
      }
    }
  };

  // Skills management
  const addSkill = () => {
    setNewSkills([...newSkills, '']);
  };

  const removeSkill = (index) => {
    if (newSkills.length > 1) {
      setNewSkills(newSkills.filter((_, i) => i !== index));
    }
  };

  const updateSkill = (index, value) => {
    const updated = [...newSkills];
    updated[index] = value;
    setNewSkills(updated);
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

  const filteredJobs = jobs.filter((job) =>
    [job.jobTitle, job.skills.join(', '), job.jobDescription]
      .some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

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
          <p className="text-2xl text-gray-800 font-bold tracking-wide animate-pulse">Loading Available Internships</p>
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

        <Link href={`/dashboard/${username}/`} className="group relative z-10">
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
                {searchQuery ? 'No matching jobs found' : 'No internships available'}
              </h3>
              <p className="text-gray-600 max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all available positions.' 
                  : 'Check back later for new internship opportunities.'
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
              className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-700/50 hover:border-emerald-500/50 transform hover:-translate-y-2 hover:rotate-1"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
              
              <div className="relative z-10 space-y-4">
                {/* Header with company info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors duration-300 leading-tight line-clamp-2">
                        {job.jobTitle}
                      </h3>
                      <p className="text-emerald-400 font-semibold text-sm">{job.company_name}</p>
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

                {/* Premium Action Button */}
                <button
                  onClick={() => setSelectedJob(job)}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 text-white text-sm font-bold rounded-2xl py-4 px-4 shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-3 group-hover:scale-105 transform"
                  aria-label={`View details for ${job.jobTitle}`}
                >
                  <Eye className="w-4 h-4" />
                  <span>View & Apply</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
              <div className="absolute top-1/2 left-0 w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-600 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))
        )}
      </main>

      {/* Ultra-Premium Job Details Modal */}
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
                      <h2 id="job-modal-title" className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {selectedJob.jobTitle}
                      </h2>
                      <p className="text-2xl text-emerald-600 font-bold">{selectedJob.company_name}</p>
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
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
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
                        <span className="text-gray-900 font-bold text-sm">{selectedJob.duration} months</span>
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
                          <Clock className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700 font-medium">Deadline</span>
                        </div>
                        <span className={`font-bold text-sm ${
                          getDaysUntilDeadline(selectedJob.application_deadline).includes('Expired') 
                            ? 'text-red-600' 
                            : getDaysUntilDeadline(selectedJob.application_deadline).includes('Today') || getDaysUntilDeadline(selectedJob.application_deadline).includes('1 day')
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}>
                          {getDaysUntilDeadline(selectedJob.application_deadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Apply Button */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all duration-300 border border-gray-300 hover:shadow-lg"
                >
                  Close
                </button>
                
                <button
                  onClick={() => {
                    setApplyingJob(selectedJob);
                    setShowModal(true);
                  }}
                  disabled={!selectedJob.is_active}
                  className={`px-12 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 text-white flex items-center space-x-3 hover:shadow-2xl transform hover:-translate-y-1 ${
                    selectedJob.is_active 
                      ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span>{selectedJob.is_active ? 'Apply Now' : 'Application Closed'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Type Selection Modal */}
      {showModal && applyingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200/50">
            <button
              onClick={() => {
                setShowModal(false);
                setApplyingJob(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              ×
            </button>

            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Apply to {applyingJob.jobTitle}</h2>
                <p className="text-gray-600">Choose your application method</p>
              </div>

              <div className="space-y-4">
                {/* Automatic Apply */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowQuickApplyModal(true);
                  }}
                  disabled={applying}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-emerald-300 disabled:to-green-300 text-white py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">Quick Apply (Use My Profile)</span>
                </button>

                {/* Manual Apply */}
                <button
                  onClick={() => {
                    setShowManualModal(true);
                    setShowModal(false);
                  }}
                  disabled={applying}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-semibold">Custom Apply (Upload Resume)</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Quick Apply uses your existing profile information. Custom Apply allows you to upload a specific resume and add additional details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Apply Duration Selection Modal */}
      {showQuickApplyModal && applyingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[65] p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200/50">
            <button
              onClick={() => {
                setShowQuickApplyModal(false);
                setShowModal(true);
                setQuickApplyDuration('');
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              ×
            </button>

            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Quick Apply</h2>
                <p className="text-gray-600">Select your preferred internship duration</p>
                <p className="text-sm text-emerald-600 font-medium">Applying to: {applyingJob.jobTitle}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <span>Preferred Duration</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickApplyDuration}
                    onChange={(e) => setQuickApplyDuration(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white shadow-sm text-gray-700 font-medium"
                  >
                    <option value="">Select duration in months</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>
                        {month} month{month > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickApplyModal(false);
                      setShowModal(true);
                      setQuickApplyDuration('');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-300 border border-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleAutoApply(applyingJob.id)}
                    disabled={applying || !quickApplyDuration}
                    className="flex-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        <span>Apply Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                This will use your existing profile information along with your selected duration preference.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Application Modal */}
      {showManualModal && applyingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[70] p-4 overflow-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl p-8 relative border border-gray-200/50 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowManualModal(false);
                setShowModal(true);
                // Reset form
                setSelectedFile(null);
                setNewSkills(['']);
                setSelectedDuration('');
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              ×
            </button>

            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Custom Application</h2>
                <p className="text-gray-600">Customize your application for {applyingJob.jobTitle}</p>
              </div>

              <form className="space-y-6">
                {/* Resume Upload */}
                <div className="space-y-3">
                  <label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Upload Resume</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                      dragActive 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : selectedFile 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center space-y-3">
                      {selectedFile ? (
                        <>
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                            <FileText className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-700">{selectedFile.name}</p>
                            <p className="text-sm text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove file
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">Drag & drop your resume here</p>
                            <p className="text-sm text-gray-500">or click to browse files</p>
                          </div>
                          <p className="text-xs text-gray-500">Supports PDF, DOC, DOCX (Max 10MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="space-y-3">
                  <label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <span>Preferred Duration</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white shadow-sm text-gray-700 font-medium"
                  >
                    <option value="">Select duration in months</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>
                        {month} month{month > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Skills */}
                <div className="space-y-3">
                  <label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span>Additional Skills (Optional)</span>
                  </label>
                  <div className="space-y-3">
                    {newSkills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => updateSkill(index, e.target.value)}
                          placeholder="Enter a skill..."
                          className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white shadow-sm"
                        />
                        {newSkills.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add another skill</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualModal(false);
                      setShowModal(true);
                      // Reset form
                      setSelectedFile(null);
                      setNewSkills(['']);
                      setSelectedDuration('');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-bold transition-all duration-300 border border-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleManualApply}
                    disabled={applying || !selectedFile || !selectedDuration}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
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