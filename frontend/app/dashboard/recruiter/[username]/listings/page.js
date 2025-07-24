'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';

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

// Authenticated request wrapper
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

// Error handler
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

  // Fetch jobs from backend
  const fetchJobs = async () => {
    setLoading(true);
    console.log("🧪 Username from route:", username);
    console.log("📦 Access Token:", getAccessToken());

    const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/recruiters/jobs/`, { method: 'GET' }, router);

    if (!response) return;

    if (!response.ok) {
      ErrorHandler.showErrorToast({ response }, 'Fetching jobs');
      return;
    }

    const data = await response.json();
    console.log('✅ Jobs response:', data);

    const jobsData = (data.results || []).map(job => ({
      id: job.id,
      jobTitle: job.title,
      jobDescription: job.description,
      skills: job.required_skills || {},
      createdAt: job.created_at,
      salary_from: job.salary?.amount || 'Not specified',
    }));

    setJobs(jobsData);
    setLoading(false);
  };

  const deleteJob = async (jobId) => {
    const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/recruiters/jobs/${jobId}/`, {
      method: 'DELETE',
    }, router);

    if (response && response.ok) {
      setJobs(jobs.filter(job => job.id !== jobId));
      setSelectedJob(null);
    } else {
      ErrorHandler.showErrorToast({ response }, 'Deleting job');
    }
  };

  const filteredJobs = jobs.filter((job) =>
    [job.jobTitle, job.skills.join(', '), job.jobDescription]
      .some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  useEffect(() => {
    fetchJobs();
  }, [username]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
        <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Loading Listings</p>
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
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none text-white text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <Link href={`/dashboard/recruiter/${username}/`}>
          <button className="text-sm text-green-400 hover:text-white">
            Back to Dashboard
          </button>
        </Link>
      </nav>

      {/* Job Cards */}
      <div className="p-6 bg-green-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-black shadow-md rounded-lg p-4 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-green-600">{job.jobTitle}</h2>
            <p className="text-sm text-gray-200">Skills: {job.skills.join(', ') || 'Not listed'}</p>
            <p className="text-sm text-gray-300">Posted: {job.createdAt}</p>
            <p className="text-sm text-gray-400 line-clamp-3 mt-2">{job.jobDescription}</p>
            <button
              onClick={() => setSelectedJob(job)}
              className="mt-4 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg shadow"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-2 right-2 text-gray-100 hover:text-black text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Job Info</h2>
            <p><strong>Title:</strong> {selectedJob.jobTitle}</p>
            <p><strong>Skills:</strong> {selectedJob.skills.join(', ')}</p>
            <p><strong>Description:</strong> {selectedJob.jobDescription}</p>
            <p><strong>Posted:</strong> {selectedJob.createdAt}</p>
            <p><strong>Salary:</strong> {selectedJob.salary_from}</p>
            <button
              onClick={() => deleteJob(selectedJob.id)}
              className="mt-4 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg shadow"
            >
              Delete Job Posting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
