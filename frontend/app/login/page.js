"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { FaGithub, FaFacebook, FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const users = ["Recruiter", "Candidate", "University"];
    const BACKEND_URL = "http://localhost:8000/"

  const [userType, setUserType] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (formError) setFormError("");
  };

  const validateForm = () => {
    const errors = [];
    
    if (!userType) {
      errors.push("Please select a user type.");
    }
    
    if (!formData.username) {
      errors.push("Username is required.");
    } else if (formData.username.length < 3) {
      errors.push("Username must be at least 3 characters long.");
    }
    
    if (!formData.password) {
      errors.push("Password is required.");
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters long.");
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare the request payload
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        role: userType
      };

      console.log("Sending login request with payload:", { ...payload, password: "[HIDDEN]" });

      const res = await fetch(`${BACKEND_URL}/api/auth/login/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      // Handle different response statuses
      if (res.status === 401) {
        toast.error("😪 Login Failed", {
          description: "Invalid credentials. Please check your username and password."
        });
        return;
      }

      if (res.status === 400) {
        const errorBody = await res.json();
        console.log("400 Error response:", errorBody);
        
        // Handle specific field errors
        const errorMessages = [];
        
        if (errorBody.username) {
          errorMessages.push(`Username: ${Array.isArray(errorBody.username) ? errorBody.username[0] : errorBody.username}`);
        }
        
        if (errorBody.password) {
          errorMessages.push(`Password: ${Array.isArray(errorBody.password) ? errorBody.password[0] : errorBody.password}`);
        }
        
        if (errorBody.role) {
          errorMessages.push(`Role: ${Array.isArray(errorBody.role) ? errorBody.role[0] : errorBody.role}`);
        }
        
        if (errorBody.detail) {
          errorMessages.push(errorBody.detail);
        }
        
        if (errorBody.non_field_errors) {
          errorMessages.push(...errorBody.non_field_errors);
        }
        
        const errorMessage = errorMessages.length > 0 
          ? errorMessages.join(". ") 
          : "Invalid input. Please check your information.";
        
        toast.error("Validation Error", {
          description: errorMessage
        });
        setFormError(errorMessage);
        return;
      }

      if (!res.ok) {
        const errorBody = await res.text();
        console.log("Non-200 response:", errorBody);
        
        toast.error("Login Failed", {
          description: `Server error (${res.status}). Please try again later.`
        });
        return;
      }

      const data = await res.json();
      console.log("Login success:", { ...data, access: "[HIDDEN]", refresh: "[HIDDEN]" });

      // Check if we got the expected tokens
      if (!data.access || !data.refresh) {
        toast.error("Login Error", {
          description: "Invalid response from server. Please try again."
        });
        return;
      }

      // Store tokens and user info
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem("username", formData.username);
      localStorage.setItem("userType", userType);
      
      toast.success("🎉 Welcome back!", {
        description: "You have been logged in successfully."
      });

      // Redirect to dashboard
      router.push("/dashboard");
      
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Connection Error", {
        description: "Unable to connect to the server. Please check your internet connection."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFields = () => {
    return (
      <>
        <InputField 
          name="username" 
          label="Username" 
          formData={formData}
          onChange={handleChange}
          placeholder="Enter your username"
          autoComplete="username"
        />
        <div className="relative">
          <InputField 
            name="password" 
            label="Password" 
            type={showPassword ? "text" : "password"}
            formData={formData}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-11 text-green-600 hover:text-green-800 transition-colors"
          >
            {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
          </button>
        </div>

        {/* Social login placeholders */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-green-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-green-600">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex gap-0 items-center justify-center w-full font-sans font-semibold tracking-wide border-green-400 text-white bg-transparent rounded-lg h-[60px] hover:bg-green-50 transition-all duration-200"
          disabled
        >
          <div className="bg-[#678c708a] w-full md:px-8 lg:px-8 xl:px-8 px-5 py-0 md:py-3 xl:py-3 lg:py-3 rounded-l-lg">
            <span className="text-xs md:text-md lg:text-md xl:text-md font-medium">Login with</span>
          </div>
          <div className="inline-flex gap-2 items-center justify-center px-8 py-1 font-sans font-semibold tracking-wide border-green-400 text-white bg-[#7d76765d] h-[48px] rounded-r-lg">
            <FcGoogle className="w-[30px] h-[30px] cursor-pointer mr-2 opacity-50" />
            <FaGithub className="w-[30px] h-[30px] cursor-pointer mr-2 opacity-50" />
            <FaFacebook className="bg-blue-500 cursor-pointer rounded-full text-black w-[30px] h-[30px] mr-2 opacity-50" />
          </div>
        </button>
        <p className="text-xs text-center text-gray-500">Social login coming soon</p>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-8">
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-green-200">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Role selector */}
        <section>
          <h3 className="text-lg sm:text-xl mb-4 text-green-700 font-semibold">Select Your Role</h3>
          <div className="flex gap-2 sm:gap-4 flex-wrap justify-center sm:justify-start">
            {users.map((user) => (
              <div
                key={user}
                onClick={() => setUserType(user)}
                className={`px-3 sm:px-4 py-2 rounded-full cursor-pointer border transition-all duration-300 text-sm sm:text-base font-medium ${
                  userType === user
                    ? "bg-green-600 border-green-600 text-white shadow-md transform scale-105"
                    : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400"
                }`}
              >
                {user}
              </div>
            ))}
          </div>
        </section>

        {/* Login form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {renderFields()}
          
          {formError && (
            <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md border border-red-200">
              <p className="font-semibold">Error:</p>
              <p>{formError}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={!userType || submitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              !userType || submitting
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Logging in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
          
          <Link className="text-center block" href="/forgot-password">
            <p className="text-center text-gray-600 hover:text-green-700 transition-colors duration-200">
              Forgot Password? <span className="text-green-600 font-medium">Reset</span>
            </p>
          </Link>
        </form>

        {/* Register dialog */}
        <div className="text-center text-sm text-gray-600">
          Don't have an account?
          <Dialog>
            <DialogTrigger className="ml-2 text-green-600 font-medium hover:text-green-700 hover:underline cursor-pointer transition-colors duration-200">
              Register
            </DialogTrigger>
            <DialogContent className="max-w-sm  bg-white sm:max-w-md mx-4">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl sm:text-2xl text-green-800 mb-2">Sign Up</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Begin Your Smart Journey at OGnite!
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Link
                  href="/register"
                  className="border-2 border-green-600 rounded-xl py-3 px-4 bg-green-600 text-white font-medium hover:bg-green-700 hover:border-green-700 transition-all duration-200 text-center"
                >
                  Register as a Candidate
                </Link>
                <Link
                  href="/register/recruiter-registration"
                  className="border-2 border-green-600 rounded-xl py-3 px-4 bg-white text-green-600 font-medium hover:bg-green-50 transition-all duration-200 text-center"
                >
                  Register as a Recruiter
                </Link>
                <Link
                  href="/register/university-registration"
                  className="border-2 border-green-600 rounded-xl py-3 px-4 bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-all duration-200 text-center"
                >
                  Register as a University
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

// Reusable input field component
const InputField = ({ name, label, type = "text", formData, onChange, placeholder, autoComplete }) => {
  const value = formData[name] || "";
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-lg bg-green-50 text-green-950 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        required
      />
    </div>
  );
};