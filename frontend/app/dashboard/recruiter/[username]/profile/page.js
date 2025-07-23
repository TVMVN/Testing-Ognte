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
  const username = params.username;
  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasChangesToSave, setHasChangesToSave] = useState(false);

  const [originalData, setOriginalData] = useState(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_IMAGE);
  const [profileFile, setProfileFile] = useState(null);
  const BACKEND_URL = 'http://localhost:8000/';
  const [editValues, setEditValues] = useState({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    companyName: '',
    website: '',
    companySize: '',
    phone: '',
    location: '',
    industry: '',
    bio: '',
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
      toast.error('Please log in to continue.', {
        description: 'You need to be logged in to access this resource.',
        duration: 5000,
      });
      return null;
    }

    // First attempt with current token
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      token = await refreshAccessToken();
      
      if (token) {
        // Retry the request with new token
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

  // Fetch profile with enhanced token management
  useEffect(() => {
    if (!username) return;
    
    const fetchProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/recruiters/profile/`);
        
        if (response && response.ok) {
          const data = await response.json();
          setOriginalData(data);
          setProfileImage(data.logo || DEFAULT_IMAGE);
          setEditValues({
            email: data.user?.email || '',
            firstName: data.user?.first_name || '',
            lastName: data.user?.last_name || '',
            username: data.user?.username || '',
            companyName: data.company_name || '',
            website: data.website || '',
            companySize: data.company_size || '',
            phone: data.phone || '',
            location: data.location || '',
            industry: data.industry || '',
            bio: data.bio || '',
          });
        } else if (response && !response.ok) {
          toast.error('Failed to load profile data.', {
            description: 'Please check your network connection or try again later.',
            duration: 5000,
          });
        }
      } catch (error) {
        toast.error('Error loading profile.', {
          description: 'An error occurred while fetching your profile. Please try again later.',
          duration: 5000,
        });
      }
    };

    fetchProfile();
  }, [username]);

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
    
    // Check file changes
    if (profileFile) return true;
    
    // Check form field changes
    const fieldChanges = 
      editValues.email !== (originalData.email || '') ||
      editValues.firstName !== (originalData.first_name || '') ||
      editValues.lastName !== (originalData.last_name || '') ||
      editValues.username !== (originalData.user || '') ||
      editValues.companyName !== (originalData.company_name || '') ||
      editValues.website !== (originalData.website || '') ||
      editValues.companySize !== (originalData.company_size || '') ||
      editValues.phone !== (originalData.phone || '') ||
      editValues.location !== (originalData.location || '') ||
      editValues.industry !== (originalData.industry || '') ||
      editValues.bio !== (originalData.bio || '');
    
    return fieldChanges;
  };

  // Monitor changes for save button
  useEffect(() => {
    setHasChangesToSave(hasChanges());
  }, [profileFile, editValues, originalData]);

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

  // Enhanced save function with token management
  const save = async () => {
    // Check if there are any changes before saving
    if (!hasChanges()) {
      toast.error('No changes were made');
      return;
    }

    const fd = new FormData();
    
    // Add all form fields to FormData
    fd.append('email', editValues.email);
    fd.append('first_name', editValues.firstName);
    fd.append('last_name', editValues.lastName);
    fd.append('username', editValues.username);
    fd.append('company_name', editValues.companyName);
    fd.append('website', editValues.website);
    fd.append('company_size', editValues.companySize);
    fd.append('phone', editValues.phone);
    fd.append('location', editValues.location);
    fd.append('industry', editValues.industry);
    fd.append('bio', editValues.bio);
    
    if (profileFile) fd.append('logo', profileFile);

    try {
      const response = await makeAuthenticatedRequest(`${BACKEND_URL}/api/recruiters/profile/`, {
        method: 'PATCH',
        body: fd,
      });
      
      if (response && response.ok) {
        const data = await response.json();
        toast.success('Profile saved!',{
          description: 'Your profile has been updated successfully.',
          duration: 5000,
        });
        
        // Update original data to reflect the saved changes
        setOriginalData(data);
        setProfileFile(null);
        
        // Update current values from the response
        setProfileImage(data.logo || DEFAULT_IMAGE);
        setEditValues({
          email: data.email || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          username: data.user || '',
          companyName: data.company_name || '',
          website: data.website || '',
          companySize: data.company_size || '',
          phone: data.phone || '',
          location: data.location || '',
          industry: data.industry || '',
          bio: data.bio || '',
        });
      } else if (response && !response.ok) {
        toast.error('Save failed.');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Save failed.',
        {
          description: 'An error occurred while saving your profile. Please try again later.',
          duration: 5000,
        });
    }
  };

  if (!hydrated || !username) return <LoadingPage />;

  return (
    <div className="relative bg-gradient-to-br from-green-50  w-full to-green-100 p-10 text-black min-h-screen">
      <div ref={circleContainer} className="absolute inset-0 pointer-events-none">
        {Array(80).fill().map((_, i) => {
          const sz = Math.random() * 20 + 10;
          const top = Math.random()*100, left = Math.random()*100;
          const cols = ['#00ff00','#4B5320','#355E38 ','#0000','#006400'];
          return <div key={i} className="circle" style={{
            width: sz, height: sz, top:`${top}%`, left:`${left}%`,
            backgroundColor: cols[Math.floor(Math.random()*cols.length)],
            position:'absolute', borderRadius:'9999px', opacity:0.2
          }}/>
        })}
      </div>

      <div className="p-6 z-10 relative max-w-3xl mx-auto bg-white text-black rounded shadow">
        <Link href={`/dashboard/recruiter/${username}`} className="flex items-center text-green-500 mb-6">
          <ArrowLeft /><span className="ml-2">Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={profileImage} alt="Company Logo" className="w-24 object-center h-24 rounded-full border-2 border-green-500"/>
            <label className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-full cursor-pointer">
              <Camera className="text-white"/>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-green-800">{`${editValues.firstName} ${editValues.lastName}`}</h2>
            <p className='text-green-600'>{editValues.email}</p>
            <p className='text-gray-700 font-medium'>{editValues.companyName} | {editValues.location && <span className='text-green-600 text-sm'>{editValues.location}</span>} </p>
            
          </div>
        </div>

        <button onClick={() => setEditMode(!editMode)} className="absolute top-6 right-6">
          <Pencil className="text-green-600 hover:text-green-800" />
        </button>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">First Name</label>
              <input
                disabled={!editMode}
                type="text"
                value={editValues.firstName}
                onChange={(e) => setEditValues({...editValues, firstName: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="font-medium">Last Name</label>
              <input
                disabled={!editMode}
                type="text"
                value={editValues.lastName}
                onChange={(e) => setEditValues({...editValues, lastName: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="font-medium">Username</label>
              <input
                disabled={!editMode}
                type="text"
                value={editValues.username}
                onChange={(e) => setEditValues({...editValues, username: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="font-medium">Email</label>
              <input
                disabled={!editMode}
                type="email"
                value={editValues.email}
                onChange={(e) => setEditValues({...editValues, email: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="font-medium">Phone</label>
              <input
                disabled={!editMode}
                type="tel"
                value={editValues.phone}
                onChange={(e) => setEditValues({...editValues, phone: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="font-medium">Location</label>
              <input
                disabled={!editMode}
                type="text"
                value={editValues.location}
                onChange={(e) => setEditValues({...editValues, location: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Company Name</label>
              <input
                disabled={!editMode}
                type="text"
                value={editValues.companyName}
                onChange={(e) => setEditValues({...editValues, companyName: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="font-medium">Website</label>
              <input
                disabled={!editMode}
                type="url"
                value={editValues.website}
                onChange={(e) => setEditValues({...editValues, website: e.target.value})}
                className="w-full p-2 border rounded mt-1"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="font-medium">Company Size</label>
              <select
                disabled={!editMode}
                value={editValues.companySize}
                onChange={(e) => setEditValues({...editValues, companySize: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="">Select Company Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
            <div>
              <label className="font-medium">Industry</label>
              <select
                disabled={!editMode}
                value={editValues.industry}
                onChange={(e) => setEditValues({...editValues, industry: e.target.value})}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Construction">Construction</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Government">Government</option>
                <option value="Non-profit">Non-profit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Bio</h3>
          <div>
            <label className="font-medium">Company Description</label>
            <textarea
              disabled={!editMode}
              value={editValues.bio}
              onChange={(e) => setEditValues({...editValues, bio: e.target.value})}
              className="w-full p-2 border border-1 border-green-700 rounded mt-1 resize-none"
              rows="4"
              placeholder="Tell us about your company, culture, and what makes it a great place to work..."
            />
          </div>
        </div>

        {/* Save button */}
        {editMode && (
          <div className="mt-6">
            <button 
              onClick={save} 
              disabled={!hasChangesToSave}
              className={`px-6 py-2 text-white rounded ${
                hasChangesToSave 
                  ? 'bg-green-700 hover:bg-green-800' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;