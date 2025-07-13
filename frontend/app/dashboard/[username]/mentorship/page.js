'use client';
import React, { useState } from 'react';
import { ArrowLeft } from "lucide-react"; // ✅ This must be correct
import Link from "next/link";  

const recruitersList = [
  {
    id: 1,
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1234567890',
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1987654321',
  },
  {
    id: 3,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+98848484848',
  },
];

const MentorshipPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const [requests, setRequests] = useState([
    {
      recruiterId: 1,
      recruiterName: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1234567890',
      field: 'Frontend Development',
      jobTitle: 'React Developer',
      message: 'Looking for help with advanced animations in React.',
      status: 'accepted', // approved by recruiter
    },
    {
      recruiterId: 2,
      recruiterName: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1987654321',
      field: 'Data Engineering',
      jobTitle: 'ETL Developer',
      message: 'Need help with Python pipelines.',
      status: 'rejected', // rejected
    },
    {
      recruiterId: 3,
      recruiterName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+98848484848',
      field: 'Data Science',
      jobTitle: 'Python Developer',
      message: 'Need help with Python pipelines.',
      status: 'rejected', // still waiting for approval
    },
  ]);

  const [jobTitle, setJobTitle] = useState('');
  const [field, setField] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmitRequest = (e) => {
    e.preventDefault();

    const newRequest = {
      recruiterId: selectedRecruiter.id,
      recruiterName: selectedRecruiter.name,
      email: selectedRecruiter.email,
      phone: selectedRecruiter.phone,
      field,
      jobTitle,
      message,
      status: 'pending',
    };

    setRequests([...requests, newRequest]);
    setShowDialog(false);
    setJobTitle('');
    setField('');
    setMessage('');
    alert('Your mentorship request has been submitted and is pending recruiter approval.');
  };

  const filteredRecruiters = recruitersList.filter((rec) =>
    rec.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50  w-full to-green-100  text-green-900 p-6">
          <Link href="./">
  <div className="flex items-center mb-6 text-green-500 hover:text-green-700 transition">
    <ArrowLeft className="mr-2" />
    <span>Back to Dashboard</span>
  </div>
</Link>
      <h1 className="text-4xl font-bold text-green-700 mb-6">Find a Mentor</h1>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search recruiters by name..."
          className="p-2 w-full md:w-1/2 rounded bg-green-50 border border-green-700 text-green-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 grid-cols-1">
        {filteredRecruiters.map((rec) => (
          <div
            key={rec.id}
            className="bg-white shadow-2xl p-6 rounded-lg border "
          >
            <h2 className="text-2xl font-semibold text-green-800">{rec.name}</h2>
            <p className="text-sm text-gray-400 mb-4">Available for mentorship</p>
            <button
              onClick={() => {
                setSelectedRecruiter(rec);
                setShowDialog(true);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white"
            >
              Request Mentorship
            </button>
          </div>
        ))}
      </div>

      {/* Candidate's Sent Requests */}
{requests.length > 0 &&
  (requests.some(req => req.status === 'pending') ||
   requests.some(req => req.status === 'accepted') ||
   requests.some(req => req.status === 'rejected')) && (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-green-800 mb-4">Your Mentorship Requests</h2>
      <div className="space-y-10">

        {/* Pending Requests */}
        {requests.some(req => req.status === 'pending') && (
          <div>
            <h3 className="text-2xl font-semibold text-yellow-400 mb-2">Pending Requests</h3>
            <div className="space-y-4">
              {requests.filter(req => req.status === 'pending').map((req, idx) => (
                <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-yellow-500">
                  <h3 className="text-xl font-bold text-yellow-300">{req.recruiterName}</h3>
                  <p className="text-sm text-green-300 mb-1">Field: {req.field}</p>
                  <p className="text-sm text-green-300 mb-1">Job Title: {req.jobTitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Requests */}
        {requests.some(req => req.status === 'accepted') && (
          <div>
            <h3 className="text-2xl font-semibold text-green-700 mb-2">Accepted Requests</h3>
            <div className="space-y-4">
              {requests.filter(req => req.status === 'accepted').map((req, idx) => (
                <div key={idx} className="bg-white shadow-2xl p-6 rounded-lg border border-green-800">
                  <h3 className="text-xl font-bold text-green-500">{req.recruiterName}</h3>
                  <p className="text-sm text-green-500 mb-1">Field: {req.field}</p>
                  <p className="text-sm text-green-500 mb-1">Job Title: {req.jobTitle}</p>
                  <div className="text-sm mt-4 text-green-900 ">
                    <p>📧 Email: {req.email}</p>
                    <p>📞 Phone: {req.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {requests.some(req => req.status === 'rejected') && (
          <div>
            <h3 className="text-2xl font-semibold text-red-400 mb-2">Rejected Requests</h3>
            <div className=" grid grid-cols-2 gap-5 space-y-4">
              {requests.filter(req => req.status === 'rejected').map((req, idx) => (
                <div key={idx} className="bg-white p-6 h-[100%] overflow-y-auto rounded-lg border border-red-500">
                  <h3 className="text-xl font-bold text-red-500">{req.recruiterName}</h3>
                  <p className="text-sm text-green-500 mb-1">Field: {req.field}</p>
                  <p className="text-sm text-green-500 mb-1">Job Title: {req.jobTitle}</p>
                  <p className="text-sm text-gray-600 mt-4">Message: {req.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
)}


      {/* Request Dialog */}
      {showDialog && selectedRecruiter && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-[90%] md:w-[450px] border border-green-500">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              Request Mentorship from {selectedRecruiter.name}
            </h2>
            <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Job Title you're applying for"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="p-2 rounded border border-gray-600 bg-gray-800 text-white"
              />
              <input
                type="text"
                placeholder="Field of Mentorship"
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
                className="p-2 rounded border border-gray-600 bg-gray-800 text-white"
              />
              <textarea
                placeholder="Write your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="p-2 rounded border border-gray-600 bg-gray-800 text-white"
              />
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipPage;
