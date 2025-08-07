"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Loader2, FileText, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, TrendingUp, Award, Target, BarChart3, Star, AlertTriangle, ThumbsUp, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from "recharts";

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [originalResumeText, setOriginalResumeText] = useState("");
  const [originalResumeFile, setOriginalResumeFile] = useState(null);
  const [resumeTitle, setResumeTitle] = useState("Profile Resume");
  const [skills, setSkills] = useState([]);
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractingProfile, setExtractingProfile] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const params = useParams();
  const router = useRouter();
  const username = params.username;

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
      toast.error('Session expired. Please log in again.');
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

  // Enhanced API request function
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      toast.error('Please log in to continue.');
      router.push('/login');
      return null;
    }

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      let response = await axios(url, config);
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        token = await refreshAccessToken();
        
        if (token) {
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

  // Text extraction functions for profile resume files
  const extractTextFromProfileFile = async (fileData, fileName) => {
    setExtractingProfile(true);
    try {
      let blob;
      if (typeof fileData === 'string') {
        const byteCharacters = atob(fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray]);
      } else {
        blob = new Blob([fileData]);
      }

      const file = new File([blob], fileName, {
        type: getFileTypeFromName(fileName)
      });

      toast.info(`Extracting text from profile resume: ${fileName}...`);

      const extracted = await extractTextFromFileInternal(file);
      
      if (extracted && extracted.trim().length >= 50) {
        toast.success(`Successfully extracted ${extracted.length} characters from profile resume`);
        return extracted;
      } else {
        toast.warning('Profile resume file could not be processed. Using raw text instead.');
        return null;
      }
    } catch (err) {
      console.error('Profile file extraction error:', err);
      toast.warning(`Could not extract text from profile resume file: ${err.message}`);
      return null;
    } finally {
      setExtractingProfile(false);
    }
  };

  const getFileTypeFromName = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  };

  const extractTextFromFileInternal = async (file) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    let extracted = '';

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      extracted = await extractPDFText(file);
    } else if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      extracted = await extractWordText(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      extracted = await extractPlainText(file);
    } else {
      throw new Error(`Unsupported file format: ${fileType || 'unknown'}`);
    }

    return extracted;
  };

  const extractPDFText = async (file) => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.pdfjsLib) {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target.result);
            const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n';
            }
            
            resolve(fullText.trim());
          } catch (error) {
            reject(new Error('Unable to extract text from PDF. The file might be image-based or corrupted.'));
          }
        };
        fileReader.onerror = () => reject(new Error('Failed to read PDF file'));
        fileReader.readAsArrayBuffer(file);
      } else {
        resolve(`PDF text extraction requires additional libraries. 

Profile Resume File: ${file.name}
File size: ${(file.size / 1024).toFixed(1)} KB

Please ensure your profile resume text is properly saved in your profile.`);
      }
    });
  };

  const extractWordText = async (file) => {
    if (typeof window !== 'undefined' && window.mammoth) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        
        if (result.value && result.value.trim()) {
          return result.value.trim();
        } else {
          throw new Error('No text content found in the Word document');
        }
      } catch (error) {
        throw new Error(`Error processing Word document: ${error.message}`);
      }
    }
    
    throw new Error('Word document processing is not available. Please ensure your profile resume text is properly saved.');
  };

  const extractPlainText = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        if (text && text.trim()) {
          resolve(text.trim());
        } else {
          reject(new Error('The text file appears to be empty'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_API}/profile/`, {
        method: 'GET'
      });
      
      if (!response) return;
      
      const data = response.data;
      let profileResumeText = data.resume || data.resume_text || "";
      
      // Check if there's a resume file to extract from
      if (data.resume_file && data.resume_file_name && !profileResumeText) {
        toast.info('Found resume file in profile. Extracting text...');
        try {
          const extractedText = await extractTextFromProfileFile(data.resume_file, data.resume_file_name);
          if (extractedText) {
            profileResumeText = extractedText;
            await updateProfileResumeText(extractedText);
          }
        } catch (extractError) {
          console.warn('Could not extract from profile file:', extractError);
        }
      }
      
      if (data.resume_file && data.resume_file_name) {
        setOriginalResumeFile({
          file: data.resume_file,
          name: data.resume_file_name
        });
      }
      
      setResumeText(profileResumeText);
      setOriginalResumeText(profileResumeText);
      setSkills(data.skills || []);
      setScore(data.resume_score ?? null);
      setAnalysis(data.resume_analysis || null);
      setResumeTitle("Profile Resume");
      
      if (profileResumeText) {
        toast.success('Profile resume loaded successfully');
      } else {
        toast.info('No resume found in profile. Please add resume content to your profile first.');
        setError('No resume found in your profile. Please go to your profile page and add your resume content first.');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError("Error fetching profile. Please try again.");
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileResumeText = async (resumeText) => {
    try {
      const token = getAccessToken();
      if (!token) return false;

      const response = await axios.patch(`${BACKEND_API}/profile/`, {
        resume_text: resumeText
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      console.warn('Could not update profile resume text:', error);
      return false;
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast.error('No resume content found. Please add resume content to your profile first.');
      setError('No resume content available for analysis. Please go to your profile and add your resume first.');
      return;
    }

    setAnalyzing(true);
    setError("");
    
    toast.info('Starting resume analysis...');
    
    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_API}/resume-analysis/`, {
        method: "GET"
      });
      
      if (!response) return;
      
      const data = response.data;
      setScore(data.resume_score);
      setSkills(data.skills || []);
      setAnalysis(data.resume_analysis || null);
      
      toast.success(`Resume analysis complete! Score: ${data.resume_score}%`);
      setSuccess("Resume analyzed successfully! Check your score and recommendations below.");
      
      setTimeout(() => setSuccess(""), 8000);
      
    } catch (err) {
      console.error('Analyze resume error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Error analyzing resume";
      setError(errorMessage);
      toast.error('Resume analysis failed: ' + errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      toast.error('Please log in to access resume analyzer');
      router.push('/login');
      return;
    }
    
    fetchProfile();
  }, [username, router]);

  // Load external libraries
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.mammoth) {
        const mammothScript = document.createElement('script');
        mammothScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js';
        mammothScript.async = true;
        document.head.appendChild(mammothScript);
      }
      
      if (!window.pdfjsLib) {
        const pdfScript = document.createElement('script');
        pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        pdfScript.async = true;
        pdfScript.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
        };
        document.head.appendChild(pdfScript);
      }
    }
  }, []);

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

  const getMotivationText = (score) => {
    if (score >= 90) return "Excellent! Your resume is in great shape. Keep refining the details.";
    if (score >= 80) return "Great work! A few tweaks could make your resume even stronger.";
    if (score >= 70) return "Good foundation! Focus on highlighting your key achievements.";
    if (score >= 60) return "You're on the right track. Consider adding more specific details and metrics.";
    if (score >= 50) return "There's room for improvement. Focus on clarity and relevant skills.";
    return "Let's work together to strengthen your resume. Every improvement counts!";
  };

  const getRecommendations = (score) => {
    if (score >= 90) {
      return [
        { type: 'success', icon: <Star className="h-4 w-4" />, text: 'Your resume is exceptional! Consider minor formatting refinements.' },
        { type: 'success', icon: <ThumbsUp className="h-4 w-4" />, text: 'Keep your content updated with recent achievements.' },
        { type: 'info', icon: <Target className="h-4 w-4" />, text: 'Tailor your resume for specific job applications.' }
      ];
    } else if (score >= 80) {
      return [
        { type: 'success', icon: <ThumbsUp className="h-4 w-4" />, text: 'Strong resume! Minor improvements will make it even better.' },
        { type: 'info', icon: <Target className="h-4 w-4" />, text: 'Add more quantifiable achievements and metrics.' },
        { type: 'info', icon: <TrendingUp className="h-4 w-4" />, text: 'Consider adding relevant certifications or skills.' }
      ];
    } else if (score >= 60) {
      return [
        { type: 'warning', icon: <AlertTriangle className="h-4 w-4" />, text: 'Good foundation, but needs strengthening in key areas.' },
        { type: 'info', icon: <Target className="h-4 w-4" />, text: 'Add more specific examples of your accomplishments.' },
        { type: 'info', icon: <TrendingUp className="h-4 w-4" />, text: 'Include relevant keywords for your target industry.' },
        { type: 'warning', icon: <FileText className="h-4 w-4" />, text: 'Improve formatting and overall structure.' }
      ];
    } else {
      return [
        { type: 'error', icon: <AlertCircle className="h-4 w-4" />, text: 'Significant improvements needed for competitive edge.' },
        { type: 'warning', icon: <AlertTriangle className="h-4 w-4" />, text: 'Focus on clear, concise professional summary.' },
        { type: 'info', icon: <Target className="h-4 w-4" />, text: 'Add quantified achievements and specific examples.' },
        { type: 'info', icon: <TrendingUp className="h-4 w-4" />, text: 'Include relevant skills and certifications.' },
        { type: 'warning', icon: <FileText className="h-4 w-4" />, text: 'Improve overall formatting and readability.' }
      ];
    }
  };

  const radialData = score !== null ? [
    {
      name: 'Resume Score',
      score: score,
      fill: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
    }
  ] : [];

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
            Analyze and optimize your profile resume with AI-powered insights
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
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Content Display */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span className="truncate">{resumeTitle}</span>
                  </CardTitle>
                </div>
                {resumeText && (
                  <p className="text-sm text-white/80 mt-2">
                    {resumeText.length.toLocaleString()} characters • 
                    {Math.ceil(resumeText.split(' ').length)} words • 
                    Ready for analysis
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8 text-green-600" />
                    <span className="ml-3 text-slate-600">Loading profile resume...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={16}
                      className="bg-slate-50 border-slate-200 text-slate-700 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm leading-relaxed"
                      placeholder="Your profile resume content will appear here. You can edit it before analysis."
                      readOnly={!resumeText}
                    />
                    
                    {originalResumeFile && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Profile contains resume file: <strong>{originalResumeFile.name}</strong>
                          {extractingProfile && ' - Extracting text...'}
                        </span>
                      </div>
                    )}
                    
                    {resumeText && (
                      <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg">
                        <strong>Profile Resume:</strong> This is your saved profile resume. 
                        You can make edits here before analysis. Changes are temporary and won't affect your saved profile.
                      </div>
                    )}

                    {!resumeText && !loading && (
                      <div className="text-center py-8 text-slate-400">
                        <FileText className="h-12 w-12 mx-auto mb-3" />
                        <p className="text-lg font-medium mb-2">No Resume Found</p>
                        <p className="text-sm">Please add your resume content to your profile first.</p>
                        <Link href={`/dashboard/${username}/profile`} className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          Go to Profile
                        </Link>
                      </div>
                    )}
                  </div>
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
                  disabled={analyzing || loading || extractingProfile || !resumeText.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze Profile Resume
                    </>
                  )}
                </Button>

                <Button
                  onClick={fetchProfile}
                  disabled={loading || extractingProfile}
                  variant="outline"
                  className="w-full border-slate-300 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Profile Data
                </Button>

                {!resumeText && !loading && (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-yellow-700 mb-3">
                      No resume content found in your profile.
                    </p>
                    <Link href={`/dashboard/${username}/profile`}>
                      <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                        Add Resume to Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Display with Chart */}
            {score !== null && (
              <Card className={`shadow-lg border-2 ${getScoreBg(score)}`}>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className={`h-6 w-6 ${getScoreColor(score)}`} />
                      <h3 className="text-lg font-semibold text-slate-700">Resume Score</h3>
                    </div>
                    <div className={`text-4xl font-bold ${getScoreColor(score)} mb-2`}>
                      {score}%
                    </div>
                  </div>

                  {/* Score Chart */}
                  <div className="h-32 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
                        <RadialBar
                          dataKey="score"
                          cornerRadius={10}
                          fill={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                        />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-slate-700">
                          {score}%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>

                  {/* Motivation Text */}
                  <div className="text-center">
                    <p className="text-sm text-slate-600 italic">
                      {getMotivationText(score)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {score !== null && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {getRecommendations(score).map((rec, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          rec.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                          rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                          rec.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                          'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <div className="mt-0.5">
                          {rec.icon}
                        </div>
                        <p className="text-sm font-medium">{rec.text}</p>
                      </div>
                    ))}
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
                    Detected Skills ({skills.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-green-100 to-indigo-100 text-green-800 rounded-full text-sm font-medium border border-green-200 hover:shadow-md transition-shadow"
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
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    AI Analysis & Detailed Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm text-slate-700 max-w-none">
                    {typeof analysis === 'string' ? (
                      <div className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border text-sm leading-relaxed">
                        {analysis}
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border overflow-x-auto">
                        {JSON.stringify(analysis, null, 2)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Analysis Yet */}
            {!loading && !analyzing && !extractingProfile && score === null && resumeText && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-slate-400 mb-4">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold">Ready for Analysis</h3>
                    <p className="text-sm mb-4">Your profile resume is loaded and ready to be analyzed</p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>✓ Profile resume loaded successfully</p>
                      <p>✓ AI-powered analysis and scoring</p>
                      <p>✓ Instant feedback and improvement suggestions</p>
                      <p>✓ Personalized recommendations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Resume Available */}
            {!loading && !analyzing && !extractingProfile && !resumeText && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-slate-400 mb-4">
                    <FileText className="h-12 w-12 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold">No Resume Found</h3>
                    <p className="text-sm mb-4">Please add your resume content to your profile to get started</p>
                    <div className="text-xs text-slate-500 space-y-1 mb-4">
                      <p>• Go to your profile page</p>
                      <p>• Add or upload your resume content</p>
                      <p>• Return here to analyze your resume</p>
                    </div>
                    <Link href={`/dashboard/${username}/profile`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Go to Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {(loading || analyzing || extractingProfile) && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-slate-400 mb-4">
                    <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-green-600" />
                    <h3 className="text-lg font-semibold">
                      {loading ? 'Loading Profile...' : 
                       analyzing ? 'Analyzing Resume...' : 
                       'Processing Profile Resume...'}
                    </h3>
                    <p className="text-sm">
                      {loading ? 'Fetching your profile information' : 
                       analyzing ? 'AI is processing your resume for insights' :
                       'Extracting text from your profile resume file'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8">
          <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center text-slate-600">
                <h3 className="font-semibold mb-4">How to Use Resume Analyzer</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">1. Profile Resume</span>
                    <span className="text-xs text-center">Your saved profile resume is automatically loaded</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <span className="font-medium">2. Analyze</span>
                    <span className="text-xs text-center">Get AI-powered analysis and scoring</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-lg">
                    <Target className="h-8 w-8 text-yellow-600" />
                    <span className="font-medium">3. Improve</span>
                    <span className="text-xs text-center">Follow personalized recommendations</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
                  <h4 className="font-medium mb-2">Analysis Features</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-green-500" />
                      <span>Resume Scoring</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-blue-500" />
                      <span>Skills Detection</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-purple-500" />
                      <span>AI Recommendations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-indigo-500" />
                      <span>Detailed Insights</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  This analyzer works exclusively with your profile resume. 
                  To add or update your resume, please visit your profile page first.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}