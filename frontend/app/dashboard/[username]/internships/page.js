"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, ArrowLeft, RefreshCw, Upload, CheckCircle, AlertCircle, TrendingUp, Award, Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState([]);
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const params = useParams();
  const router = useRouter();
  const username = params.username;

  // Update to your backend API base URL
  const API_URL = "http://localhost:8000";
  const BACKEND_API = `${API_URL}/api/candidates`;

  // Token management functions
  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  };

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userType');
    }
  };

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      toast.error('No refresh token found. Please log in again.');
      clearTokens();
      router.push('/login');
      return null;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/refresh/`, {
        refresh: refresh,
      });

      if (res.status === 200) {
        const data = res.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access);
        }
        return data.access;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('Session expired. Please log in again.');
      clearTokens();
      router.push('/login');
      return null;
    }
  };

  // Enhanced API request function with automatic token refresh
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      toast.error('Please log in to continue.');
      router.push('/login');
      return null;
    }

    // Configure axios request
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      // First attempt with current token
      let response = await axios(url, config);
      return response;
    } catch (error) {
      // If unauthorized, try to refresh token and retry
      if (error.response?.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        
        if (token) {
          // Retry the request with new token
          config.headers.Authorization = `Bearer ${token}`;
          try {
            const response = await axios(url, config);
            return response;
          } catch (retryError) {
            console.error('Retry request failed:', retryError);
            throw retryError;
          }
        } else {
          return null;
        }
      }
      throw error;
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_API}/profile/`, {
        method: 'GET'
      });
      
      if (!response) return; // Request failed or user redirected to login
      
      const data = response.data;
      setResumeText(data.resume || "");
      setSkills(data.skills || []);
      setScore(data.resume_score ?? null);
      setAnalysis(data.analysis || null);
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError("Error fetching profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async () => {
    setAnalyzing(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_API}/resume-analysis/`, {
        method: "POST"
      });
      
      if (!response) return; // Request failed or user redirected to login
      
      const data = response.data;
      setScore(data.score);
      setSkills(data.skills || []);
      setAnalysis(data.analysis || null);
      setSuccess("Resume analyzed successfully!");
      
      // Refresh profile data
      setTimeout(() => fetchProfile(), 1000);
      
    } catch (err) {
      console.error('Analyze resume error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Error analyzing resume. Please try again.";
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Check authentication on component mount
    const token = getAccessToken();
    if (!token) {
      toast.error('Please log in to view resume analyzer.');
      router.push('/login');
      return;
    }
    
    fetchProfile();
  }, [username, router]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-500";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/${username}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Resume Analyzer</h1>
          </div>
          <p className="text-slate-600 text-lg">
            Get AI-powered insights and suggestions to improve your resume
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-green-600" />
                    <span className="ml-3 text-slate-600">Loading resume...</span>
                  </div>
                ) : (
                  <Textarea
                    value={resumeText}
                    readOnly
                    rows={15}
                    className="bg-slate-50 border-slate-200 text-slate-700 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="No resume found. Please upload a resume first."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Analysis Actions */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analysis Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={analyzeResume}
                  disabled={analyzing || loading || !resumeText}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-indigo-700 text-white shadow-lg"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Analyze Resume
                    </>
                  )}
                </Button>

                <Button
                  onClick={fetchProfile}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-slate-300 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Need to update your resume?</p>
                  <Link href={`/dashboard/${username}`}>
                    <Button variant="outline" size="sm" className="border-green-300 text-green-600 hover:bg-green-50">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Resume
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Score Display */}
            {score !== null && (
              <Card className={`shadow-lg border-2 ${getScoreBg(score)}`}>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className={`h-6 w-6 ${getScoreColor(score)}`} />
                    <h3 className="text-lg font-semibold text-slate-700">Resume Score</h3>
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(score)} mb-2`}>
                    {score}/100
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills Display */}
            {skills.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Detected Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-green-100 to-indigo-100 text-green-800 rounded-full text-sm font-medium border border-green-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {analysis && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm text-slate-700">
                    {typeof analysis === 'string' ? (
                      <p>{analysis}</p>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(analysis, null, 2)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Analysis Yet */}
            {!loading && !analyzing && score === null && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-slate-400 mb-4">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold">No Analysis Available</h3>
                    <p className="text-sm">Click "Analyze Resume" to get AI-powered insights</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}