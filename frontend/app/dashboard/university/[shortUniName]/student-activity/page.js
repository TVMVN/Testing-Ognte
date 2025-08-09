'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, Award, TrendingUp, Filter, ArrowLeft, Eye } from 'lucide-react'
import TopPerforming from '@/components/TopPerforming'
import BelowAverage from '@/components/BelowAveragePerforming'
import AveragePerforming from '@/components/AveragePerforming'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const StudentActivity = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [studentsData, setStudentsData] = useState({
    total: 0,
    topPerforming: 0,
    average: 0,
    belowAverage: 0
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    setStudentsData({
      total: 290,
      topPerforming: 85,
      average: 125,
      belowAverage: 80
    });
  }, []);

  const filterOptions = [
    { id: 'all', label: 'All Students', count: studentsData.total, color: 'bg-slate-100 text-slate-700' },
    { id: 'top', label: 'Top Performers', count: studentsData.topPerforming, color: 'bg-emerald-100 text-emerald-700' },
    { id: 'average', label: 'Average', count: studentsData.average, color: 'bg-green-100 text-green-700' },
    { id: 'below', label: 'Needs Support', count: studentsData.belowAverage, color: 'bg-amber-100 text-amber-700' }
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50'>
      {/* Enhanced Navbar */}
      <nav className="px-4 sm:px-8 h-[70px] flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-200 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              OG<span className="text-emerald-500">nite</span>
            </h1>
          </Link>
          <div className="hidden sm:block w-px h-8 bg-emerald-200"></div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-700">Student Activity</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Enhanced Search */}
          <div className="flex items-center space-x-2 border border-emerald-200 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all min-w-[200px]">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-slate-700 text-sm bg-transparent flex-1 placeholder:text-slate-400"
            />
          </div>
          
          <Link href={`./`}>
            <Button variant="outline" className="border-emerald-300 hover:bg-emerald-50 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            Student Activity Dashboard
          </h1>
          <p className="text-slate-600">
            Monitor student performance, track progress, and identify students who need support
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">{studentsData.total}</p>
                  <p className="text-emerald-200 text-xs mt-1">Active this semester</p>
                </div>
                <Users className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Top Performers</p>
                  <p className="text-3xl font-bold">{studentsData.topPerforming}</p>
                  <p className="text-green-200 text-xs mt-1">Excellent progress</p>
                </div>
                <Award className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Average Progress</p>
                  <p className="text-3xl font-bold">{studentsData.average}</p>
                  <p className="text-teal-200 text-xs mt-1">On track</p>
                </div>
                <TrendingUp className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Need Support</p>
                  <p className="text-3xl font-bold">{studentsData.belowAverage}</p>
                  <p className="text-amber-200 text-xs mt-1">Require attention</p>
                </div>
                <Eye className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                  activeFilter === option.id 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : `${option.color} hover:shadow-md`
                }`}
              >
                <span className="font-medium">{option.label}</span>
                <Badge variant="secondary" className={`${
                  activeFilter === option.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/60'
                }`}>
                  {option.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Overall Performance</h3>
                    <p className="text-slate-600 text-sm">
                      {Math.round((studentsData.topPerforming / studentsData.total) * 100)}% of students are performing excellently
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(((studentsData.topPerforming + studentsData.average) / studentsData.total) * 100)}%
                  </p>
                  <p className="text-slate-500 text-sm">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Lists */}
        <div className="space-y-8">
          {(activeFilter === 'all' || activeFilter === 'top') && (
            <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-800">Top Performing Students</CardTitle>
                      <CardDescription>Students with excellent academic and career progress</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                    {studentsData.topPerforming} students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TopPerforming searchQuery={searchQuery} />
              </CardContent>
            </Card>
          )}

          {(activeFilter === 'all' || activeFilter === 'average') && (
            <Card className="bg-white/70 backdrop-blur-sm border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-green-800">Average Performing Students</CardTitle>
                      <CardDescription>Students showing steady progress and development</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                    {studentsData.average} students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <AveragePerforming searchQuery={searchQuery} />
              </CardContent>
            </Card>
          )}

          {(activeFilter === 'all' || activeFilter === 'below') && (
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-amber-800">Students Needing Support</CardTitle>
                      <CardDescription>Students who may benefit from additional guidance</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                    {studentsData.belowAverage} students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <BelowAverage searchQuery={searchQuery} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentActivity;