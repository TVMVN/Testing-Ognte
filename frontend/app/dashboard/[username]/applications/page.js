'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Search } from 'lucide-react';

const API_URL = 'https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/users';

export default function ApplicantsPage() {
  const { username } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserApplications();
  }, [username]);

  const fetchUserApplications = async () => {
    try {
      const res = await axios.get(`${API_URL}?username=${username}`);
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching user applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (id) => {
    const application = applications.find((a) => a.id === id);
    if (!application) return;

    const confirm = window.confirm("Are you sure you want to withdraw this application?");
    if (!confirm) return;

    setWithdrawingId(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error withdrawing application:', err);
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = applications.filter((application) =>
    [application.name, application.email, application.skills, application.jobTitle]
      .some(field =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

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
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredApplications.map((app) => {
          const isWithdrawing = withdrawingId === app.id;

          return (
            <div
              key={app.id}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
            >
              <div className="flex flex-col gap-2 justify-between h-full">
                <div>
                  <h2 className="text-lg font-semibold">{app.name}</h2>
                  <p className="text-sm text-gray-600">
                    Email: <span className="font-medium">{app.email}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Applied for: <span className="font-medium">{app.jobTitle || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-medium">{app.status || 'Pending'}</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedApplication(app)}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg shadow transition duration-200"
                  >
                    View Info
                  </button>

                  <button
                    onClick={() => withdrawApplication(app.id)}
                    disabled={isWithdrawing}
                    className={`px-3 py-1.5 text-white text-sm rounded-lg shadow transition duration-200 ${
                      isWithdrawing
                        ? 'bg-red-400 cursor-wait'
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

      {/* Application Info Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Application Info</h2>
            <p><strong>Full Name:</strong> {selectedApplication.name}</p>
            <p><strong>Email:</strong> {selectedApplication.email}</p>
            <p><strong>Contact:</strong> {selectedApplication.phone || 'N/A'}</p>
            <p><strong>Skills:</strong> {selectedApplication.skills || 'Not provided'}</p>
            <p><strong>Applied for:</strong> {selectedApplication.jobTitle || 'N/A'}</p>
            <p className="truncate">
              <strong>Resume:</strong>{' '}
              {selectedApplication.resume ? (
                <a
                  href={selectedApplication.resume}
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
