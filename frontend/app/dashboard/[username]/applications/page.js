'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { toast } from 'sonner'; // Assuming you're using react-hot-toast

const API_URL = 'http://localhost:8000/';

export default function ApplicantsPage() {
  const { username } = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    fetchUserApplications();
  }, [username]);

  const fetchUserApplications = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/api/candidates/my-applications/`, {
        method: 'GET',
      });

      if (response && response.data) {
        // Handle paginated response
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
      // Assuming there's a withdraw endpoint - adjust URL as needed
      const response = await makeAuthenticatedRequest(
        `${API_URL}/api/candidates/applications/${applicationId}/withdraw/`,
        {
          method: 'DELETE', // or 'PATCH' depending on your API design
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

  // Updated filter function to work with the new data structure
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

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to format salary
  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return `${salary.currency === 'naira' ? '₦' : '$'}${salary.amount}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
        <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Loading Applications</p>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Navbar */}
      <nav className="px-8 h-[60px] w-full flex justify-between items-center sticky top-0 z-50 bg-black shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
        <Link href="/">
          <h1 className="text-xl font-bold text-white">
            OG<span className="text-[#25d442]">nite</span>
          </h1>
        </Link>
        <div className="flex items-center space-x-1 border rounded-md px-3 py-1 group bg-[#111]">
          <Search className="w-4 h-4 text-white mr-2" />
          <input
            type="text"
            placeholder="Search your applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none text-white text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <Link href={`/dashboard/${username}`}>
          <button className="text-sm text-green-400 hover:text-white">
            Back to Dashboard
          </button>
        </Link>
      </nav>

      {/* Applications Grid */}
      <div className="p-6">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No applications match your search' : 'No applications found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredApplications.map((app) => {
              const isWithdrawing = withdrawingId === app.id;
              const jobPost = app.job_post;

              return (
                <div
                  key={app.id}
                  className="bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex flex-col gap-3 justify-between h-full">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {jobPost?.title || 'Job Title Not Available'}
                      </h2>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Company:</span> {jobPost?.recruiter || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Location:</span> {jobPost?.location || 'N/A'}
                          {jobPost?.is_remote && <span className="text-green-600 ml-1">(Remote)</span>}
                        </p>
                        <p>
                          <span className="font-medium">Industry:</span> {jobPost?.industry || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Salary:</span> {formatSalary(jobPost?.salary)}
                        </p>
                        <p>
                          <span className="font-medium">Applied:</span> {formatDate(app.applied_at)}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span> 
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            app.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : app.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                          </span>
                        </p>
                      </div>

                      {/* Required Skills */}
                      {jobPost?.required_skills && jobPost.required_skills.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Required Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {jobPost.required_skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {jobPost.required_skills.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{jobPost.required_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg shadow transition duration-200"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => withdrawApplication(app.id)}
                        disabled={isWithdrawing || app.status !== 'pending'}
                        className={`px-3 py-1.5 text-white text-sm rounded-lg shadow transition duration-200 ${
                          isWithdrawing
                            ? 'bg-red-400 cursor-wait'
                            : app.status !== 'pending'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                        }`}
                      >
                        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-xl font-bold"
            >
              &times;
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Application Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Job Title:</strong> {selectedApplication.job_post?.title || 'N/A'}</p>
                  <p><strong>Company:</strong> {selectedApplication.job_post?.recruiter || 'N/A'}</p>
                  <p><strong>Industry:</strong> {selectedApplication.job_post?.industry || 'N/A'}</p>
                  <p><strong>Location:</strong> {selectedApplication.job_post?.location || 'N/A'}</p>
                  <p><strong>Remote:</strong> {selectedApplication.job_post?.is_remote ? 'Yes' : 'No'}</p>
                  <p><strong>Salary:</strong> {formatSalary(selectedApplication.job_post?.salary)}</p>
                  <p><strong>Slots Available:</strong> {selectedApplication.job_post?.number_of_slots || 'N/A'}</p>
                  <p><strong>Duration:</strong> {selectedApplication.job_post?.duration_of_internship ? `${selectedApplication.job_post.duration_of_internship} months` : 'N/A'}</p>
                </div>
              </div>

              {selectedApplication.job_post?.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Description</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedApplication.job_post.description}
                  </p>
                </div>
              )}

              {selectedApplication.job_post?.required_skills && selectedApplication.job_post.required_skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.job_post.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Application Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedApplication.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : selectedApplication.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : selectedApplication.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedApplication.status ? selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1) : 'Pending'}
                    </span>
                  </p>
                  <p><strong>Applied On:</strong> {formatDate(selectedApplication.applied_at)}</p>
                  <p><strong>Application Deadline:</strong> {formatDate(selectedApplication.job_post?.application_deadline)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}