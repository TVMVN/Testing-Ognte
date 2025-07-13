"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaFacebook } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UniversityRegistration() {
  const router = useRouter();

  const [data, setData] = useState({
    username: "",
    password: "",
    confirm_password: "",
    name: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    type: "",
    courses: [],
    year: "",
    description: "",
    logo: null,
  });

  const [touched, setTouched] = useState({
    password: false,
    confirm_password: false,
  });

  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;
    return strongRegex.test(password);
  };

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setData({ ...data, [name]: files[0] });
    } else {
      setData({ ...data, [name]: value });
    }
  };

  const handleCheckboxChange = (course) => {
    setData((prev) => {
      const courses = prev.courses.includes(course)
        ? prev.courses.filter((c) => c !== course)
        : [...prev.courses, course];
      return { ...prev, courses };
    });
  };

  const selectType = (type) => {
    setData({ ...data, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agree) {
      toast.error("Please accept the terms and conditions.");
      return;
    }
    if (data.password !== data.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(data.password)) {
      toast.error(
        "Password must be at least 8 characters, include a number, uppercase letter, lowercase letter, and a special character."
      );
      return;
    }

    try {
      setLoading(true);

      // Option 1: Send as FormData (if backend accepts multipart/form-data)
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirm_password", data.confirm_password);
      formData.append("name", data.name);
      formData.append("phone", data.phone);
      formData.append("website", data.website);
      formData.append("location", data.location);
      formData.append("type", data.type);
      formData.append("courses", data.courses.join(", "));
      formData.append("year", data.year || "");
      formData.append("description", data.description);

      if (data.logo) {
        formData.append("logo", data.logo);
      }

      // Use the correct API endpoint
      const res = await fetch("http://127.0.0.1:8000/api/auth/register/university/", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("🎉 Registration Successful");
        router.push("/login");
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Registration error:", err); // Debug log
        toast.error("Registration Failed", {
          description: err.detail || err.message || "Please check your information.",
        });
      }
    } catch (err) {
      console.error("Network error:", err); // Debug log
      toast.error("Network Error", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Alternative handleSubmit for JSON format (if backend expects JSON)
  const handleSubmitJSON = async (e) => {
    e.preventDefault();

    if (!agree) {
      toast.error("Please accept the terms and conditions.");
      return;
    }
    if (data.password !== data.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!isStrongPassword(data.password)) {
      toast.error(
        "Password must be at least 8 characters, include a number, uppercase letter, lowercase letter, and a special character."
      );
      return;
    }

    try {
      setLoading(true);

      // Option 2: Send as JSON (if backend expects JSON)
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        name: data.name,
        phone: data.phone,
        website: data.website,
        location: data.location,
        type: data.type,
        courses: data.courses.join(", "),
        year: data.year || "",
        description: data.description,
        logo: null // Handle logo separately if needed
      };

      const res = await fetch("http://127.0.0.1:8000/api/auth/register/university/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("🎉 Registration Successful");
        router.push("/login");
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Registration error:", err); // Debug log
        toast.error("Registration Failed", {
          description: err.detail || err.message || "Please check your information.",
        });
      }
    } catch (err) {
      console.error("Network error:", err); // Debug log
      toast.error("Network Error", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMismatch = data.password !== data.confirm_password;
  const isPasswordWeak = !isStrongPassword(data.password);
  const isSubmitDisabled = isPasswordMismatch || isPasswordWeak || loading || !agree;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-green-200 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">University Registration</h1>
          <div className="w-24 h-1 bg-green-600 mx-auto rounded-full"></div>
          <h2 className="text-lg sm:text-xl text-green-700 mt-4 mb-2">Welcome! Let's get your university started</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                name="username"
                placeholder="Display Name *"
                value={data.username}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="text"
                name="name"
                placeholder="University Name *"
                value={data.name}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="email"
                name="email"
                placeholder="University Email *"
                value={data.email}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <input
                type="tel"
                name="phone"
                placeholder="Contact Number *"
                value={data.phone}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="url"
                name="website"
                placeholder="Website URL *"
                value={data.website}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <input
                type="text"
                name="location"
                placeholder="Location *"
                value={data.location}
                onChange={handleChange}
                required
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password *"
                  value={data.password}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  required
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
                  value={data.confirm_password}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirm_password: true }))}
                  required
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

          {/* University Type */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">University Type</h3>
            <div className="flex flex-wrap gap-3">
              {["Public", "Private", "Other"].map((type) => (
                <div
                  key={type}
                  onClick={() => selectType(type)}
                  className={`px-4 py-2 rounded-full cursor-pointer border transition-all duration-200 text-sm sm:text-base ${
                    data.type === type
                      ? 'bg-green-600 border-green-600 text-white shadow-md'
                      : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400'
                  }`}
                >
                  {type}
                </div>
              ))}
            </div>
          </section>

          {/* Courses Offered */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Courses Offered</h3>
            <div className="flex flex-wrap gap-3">
              {["Engineering", "Business", "Medicine", "Law", "Arts", "Science", "Technology"].map((course) => (
                <div
                  key={course}
                  onClick={() => handleCheckboxChange(course)}
                  className={`px-4 py-2 rounded-full cursor-pointer transition-all duration-200 text-sm sm:text-base ${
                    data.courses.includes(course)
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 hover:border-green-400'
                  }`}
                >
                  {course}
                </div>
              ))}
            </div>
          </section>

          {/* Additional Details */}
          <section>
            <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Additional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="year"
                placeholder="Year Established (Optional)"
                value={data.year}
                onChange={handleChange}
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200"
              />
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <label className="block font-semibold mb-2 text-green-800">
                  Upload University Logo
                  <span className="text-green-600 text-sm font-normal"> (optional)</span>
                </label>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={handleChange}
                  className="block w-full text-sm text-green-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                />
                {data.logo && <p className="text-green-700 text-xs mt-2 font-medium">✓ {data.logo.name}</p>}
              </div>
            </div>

            <div className="mt-4">
              <textarea
                name="description"
                placeholder="Short Description (Optional)"
                value={data.description}
                onChange={handleChange}
                rows="3"
                className="bg-green-50 border border-green-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-900 placeholder-green-600 transition-all duration-200 resize-none"
              />
            </div>
          </section>

          {/* Terms & Conditions */}
          <section>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  className="w-4 h-4 text-green-600 bg-green-50 border-green-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-green-700 font-medium">
                  I agree to the terms and conditions
                </span>
              </label>
            </div>
          </section>

          {/* Social Register */}
          <div className="bg-green-100 p-4 rounded-lg border border-green-200">
            <button
              type="button"
              className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg w-full transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="text-base sm:text-lg">Register with Socials</span>
              <div className="flex gap-4 border-l-2 border-green-100 pl-3 text-xl">
                <FcGoogle className="w-[30px] h-[30px] cursor-pointer mr-2" />
                <FaGithub className="w-[30px] h-[30px] cursor-pointer mr-2" />
                <FaFacebook className="bg-blue-500 cursor-pointer rounded-full text-black w-[30px] h-[30px] mr-2" />
              </div>
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              isSubmitDisabled
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </div>
            ) : 'Register University'}
          </button>

          <div className="text-center pt-4 border-t border-green-100">
            <Link href="/login">
              <p className="text-green-600 hover:text-green-700 font-medium transition-colors duration-200">
                Already have an account? Login here
              </p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}