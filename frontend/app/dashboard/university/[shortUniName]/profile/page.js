'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Camera } from 'lucide-react';
import gsap from 'gsap';
import LoadingPage from '@/app/loading';
import { toast } from 'sonner';

const DEFAULT_IMAGE = 'https://i.pinimg.com/736x/8a/f7/b5/8af7b51236d65265ed84dc50a99f63fb.jpg';

const Profile = () => {
  const params = useParams();
  const shortUniName = params.shortUniName;
  const BACKEND_URL = 'http://localhost:8000'; 
  
  console.log('Params:', params);
  console.log('shortUniName:', shortUniName);

  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasChangesToSave, setHasChangesToSave] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Token management functions
  const getAccessToken = () => localStorage.getItem('access_token');
  const getRefreshToken = () => localStorage.getItem('refresh_token');

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      toast.error('No refresh token found. Please log in again.');
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
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      toast.error('Authentication error. Please log in again.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  };

  // Enhanced API request function with automatic token refresh
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      toast.error('Please log in to continue.');
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
    // Remove any extra quotes and whitespace
    let cleanedData = coursesData.trim();
    
    // Try to parse as JSON multiple times to handle nested stringification
    let parsed = cleanedData;
    let attempts = 0;
    const maxAttempts = 5; // Prevent infinite loops
    
    while (typeof parsed === 'string' && attempts < maxAttempts) {
      try {
        parsed = JSON.parse(parsed);
        attempts++;
      } catch (error) {
        // If JSON.parse fails, try splitting by comma as fallback
        return cleanedData.split(',').map(course => course.trim()).filter(course => course);
      }
    }
    
    // If we end up with an array, return it
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // If we end up with a string after parsing, split by comma
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
        // Note: Adjust the API endpoint if needed to include shortUniName for fetching the right profile
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
            description: 'Please try again later.'
          });
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        toast.error('Error loading profile.', {
          duration: 3000,
          description: 'Please check your internet connection and try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [shortUniName]);

  // GSAP background circles
  useEffect(() => {
    if (circleContainer.current) {
      const circles = circleContainer.current.querySelectorAll('.circle');
      circles.forEach((c) => {
        const x = gsap.utils.random(-200, 200, true);
        const y = gsap.utils.random(-300, 300, true);
        const dur = gsap.utils.random(10, 30);
        const dly = gsap.utils.random(0, 5);
        gsap.fromTo(c, { scale: 0.5, opacity: 0 }, {
          scale: 1, opacity: 0.2, duration: 2, delay: dly, ease: 'power2.out'
        });
        gsap.to(c, { x, y, repeat: -1, yoyo: true, duration: dur, delay: dly, ease: 'sine.inOut' });
      });
    }
  }, []);

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
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Course management
  const addCourse = () => {
    if (courseInput.trim() && !courses.includes(courseInput.trim())) {
      setCourses([...courses, courseInput.trim()]);
      setCourseInput('');
    }
  };

  const removeCourse = (idx) => {
    setCourses(courses.filter((_, i) => i !== idx));
  };

  // Save function
  const save = async () => {
    if (!hasChanges()) {
      toast.error('No changes were made', {
        duration: 3000,
        description: 'Please modify your profile before saving.'
      });
      return;
    }
    
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
        toast.success('Profile saved successfully!');
        
        setOriginalData(data);
        setProfileFile(null);
        
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
        console.error('Save error:', errorData);
        toast.error('Save failed.', {
          duration: 3000,
          description: JSON.stringify(errorData)
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving your profile.');
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
    }
  };

  if (!hydrated || loading) return <LoadingPage />;

  if (!shortUniName) return <div>University not found. Please check the URL.</div>;

  return (
    <div className="relative h-screen overflow-y-auto bg-green-100 text-green-900 p-4">
      {/* Background circles */}
      <div ref={circleContainer} className="fixed inset-0 -z-10 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="circle absolute rounded-full bg-green-600 opacity-10"
            style={{
              width: '300px',
              height: '300px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <Link href={`/dashboard/university/${shortUniName}`} className="mb-4 flex items-center space-x-2 text-green-400 hover:text-green-600">
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <div className="max-w-4xl mx-auto bg-white rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-x-0 md:space-x-8">
          <div className="relative">
            <img
              src={profileImage}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover border-4 border-green-600"
            />
            {editMode && (
              <label htmlFor="profile-upload" className="absolute bottom-2 right-2 bg-green-600 p-2 rounded-full cursor-pointer hover:bg-green-700">
                <Camera size={20} className= "text-white" />
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

          <div className="flex-1 mt-4 md:mt-0">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">{editValues.name}</h1>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                >
                  <Pencil size={16} />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={save}
                    disabled={!hasChangesToSave}
                    className={`px-4 py-2 rounded ${hasChangesToSave ? 'bg-green-600  text-green-100 hover:bg-green-700' : 'bg-gray-600  text-green-100 cursor-not-allowed'}`}
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelChanges}
                    className="px-4 py-2 text-white rounded bg-red-600 hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Editable Fields */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    value={editValues.email}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    className="w-full rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                  />
                ) : (
                  <p>{editValues.email}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold">University Type</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editValues.type}
                    onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                    className="w-full rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                  />
                ) : (
                  <p>{editValues.type}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold">Website</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editValues.website}
                    onChange={(e) => setEditValues({ ...editValues, website: e.target.value })}
                    className="w-full rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                  />
                ) : (
                  <p>{editValues.website}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold">Location</label>
                {editMode ? (
                  <input
                    type="text"
                    value={editValues.location}
                    onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                    className="w-full rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                  />
                ) : (
                  <p>{editValues.location}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold">Year Established</label>
                {editMode ? (
                  <input
                    type="text"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                    className="w-full rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                  />
                ) : (
                  <p>{establishedYear}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block mb-1 font-semibold">Description</label>
              {editMode ? (
                <textarea
                  rows={4}
                  value={editValues.description}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  className="w-full rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                />
              ) : (
                <p>{editValues.description}</p>
              )}
            </div>

            <div className="mt-6">
              <label className="block mb-1 font-semibold">Courses</label>
              {editMode ? (
                <>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add a course"
                      value={courseInput}
                      onChange={(e) => setCourseInput(e.target.value)}
                      className="flex-grow rounded bg-green-200 p-2 border border-gray-600 text-green-900"
                    />
                    <button
                      onClick={addCourse}
                      className="bg-green-600 text-green-100 hover:bg-green-700 px-4 py-2 rounded"
                      disabled={!courseInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {courses.map((course, idx) => (
                      <li
                        key={idx}
                        className="bg-green-500 rounded px-3 py-1 cursor-pointer hover:bg-green-600 flex items-center space-x-2"
                      >
                        <span>{course}</span>
                        <button
                          onClick={() => removeCourse(idx)}
                          aria-label={`Remove ${course}`}
                          className="text-green-100 hover:text-gray-300"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <ul>
                  {courses.map((course, idx) => (
                    <li key={idx}>{course}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
