'use client';
import React, { useState } from 'react';
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const MentorshipPage = () => {
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      menteeName: 'Alice Johnson',
      field: 'Frontend Development',
      message: 'I’d love to be mentored in React and advanced UI design.',
    },
    {
      id: 2,
      menteeName: 'Bob Williams',
      field: 'Data Science',
      message: 'I’m looking to transition into ML engineering.',
    },
  ]);

  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);

  const handleDeny = (id) => {
    const denied = pendingRequests.find((req) => req.id === id);
    if (denied) {
      setRejectedRequests((prev) => [...prev, denied]);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
      toast.error('Mentorship request denied.',{
        description: 'The mentee has been notified of the rejection.',
      });
    }
  };

  const handleApprove = (id) => {
    const approved = pendingRequests.find((req) => req.id === id);
    if (approved) {
      setApprovedRequests((prev) => [...prev, approved]);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
      toast.success('Mentorship request approved.',
        {
          description: 'You can now start mentoring this mentee.',
        }
      );
    }
  };

  const renderRequestCard = (req, buttons = true) => (
    <div
      key={req.id}
      className="bg-gray-50 p-6 rounded-lg shadow-md border border-green-600"
    >
      <h2 className="text-2xl font-semibold text-green-800">{req.menteeName}</h2>
      <p className="text-sm text-green-700 mb-2">Field: {req.field}</p>
      <p className="text-gray-700 mb-4">{req.message}</p>
      {buttons && (
        <div className="flex gap-4">
          <button
            onClick={() => handleDeny(req.id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            Deny
          </button>
          <button
            onClick={() => handleApprove(req.id)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-green-50 text-white p-6">
      <Link href="./">
        <div className="flex items-center mb-6 text-green-500 hover:text-green-700 transition">
          <ArrowLeft className="mr-2" />
          <span>Back to Dashboard</span>
        </div>
      </Link>

      <h1 className="text-4xl font-bold text-green-500 mb-8">Mentorship Requests</h1>

      {/* Pending Requests */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-green-900 mb-4">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-800">No pending requests.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 grid-cols-1">
            {pendingRequests.map((req) => renderRequestCard(req))}
          </div>
        )}
      </section>

      {/* Approved Requests */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-green-600 mb-4">Approved Requests</h2>
        {approvedRequests.length === 0 ? (
          <p className="text-gray-800">No approved requests yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 grid-cols-1">
            {approvedRequests.map((req) => renderRequestCard(req, false))}
          </div>
        )}
      </section>

      {/* Rejected Requests */}
      <section>
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Rejected Requests</h2>
        {rejectedRequests.length === 0 ? (
          <p className="text-gray-800">No rejected requests.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 grid-cols-1">
            {rejectedRequests.map((req) => renderRequestCard(req, false))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MentorshipPage;
