// app/student-activity/page.js
'use client'
import React, { useState } from 'react'
import TopPerforming from '@/components/TopPerforming'
import BelowAverage from '@/components/BelowAveragePerforming'
import AveragePerforming from '@/components/AveragePerforming'
import Link from 'next/link'
import { Search } from 'lucide-react'

const StudentActivity = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col items-center bg-black justify-center w-full  gap-4'>
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
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none text-white text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <Link href={`./`}>
          <button className="text-sm text-green-400 hover:text-white">
            Back to Dashboard
          </button>
        </Link>
      </nav>
      <TopPerforming searchQuery={searchQuery} />
      <BelowAverage searchQuery={searchQuery} />
      <AveragePerforming searchQuery={searchQuery} />
    </div>
  );
};

export default StudentActivity;