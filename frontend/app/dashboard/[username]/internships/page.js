'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search } from 'lucide-react';

const API_URL = 'https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN';

export default function ListingsPage() {
  const { username } = useParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
const [applyingJob, setApplyingJob] = useState(null);


  useEffect(() => {
    fetchJobs();
  }, [username]);

  const fetchJobs = async () => {
    try {
      const recruitersRes = await axios.get(`${API_URL}/recruiters`);
      const jobsData = [];

      for (const rec of recruitersRes.data) {
        try {
          const res = await axios.get(`${API_URL}/recruiters/${rec.id}/jobs`);
          jobsData.push(...res.data);
          await new Promise((resolve) => setTimeout(resolve, 200)); // 1 second delay
        } catch (err) {
          console.warn(`Failed to fetch jobs for recruiter ${rec.id}`);
        }
      }

      setJobs(jobsData);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // const deleteJob = async (jobId) => {
  //   try {
  //     await axios.delete(`${API_URL}/jobs/${jobId}`);
  //     setJobs(jobs.filter((job) => job.id !== jobId));
  //     setSelectedJob(null);
  //   } catch (err) {
  //     console.error('Error deleting job:', err);
  //   }
  // };

  const filteredJobs = jobs.filter((job) =>
    [job.jobTitle, job.skills, job.jobDescription]
      .some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) return (<div className="h-screen flex flex-col justify-center items-center bg-black">
    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
    <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Loading Internships</p>
  </div>);

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
        <Link href={`/dashboard/${username}/`}>
          <button className="text-sm text-green-400 hover:text-white">
            Back to Dashboard
          </button>
        </Link>
      </nav>

      {/* Jobs Grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-800">{job.jobTitle}</h2>
            <p className="text-sm text-gray-600">Skills: {job.skills || 'Not listed'}</p>
            <p className="text-sm text-gray-500">Posted: {job.createdAt}</p>
            <p className="text-sm text-gray-600 line-clamp-3 mt-2">{job.jobDescription}</p>

            <button
              onClick={() => setSelectedJob(job)}
              className="mt-4 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg shadow"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Job Info</h2>
            <p><strong>Title:</strong> {selectedJob.jobTitle}</p>
            <p><strong>Skills:</strong> {selectedJob.skills}</p>
            <p><strong>Description:</strong> {selectedJob.jobDescription}</p>
            <p><strong>Posted:</strong> {selectedJob.createdAt}</p>
            <p><strong>Salary:</strong> {selectedJob.salary_from}</p>

            {/* Apply Button */}
            <button
              onClick={() => {
                setApplyingJob(selectedJob); // pass job info
                setShowModal(true);
              }}
              
              className="mt-4 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg shadow"
              
            >
              Apply Now
            </button>
            {showModal && applyingJob && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
      >
        ✖
      </button>

      <h2 className="text-xl font-semibold text-green-700 mb-4">Apply to {applyingJob.title}</h2>

      <p className="mb-2">Choose how you want to apply:</p>

      {/* Automatic Apply */}
      <button
        onClick={() => handleAutoApply(applyingJob.id)}
        className="w-full mb-3 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
      >
        Automatic Apply (Use My Resume)
      </button>

      {/* Manual Apply */}
      <button
        onClick={() => handleManualApply(applyingJob.id)}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
      >
        Manual Apply
      </button>
    </div>
  </div>
)}

          </div>
        </div>
      )}
    </div>
  );
}
