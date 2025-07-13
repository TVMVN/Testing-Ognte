'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingPage from "../loading";

const DashboardPage = () => {
  const [username, setUsername] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    const storedUsername = localStorage.getItem("username");

    if (!storedUserType || !storedUsername) {
      toast.error("User information is missing.");
      setLoading(false);
      return;
    }

    setUserType(storedUserType);
    setUsername(storedUsername);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && userType && username) {
      switch (userType) {
        case "University":
          router.push(`/dashboard/university`);
          break;
        case "Recruiter":
          router.push(`/dashboard/recruiter`);
          break;
        case "Candidate":
          router.push(`/dashboard/${username}`);
          break;
        default:
          toast.error("Invalid user type.");
          break;
      }
    }
  }, [username, userType, loading, router]);

  if (loading) {
    return <LoadingPage />;
  }
};

export default DashboardPage;
