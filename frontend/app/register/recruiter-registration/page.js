'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaFacebook } from "react-icons/fa";
import { toast } from "sonner";

export default function RecruiterRegister() {
  const [recruiter, setRecruiter] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    username: '',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    industry: '',
    company_size: '',
    bio: '',
    logo: null,
    agree: false,
  });

  const [touched, setTouched] = useState({
    password: false,
    confirm_password: false,
  });

  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;
    return strongRegex.test(password);
  };

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const industries = ['IT', 'Finance', 'Healthcare', 'Education', 'Construction', 'Retail'];
  const companySizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRecruiter({ ...recruiter, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLogoUpload = (e) => {
    setRecruiter({ ...recruiter, logo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recruiter.agree) {
      toast.error("Please accept the terms and conditions.");
      return;
    }

    if (recruiter.password !== recruiter.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(recruiter.password)) {
      toast.error("Password must be at least 8 characters, include a number, uppercase letter, lowercase letter, and a special character.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    Object.entries(recruiter).forEach(([key, value]) => {
      // if (key === "logo" && value) {
      //   formData.append(key, value);
      if (key === "agree" || !value) return;

      if (key === "logo" ) {
        formData.append(key, value);
      } else if (value) {
        formData.append(key, value);
      }
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/recruiter/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success("🎉 Registration Successful", {
          description: "You can now log in with your credentials.",
        });
        router.push('/login');
      } else {
        toast.error("Registration Failed", {
          description: "Please check your information and try again.",
        });
      }
    } catch (err) {
      toast.error("Network Error", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch = recruiter.password !== recruiter.confirm_password;
  const isPasswordWeak = !isStrongPassword(recruiter.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-green-200 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Recruiter Registration</h1>
          <div className="w-24 h-1 bg-green-600 mx-auto rounded-full"></div>
          <h2 className="text-lg sm:text-xl text-green-700 mt-4 mb-2">Join our recruiting platform</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1  sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="first_name"
                placeholder="First Name *"
                value={recruiter.first_name}
                onChange={handleChange}
                required
                className="bg-green-50 border  border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name *"
                value={recruiter.last_name}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <input
                type="text"
                name="username"
                placeholder="Username *"
                value={recruiter.username}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="text"
                name="company_name"
                placeholder="Company Name *"
                value={recruiter.company_name}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full sm:col-span-2 lg:col-span-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={recruiter.email}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={recruiter.phone}
                onChange={handleChange}
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <input
                type="url"
                name="website"
                placeholder="Company Website"
                value={recruiter.website}
                onChange={handleChange}
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="text"
                name="location"
                placeholder="Location (City, Country)"
                value={recruiter.location}
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
                  value={recruiter.password}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
                />
                {touched.password && isPasswordWeak && (
                  <p className="text-red-600 text-xs mt-1 bg-red-50 p-2 rounded border border-red-200">
                    Password must be 8+ characters, include a number, uppercase letter, lowercase letter and a special character.
                  </p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm Password *"
                  value={recruiter.confirm_password}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirm_password: true }))}
                  className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
                />
                {touched.confirm_password && isPasswordMismatch && (
                  <p className="text-red-600 text-xs mt-1 bg-red-50 p-2 rounded border border-red-200">
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Company Information */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Company Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <select
                  name="industry"
                  value={recruiter.industry}
                  onChange={handleChange}
                  required
                  className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 transition-all duration-200"
                >
                  <option value="" className="text-green-600">Select Industry *</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  name="company_size"
                  value={recruiter.company_size}
                  onChange={handleChange}
                  required
                  className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 transition-all duration-200"
                >
                  <option value="" className="text-green-600">Select Company Size *</option>
                  {companySizes.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <textarea
                name="bio"
                placeholder="Short Company Bio (Optional)"
                value={recruiter.bio}
                onChange={handleChange}
                rows="4"
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
            </div>
          </section>

          {/* Company Logo Upload */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Company Logo</h3>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="block font-semibold mb-2 text-green-800">
                Upload Company Logo
                <span className="text-green-600 text-sm font-normal"> (optional)</span>
              </label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-green-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
              />
              {recruiter.logo && (
                <p className="text-green-700 text-xs mt-2 font-medium">✓ {recruiter.logo.name}</p>
              )}
            </div>
          </section>

          {/* Terms and Conditions */}
          <section>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="agree"
                  checked={recruiter.agree}
                  onChange={handleChange}
                  className="accent-green-500 w-5 h-5"
                />
                <label className="text-green-800 font-medium">
                  I agree to the Terms and Conditions
                </label>
              </div>
            </div>
          </section>

          {/* Social Register */}
          <div className="bg-green-100 p-4 rounded-lg border border-green-200">
            <button 
              type="button" 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition-all duration-200 shadow-md hover:shadow-lg"
              disabled
            >
              <span className="text-base sm:text-lg">Register with Socials</span>
              <div className="flex gap-4 lg:border-l-2 md:border-l-2 xl:border-l-2 border-green-100 pl-3 text-xl">
                <FcGoogle className="w-[30px] h-[30px] cursor-pointer" />
                <FaGithub className="w-[30px] h-[30px] cursor-pointer" />
                <FaFacebook className="bg-blue-500 cursor-pointer rounded-full text-black w-[30px] h-[30px]" />
              </div>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              loading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </div>
            ) : (
              'Register Now'
            )}
          </button>

          <div className="text-center pt-4 border-t border-green-100">
            <Link href="/login">
              <p className="text-black hover:text-green-700 font-medium transition-colors duration-200">
                Already have an account? <span className=" text-green-600">Login here</span>
              </p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}