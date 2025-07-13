'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Camera, FileUp } from 'lucide-react';
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
      // Redirect to login or handle logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }

    try {
      const res = await fetch('http://localhost:8000/api/auth/refresh/', {
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
        // Redirect to login page
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

  // Fetch universities
  useEffect(() => {
    fetch('http://localhost:8000/api/universities/')
      .then((res) => res.json())
      .then(setUniversities)
      .catch(console.error);
  }, []);

  // Fetch profile with enhanced token management
  useEffect(() => {
    if (!username) return;
    
    const fetchProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest('http://localhost:8000/api/candidates/profile/');
        
        if (response && response.ok) {
          const data = await response.json();
          setOriginalData(data);
          setProfileImage(data.profile_picture || DEFAULT_IMAGE);
          setResumeUrl(data.resume);
          setSkills(data.skills || []);
          setLanguages(data.languages || '');
          setGraduationYear(data.graduation_year || '');
          setEditValues({
            email: data.user.email || '',
            firstName: data.user.first_name || '',
            lastName: data.user.last_name || '',
            title: data.professional_title || '',
            gender: data.gender || '',
            city: data.city || '',
            university: data.university || '',
            degree: data.degree || '',
          });
        } else if (response && !response.ok) {
          toast.error('Failed to load profile data.', {
            duration: 3000,
            description: 'Please try again later.'
          });
        }
      } catch (error) {
        toast.error('Error loading profile.',
          {
            duration: 3000,
            description: 'Please check your internet connection and try again.'
          }
        );
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

  // Get university name by ID
  const getUniversityName = (universityId) => {
    const university = universities.find(u => u.id === Number(universityId));
    return university ? university.name : '';
  };

  // Check if any changes have been made
  const hasChanges = () => {
    if (!originalData) return false;
    
    // Check file changes
    if (profileFile || resumeFile) return true;
    
    // Check form field changes
    const fieldChanges = 
      editValues.email !== (originalData.email || '') ||
      editValues.firstName !== (originalData.first_name || '') ||
      editValues.lastName !== (originalData.last_name || '') ||
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
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || /msword|docx/.test(file.type))) {
      setResumeFile(file);
      setResumeUrl(null);
    } else {
      toast.error('Upload PDF/DOC.', 
        {
          duration: 3000,
          description: 'Please upload a valid PDF or Word document.'
        }
      );
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
    if (!skills.includes(s)) setSkills([...skills, s]);
    setSkillInput('');
    setSuggestions([]);
  };

  const removeSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx));

  // Enhanced save function with token management
  const save = async () => {
    // Check if there are any changes before saving
    if (!hasChanges()) {
      toast.error('No changes were made', 
        {
          duration: 3000,
          description: 'Please modify your profile before saving.'
        }
      );
      return;
    }
    
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
      const response = await makeAuthenticatedRequest('http://localhost:8000/api/candidates/profile/', {
        method: 'PATCH',
        body: fd,
      });
      
      if (response && response.ok) {
        const data = await response.json();
        toast.success('Profile saved!');
        
        // Update original data to reflect the saved changes
        setOriginalData(data);
        setProfileFile(null);
        setResumeFile(null);
        
        // Update current values from the response
        setProfileImage(data.profile_picture || DEFAULT_IMAGE);
        setResumeUrl(data.resume);
        setSkills(data.skills || []);
        setLanguages(data.languages || '');
        setGraduationYear(data.graduation_year || '');
        setEditValues({
          email: data.user.email || '',
          firstName: data.user.first_name || '',
          lastName: data.user.last_name || '',
          title: data.professional_title || '',
          gender: data.gender || '',
          city: data.city || '',
          university: data.university || '',
          degree: data.degree || '',
        });
      } else if (response && !response.ok) {
        toast.error('Save failed.', 
          {
            duration: 3000,
            description: 'Please check your input and try again.'
          }
        );
      }
    } catch (error) {
      toast.error('Save failed.', {
        duration: 3000,
        description: 'An error occurred while saving your profile. Please try again later.'
      });
    }
  };

  if (!hydrated || !username) return <LoadingPage />;

  return (
    <div className="relative bg-gradient-to-br from-green-50  w-full to-green-100  p-10 text-black min-h-screen">
      <div ref={circleContainer} className="absolute inset-0 pointer-events-none">
        {Array(80).fill().map((_, i) => {
          const sz = Math.random() * 20 + 10;
          const top = Math.random()*100, left = Math.random()*100;
          const cols = ['#00ff00','#4B5320','#355E38','#0000','#006400'];
          return <div key={i} className="circle" style={{
            width: sz, height: sz, top:`${top}%`, left:`${left}%`,
            backgroundColor: cols[Math.floor(Math.random()*cols.length)],
            position:'absolute', borderRadius:'9999px', opacity:0.2
          }}/>
        })}
      </div>

      <div className="p-6 z-10 relative max-w-3xl mx-auto bg-white text-black rounded shadow">
        <Link href={`/dashboard/${username}`} className="flex items-center text-green-500 mb-6">
          <ArrowLeft /><span className="ml-2">Back</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={profileImage} alt="Profile" className="w-23 object-center h-24 rounded-full"/>
            <label className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-full cursor-pointer">
              <Camera className="text-white"/>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-green-800">{`${editValues.firstName} ${editValues.lastName}`}</h2>
            <p className='text-green-600'>{editValues.email}</p>
            <p className=''>{editValues.title}</p>
          </div>
        </div>

        <button onClick={() => setEditMode(!editMode)} className="absolute top-6 right-6">
          <Pencil className="text-green-600 hover:text-green-800" />
        </button>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {Object.entries(editValues).filter(([k]) => k !== 'university').map(([k,v]) => (
            <div key={k}>
              <label className="capitalize">{k === 'firstName' ? 'First Name' : k === 'lastName' ? 'Last Name' : k}</label>
              <input
                disabled={!editMode}
                type="text"
                value={v}
                onChange={(e) => setEditValues({...editValues, [k]: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          <div>
            <label>University</label>
            <select
              disabled={!editMode}
              value={editValues.university}
              onChange={(e) => setEditValues({...editValues, university: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">Select University</option>
              {universities.map((u) => (
                <option key={u.university_id} value={u.university_id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Graduation Year</label>
            <input
              disabled={!editMode}
              type="number"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Languages</label>
            <input
              disabled={!editMode}
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <label>Skills</label>
          <div className="flex gap-2 mt-2">
            <input
              disabled={!editMode}
              value={skillInput}
              onChange={handleSkillChange}
              placeholder="Add skill"
              className="flex-1 p-2 border rounded"
            />
            <button disabled={!editMode} onClick={() => addSkill(skillInput)} className="px-4 py-2 rounded-3xl bg-green-600">Add</button>
          </div>
          {suggestions.length > 0 && (
            <ul className="bg-white text-black p-2 rounded shadow">
              {suggestions.map((s,i) => (
                <li key={i} onClick={() => addSkill(s)} className="cursor-pointer hover:bg-green-200 p-1">{s}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((s,i) => (
              <span key={i} className="bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1">
                {s}
                <button onClick={() => removeSkill(i)} disabled={!editMode} className="ml-1 font-bold">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Resume */}
        <div className="mt-6">
          <label>Resume</label>
          <div className="mt-2 flex gap-4">
            <label className="px-4 w-[20%] py-2 bg-green-600 rounded cursor-pointer">
              <div className="flex flex-row gap-5"><FileUp /> Upload</div>
              <input type="file" disabled={!editMode} accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
            </label>
            {resumeUrl && !resumeFile && <a href={resumeUrl} target="_blank" className="text-green-600 underline">Resume</a>}
            {resumeFile && <span>{resumeFile.name}</span>}
          </div>
        </div>

        {/* Save button */}
        {editMode && (
          <div className="mt-6">
            <button onClick={save} className="bg-green-700 cursor-pointer px-6 py-2 text-white rounded hover:bg-green-800">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;