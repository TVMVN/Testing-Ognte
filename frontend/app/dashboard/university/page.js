'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const UniversityPage = () => {
  const [shortUniName, setShortUniName] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get the user data from localStorage
    const storedUserType = localStorage.getItem("userType");
    const storedShortUniName = localStorage.getItem("username");

    if (!storedUserType || !storedShortUniName) {
      toast.error("User information is missing. Please log in again.");
      router.push('/login');
      setLoading(false); // Set loading to false if no user data
      return;
    }

    // Verify that the user is a university
    if (storedUserType !== "University") {
      toast.error("Access denied. You are not authorized to view this page.");
      router.push('/dashboard');
      setLoading(false); // Set loading to false if access is denied  
      return;
    }

    setUserType(storedUserType);
    setShortUniName(storedShortUniName);
  }, [router]);

  useEffect(() => {
    // Redirect to the university's dashboard once data is loaded
    if (!loading && userType === "University" && shortUniName) {
      router.push(`/dashboard/university/${shortUniName}`);
    }
  }, [loading, userType, shortUniName, router]);

  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        // const randomId = Math.floor(Math.random() * 20) + 1;
        // const response = await fetch(
        //   `https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/university/${randomId}`
        // );
        if (response.ok) {
          const data = await response.json();
          setShortUniName(data.shortUniName); // Assuming the API returns a field called 'shortUniName'
        } else {
          console.error("Failed to fetch university data.");
        }
      } catch (error) {
        console.error("An error occurred while fetching university data.");
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    if (userType === "University" && shortUniName) {
      fetchUniversityData();
    }
  }, [userType, shortUniName]);

  // Wait until both username and userType are set and loading is false
  if (loading || !shortUniName) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-black">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-400"></div>
        <p className="mt-6 text-lg text-gray-100 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    ); // Show loading page until everything is ready
  }
};

export default UniversityPage;