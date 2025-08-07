'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search, Clock, DollarSign, Users, MapPin, ArrowLeft, ArrowRight, Eye, Building, Calendar, Hash, Briefcase, Star, Upload, X, FileText, Plus, PenTool } from 'lucide-react';
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

  // Candidate profile data
  const [candidateProfile, setCandidateProfile] = useState(null);

  // Manual application form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [newSkills, setNewSkills] = useState(['']);
  const [selectedDuration, setSelectedDuration] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Quick apply duration modal state
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [quickApplyDuration, setQuickApplyDuration] = useState('');

  // Cover letter state for both quick and manual apply
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [coverLetterType, setCoverLetterType] = useState('text'); // 'text' or 'file'
  
  // Quick apply cover letter state
  const [quickApplyIncludeCoverLetter, setQuickApplyIncludeCoverLetter] = useState(false);
  const [quickApplyCoverLetter, setQuickApplyCoverLetter] = useState('');
  const [quickApplyCoverLetterFile, setQuickApplyCoverLetterFile] = useState(null);
  const [quickApplyCoverLetterType, setQuickApplyCoverLetterType] = useState('text');

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
        // Only set default Content-Type if it's not FormData
        ...(!(options.data instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
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

  // Fetch candidate profile
  const fetchCandidateProfile = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/candidates/profile/`, {
        method: 'GET',
      });

      if (response && response.status === 200) {
        console.log('Candidate profile:', response.data);
        setCandidateProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching candidate profile:', error);
      // Don't show error toast as this is background fetch
      // User can still apply but might need to provide more info
    }
  };

  // FIXED: Download profile resume as blob
  const downloadProfileResume = async () => {
    if (!candidateProfile?.resume) {
      console.error('No resume found in profile');
      return null;
    }

    try {
      console.log('Downloading profile resume from:', candidateProfile.resume);
      
      // Make authenticated request to download the resume file
      const response = await makeAuthenticatedRequest(candidateProfile.resume, {
        method: 'GET',
        responseType: 'blob', // Important: get response as blob
      });

      if (response && response.status === 200) {
        // Create a blob from the response data
        const blob = response.data;
        console.log('Resume blob downloaded:', blob.size, 'bytes');
        return blob;
      } else {
        console.error('Failed to download resume:', response?.status);
        return null;
      }
    } catch (error) {
      console.error('Error downloading profile resume:', error);
      return null;
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
    fetchCandidateProfile();
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

  // FIXED: Auto Apply - Uses profile resume automatically
  const handleAutoApply = async (jobId) => {
    if (!jobId) {
      toast.error('Job ID is missing.');
      return;
    }
    if (!quickApplyDuration) {
      toast.error('Please select your preferred duration.');
      return;
    }

    // Check if candidate has a resume in their profile
    if (!candidateProfile?.resume) {
      toast.error('No resume found in your profile. Please use Custom Apply to upload a resume or update your profile.');
      return;
    }

    setApplying(true);

    try {
      // FIXED: Download the profile resume first
      console.log('Downloading profile resume for quick apply...');
      const resumeBlob = await downloadProfileResume();
      
      if (!resumeBlob) {
        toast.error('Failed to download your profile resume. Please try Custom Apply instead.');
        return;
      }

      // Create FormData for auto apply
      const formData = new FormData();

      // FIXED: Add the profile resume as a file
      // Extract filename from URL or use a default name
      let resumeFilename = 'resume.pdf';
      if (candidateProfile.resume) {
        const urlParts = candidateProfile.resume.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          resumeFilename = lastPart;
        }
      }
      
      formData.append('resume', resumeBlob, resumeFilename);

      // Add duration as required field
      formData.append('duration_of_internship', quickApplyDuration);

      // Handle cover letter for quick apply (optional)
      if (quickApplyIncludeCoverLetter) {
        if (quickApplyCoverLetterType === 'text' && quickApplyCoverLetter.trim()) {
          // For text cover letter, create a blob and append as file
          const coverLetterBlob = new Blob([quickApplyCoverLetter.trim()], { type: 'text/plain' });
          formData.append('cover_letter', coverLetterBlob, 'cover_letter.txt');
        } else if (quickApplyCoverLetterType === 'file' && quickApplyCoverLetterFile) {
          formData.append('cover_letter', quickApplyCoverLetterFile, quickApplyCoverLetterFile.name);
        }
      }

      console.log('Auto Apply FormData prepared with profile resume');
      
      // Debug FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File || pair[1] instanceof Blob ? `${pair[1].constructor.name} (${pair[1].size} bytes)` : pair[1]));
      }

      const response = await makeAuthenticatedRequest(`${API_URL}api/candidates/apply/${jobId}/`, {
        method: 'POST',
        data: formData,
      });

      if (response && response.status === 201) {
        toast.success('Quick application submitted successfully!', {
          duration: 5000,
          description: "Your application has been sent using your profile resume!"
        });
        
        // Reset states and close modals
        resetQuickApplyForm();
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      console.error('Error response:', error.response?.data);
      handleApplicationError(error);
    } finally {
      setApplying(false);
    }
  };

  // Manual Apply - Upload custom resume (unchanged)
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
      // Create FormData for manual apply with file upload
      const formData = new FormData();
      
      // Add the resume file (this will be uploaded and stored)
      formData.append('resume', selectedFile, selectedFile.name);
      
      // Add core fields
      formData.append('duration_of_internship', selectedDuration);
      
      // Additional skills as JSON array (optional)
      if (validSkills.length > 0) {
        formData.append('additional_skills', JSON.stringify(validSkills));
      }
      
      // Handle cover letter for manual apply (optional)
      if (includeCoverLetter) {
        if (coverLetterType === 'text' && coverLetter.trim()) {
          // For text cover letter, create a blob and append as file
          const coverLetterBlob = new Blob([coverLetter.trim()], { type: 'text/plain' });
          formData.append('cover_letter', coverLetterBlob, 'cover_letter.txt');
        } else if (coverLetterType === 'file' && coverLetterFile) {
          formData.append('cover_letter', coverLetterFile, coverLetterFile.name);
        }
      }

      console.log('Manual Apply FormData prepared');
      
      // Debug FormData contents
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      const response = await makeAuthenticatedRequest(`${API_URL}api/candidates/apply/${applyingJob.id}/`, {
        method: 'POST',
        data: formData,
      });

      if (response && response.status === 201) {
        toast.success('Custom application submitted successfully!', {
          duration: 5000,
          description: "Your custom application has been sent to the recruiter!"
        });
        
        // Reset all form states and close modals
        resetManualApplyForm();
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      console.error('Error response:', error.response?.data);
      handleApplicationError(error);
    } finally {
      setApplying(false);
    }
  };

  // Helper function to handle application errors
  const handleApplicationError = (error) => {
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      console.log('Detailed error data:', errorData);
      
      let errorMessage = 'Application failed. Please check your details.';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === 'object') {
        const errorMessages = [];
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            errorMessages.push(`${field}: ${errorData[field].join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${errorData[field]}`);
          }
        });
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('; ');
        }
      }
      
      toast.error(errorMessage);
    } else if (error.response?.status === 401) {
      toast.error('Authentication failed. Please log in again.');
      clearTokens();
      router.push('/login');
    } else {
      toast.error('Failed to submit application. Please try again.');
    }
  };

  // Reset form functions
  const resetQuickApplyForm = () => {
    setShowQuickApplyModal(false);
    setShowModal(false);
    setSelectedJob(null);
    setApplyingJob(null);
    setQuickApplyDuration('');
    setQuickApplyCoverLetter('');
    setQuickApplyCoverLetterFile(null);
    setQuickApplyIncludeCoverLetter(false);
    setQuickApplyCoverLetterType('text');
  };

  const resetManualApplyForm = () => {
    setShowManualModal(false);
    setShowModal(false);
    setSelectedJob(null);
    setApplyingJob(null);
    setSelectedFile(null);
    setNewSkills(['']);
    setSelectedDuration('');
    setCoverLetter('');
    setCoverLetterFile(null);
    setIncludeCoverLetter(false);
    setCoverLetterType('text');
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
      
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // More specific file type validation
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf') || 
          file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
        
        // Check file size (e.g., max 10MB)
        if (file.size <= 10 * 1024 * 1024) {
          setSelectedFile(file);
          console.log('File accepted:', file);
        } else {
          toast.error('File size must be less than 10MB.');
          e.target.value = ''; // Clear the input
        }
      } else {
        toast.error('Please upload a PDF or Word document file.');
        e.target.value = ''; // Clear the input
      }
    }
  };

  // Cover letter file handlers
  const handleCoverLetterFileChange = (e, isQuickApply = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.txt')) {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit for cover letters
          if (isQuickApply) {
            setQuickApplyCoverLetterFile(file);
          } else {
            setCoverLetterFile(file);
          }
        } else {
          toast.error('Cover letter file size must be less than 5MB.');
          e.target.value = '';
        }
      } else {
        toast.error('Please upload a PDF, Word document, or text file for cover letter.');
        e.target.value = '';
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

  // Enhanced Currency formatting function - Updated to handle unpaid cases
  const formatSalary = (salary_from, currency = 'USD') => {
    // Check for unpaid conditions: null, undefined, 0, '0', empty string, or NaN
    if (!salary_from ||
        salary_from === 0 ||
        salary_from === '0' ||
        salary_from === '' ||
        isNaN(salary_from)) {
      return 'Unpaid';
    }

    // Currency symbols mapping
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

    const symbol = currencySymbols[currency] || currency;
    const amount = typeof salary_from === 'string' ? parseFloat(salary_from) : salary_from;

    // Double check after parsing
    if (isNaN(amount) || amount <= 0) {
      return 'Unpaid';
    }

    return `${symbol}${amount.toLocaleString()}`;
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

                {/* Premium Salary Display - Updated styling for unpaid */}
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-semibold">Salary</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${formatSalary(job.salary_from, job.currency) === 'Unpaid' ? 'text-amber-400' : 'text-green-300'}`}>
                        {formatSalary(job.salary_from, job.currency)}
                      </div>
                      {formatSalary(job.salary_from, job.currency) !== 'Unpaid' && (
                        <div className="text-xs text-gray-400">{job.payment_frequency}</div>
                      )}
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
                  {/* Compensation Card - Updated for unpaid display */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Compensation</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className={`text-3xl font-black ${formatSalary(selectedJob.salary_from, selectedJob.currency) === 'Unpaid' ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatSalary(selectedJob.salary_from, selectedJob.currency)}
                        </div>
                        {formatSalary(selectedJob.salary_from, selectedJob.currency) !== 'Unpaid' && (
                          <div className="text-gray-600 font-medium">{selectedJob.payment_frequency}</div>
                        )}
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
                
                {/* Show profile status */}
                {candidateProfile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-left">
                    <p className="text-xs text-blue-800 font-medium mb-2">Using your profile data:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Name: {candidateProfile.user?.first_name} {candidateProfile.user?.last_name}</li>
                      <li>• Email: {candidateProfile.user?.email}</li>
                      {candidateProfile.professional_title && <li>• Title: {candidateProfile.professional_title}</li>}
                      {candidateProfile.skills?.length > 0 && <li>• Skills: {candidateProfile.skills.slice(0, 3).join(', ')}{candidateProfile.skills.length > 3 ? '...' : ''}</li>}
                      {candidateProfile.resume ? (
                        <li className="text-green-700">• ✓ Resume: Available in profile</li>
                      ) : (
                        <li className="text-red-700">• ✗ Resume: Not available in profile</li>
                      )}
                      {candidateProfile.profile_picture && (
                        <li className="text-green-700">• ✓ Profile Picture: Available</li>
                      )}
                    </ul>
                    {!candidateProfile.resume && (
                      <p className="text-xs text-red-600 mt-2 italic">
                        Please use Custom Apply to upload a resume or update your profile first.
                      </p>
                    )}
                  </div>
                )}
                
                {!candidateProfile && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-amber-700">
                      ⚠ Loading profile data...
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Quick Apply - Uses profile resume */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowQuickApplyModal(true);
                  }}
                  disabled={applying || !candidateProfile?.resume}
                  className={`w-full py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed ${
                    candidateProfile?.resume 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">
                    {candidateProfile?.resume ? 'Quick Apply (Use Profile Resume)' : 'Quick Apply (Resume Required)'}
                  </span>
                </button>

                {/* Manual Apply - Upload custom resume */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowManualModal(true);
                  }}
                  disabled={applying}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed font-semibold"
                >
                  <Upload className="w-5 h-5" />
                  <span>Custom Apply (Upload Resume)</span>
                </button>

                {!candidateProfile?.resume && (
                  <div className="text-center">
                    <p className="text-xs text-amber-600">
                      💡 Tip: Add a resume to your profile to enable Quick Apply for future applications
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Apply Modal - Uses profile resume */}
      {showQuickApplyModal && applyingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[70] p-4 overflow-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl p-8 relative border border-gray-200/50 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                resetQuickApplyForm();
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
                <p className="text-gray-600">Using your profile resume</p>
                <p className="text-sm text-emerald-600 font-medium">
                  ✓ Resume: {candidateProfile?.resume ? 'Available from profile' : 'Not available'}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAutoApply(applyingJob.id); }} className="space-y-6">
                {/* Duration Selection - Mandatory */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Preferred Internship Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickApplyDuration}
                    onChange={(e) => setQuickApplyDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                  >
                    <option value="">Select duration...</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="12">12</option>
                  </select>
                </div>

                {/* Cover Letter Option - Optional */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="quickIncludeCoverLetter"
                      checked={quickApplyIncludeCoverLetter}
                      onChange={(e) => setQuickApplyIncludeCoverLetter(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="quickIncludeCoverLetter" className="text-sm font-medium text-gray-700">
                      Include Cover Letter (Optional)
                    </label>
                  </div>

                  {quickApplyIncludeCoverLetter && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                      {/* Cover Letter Type Selection */}
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="text"
                            checked={quickApplyCoverLetterType === 'text'}
                            onChange={(e) => setQuickApplyCoverLetterType(e.target.value)}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span className="text-sm font-medium text-gray-700">Write Text</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="file"
                            checked={quickApplyCoverLetterType === 'file'}
                            onChange={(e) => setQuickApplyCoverLetterType(e.target.value)}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span className="text-sm font-medium text-gray-700">Upload File</span>
                        </label>
                      </div>

                      {quickApplyCoverLetterType === 'text' ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                          <textarea
                            value={quickApplyCoverLetter}
                            onChange={(e) => setQuickApplyCoverLetter(e.target.value)}
                            placeholder="Write your cover letter here..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                          />
                          <p className="text-xs text-gray-500">{quickApplyCoverLetter.length}/2000 characters</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Upload Cover Letter</label>
                          <div className="relative">
                            <input
                              type="file"
                              onChange={(e) => handleCoverLetterFileChange(e, true)}
                              accept=".pdf,.doc,.docx,.txt"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                            />
                          </div>
                          {quickApplyCoverLetterFile && (
                            <p className="text-xs text-green-600">✓ {quickApplyCoverLetterFile.name}</p>
                          )}
                          <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX, TXT (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => resetQuickApplyForm()}
                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying || !quickApplyDuration}
                    className="px-12 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        <span>Quick Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manual Apply Modal - Upload custom resume */}
      {showManualModal && applyingJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[70] p-4 overflow-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl p-8 relative border border-gray-200/50 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => resetManualApplyForm()}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              ×
            </button>

            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Custom Apply</h2>
                <p className="text-gray-600">Upload your resume and customize your application</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleManualApply(); }} className="space-y-6">
                {/* Resume Upload - Mandatory */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Upload Resume <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                      dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
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
                      required
                    />
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      {selectedFile ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-green-600">✓ {selectedFile.name}</p>
                          <p className="text-xs text-gray-500">File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="text-xs text-red-600 hover:text-red-700 underline"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Drag and drop your resume here</p>
                          <p className="text-xs text-gray-500 mt-1">or click to browse (PDF, DOC, DOCX - Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Duration Selection - Mandatory */}
                <div className="space-y-3">
  <label className="block text-sm font-semibold text-gray-700">
    Preferred Internship Duration <span className="text-red-500">*</span>
  </label>
  <select
    value={selectedDuration}
    onChange={(e) => setSelectedDuration(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    required
  >
    <option value="">Select duration...</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5">5</option>
    <option value="6">6</option>
    <option value="12">12</option>
  </select>
</div>

                {/* Additional Skills - Optional */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Additional Skills (Optional)
                  </label>
                  <p className="text-xs text-gray-600">Add skills not covered in your profile</p>
                  <div className="space-y-3">
                    {newSkills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => updateSkill(index, e.target.value)}
                          placeholder="Enter a skill"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          disabled={newSkills.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another Skill</span>
                    </button>
                  </div>
                </div>

                {/* Cover Letter Option - Optional */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeCoverLetter"
                      checked={includeCoverLetter}
                      onChange={(e) => setIncludeCoverLetter(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeCoverLetter" className="text-sm font-medium text-gray-700">
                      Include Cover Letter (Optional)
                    </label>
                  </div>

                  {includeCoverLetter && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                      {/* Cover Letter Type Selection */}
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="text"
                            checked={coverLetterType === 'text'}
                            onChange={(e) => setCoverLetterType(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700">Write Text</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="file"
                            checked={coverLetterType === 'file'}
                            onChange={(e) => setCoverLetterType(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700">Upload File</span>
                        </label>
                      </div>

                      {coverLetterType === 'text' ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                          <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Write your cover letter here..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          />
                          <p className="text-xs text-gray-500">{coverLetter.length}/2000 characters</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Upload Cover Letter</label>
                          <div className="relative">
                            <input
                              type="file"
                              onChange={(e) => handleCoverLetterFileChange(e, false)}
                              accept=".pdf,.doc,.docx,.txt"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {coverLetterFile && (
                            <p className="text-xs text-green-600">✓ {coverLetterFile.name}</p>
                          )}
                          <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX, TXT (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => resetManualApplyForm()}
                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying || !selectedFile || !selectedDuration}
                    className="px-12 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
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