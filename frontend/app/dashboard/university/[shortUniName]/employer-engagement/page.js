'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table"

const EmployerEngagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const randomId = Math.floor(Math.random() * 20) + 1;
    fetch(`https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/employer-engagement/${randomId}/top-employers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployers(data);
          setLoading(false);
        } else {
          console.warn("Expected an array, but got:", data);
          setEmployers([]);
        }
      })
      .catch(err => console.error("Error fetching Employers:", err));
  }, []);

  const filtered = employers.filter(s =>
    s.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );
  if (loading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <div className='flex flex-col items-center justify-center w-full gap-4'>
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
              placeholder="Search Employers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-white text-sm bg-transparent placeholder:text-gray-400"
            />
          </div>

          <Link href="./">
            <button className="text-sm text-green-400 hover:text-white">
              Back to Dashboard
            </button>
          </Link>
        </nav>
      </div>

      {/* Table */}
      <div className="w-full rounded-xl border border-[#9ebda1] bg-[#9ebda1] p-6 shadow-sm mt-4">
        <h2 className="text-lg font-semibold mb-4 text-[#028A0F]">Top 10 Performing Students</h2>
        <Table className="w-full">
          <TableHeader className="text-lg">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(employer => (
              <TableRow key={employer.id}>
                <TableCell>{employer.name || 'N/A'}</TableCell>
                <TableCell>{employer.jobTitle || 'N/A'}</TableCell>
                <TableCell>{employer.companyName || 'N/A'}</TableCell>
                <TableCell>{employer.email || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployerEngagement;
