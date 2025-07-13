// components/TopPerforming.js
'use client'
import React, { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table"

const TopPerforming = ({ searchQuery }) => {
  const [topStudents, setTopStudents] = useState([]);

  useEffect(() => {
    fetch("https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/placement-stat/1/top-performing-students")
      .then(res => res.json())
      .then(data => setTopStudents(data.slice(0, 10)))
      .catch(err => console.error("Error fetching students:", err));
  }, []);

  const filtered = topStudents.filter(s =>
    s.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );
  

  return (
    <div className="w-full rounded-xl border border-[#9ebda1] bg-[#9ebda1] p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-[#028A0F]">Top 10 Performing Students</h2>
      <Table className="w-full">
        <TableHeader className={`text-lg`}>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Course</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(student => (
            <TableRow key={student.id}>
              <TableCell>{student.name}</TableCell>
              <TableCell>{student.status}</TableCell>
              <TableCell>{student.jobTitle}</TableCell>
              <TableCell>{student.course}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TopPerforming;