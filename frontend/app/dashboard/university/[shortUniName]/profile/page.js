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
  Plus, 
  MapPin, 
  Globe, 
  Calendar, 
  Building2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Users,
  Award, 
  Mail
} from 'lucide-react';
import gsap from 'gsap';
import LoadingPage from '@/app/loading';
import { toast } from 'sonner';

const DEFAULT_IMAGE = 'https://i.pinimg.com/736x/8a/f7/b5/8af7b51236d65265ed84dc50a99f63fb.jpg';

const Profile = () => {
  const params = useParams();
  const shortUniName = params.shortUniName;
  const BACKEND_URL = 'http://localhost:8000'; 
  
  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasChangesToSave, setHasChangesToSave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [originalData, setOriginalData] = useState(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_IMAGE);
  const [profileFile, setProfileFile] = useState(null);

  // University-specific state
  const [courses, setCourses] = useState([]);
  const [courseInput, setCourseInput] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');

  const [editValues, setEditValues] = useState({
    email: '',
    name: '',
    year: '',
    website: '',
    location: '',
    description: '',
    type: '',
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

  // Parse courses - handle both string and array formats
  const parseCourses = (coursesData) => {
    if (!coursesData) return [];
    
    if (Array.isArray(coursesData)) {
      return coursesData;
    }
    
    if (typeof coursesData === 'string') {
      let cleanedData = coursesData.trim();
      let parsed = cleanedData;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (typeof parsed === 'string' && attempts < maxAttempts) {
        try {
          parsed = JSON.parse(parsed);
          attempts++;
        } catch (error) {
          return cleanedData.split(',').map(course => course.trim()).filter(course => course);
        }
      }
      
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      if (typeof parsed === 'string') {
        return parsed.split(',').map(course => course.trim()).filter(course => course);
      }
    }
    return [];
  };

  // Fetch university profile
  useEffect(() => {
    if (!shortUniName) {
      console.warn('shortUniName param missing!');
      return;
    }
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/profile/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache',
          next: { revalidate: 60 },
        });
        
        if (response && response.ok) {
          const data = await response.json();
          console.log('Fetched profile data:', data);
          
          setOriginalData(data);
          setProfileImage(data.logo || DEFAULT_IMAGE);
          
          const parsedCourses = parseCourses(data.courses);
          setCourses(parsedCourses);
          
          setEstablishedYear(data.year || '');
          
          setEditValues({
            email: data.user?.email || '',
            name: data.name || data.user?.name || '',
            year: data.year || '',
            website: data.website || '',
            location: data.location || '',
            description: data.description || '',
            type: data.type || '',
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
  }, [shortUniName]);

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

  // Check if any changes have been made
  const hasChanges = () => {
    if (!originalData) return false;
    
    if (profileFile) return true;
    
    const fieldChanges = 
      editValues.email !== (originalData.user?.email || '') ||
      editValues.name !== (originalData.name || '') ||
      editValues.year !== (originalData.year || '') ||
      editValues.website !== (originalData.website || '') ||
      editValues.location !== (originalData.location || '') ||
      editValues.description !== (originalData.description || '') ||
      editValues.type !== (originalData.type || '');
    
    const originalCourses = parseCourses(originalData.courses);
    const coursesChanged = JSON.stringify(courses.sort()) !== JSON.stringify(originalCourses.sort());
    
    return fieldChanges || coursesChanged;
  };

  // Monitor changes for save button
  useEffect(() => {
    setHasChangesToSave(hasChanges());
  }, [profileFile, editValues, establishedYear, courses, originalData]);

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

  // Course management
  const addCourse = () => {
    if (courseInput.trim() && !courses.includes(courseInput.trim())) {
      const newCourse = courseInput.trim();
      setCourses([...courses, newCourse]);
      setCourseInput('');
      
      toast.success(`Added "${newCourse}" to courses!`, {
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: 'none'
        }
      });
    } else if (courses.includes(courseInput.trim())) {
      toast.error('Course already exists!', {
        style: {
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          border: 'none'
        }
      });
    }
  };

  const removeCourse = (idx) => {
    const removedCourse = courses[idx];
    setCourses(courses.filter((_, i) => i !== idx));
    
    toast.success(`Removed "${removedCourse}" from courses.`, {
      style: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
    
    fd.append('email', editValues.email);
    fd.append('name', editValues.name);
    fd.append('year', establishedYear);
    fd.append('website', editValues.website);
    fd.append('location', editValues.location);
    fd.append('description', editValues.description);
    fd.append('type', editValues.type);
    fd.append('courses', JSON.stringify(courses));

    if (profileFile) fd.append('logo', profileFile);

    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/universities/profile/`, {
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
        
        setOriginalData(data);
        setProfileFile(null);
        setEditMode(false);
        
        setProfileImage(data.logo || DEFAULT_IMAGE);
        const parsedCourses = parseCourses(data.courses);
        setCourses(parsedCourses);
        setEstablishedYear(data.year || '');
        setEditValues({
          email: data.user?.email || '',
          name: data.name || data.user?.name || '',
          year: data.year || '',
          website: data.website || '',
          location: data.location || '',
          description: data.description || '',
          type: data.type || '',
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
        name: originalData.name || originalData.user?.name || '',
        year: originalData.year || '',
        website: originalData.website || '',
        location: originalData.location || '',
        description: originalData.description || '',
        type: originalData.type || '',
      });
      setCourses(parseCourses(originalData.courses));
      setProfileImage(originalData.logo || DEFAULT_IMAGE);
      setProfileFile(null);
      setEstablishedYear(originalData.year || '');
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

  if (!shortUniName) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl border border-red-200">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">University not found</h2>
        <p className="text-gray-600">Please check the URL and try again.</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Enhanced Background Elements */}
      <div ref={circleContainer} className="fixed inset-0 -z-10 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`circle absolute rounded-full ${
              i % 4 === 0 ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
              i % 4 === 1 ? 'bg-gradient-to-br from-green-400 to-teal-500' :
              i % 4 === 2 ? 'bg-gradient-to-br from-teal-400 to-emerald-500' :
              'bg-gradient-to-br from-emerald-500 to-green-600'
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
          href={`/dashboard/university/${shortUniName}`} 
          className="group inline-flex items-center space-x-3 text-emerald-600 hover:text-emerald-800 transition-all duration-300 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl border border-emerald-200 hover:border-emerald-300"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-semibold">Back to Dashboard</span>
          <Sparkles size={16} className="text-emerald-400 group-hover:text-emerald-600" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div 
          ref={cardRef}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-8 sm:p-12">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div ref={profileRef} className="relative group">
                <div className="relative">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow-2xl group-hover:shadow-3xl transition-shadow duration-300"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {editMode && (
                  <label 
                    htmlFor="profile-upload" 
                    className="absolute bottom-2 right-2 bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-full cursor-pointer hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
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

              {/* University Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      {editValues.name || 'University Name'}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-white/90">
                      {editValues.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>{editValues.location}</span>
                        </div>
                      )}
                      {establishedYear && (
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>Est. {establishedYear}</span>
                        </div>
                      )}
                      {editValues.type && (
                        <div className="flex items-center space-x-2">
                          <Building2 size={16} />
                          <span>{editValues.type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center md:justify-end">
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="group flex items-center space-x-2 bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border border-emerald-200"
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
                              ? 'bg-white text-emerald-600 hover:bg-emerald-50 hover:shadow-xl border border-emerald-200'
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
            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  label: 'Email Address', 
                  value: editValues.email, 
                  key: 'email', 
                  type: 'email',
                  icon: <Mail className="w-5 h-5 text-emerald-600" />
                },
                { 
                  label: 'University Type', 
                  value: editValues.type, 
                  key: 'type', 
                  type: 'text',
                  icon: <Building2 className="w-5 h-5 text-emerald-600" />
                },
                { 
                  label: 'Website', 
                  value: editValues.website, 
                  key: 'website', 
                  type: 'url',
                  icon: <Globe className="w-5 h-5 text-emerald-600" />
                },
                { 
                  label: 'Location', 
                  value: editValues.location, 
                  key: 'location', 
                  type: 'text',
                  icon: <MapPin className="w-5 h-5 text-emerald-600" />
                },
              ].map((field, index) => (
                <div key={field.key} className="space-y-3">
                  <label className="flex items-center space-x-2 font-semibold text-gray-700">
                    {field.icon}
                    <span>{field.label}</span>
                  </label>
                  {editMode ? (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                      {field.value || `No ${field.label.toLowerCase()} provided`}
                    </div>
                  )}
                </div>
              ))}

              {/* Year Established - Special handling */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 font-semibold text-gray-700">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>Year Established</span>
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                    placeholder="Enter establishment year"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800">
                    {establishedYear || 'No year provided'}
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <label className="flex items-center space-x-2 font-semibold text-gray-700">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>University Description</span>
              </label>
              {editMode ? (
                <textarea
                  rows={6}
                  value={editValues.description}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-800 placeholder-gray-500 resize-none"
                  placeholder="Describe your university, its mission, values, and what makes it unique..."
                />
              ) : (
                <div className="px-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 min-h-[120px]">
                  {editValues.description || 'No description provided'}
                </div>
              )}
            </div>

            {/* Courses Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-800">Courses Offered</h3>
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {courses.length} courses
                </span>
              </div>

              {editMode && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <input
                      type="text"
                      placeholder="Add a new course (e.g., Computer Science, Medicine)"
                      value={courseInput}
                      onChange={(e) => setCourseInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCourse()}
                      className="flex-grow px-4 py-3 rounded-2xl bg-white border border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-800 placeholder-gray-500"
                    />
                    <button
                      onClick={addCourse}
                      disabled={!courseInput.trim()}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                        courseInput.trim()
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:shadow-xl'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={18} />
                      <span>Add Course</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Courses Display */}
              <div className="space-y-4">
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:border-emerald-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors duration-300">
                              {course}
                            </span>
                          </div>
                          {editMode && (
                            <button
                              onClick={() => removeCourse(idx)}
                              className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                              aria-label={`Remove ${course}`}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
                    <BookOpen className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-600 mb-2">No courses added yet</h4>
                    <p className="text-gray-500">
                      {editMode 
                        ? 'Start by adding your first course above' 
                        : 'Courses will appear here once added'
                      }
                    </p>
                  </div>
                )}
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

            {/* Profile Statistics */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 text-center">Profile Completeness</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { 
                    label: 'Basic Info', 
                    value: Math.round((
                      (editValues.name ? 1 : 0) + 
                      (editValues.email ? 1 : 0) + 
                      (editValues.location ? 1 : 0) + 
                      (editValues.type ? 1 : 0)
                    ) / 4 * 100),
                    icon: <Users className="w-6 h-6" />
                  },
                  { 
                    label: 'Description', 
                    value: editValues.description ? 100 : 0,
                    icon: <BookOpen className="w-6 h-6" />
                  },
                  { 
                    label: 'Courses', 
                    value: courses.length > 0 ? 100 : 0,
                    icon: <Award className="w-6 h-6" />
                  },
                  { 
                    label: 'Profile Image', 
                    value: profileImage !== DEFAULT_IMAGE ? 100 : 0,
                    icon: <Camera className="w-6 h-6" />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;