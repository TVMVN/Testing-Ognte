'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Briefcase, Building2, TrendingUp, Users, ArrowLeft, MapPin, Mail, Phone, Globe, Star } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const EmployerEngagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployers: 0,
    activeJobs: 0,
    avgEngagement: 0,
    topIndustry: ''
  });

  useEffect(() => {
    // Fetch employers data
    const randomId = Math.floor(Math.random() * 20) + 1;
    fetch(`https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/employer-engagement/${randomId}/top-employers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Enhanced mock data with additional fields
          const enhancedData = data.map((employer, index) => ({
            ...employer,
            industry: ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Manufacturing'][index % 6],
            location: ['Lagos, Nigeria', 'Abuja, Nigeria', 'Port Harcourt, Nigeria', 'Ibadan, Nigeria', 'Kano, Nigeria'][index % 5],
            employees: Math.floor(Math.random() * 500) + 50,
            activeJobs: Math.floor(Math.random() * 20) + 1,
            engagementScore: Math.floor(Math.random() * 40) + 60,
            rating: (Math.random() * 2 + 3).toFixed(1),
            website: `https://${employer.companyName?.toLowerCase().replace(/\s+/g, '')}.com` || '#',
            phone: `+234 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
            joinedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
            description: `Leading ${['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Manufacturing'][index % 6].toLowerCase()} company focused on innovation and growth.`
          }));
          
          setEmployers(enhancedData);
          
          // Calculate stats
          setStats({
            totalEmployers: enhancedData.length,
            activeJobs: enhancedData.reduce((sum, emp) => sum + emp.activeJobs, 0),
            avgEngagement: Math.round(enhancedData.reduce((sum, emp) => sum + emp.engagementScore, 0) / enhancedData.length),
            topIndustry: 'Technology'
          });
          
          setLoading(false);
        } else {
          console.warn("Expected an array, but got:", data);
          setEmployers([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Error fetching Employers:", err);
        setLoading(false);
      });
  }, []);

  const filtered = employers.filter(employer =>
    employer.name?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
    employer.companyName?.toLowerCase().includes(searchQuery?.toLowerCase() || "") ||
    employer.industry?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  const getEngagementColor = (score) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-100';
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getIndustryColor = (industry) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Education': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Manufacturing': 'bg-gray-100 text-gray-800'
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 text-lg">Loading employer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
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
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-700">Employer Engagement</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Enhanced Search */}
          <div className="flex items-center space-x-2 border border-emerald-200 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all min-w-[250px]">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              type="text"
              placeholder="Search employers, companies, industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-slate-700 text-sm bg-transparent flex-1 placeholder:text-slate-400"
            />
          </div>

          <Link href="./">
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
              <Briefcase className="w-6 h-6 text-emerald-600" />
            </div>
            Employer Engagement Hub
          </h1>
          <p className="text-slate-600">
            Connect with top employers, track engagement metrics, and manage partnership opportunities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Employers</p>
                  <p className="text-3xl font-bold">{stats.totalEmployers}</p>
                  <p className="text-emerald-200 text-xs mt-1">Active partnerships</p>
                </div>
                <Building2 className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Jobs</p>
                  <p className="text-3xl font-bold">{stats.activeJobs}</p>
                  <p className="text-green-200 text-xs mt-1">Open positions</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Avg Engagement</p>
                  <p className="text-3xl font-bold">{stats.avgEngagement}%</p>
                  <p className="text-teal-200 text-xs mt-1">Platform activity</p>
                </div>
                <TrendingUp className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-emerald-600 text-white border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Top Industry</p>
                  <p className="text-xl font-bold">{stats.topIndustry}</p>
                  <p className="text-blue-200 text-xs mt-1">Most hiring</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg">
          <CardHeader className="border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                  Active Employer Partners
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Showing {filtered.length} of {employers.length} employers • Sorted by engagement score
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                {filtered.length} Results
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100">
                    <TableHead className="font-semibold text-slate-700">Active Jobs</TableHead>
                    <TableHead className="font-semibold text-slate-700">Engagement</TableHead>
                    <TableHead className="font-semibold text-slate-700">Rating</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((employer, index) => (
                    <TableRow 
                      key={employer.id} 
                      className="hover:bg-emerald-50/50 transition-colors border-emerald-100/50"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employer.companyName}`} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                              {employer.companyName?.substring(0, 2).toUpperCase() || 'CO'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-800">{employer.companyName || 'N/A'}</div>
                            <div className="text-sm text-slate-500">{employer.employees} employees</div>
                            <div className="text-xs text-slate-400">Joined {employer.joinedDate}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-800">{employer.name || 'N/A'}</div>
                          <div className="text-sm text-slate-600">{employer.jobTitle || 'N/A'}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{employer.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            <span>{employer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <Badge 
                          variant="secondary" 
                          className={`${getIndustryColor(employer.industry)} font-medium`}
                        >
                          {employer.industry}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{employer.location}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-800">{employer.activeJobs}</div>
                          <div className="text-xs text-slate-500">open positions</div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex flex-col items-center gap-1">
                          <Badge 
                            variant="secondary" 
                            className={`${getEngagementColor(employer.engagementScore)} font-semibold`}
                          >
                            {employer.engagementScore}%
                          </Badge>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{width: `${employer.engagementScore}%`}}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold text-slate-800">{employer.rating}</span>
                          <span className="text-xs text-slate-500">/5.0</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                            onClick={() => window.open(employer.website, '_blank')}
                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No employers found</h3>
                <p className="text-slate-500">
                  {searchQuery 
                    ? `No employers match "${searchQuery}". Try adjusting your search terms.`
                    : 'No employers available at the moment.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Insights */}
        {filtered.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-200">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Average Engagement</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {Math.round(filtered.reduce((sum, emp) => sum + emp.engagementScore, 0) / filtered.length)}%
                </p>
                <p className="text-sm text-slate-600 mt-1">Across all shown employers</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-100 to-teal-100 border-green-200">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Total Opportunities</h3>
                <p className="text-2xl font-bold text-green-600">
                  {filtered.reduce((sum, emp) => sum + emp.activeJobs, 0)}
                </p>
                <p className="text-sm text-slate-600 mt-1">Active job openings</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-teal-100 to-blue-100 border-teal-200">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-2">Average Rating</h3>
                <p className="text-2xl font-bold text-teal-600">
                  {(filtered.reduce((sum, emp) => sum + parseFloat(emp.rating), 0) / filtered.length).toFixed(1)}
                </p>
                <p className="text-sm text-slate-600 mt-1">Out of 5.0 stars</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
export default EmployerEngagement;