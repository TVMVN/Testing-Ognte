'use client'
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const RecruiterPage = () => {
  const [username, setUsername] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get the user data from localStorage (same as DashboardPage)
    const storedUserType = localStorage.getItem("userType");
    const storedUsername = localStorage.getItem("username");

    if (!storedUserType || !storedUsername) {
      toast.error("User information is missing. Please log in again.");
      router.push('/login'); // Redirect to login if no user data
      setLoading(false);
      return;
    }

    // Verify that the user is actually a recruiter
    if (storedUserType !== "Recruiter") {
      toast.error("Access denied. You are not authorized to view this page.");
      router.push('/dashboard'); // Redirect to general dashboard
      setLoading(false);
      return;
    }

    setUserType(storedUserType);
    setUsername(storedUsername);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // Redirect to the recruiter's actual dashboard once data is loaded
    if (!loading && userType === "Recruiter" && username) {
      router.push(`/dashboard/recruiter/${username}`);
    }
  }, [loading, userType, username, router]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
        <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Loading Dashboard</p>
      </div>
    );
  }
};

export default RecruiterPage;