'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Pencil, 
  Camera, 
  Save, 
  X, 
  MapPin, 
  Globe, 
  Building2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Mail,
  Phone,
  FileText,
  Award,
  GraduationCap,
  Languages,
  FileUp,
  Plus,
  Trash2,
  BookOpen,
  Calendar
} from 'lucide-react';
import gsap from 'gsap';
import LoadingPage from '@/app/loading';
import { toast } from 'sonner';

const DEFAULT_IMAGE = 'https://i.pinimg.com/736x/8a/f7/b5/8af7b51236d65265ed84dc50a99f63fb.jpg';

const Profile = () => {
  const params = useParams();
  const username = params.username;
  const BACKEND_URL = 'http://localhost:8000'; 

  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasChangesToSave, setHasChangesToSave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [originalData, setOriginalData] = useState(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_IMAGE);
  const [profileFile, setProfileFile] = useState(null);

  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [universities, setUniversities] = useState([]);
  const [graduationYear, setGraduationYear] = useState('');

  const [languages, setLanguages] = useState('');

  const [editValues, setEditValues] = useState({
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    gender: '',
    city: '',
    university: '',
    degree: '',
  });

  const circleContainer = useRef();
  const profileRef = useRef();
  const cardRef = useRef();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Token management functions
  const getAccessToken = () => localStorage.getItem('access_token');
  const getRefreshToken = () => localStorage.getItem('refresh_token');

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      toast.error('Session expired. Please log in again.', {
        style: {
          background: 'linear-gradient(135deg, #f56565, #e53e3e)',
          color: 'white',
          border: 'none'
        }
      });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access);
        return data.access;
      } else {
        toast.error('Session expired. Please log in again.', {
          style: {
            background: 'linear-gradient(135deg, #f56565, #e53e3e)',
            color: 'white',
            border: 'none'
          }
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      toast.error('Authentication error. Please log in again.', {
        style: {
          background: 'linear-gradient(135deg, #f56565, #e53e3e)',
          color: 'white',
          border: 'none'
        }
      });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  };

  // Enhanced API request function with automatic token refresh
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      toast.error('Please log in to continue.', {
        style: {
          background: 'linear-gradient(135deg, #f56565, #e53e3e)',
          color: 'white',
          border: 'none'
        }
      });
      return null;
    }

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      token = await refreshAccessToken();
      
      if (token) {
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        return null;
      }
    }

    return response;
  };

  // Fetch universities
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/universities/`)
      .then((res) => res.json())
      .then((data) => setUniversities(data.results || data || []))
      .catch(console.error);
  }, []);

  // Fetch candidate profile
  useEffect(() => {
    if (!username) {
      console.warn('Username param missing!');
      return;
    }
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/profile/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache',
        });
        
        if (response && response.ok) {
          const data = await response.json();
          console.log('Fetched profile data:', data);
          
          setOriginalData(data);
          setProfileImage(data.profile_picture || DEFAULT_IMAGE);
          setResumeUrl(data.resume);
          setSkills(data.skills || []);
          setLanguages(data.languages || '');
          setGraduationYear(data.graduation_year || '');
          
          setEditValues({
            email: data.user?.email || '',
            firstName: data.user?.first_name || '',
            lastName: data.user?.last_name || '',
            title: data.professional_title || '',
            gender: data.gender || '',
            city: data.city || '',
            university: data.university || '',
            degree: data.degree || '',
          });
        } else if (response && !response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Profile fetch error:', errorData);
          toast.error('Failed to load profile data.', {
            duration: 3000,
            description: 'Please try again later.',
            style: {
              background: 'linear-gradient(135deg, #f56565, #e53e3e)',
              color: 'white',
              border: 'none'
            }
          });
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        toast.error('Error loading profile.', {
          duration: 3000,
          description: 'Please check your internet connection and try again.',
          style: {
            background: 'linear-gradient(135deg, #f56565, #e53e3e)',
            color: 'white',
            border: 'none'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Enhanced GSAP animations
  useEffect(() => {
    if (circleContainer.current) {
      const circles = circleContainer.current.querySelectorAll('.circle');
      circles.forEach((c, index) => {
        const x = gsap.utils.random(-300, 300, true);
        const y = gsap.utils.random(-400, 400, true);
        const dur = gsap.utils.random(15, 40);
        const dly = gsap.utils.random(0, 8);
        
        gsap.fromTo(c, 
          { scale: 0, opacity: 0, rotation: 0 }, 
          {
            scale: gsap.utils.random(0.8, 1.2),
            opacity: gsap.utils.random(0.1, 0.3),
            rotation: 360,
            duration: 3,
            delay: dly,
            ease: 'power2.out'
          }
        );
        
        gsap.to(c, {
          x, y,
          repeat: -1,
          yoyo: true,
          duration: dur,
          delay: dly,
          ease: 'sine.inOut',
          rotation: `+=${gsap.utils.random(-180, 180)}`
        });
      });
    }

    // Card entrance animation
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power2.out', delay: 0.2 }
      );
    }

    // Profile image animation
    if (profileRef.current) {
      gsap.fromTo(profileRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.7)', delay: 0.5 }
      );
    }
  }, [loading]);

  // Get university name by ID
  const getUniversityName = (universityId) => {
    const university = universities.find(u => u.university_id === Number(universityId));
    return university ? university.name : '';
  };

  // Check if any changes have been made
  const hasChanges = () => {
    if (!originalData) return false;
    
    // Check file changes
    if (profileFile || resumeFile) return true;
    
    // Check form field changes
    const fieldChanges = 
      editValues.email !== (originalData.user?.email || '') ||
      editValues.firstName !== (originalData.user?.first_name || '') ||
      editValues.lastName !== (originalData.user?.last_name || '') ||
      editValues.title !== (originalData.professional_title || '') ||
      editValues.gender !== (originalData.gender || '') ||
      editValues.city !== (originalData.city || '') ||
      editValues.degree !== (originalData.degree || '') ||
      Number(editValues.university) !== (originalData.university || '') ||
      graduationYear !== String(originalData.graduation_year || '') ||
      languages !== (originalData.languages || '');
    
    // Check skills changes
    const skillsChanged = JSON.stringify(skills.sort()) !== JSON.stringify((originalData.skills || []).sort());
    
    return fieldChanges || skillsChanged;
  };

  // Monitor changes for save button
  useEffect(() => {
    setHasChangesToSave(hasChanges());
  }, [profileFile, resumeFile, editValues, graduationYear, skills, languages, originalData]);

  // Handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size too large. Please select an image under 5MB.', {
          style: {
            background: 'linear-gradient(135deg, #f56565, #e53e3e)',
            color: 'white',
            border: 'none'
          }
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.', {
          style: {
            background: 'linear-gradient(135deg, #f56565, #e53e3e)',
            color: 'white',
            border: 'none'
          }
        });
        return;
      }

      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result);
        // Animate image change
        if (profileRef.current) {
          gsap.fromTo(profileRef.current,
            { scale: 0.8, opacity: 0.5 },
            { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' }
          );
        }
      };
      reader.readAsDataURL(file);

      toast.success('Profile image updated!', {
        description: 'Don\'t forget to save your changes.',
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none'
        }
      });
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || /msword|docx/.test(file.type))) {
      setResumeFile(file);
      setResumeUrl(null);
      toast.success('Resume uploaded!', {
        description: 'Don\'t forget to save your changes.',
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none'
        }
      });
    } else {
      toast.error('Upload PDF/DOC.', {
        duration: 3000,
        description: 'Please upload a valid PDF or Word document.',
        style: {
          background: 'linear-gradient(135deg, #f56565, #e53e3e)',
          color: 'white',
          border: 'none'
        }
      });
    }
  };

  const handleSkillChange = async (e) => {
    const v = e.target.value;
    setSkillInput(v);
    if (v.length > 1) {
      try {
        const resp = await fetch(`http://api.datamuse.com/words?ml=${v}`);
        const arr = await resp.json();
        setSuggestions(arr.slice(0, 5).map((d) => d.word));
      } catch (error) {
        console.error('Skill suggestion error:', error);
        setSuggestions([]);
      }
    } else setSuggestions([]);
  };

  const addSkill = (s) => {
    if (s.trim() && !skills.includes(s.trim())) {
      setSkills([...skills, s.trim()]);
      toast.success(`Added skill: ${s.trim()}`, {
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none'
        }
      });
    }
    setSkillInput('');
    setSuggestions([]);
  };

  const removeSkill = (idx) => {
    const removedSkill = skills[idx];
    setSkills(skills.filter((_, i) => i !== idx));
    toast.info(`Removed skill: ${removedSkill}`, {
      style: {
        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
        color: 'white',
        border: 'none'
      }
    });
  };

  // Enhanced save function
  const save = async () => {
    if (!hasChanges()) {
      toast.error('No changes were made', {
        duration: 3000,
        description: 'Please modify your profile before saving.',
        style: {
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          border: 'none'
        }
      });
      return;
    }

    setSaving(true);
    const fd = new FormData();
    
    // Add all form fields to FormData
    fd.append('email', editValues.email);
    fd.append('first_name', editValues.firstName);
    fd.append('last_name', editValues.lastName);
    fd.append('professional_title', editValues.title);
    fd.append('gender', editValues.gender);
    fd.append('city', editValues.city);
    fd.append('university', editValues.university);
    fd.append('degree', editValues.degree);
    fd.append('graduation_year', graduationYear);
    fd.append('skills', JSON.stringify(skills));
    fd.append('languages', languages);
    
    if (profileFile) fd.append('profile_picture', profileFile);
    if (resumeFile) fd.append('resume', resumeFile);

    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/candidates/profile/`, {
        method: 'PATCH',
        body: fd,
      });
      
      if (response && response.ok) {
        const data = await response.json();
        toast.success('Profile saved successfully!', {
          description: 'Your changes have been applied.',
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none'
          }
        });
        
        // Update original data to reflect the saved changes
        setOriginalData(data);
        setProfileFile(null);
        setResumeFile(null);
        setEditMode(false);
        
        // Update current values from the response
        setProfileImage(data.profile_picture || DEFAULT_IMAGE);
        setResumeUrl(data.resume);
        setSkills(data.skills || []);
        setLanguages(data.languages || '');
        setGraduationYear(data.graduation_year || '');
        setEditValues({
          email: data.user?.email || '',
          firstName: data.user?.first_name || '',
          lastName: data.user?.last_name || '',
          title: data.professional_title || '',
          gender: data.gender || '',
          city: data.city || '',
          university: data.university || '',
          degree: data.degree || '',
        });

        // Success animation
        if (cardRef.current) {
          gsap.fromTo(cardRef.current,
            { scale: 1 },
            { scale: 1.02, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }
          );
        }
      } else if (response && !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save error:', errorData);
        toast.error('Save failed.', {
          duration: 3000,
          description: 'Please try again or contact support.',
          style: {
            background: 'linear-gradient(135deg, #f56565, #e53e3e)',
            color: 'white',
            border: 'none'
          }
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving your profile.', {
        style: {
          background: 'linear-gradient(135deg, #f56565, #e53e3e)',
          color: 'white',
          border: 'none'
        }
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancel changes
  const cancelChanges = () => {
    if (originalData) {
      setEditValues({
        email: originalData.user?.email || '',
        firstName: originalData.user?.first_name || '',
        lastName: originalData.user?.last_name || '',
        title: originalData.professional_title || '',
        gender: originalData.gender || '',
        city: originalData.city || '',
        university: originalData.university || '',
        degree: originalData.degree || '',
      });
      setProfileImage(originalData.profile_picture || DEFAULT_IMAGE);
      setResumeUrl(originalData.resume);
      setSkills(originalData.skills || []);
      setLanguages(originalData.languages || '');
      setGraduationYear(originalData.graduation_year || '');
      setProfileFile(null);
      setResumeFile(null);
      setEditMode(false);

      toast.info('Changes cancelled.', {
        description: 'Your profile has been restored to its previous state.',
        style: {
          background: 'linear-gradient(135deg, #6b7280, #4b5563)',
          color: 'white',
          border: 'none'
        }
      });
    }
  };

  if (!hydrated || loading) return <LoadingPage />;

  if (!username) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl border border-red-200">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidate not found</h2>
        <p className="text-gray-600">Please check the URL and try again.</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Enhanced Background Elements */}
      <div ref={circleContainer} className="fixed inset-0 -z-10 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`circle absolute rounded-full ${
              i % 4 === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
              i % 4 === 1 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
              i % 4 === 2 ? 'bg-gradient-to-br from-teal-400 to-green-500' :
              'bg-gradient-to-br from-green-500 to-emerald-600'
            }`}
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="relative z-10 p-4 sm:p-6">
        <Link 
          href={`/dashboard/${username}`} 
          className="group inline-flex items-center space-x-3 text-green-600 hover:text-green-800 transition-all duration-300 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl border border-green-200 hover:border-green-300"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-semibold">Back to Dashboard</span>
          <Sparkles size={16} className="text-green-400 group-hover:text-green-600" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div 
          ref={cardRef}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 sm:p-12">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div ref={profileRef} className="relative group">
                <div className="relative">
                  <img
                    src={profileImage}
                    alt="Profile Picture"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow-2xl group-hover:shadow-3xl transition-shadow duration-300"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {editMode && (
                  <label 
                    htmlFor="profile-upload" 
                    className="absolute bottom-2 right-2 bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full cursor-pointer hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
                  >
                    <Camera size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
                    <input
                      type="file"
                      id="profile-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {/* Candidate Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      {`${editValues.firstName} ${editValues.lastName}`.trim() || 'Your Name'}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-white/90 mb-2">
                      {editValues.email && (
                        <div className="flex items-center space-x-2">
                          <Mail size={16} />
                          <span>{editValues.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-white/90">
                      {editValues.title && (
                        <div className="flex items-center space-x-2">
                          <Award size={16} />
                          <span>{editValues.title}</span>
                        </div>
                      )}
                      {editValues.city && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>{editValues.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center md:justify-end">
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="group flex items-center space-x-2 bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border border-green-200"
                      >
                        <Pencil size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={save}
                          disabled={!hasChangesToSave || saving}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                            hasChangesToSave && !saving
                              ? 'bg-white text-green-600 hover:bg-green-50 hover:shadow-xl border border-green-200'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300'
                          }`}
                        >
                          {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button
                          onClick={cancelChanges}
                          disabled={saving}
                          className="flex items-center space-x-2 bg-red-500 text-white hover:bg-red-600 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <X size={18} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-8 sm:p-12 space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <Users className="w-6 h-6 text-green-600" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { 
                    label: 'First Name', 
                    value: editValues.firstName, 
                    key: 'firstName', 
                    type: 'text',
                    icon: <Users className="w-5 h-5 text-green-600" />
                  },
                  { 
                    label: 'Last Name', 
                    value: editValues.lastName, 
                    key: 'lastName', 
                    type: 'text',
                    icon: <Users className="w-5 h-5 text-green-600" />
                  },
                  { 
                    label: 'Email Address', 
                    value: editValues.email, 
                    key: 'email', 
                    type: 'email',
                    icon: <Mail className="w-5 h-5 text-green-600" />
                  },
                  { 
                    label: 'Professional Title', 
                    value: editValues.title, 
                    key: 'title', 
                    type: 'text',
                    icon: <Award className="w-5 h-5 text-green-600" />
                  },
                  { 
                    label: 'Gender', 
                    value: editValues.gender, 
                    key: 'gender', 
                    type: 'select',
                    options: [
                      { value: '', label: 'Select Gender' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                      { value: 'Prefer not to say', label: 'Prefer not to say' }
                    ],
                    icon: <Users className="w-5 h-5 text-green-600" />
                  },
                  { 
                    label: 'City', 
                    value: editValues.city, 
                    key: 'city', 
                    type: 'text',
                    icon: <MapPin className="w-5 h-5 text-green-600" />
                  },
                ].map((field) => (
                  <div key={field.key} className="space-y-3">
                    <label className="flex items-center space-x-2 font-semibold text-gray-700">
                      {field.icon}
                      <span>{field.label}</span>
                    </label>
                    {editMode ? (
                      field.type === 'select' ? (
                        <select
                          value={field.value}
                          onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800"
                        >
                          {field.options.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )
                    ) : (
                      <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                        {field.value || `No ${field.label.toLowerCase()} provided`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Education Information Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-green-600" />
                <span>Education Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 font-semibold text-gray-700">
                    <Building2 className="w-5 h-5 text-green-600" />
                    <span>University</span>
                  </label>
                  {editMode ? (
                    <select
                      value={editValues.university}
                      onChange={(e) => setEditValues({ ...editValues, university: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800"
                    >
                      <option value="">Select University</option>
                      {universities.map((u) => (
                        <option key={u.university_id} value={u.university_id}>{u.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                      {getUniversityName(editValues.university) || 'No university selected'}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2 font-semibold text-gray-700">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <span>Degree</span>
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editValues.degree}
                      onChange={(e) => setEditValues({ ...editValues, degree: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                      placeholder="Enter degree"
                    />
                  ) : (
                    <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                      {editValues.degree || 'No degree provided'}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2 font-semibold text-gray-700">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span>Graduation Year</span>
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      min="1950"
                      max={new Date().getFullYear() + 10}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                      placeholder="Enter graduation year"
                    />
                  ) : (
                    <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                      {graduationYear || 'No graduation year provided'}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2 font-semibold text-gray-700">
                    <Languages className="w-5 h-5 text-green-600" />
                    <span>Languages</span>
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                      placeholder="e.g., English, Spanish, French"
                    />
                  ) : (
                    <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                      {languages || 'No languages provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <Award className="w-6 h-6 text-green-600" />
                <span>Skills & Expertise</span>
              </h3>

              {editMode && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={handleSkillChange}
                        placeholder="Add a skill"
                        className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                        onKeyPress={(e) => e.key === 'Enter' && addSkill(skillInput)}
                      />
                      {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-green-200 rounded-2xl shadow-xl z-10 max-h-48 overflow-y-auto">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              onClick={() => addSkill(s)}
                              className="px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl border-b border-gray-100 last:border-b-0"
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim()}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                        skillInput.trim()
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={18} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {skills.length > 0 ? (
                  skills.map((skill, i) => (
                    <div
                      key={i}
                      className="group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-600 hover:to-emerald-600"
                    >
                      <span>{skill}</span>
                      {editMode && (
                        <button
                          onClick={() => removeSkill(i)}
                          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8 w-full">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No skills added yet</p>
                    {editMode && <p className="text-sm">Start typing to add your first skill</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Resume Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <FileText className="w-6 h-6 text-green-600" />
                <span>Resume</span>
              </h3>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Current Resume</h4>
                      <p className="text-sm text-gray-600">
                        {resumeFile ? resumeFile.name : (resumeUrl ? 'Resume uploaded' : 'No resume uploaded')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {editMode && (
                      <label className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <FileUp size={18} />
                        <span>Upload</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                        />
                      </label>
                    )}
                    
                    {((resumeUrl && !resumeFile) || resumeFile) && (
                      <a
                        href={resumeFile ? URL.createObjectURL(resumeFile) : resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-white text-green-600 border border-green-200 px-6 py-3 rounded-2xl font-semibold hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <FileText size={18} />
                        <span>View Resume</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            {editMode && (
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  {hasChangesToSave ? (
                    <>
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                      <div>
                        <p className="font-semibold text-gray-800">You have unsaved changes</p>
                        <p className="text-sm text-gray-600">Don't forget to save your updates</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-gray-800">All changes saved</p>
                        <p className="text-sm text-gray-600">Your profile is up to date</p>
                      </div>
                    </>
                  )}
                </div>
                
                {hasChangesToSave && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-amber-600">Unsaved</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile Completeness Statistics */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">Profile Completeness</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { 
                    label: 'Personal Info', 
                    value: Math.round((
                      (editValues.firstName ? 1 : 0) + 
                      (editValues.lastName ? 1 : 0) + 
                      (editValues.email ? 1 : 0) + 
                      (editValues.title ? 1 : 0) +
                      (editValues.city ? 1 : 0) +
                      (editValues.gender ? 1 : 0)
                    ) / 6 * 100),
                    icon: <Users className="w-6 h-6" />
                  },
                  { 
                    label: 'Education', 
                    value: Math.round((
                      (editValues.university ? 1 : 0) + 
                      (editValues.degree ? 1 : 0) + 
                      (graduationYear ? 1 : 0)
                    ) / 3 * 100),
                    icon: <GraduationCap className="w-6 h-6" />
                  },
                  { 
                    label: 'Skills', 
                    value: skills.length > 0 ? 100 : 0,
                    icon: <Award className="w-6 h-6" />
                  },
                  { 
                    label: 'Resume', 
                    value: (resumeUrl || resumeFile) ? 100 : 0,
                    icon: <FileText className="w-6 h-6" />
                  },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}%</div>
                    <div className="text-sm opacity-90">{stat.label}</div>
                    <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${stat.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Overall Progress */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {Math.round((
                      Math.round(((editValues.firstName ? 1 : 0) + (editValues.lastName ? 1 : 0) + (editValues.email ? 1 : 0) + (editValues.title ? 1 : 0) + (editValues.city ? 1 : 0) + (editValues.gender ? 1 : 0)) / 6 * 100) +
                      Math.round(((editValues.university ? 1 : 0) + (editValues.degree ? 1 : 0) + (graduationYear ? 1 : 0)) / 3 * 100) +
                      (skills.length > 0 ? 100 : 0) +
                      ((resumeUrl || resumeFile) ? 100 : 0)
                    ) / 4)}%
                  </div>
                  <p className="text-white/90">Overall Completion</p>
                  <div className="w-full bg-white/20 rounded-full h-3 mt-3">
                    <div 
                      className="bg-white h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.round(((Math.round(((editValues.firstName ? 1 : 0) + (editValues.lastName ? 1 : 0) + (editValues.email ? 1 : 0) + (editValues.title ? 1 : 0) + (editValues.city ? 1 : 0) + (editValues.gender ? 1 : 0)) / 6 * 100) + Math.round(((editValues.university ? 1 : 0) + (editValues.degree ? 1 : 0) + (graduationYear ? 1 : 0)) / 3 * 100) + (skills.length > 0 ? 100 : 0) + ((resumeUrl || resumeFile) ? 100 : 0)) / 4))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;