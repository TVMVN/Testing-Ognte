"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, ArrowLeft} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";
import Link from "next/link";


export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useParams();
  const username = params.username;
  // Update to your backend API base URL
  const BACKEND_API = "http://localhost:8000/api/candidates/profile/";


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(BACKEND_API, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to fetch profile");
        setResumeText(data.resume || "");
        setSkills(data.skills || []);
        setScore(data.resume_score ?? null);
      } catch (err) {
        setError("Error fetching profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);


  // No manual analysis needed, analysis is automatic on upload

  return (
    <div className="min-h-screen bg-green-100 text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="">
          <h1 className="text-3xl font-bold mb-6 text-green-800">
            <FileText className="inline-block mr-2" />
            Resume Analyzer
          </h1>
          <p className="text-green-900 mb-4">
            Analyze your resume to get insights and suggestions for improvement.
          </p>
        </div>
        <div className="flex flex-row w-[50%] gap-4 items-center text-green-500 cursor-pointer hover:text-green-700 transition">
          <Link href={`/dashboard/${username}`}>
            <p className="text-green-400">Back To Dashboard</p>
          </Link>
        </div>

        <Card className="bg-white shadow-2xl ">
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="text-red-400 text-sm bg-red-900 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="resume" className="block text-green-700 mb-2">
                Resume Preview:
              </label>
              <Textarea
                id="resume"
                value={resumeText}
                readOnly
                rows={10}
                className="bg-green-100 resize-none text-green-900 border-green-500 placeholder-green-600"
                placeholder="No resume found..."
              />
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-green-700 mb-2">AI Analysis Result</h2>
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Loading...
                </span>
              ) : (
                <>
                  <div className="mb-2">
                    <span className="font-bold">Score:</span> {score !== null ? score : 'N/A'}
                  </div>
                  <div>
                    <span className="font-bold">Skills:</span> {skills.length > 0 ? skills.join(', ') : 'N/A'}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
