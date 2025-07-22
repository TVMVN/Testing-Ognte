'use client';
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  ChevronDown,
  Bell,
  MessageSquareMore,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingUp,
  Clock,
  FileText,
  Shield,
  Users,
  Briefcase,
  ChevronRight
} from "lucide-react";
import {
  DollarSign,
  Euro,
  Naira,
  PoundSterling,
} from 'lucide-react';
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner";

// Enhanced Error Handler Class
class ErrorHandler {
  static handleApiError(error, context = '') {
    console.error(`API Error ${context}:`, error);
    
    // Network errors
    if (!navigator.onLine) {
      return {
        message: "No internet connection",
        description: "Please check your network connection and try again.",
        type: "network"
      };
    }
    
    // Timeout errors
    if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
      return {
        message: "Request timed out",
        description: "The server is taking too long to respond. Please try again.",
        type: "timeout"
      };
    }
    
    // Parse error response
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 400:
          return {
            message: "Invalid request",
            description: "Please check your input and try again.",
            type: "validation"
          };
        case 401:
          return {
            message: "Authentication failed",
            description: "Please log in again to continue.",
            type: "auth"
          };
        case 403:
          return {
            message: "Access denied",
            description: "You don't have permission to perform this action.",
            type: "permission"
          };
        case 404:
          return {
            message: "Resource not found",
            description: "The requested resource could not be found.",
            type: "notfound"
          };
        case 429:
          return {
            message: "Too many requests",
            description: "Please wait a moment before trying again.",
            type: "ratelimit"
          };
        case 500:
          return {
            message: "Server error",
            description: "Something went wrong on our end. Please try again later.",
            type: "server"
          };
        default:
          return {
            message: "Something went wrong",
            description: `Error ${status}: Please try again or contact support.`,
            type: "unknown"
          };
      }
    }
    
    // Generic error fallback
    return {
      message: "An unexpected error occurred",
      description: "Please try again. If the problem persists, contact support.",
      type: "generic"
    };
  }

  static showErrorToast(error, context = '', retryAction = null) {
    const errorInfo = this.handleApiError(error, context);
    
    const toastOptions = {
      duration: 5000,
      description: errorInfo.description,
    };
    
    if (retryAction) {
      toastOptions.action = {
        label: "Retry",
        onClick: retryAction,
      };
    }
    
    if (errorInfo.type === 'auth') {
      toastOptions.action = {
        label: "Go to Login",
        onClick: () => window.location.href = '/login',
      };
    }
    
    toast.error(errorInfo.message, toastOptions);
  }
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const { username } = useParams();
  const [profilePic, setProfilePic] = useState(null);
  const [email, setEmail] = useState(null);
  const [site, setSite] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const BACKEND_URL = "http://localhost:8000/"

  const currencyIcons = {
    '$': <DollarSign size={16} />,
    '€': <Euro size={16} />,
    '£': <PoundSterling size={16} />,
    // '₦': <Naira size={16} />,
  };

  // Enhanced form state for internship posting
const [form, setForm] = useState({
  employer: '',
  title: '',
  description: '',
  location: '',
  skills: [],
  is_remote: false,
  is_active: true,
  application_deadline: '',
  salary: '',
  currency: '₦',
  paymentFrequency: 'monthly',
  salaryType: 'paid',
  number_of_slots: 1,
  industry: 'Technology',
  duration_of_internship: 3,
});

  const [tempFields, setTempFields] = useState({
    skills: '',
  });

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.location.trim() && !form.is_remote) newErrors.location = 'Location is required for non-remote positions';
    if (!form.application_deadline) newErrors.application_deadline = 'Application deadline is required';
    if (form.salaryType === 'paid' && !form.salary) newErrors.salary = 'Salary amount is required for paid positions';
    
    // Validate deadline is in the future
    if (form.application_deadline) {
      const deadlineDate = new Date(form.application_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate <= today) {
        newErrors.application_deadline = 'Application deadline must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Token management functions with enhanced error handling
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
      ErrorHandler.showErrorToast(
        { response: { status: 401 } }, 
        'Token refresh - no refresh token'
      );
      clearTokens();
      router.push('/login');
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access);
        }
        return data.access;
      } else {
        throw { response: { status: res.status } };
      }
    } catch (error) {
      ErrorHandler.showErrorToast(error, 'Token refresh');
      clearTokens();
      router.push('/login');
      return null;
    }
  };

  // Enhanced API request function
  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      ErrorHandler.showErrorToast(
        { response: { status: 401 } }, 
        'No authentication token'
      );
      router.push('/login');
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
        
        if (token) {
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
          
          response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              Authorization: `Bearer ${token}`,
            },
            signal: retryController.signal,
          });
          
          clearTimeout(retryTimeoutId);
        } else {
          return null;
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleOnChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleLogoutWithConfirmation = async () => {
  const confirmed = window.confirm('Are you sure you want to logout?');
  if (!confirmed) return;
  
  try {
    const token = getAccessToken();
    
    // Clear tokens immediately
    clearTokens();
    
    // Notify server in background (don't wait for response)
    if (token) {
      fetch(`${BACKEND_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(err => console.error('Background logout error:', err));
    }
    
    // Redirect immediately
    router.push('/login');
  } catch (err) {
    console.error('Logout error:', err);
    // Force redirect even if there's an error
    router.push('/login');
  }
};

  const handleAddField = (field) => {
    const newItem = tempFields[field].trim();
    if (newItem && !form[field].includes(newItem)) {
      setForm({ ...form, [field]: [newItem, ...form[field]] });
      setTempFields({ ...tempFields, [field]: '' });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm({
      ...form,
      skills: form.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Enhanced submit handler
 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error("Please fix the errors in the form", {
      duration: 3000,
      description: "Check the highlighted fields and try again.",
    });
    return;
  }
  
  setSubmitting(true);
  
  try {
    // Map frontend form data to backend expected fields
    const internshipData = {
      title: form.title,
      description: form.description,
      location: form.is_remote ? 'Remote' : form.location,
      required_skills: form.skills, // Backend expects 'required_skills', not 'skills'
      is_remote: form.is_remote,
      is_active: form.is_active,
      application_deadline: form.application_deadline,
      number_of_slots: 1, // Add default value
      industry: 'General', // Add default value or make this a form field
      duration_of_internship: 3, // Add default value or make this a form field
      // Map salary fields to what backend expects
      salary_amount: form.salaryType === 'paid' ? parseFloat(form.salary) : 0,
      salary_currency: form.currency === '₦' ? 'naira' : 
                      form.currency === '$' ? 'dollar' : 
                      form.currency === '€' ? 'euro' : 
                      form.currency === '£' ? 'pound' : 'naira',
      salary_status: form.salaryType,
      salary_frequency: form.paymentFrequency,
    };

    const res = await makeAuthenticatedRequest(
      `${BACKEND_URL}api/recruiters/jobs/`, 
      {
        method: 'POST',
        body: JSON.stringify(internshipData),
      }
    );

    if (!res) {
      return;
    }

    if (res.ok) {
      toast.success("Internship posted successfully!", {
        duration: 5000,
        description: "Your internship listing has been created and is now active.",
        action: {
          label: "View Listing",
          onClick: () => router.push(`/dashboard/recruiter/${username}/listings`),
        },
      });
      
      // Reset form
      setForm({
        employer: '',
        title: '',
        description: '',
        location: '',
        skills: [],
        is_remote: false,
        is_active: true,
        application_deadline: '',
        salary: '',
        currency: '₦',
        paymentFrequency: 'monthly',
        salaryType: 'paid',
      });
      setErrors({});
      
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error('Server response:', errorData); // Add debugging
      throw { 
        response: { status: res.status }, 
        data: errorData 
      };
    }
  } catch (error) {
    console.error('Full error:', error); // Add debugging
    ErrorHandler.showErrorToast(
      error, 
      'Posting internship',
      () => handleSubmit(e)
    );
  } finally {
    setSubmitting(false);
  }
};

  // Enhanced profile fetch with better error handling
  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          ErrorHandler.showErrorToast(
            { response: { status: 401 } }, 
            'Profile fetch - no token'
          );
          router.push('/login');
          return;
        }

        const res = await makeAuthenticatedRequest(
          `${BACKEND_URL}/api/recruiters/profile/`, 
          { method: 'GET' }
        );

        if (!res) return;

        if (!res.ok) {
          throw { response: { status: res.status } };
        }

        const data = await res.json();
        setProfilePic(data.logo);
        setEmail(data.user.email);
        setSite(data.website);
        setFirstName(data.user.first_name);
        setCompanyName(data.company_name);
        
        // Auto-fill employer in form
        setForm(prev => ({ ...prev, employer: data.company_name || '' }));
        
      } catch (err) {
        ErrorHandler.showErrorToast(err, 'Fetching profile');
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, router]);

  if (!username) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar - keeping original structure */}
      <nav className="Navbar px-8 h-[60px] flex justify-between items-center sticky top-0 z-50 bg-black shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2">
          <Link href={"/"}>
            <h1 className="text-xl font-bold text-white">
              OG<span className="text-[#25d442]">nite</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/recruiter/${username}/applications`}>
            <button className="border-none text-green-500 px-4 py-1 rounded cursor-pointer font-medium hover:bg-green-100">
              Applications
            </button>
          </Link>

          <Link href={`/dashboard/recruiter/${username}/listings`}>
            <button className="border-none cursor-pointer text-green-500 px-4 py-1 rounded font-medium hover:bg-green-100">
              Manage Listings
            </button>
          </Link>

          <Link href={`/dashboard/recruiter/${username}/notifications`}>
            <button className="relative border-none cursor-pointer text-green-100 px-1 py-1 rounded font-medium">
              <span className="absolute flex size-2 left-4.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
              </span>
              <Bell />
            </button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-black cursor-pointer border-green-500 border-[1.5px] py-1 hover:bg-black">
                {profilePic && (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-500"
                  />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="rounded-bl-full bg-white w-[30%] ">
              <SheetHeader>
                <SheetTitle className={`text-black`}>
                  Hello,{" "}
                  <span className="text-[#247c33] font-bold">{username}</span>
                </SheetTitle>
                <SheetDescription className="text-[#25d442] text-sm font-bold">
                  <span className="text-gray-400">Recruiter at</span> {companyName}
                </SheetDescription>
                <SheetDescription className="text-gray-400  text-sm font-bold">
                  {email} | <span className="cursor-pointer hover:text-green-400 text-green-500"> <a href={`${site}`} className="">View Company Site</a></span>
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 flex flex-col gap-4 pt-2 mt-5 text-gray-800 text-right">
                <ul className="flex flex-col gap-8">
                  <Link href="/"><li className="cursor-pointer">Home</li></Link>
                  <Link href={`/dashboard/recruiter/${username}/profile`}><li className="cursor-pointer">Edit Profile</li></Link>
                  <Link href={`/dashboard/recruiter/${username}/applications`}><li className="cursor-pointer">Applications</li></Link>
                  {/* <Link href={`/dashboard/recruiter/${username}/mentorship`}><li className="cursor-pointer">Mentorship</li></Link> */}
                  <Link href={`/dashboard/recruiter/${username}/settings`}><li className="cursor-pointer">Edit Preferences</li></Link>
                  <Link href={`/dashboard/recruiter/${username}/safety-tips`}><li className="cursor-pointer">Safety tips</li></Link>
                  <li 
                          onClick={handleLogoutWithConfirmation} 
                          className="  text-black hover:text-red-600 cursor-pointer"
                        >
                          Logout
                        </li>
                  {/* <Link href={`/dashboard/recruiter/${username}/help`}><li className="cursor-pointer">Help?</li></Link> */}
                </ul>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-green-600">Recruiter Panel</h1>

        <div className="flex justify-between items-center mb-8">
          <p className="text-md text-green-900 font-semibold">Welcome back, {firstName || username}! <span className= "text-gray-600">Manage your internships and applications</span></p>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                // variant="outline"
                className="bg-green-900 text-white hover:text-green-500 hover:bg-white cursor-pointer border-green-500 border-[1.5px] py-1 "
                disabled={submitting}
              >
                <Plus className="h-4 w-4" />
                {submitting ? 'Posting...' : 'Post Internship'}
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[90%] md:w-[70%] max-h-[90vh] overflow-y-auto bg-white text-green-100 border border-green-600 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-black">Create Internship Listing</DialogTitle>
                <DialogDescription className="text-green-600">
                  Fill out the form to post a new internship opportunity.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                {/* Employer (Auto-filled) */}
                <div>
                  <Label className="text-green-700">Employer</Label>
                  <Input
                    name="employer"
                    value={companyName || 'Loading...'}
                    disabled
                    className="bg-gray-100 mt-2 border-green-600 text-gray-600"
                  />
                </div>

                {/* Title */}
                <div>
                  <Label className="text-green-700">Internship Title *</Label>
                  <Input
                    name="title"
                    placeholder="e.g., Frontend Development Internship"
                    value={form.title}
                    onChange={handleOnChange}
                    className={`bg-gray-100 mt-2 border-green-600 text-black ${errors.title ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-green-700">Description *</Label>
                  <textarea
                    name="description"
                    rows={4}
                    value={form.description}
                    onChange={handleOnChange}
                    className={`w-full bg-gray-100 border border-green-600 rounded mt-2 px-3 py-2 text-black ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Describe the internship role, responsibilities, and requirements..."
                    required
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>
                {/* Number of Slots */}
                <div>
                  <Label className="text-green-700">Number of Available Positions</Label>
                  <Input
                    name="number_of_slots"
                    type="number"
                    min="1"
                    value={form.number_of_slots || 1}
                    onChange={handleOnChange}
                    className="bg-gray-100 border-green-600 mt-2 text-black"
                  />
                </div>

                {/* Industry */}
                <div>
                  <Label className="text-green-700">Industry</Label>
                  <select
                    name="industry"
                    value={form.industry || 'Technology'}
                    onChange={handleOnChange}
                    className="w-full bg-gray-100 border border-green-600 rounded mt-2 px-3 py-2 text-black"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-green-700">Duration (months)</Label>
                  <Input
                    name="duration_of_internship"
                    type="number"
                    min="1"
                    max="12"
                    value={form.duration_of_internship || 3}
                    onChange={handleOnChange}
                    className="bg-gray-100 border-green-600 mt-2 text-black"
                  />
                </div>

                {/* Location and Remote */}
                <div className="space-y-4">
                  <div className="flex items-center  space-x-2">
                    <Switch
                      id="is_remote"
                      checked={form.is_remote}
                      onCheckedChange={(checked) => 
                        setForm({ ...form, is_remote: checked })
                      }
                    />
                    <Label htmlFor="is_remote" className="text-green-700">
                      This is a remote internship
                    </Label>
                  </div>

                  {!form.is_remote && (
                    <div>
                      <Label className="text-green-700">Location *</Label>
                      <Input
                        name="location"
                        placeholder="e.g., Lagos, Nigeria"
                        value={form.location}
                        onChange={handleOnChange}
                        className={`bg-gray-100 border-green-600 mt-2 text-black ${errors.location ? 'border-red-500' : ''}`}
                        required={!form.is_remote}
                      />
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors.location}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Application Deadline */}
                <div>
                  <Label className="text-green-700">Application Deadline *</Label>
                  <Input
                    name="application_deadline"
                    type="date"
                    value={form.application_deadline}
                    onChange={handleOnChange}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                    className={`bg-gray-100 border-green-600 mt-2 text-black ${errors.application_deadline ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.application_deadline && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.application_deadline}
                    </p>
                  )}
                </div>

                {/* Salary Field */}
                <div>
                  <Label className="text-green-700">Compensation</Label>
                  <div className="mt-2 space-y-2">
                    <select
                      name="salaryType"
                      value={form.salaryType}
                      onChange={handleOnChange}
                      className="bg-gray-200 border border-green-600 text-green-700 rounded px-2 py-1"
                    >
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>

                    {form.salaryType === "paid" && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <select
                          name="currency"
                          value={form.currency}
                          onChange={handleOnChange}
                          className="bg-gray-200 border border-green-600 text-green-700 rounded px-2 py-1"
                        >
                          <option value="₦">₦ Naira</option>
                          <option value="$">$ Dollar</option>
                          <option value="€">€ Euro</option>
                          <option value="£">£ Pound</option>
                        </select>

                        <div className={`flex items-center border border-green-600 rounded py-1 px-2 w-full md:w-1/2 bg-gray-100 ${errors.salary ? 'border-red-500' : ''}`}>
                          <span className="mr-1 text-green-950">{currencyIcons[form.currency]}</span>
                          <input
                            type="number"
                            name="salary"
                            value={form.salary}
                            onChange={handleOnChange}
                            placeholder="Amount"
                            className="outline-none w-full bg-transparent text-black"
                            min="0"
                          />
                        </div>

                        <select
                          name="paymentFrequency"
                          value={form.paymentFrequency}
                          onChange={handleOnChange}
                          className="bg-gray-200 border border-green-600 text-green-700 rounded px-2 py-1"
                        >
                          <option value="monthly">/month</option>
                          <option value="weekly">/week</option>
                          <option value="daily">/day</option>
                          <option value="hourly">/hour</option>
                        </select>
                      </div>
                    )}
                    {errors.salary && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.salary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <Label className="text-green-700">Required Skills</Label>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-200 text-green-900 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                      >
                        {skill}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-600" 
                          onClick={() => handleRemoveSkill(skill)}
                        />
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Add a required skill"
                      value={tempFields.skills}
                      onChange={(e) =>
                        setTempFields({ ...tempFields, skills: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddField('skills');
                        }
                      }}
                      className="bg-gray-200 border-green-600 text-black"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddField('skills')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-green-900 hover:bg-green-800 text-white disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin cursor-not-allowed  rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Posting Internship...
                      </div>
                    ) : (
                      <div className="cursor-pointer ">
                          Post Internship
                      </div>
                      
                    )}  
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
         <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* <Link href={`/dashboard/recruiter/${username}/listings`}> */}
            <div className="bg-white cursor-pointer border rounded-xl p-6 shadow-sm hover:shadow-md dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-shadow">
              
              <div className="flex flex-row gap-[80%]">
              <div className="p-2 mb-2 bg-emerald-50 w-[7%] text-center flex justify-center dark:bg-emerald-900/30 rounded-lg">
                <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
              </div>
              <div className="text-right">
              <h1 className="font-bold text-2xl">
                12
              </h1>
              <p className="text-green-900 text-xs">+2 this week</p>
              </div>
              </div>
              <h3 className="text-xl font-semibold">Active Listings</h3>
              {/* <p className="text-gray-700">Manage your active job listings.</p> */}
            </div>

          {/* </Link> */}

          {/* <Link href={`/dashboard/recruiter/${username}/applications`}> */}
            <div className="bg-white cursor-pointer border rounded-xl p-6 shadow-sm hover:shadow-md dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-shadow">
              
              <div className="flex flex-row gap-[80%]">
              <div className="p-2 mb-2 bg-emerald-50 w-[7%] text-center flex justify-center dark:bg-emerald-900/30 rounded-lg">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
              </div>
              <div className="text-right">
              <h1 className="font-bold text-2xl">
                48
              </h1>
              <p className="text-green-900 text-xs">+15 this week</p>
              </div>
              </div>
              <h3 className="text-xl font-semibold">Applications</h3>
              {/* <p className="text-gray-700">Manage your active job listings.</p> */}
            </div>
          {/* </Link> */}

          {/* <Link href={`/dashboard/recruiter/${username}/applications`}> */}
            <div className="bg-white cursor-pointer border rounded-xl p-6 shadow-sm hover:shadow-md dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-shadow">
              
              <div className="flex flex-row  gap-[78%]">
              <div className="p-2 mb-2 bg-emerald-50 w-[7%] text-center flex justify-center dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
              </div>
              <div className="text-right">
              <h1 className="font-bold text-2xl">
                89%
              </h1>
              <p className="text-green-900  text-xs">+5% this month</p>
              </div>
              </div>
              <h3 className="text-xl font-semibold">Response Rate</h3>
              {/* <p className="text-gray-700">Manage your active job listings.</p> */}
            </div>
          {/* </Link> */}

          {/* <Link href={`/dashboard/recruiter/${username}/applications`}> */}
            <div className="bg-white cursor-pointer border rounded-xl p-6 shadow-sm hover:shadow-md dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-shadow">
              
              <div className="flex flex-row gap-[82%]">
              <div className="p-2 mb-2 bg-emerald-50 w-[7%] text-center flex justify-center dark:bg-emerald-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
              </div>
              <div className="text-right">
              <h1 className="font-bold text-2xl">
                14 <span className="text-gray-500 text-sm">days</span>
              </h1>
              <p className="text-green-900 text-xs">-2 days</p>
              </div>
              </div>
              <h3 className="text-xl font-semibold">Avg. Time To Hire</h3>
              {/* <p className="text-gray-700">Manage your active job listings.</p> */}
            </div>
          {/* </Link> */}

              <div className="lg:col-span-2 space-y-6">
                <div className={`dark:bg-gray-800 border-gray-200 dark:border-gray-700 bg-white border rounded-xl p-6 shadow-sm`}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <button  className="group p-6 cursor-pointer bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 hover:shadow-md transition-all">
                      <Link href={`/dashboard/recruiter/${username}/listings`} >
                      <div className="flex items-center justify-between mb-2">
                        <FileText className="h-8 w-8 text-emerald-600" />
                        <ChevronRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Recent Listings</h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Manage active postings</p>
                      </Link>
                    </button>
                    

                    {/* <Link > */}
                    <button className="group cursor-pointer p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all">
                      <Link href={`/dashboard/recruiter/${username}/applications`} >
                      <div className="flex items-center justify-between mb-2">
                        <Users className="h-8 w-8 text-blue-600" />
                        <ChevronRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-300">Applications</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Review candidates</p>
                      </Link>
                    </button>
                    {/* </Link> */}
                  </div>
                </div>
              </div>

        



          
        </section>
                  <div className={`dark:bg-gray-800 border-gray-200 dark:border-gray-700 bg-white border mt-5 mb-5 border rounded-xl p-6 shadow-sm`}>
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  { q: "How do I post a job?", a: "Click the 'Post Internship' button and fill out the required information." },
                  { q: "How do I view applications?", a: "Go to the Applications section to review candidate submissions." },
                  { q: "Can I edit my job listings?", a: "Yes, visit the Manage Listings page to edit or delete your jobs." }
                ].map((faq, index) => (
                  <details key={index} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="font-medium">{faq.q}</span>
                      <ChevronRight className="h-4 w-4 text-gray-500 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-2 p-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-25 dark:bg-gray-850 rounded-lg">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <div className={`dark:bg-gray-800 border-gray-200 dark:border-gray-700 bg-white border rounded-xl p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                Safety Tips
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <strong className="text-emerald-800 dark:text-emerald-300">Verify Information</strong>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-1">Always verify candidate credentials before hiring.</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <strong className="text-blue-800 dark:text-blue-300">Secure Communication</strong>
                  <p className="text-blue-700 dark:text-blue-400 mt-1">Use our platform's messaging system initially.</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <strong className="text-purple-800 dark:text-purple-300">Professional Interviews</strong>
                  <p className="text-purple-700 dark:text-purple-400 mt-1">Conduct interviews in professional settings.</p>
                </div>
              </div>
            </div>
      </main>
    </div>
  );
};
