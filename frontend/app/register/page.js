'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaFacebook } from "react-icons/fa";
import { toast } from "sonner"

export default function UniqueRegister() {
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    professionalTitle: '',
    university: '',
    degree: '',
    graduationYear: '',
    email: '',
    username: '',
    phone: '',
    city: '',
    gender: '',
    password: '',
    confirmPassword: '',
    languages: [],
    employmentType: '',
    resume: null,
    profilePicture: null,
    role: 'Candidate'
  });

  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const BACKEND_URL = "http://localhost:8000/"

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const genders = ['Female', 'Male', 'Others'];
  const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Marathi', 'French', 'Japanese'];
  const userTypes = ['College Student', 'Fresher', 'Working Professional', 'School Student', 'Returning to Work'];

  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;
    return strongRegex.test(password);
  };

  const isValidResume = (file) => {
    if (!file) return false;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isValidType = validTypes.includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
    
    console.log('Resume validation:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isValidType,
      isValidSize
    });
    
    return isValidType && isValidSize;
  };

  const isValidImage = (file) => {
    if (!file) return false;
    const isValidType = file.type.startsWith('image/');
    const isValidSize = file.size <= 2 * 1024 * 1024; // 2MB
    
    console.log('Image validation:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isValidType,
      isValidSize
    });
    
    return isValidType && isValidSize;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectGender = (gender) => {
    setForm({ ...form, gender });
  };

  const toggleLanguage = (language) => {
    setForm({
      ...form,
      languages: form.languages.includes(language)
        ? form.languages.filter((l) => l !== language)
        : [...form.languages, language]
    });
  };

  const selectType = (employmentType) => {
    setForm({ ...form, employmentType });
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    console.log('Resume file selected:', file);
    
    if (file && !isValidResume(file)) {
      setError("Resume must be PDF, DOC, or DOCX and under 5MB.");
      setForm({ ...form, resume: null });
    } else {
      setError(null);
      setForm({ ...form, resume: file });
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    console.log('Profile picture selected:', file);
    
    if (file && !isValidImage(file)) {
      setError("Profile picture must be an image under 2MB.");
      setForm({ ...form, profilePicture: null });
    } else {
      setError(null);
      setForm({ ...form, profilePicture: file });
    }
  };

  console.log(universities);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation checks
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError("Password must be at least 8 characters, include a number and a special character.");
      setLoading(false);
      return;
    }

    // Check required fields
    const requiredFields = ['firstName', 'username', 'email', 'professionalTitle', 'phone'];
    for (const field of requiredFields) {
      if (!form[field]) {
        setError(`${field} is required.`);
        setLoading(false);
        return;
      }
    }

    // File validations - make resume required
    if (!form.resume) {
      setError("Please upload a resume.");
      setLoading(false);
      return;
    }

    if (!isValidResume(form.resume)) {
      setError("Please upload a valid resume (PDF/DOC/DOCX under 5MB).");
      setLoading(false);
      return;
    }

    // Profile picture is optional, but if provided, must be valid
    if (form.profilePicture && !isValidImage(form.profilePicture)) {
      setError("Please upload a valid profile picture (image under 2MB).");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      formData.append("first_name", form.firstName);
      formData.append("last_name", form.lastName || '');
      formData.append("professional_title", form.professionalTitle);
      if (form.university !== null && form.university !== '') {
        formData.append("university", form.university);
      }
      formData.append("degree", form.degree || '');
      formData.append("graduation_year", form.graduationYear || '');
      formData.append("email", form.email);
      formData.append("username", form.username);
      formData.append("phone", form.phone);
      formData.append("city", form.city || '');
      formData.append("gender", form.gender || '');
      formData.append("password", form.password);
      formData.append("confirm_password", form.confirmPassword);
      formData.append("languages", form.languages.join(", "));
      formData.append("employment_type", form.employmentType || '');
      formData.append("role", form.role);
      
      // Add files
      if (form.resume) {
        formData.append("resume", form.resume);
      }
      if (form.profilePicture) {
        formData.append("profile_picture", form.profilePicture);
      }

      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/register/candidate/`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      console.log('Response status:', response.status);
      
      // Try to get response text for debugging
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch (e) {
        console.log('Response is not valid JSON');
      }

      if (response.status === 201 || response.status === 200) {
        toast.success("🎉 Registration Successful", {
          description: "You can now log in with your credentials."
        });
        router.push('/login');
      } else {
        // Show specific error messages from backend
        if (responseData && responseData.error) {
          setError(responseData.error);
        } else if (responseData) {
          // Handle field-specific errors
          const errorMessages = [];
          for (const [field, messages] of Object.entries(responseData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          setError(errorMessages.join('; '));
        } else {
          setError(`Registration failed with status ${response.status}`);
        }
        
        toast.error("Registration Failed", {
          description: "Please check your information and try again.",
          duration: 5000,
        });
      }

    } catch (err) {
      console.error('Network error:', err);
      setError(`Network error: ${err.message}`);
      toast.error("Network Error", {
        description: "Please try again later.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/universities`);
        if (!res.ok) throw new Error("Failed to fetch universities");
        const data = await res.json();
        setUniversities(data);
      } catch (err) {
        console.error('Error fetching universities:', err);
      }
    };

    fetchUniversities();
  }, []);

  const isPasswordMismatch = form.password !== form.confirmPassword;
  const isPasswordWeak = !isStrongPassword(form.password);
  const isSubmitDisabled = isPasswordMismatch || isPasswordWeak || loading;

  return (
       <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-green-200 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Candidate Registration</h1>
          <div className="w-24 h-1 bg-green-600 mx-auto rounded-full"></div>
          <h2 className="text-lg sm:text-xl text-green-700 mt-4 mb-2">Welcome! Let's get you started</h2>
        </div>

        <div className="space-y-8">
          {/* Personal Info */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <input 
                type="text" 
                name="firstName" 
                placeholder="First Name *" 
                value={form.firstName} 
                onChange={handleChange} 
                required 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
              <input 
                type="text" 
                name="lastName" 
                placeholder="Last Name (Optional)" 
                value={form.lastName} 
                onChange={handleChange} 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
              <input 
                type="text" 
                name="username" 
                placeholder="Username *" 
                value={form.username} 
                onChange={handleChange} 
                required 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <select
                name="university"
                value={form.university}
                onChange={handleChange}
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 transition-all duration-200"
              >
                <option value="" className="text-green-600">Select University</option>
                {universities.map((uni) => (
                  <option key={uni.university_id || uni.id} value={uni.university_id || uni.id}>
                    {uni.name}
                    </option>
                  ))}
              </select>
              <input 
                type="text" 
                name="degree" 
                placeholder="Degree (Optional)" 
                value={form.degree} 
                onChange={handleChange} 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
              <input 
                type="number" 
                name="graduationYear" 
                placeholder="Graduation Year" 
                value={form.graduationYear} 
                onChange={handleChange} 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address *" 
                value={form.email} 
                onChange={handleChange} 
                required 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
              <input 
                type="text" 
                name="professionalTitle" 
                placeholder="Professional Title *" 
                required 
                value={form.professionalTitle} 
                onChange={handleChange} 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <input 
                type="tel" 
                name="phone" 
                placeholder="Mobile Number *" 
                value={form.phone} 
                onChange={handleChange} 
                required 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
              <input 
                type="text" 
                name="city" 
                placeholder="Current City" 
                value={form.city} 
                onChange={handleChange} 
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password *"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
                />
                {touched.password && isPasswordWeak && (
                  <p className="text-red-600 text-xs mt-1 bg-red-50 p-2 rounded border border-red-200">Password must be 8+ characters, include a number, uppercase letter, lowercase letter and a special character.</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password *"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
                />
                {touched.confirmPassword && isPasswordMismatch && (
                  <p className="text-red-600 text-xs mt-1 bg-red-50 p-2 rounded border border-red-200">Passwords do not match.</p>
                )}
              </div>
            </div>
          </section>

          {/* Gender Selection */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Gender</h3>
            <div className="flex flex-wrap gap-3">
              {genders.map((gender) => (
                <div 
                  key={gender} 
                  onClick={() => selectGender(gender)} 
                  className={`px-4 py-2 rounded-full cursor-pointer border transition-all duration-200 text-sm sm:text-base ${
                    form.gender === gender 
                      ? 'bg-green-600 border-green-600 text-white shadow-md' 
                      : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400'
                  }`}
                >
                  {gender}
                </div>
              ))}
            </div>
          </section>

          {/* Language Selection */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Languages You Know</h3>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang) => (
                <div 
                  key={lang} 
                  onClick={() => toggleLanguage(lang)} 
                  className={`px-4 py-2 rounded-full cursor-pointer transition-all duration-200 text-sm sm:text-base ${
                    form.languages.includes(lang) 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 hover:border-green-400'
                  }`}
                >
                  {lang}
                </div>
              ))}
            </div>
          </section>

          {/* User Type */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">You Are</h3>
            <div className="flex flex-wrap gap-3">
              {userTypes.map((type) => (
                <div 
                  key={type} 
                  onClick={() => selectType(type)} 
                  className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm sm:text-base ${
                    form.employmentType === type 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 hover:border-green-400'
                  }`}
                >
                  {type}
                </div>
              ))}
            </div>
          </section>

          {/* Resume & Picture Upload */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="block font-semibold mb-2 text-green-800">
                  Upload Resume <span className="text-red-500">*</span> 
                  <span className="text-green-600 text-sm font-normal"> (pdf/docx)</span>
                </label>
                <input 
                  type="file" 
                  name="resume" 
                  onChange={handleResumeChange} 
                  accept=".pdf,.doc,.docx" 
                  required 
                  className="block w-full text-sm text-green-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer" 
                />
                {form.resume && <p className="text-green-700 text-xs mt-2 font-medium">✓ {form.resume.name}</p>}
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="block font-semibold mb-2 text-green-800">
                  Upload Profile Picture 
                  <span className="text-green-600 text-sm font-normal"> (optional)</span>
                </label>
                <input 
                  type="file" 
                  name="profilePicture" 
                  onChange={handlePictureChange} 
                  accept="image/*" 
                  className="block w-full text-sm text-green-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer" 
                />
                {form.profilePicture && <p className="text-green-700 text-xs mt-2 font-medium">✓ {form.profilePicture.name}</p>}
              </div>
            </div>
          </section>

          {/* Social Register */}
          <div className="bg-green-100 p-4 rounded-lg border border-green-200">
            <button 
              type="button" 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="text-base sm:text-lg">Register with Socials</span>
              <div className="flex gap-4  lg:border-l-2 md:border-l-2 xl:border-l-2 border-green-100 pl-3 text-xl">
              {/* <div className="inline-flex gap-2 items-center justify-center  px-8 py-1 font-sans font-semibold tracking-wide border-green-400 text-white bg-[#7d76765d] h-[48px] rounded-r-lg "> */}
            <FcGoogle className="w-[30px] h-[30px] cursor-pointer mr-2" />
            <FaGithub className="w-[30px] h-[30px] cursor-pointer mr-2" />
            <FaFacebook className="bg-blue-500 cursor-pointer rounded-full text-black w-[30px] h-[30px] mr-2" />
              {/* </div> */}
              </div>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled || loading} 
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              isSubmitDisabled || loading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </div>
            ) : 'Sign Up'}
          </button>
          

          <div className="text-center pt-4 border-t border-green-100">
            <Link href="/login">
              <p className="text-black hover:text-green-700 font-medium transition-colors duration-200">
                Already have an account? <span className=" text-green-600">Login here</span>
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

