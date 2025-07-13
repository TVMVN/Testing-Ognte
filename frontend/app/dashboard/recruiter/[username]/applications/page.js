'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search } from 'lucide-react';

const API_URL = 'https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/users';

export default function ApplicantsPage() {
  const { username } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplicants();
  }, [username]);

  const fetchApplicants = async () => {
    try {
      const res = await axios.get(`${API_URL}?limit=10`);
      setApplicants(res.data);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    setUpdatingId(id);

    try {
      await axios.put(`${API_URL}/${id}`, {
        ...applicant,
        status: newStatus,
      });

      setApplicants((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: newStatus } : a
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplicants = applicants.filter((applicant) =>
    [applicant.name, applicant.email, applicant.skills, applicant.jobTitle]
      .some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) return (<div className="h-screen flex flex-col justify-center items-center bg-black">
  <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
  <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Loading Applicants</p>
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
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none text-white text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <Link href={`/dashboard/recruiter/${username}`}>
          <button className="text-sm text-green-400 hover:text-white">
            Back to Dashboard
          </button>
        </Link>
      </nav>

      {/* Applicants Grid */}
      <div className="p-6 bg-green-50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredApplicants.map((applicant) => {
          const isUpdating = updatingId === applicant.id;
          const isAccepted = applicant.status === 'Accepted';
          const isRejected = applicant.status === 'Rejected';

          return (
            <div
              key={applicant.id}
              className="bg-[#202e1564] shadow-md rounded-lg p-4 border border-gray-200"
            >
              <div className="flex flex-col gap-2 justify-between h-full">
                <div>
                  <h2 className="text-lg text-green-600 font-semibold">{applicant.name}</h2>
                  {isAccepted && (
                    <p className="text-sm text-gray-100">{applicant.email}</p>
                  )}
                  <p className="text-sm text-gray-100">
                    Applied for: <span className="font-medium">{applicant.jobTitle || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-gray-100">
                    Status: <span className="font-medium">{applicant.status || 'Pending'}</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedApplicant(applicant)}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg shadow transition duration-200"
                  >
                    View Info
                  </button>

                  {isAccepted ? (
                    <span className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg shadow cursor-not-allowed">
                      Accepted
                    </span>
                  ) : (
                    <button
                      onClick={() => updateStatus(applicant.id, 'Accepted')}
                      disabled={isUpdating}
                      className={`px-3 py-1.5 text-white text-sm rounded-lg shadow transition duration-200 ${
                        isUpdating
                          ? 'bg-green-700 cursor-wait'
                          : 'bg-green-800 hover:bg-green-900 cursor-pointer'
                      }`}
                    >
                      {isUpdating ? 'Updating...' : 'Accept'}
                    </button>
                  )}

                  {isRejected ? (
                    <span className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg shadow cursor-not-allowed">
                      Rejected
                    </span>
                  ) : (
                    <button
                      onClick={() => updateStatus(applicant.id, 'Rejected')}
                      disabled={isUpdating || isAccepted}
                      className={`px-3 py-1.5 text-white text-sm rounded-lg shadow transition duration-200 ${
                        isUpdating || isAccepted
                          ? 'bg-red-300 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600 cursor-pointer'
                      }`}
                    >
                      {isUpdating ? 'Updating...' : 'Reject'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Applicant Info Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Applicant Info</h2>
            <p><strong>Full Name:</strong> {selectedApplicant.name}</p>
            <p><strong>Email:</strong> {selectedApplicant.email}</p>
            <p><strong>Contact:</strong> {selectedApplicant.phone || 'N/A'}</p>
            <p><strong>Skills:</strong> {selectedApplicant.skills || 'Not provided'}</p>
            <p><strong>Applied for:</strong> {selectedApplicant.jobTitle || 'N/A'}</p>
            <p className="truncate">
              <strong>Resume:</strong>{' '}
              {selectedApplicant.resume ? (
                <a
                  href={selectedApplicant.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Resume
                </a>
              ) : (
                'Not uploaded'
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
