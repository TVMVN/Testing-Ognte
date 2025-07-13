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
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useParams()
  const username = params.username // Fallback username if not provided
  // Replace with your API and user identifier logic
  const USER_ID = "1";
  const FETCH_API = `https://your-backend.com/api/users/${USER_ID}/resume`;
  const ANALYZE_API = `https://your-backend.com/api/analyze`;

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await fetch(FETCH_API);
        const data = await res.json();

        if (!res.ok) throw new Error("Failed to fetch resume");

        // Assuming API returns resume text
        setResumeText(data.resumeText || "");
      } catch (err) {
        setError("Error fetching resume. Please try again.");
      }
    };

    fetchResume();
  }, []);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const res = await fetch(ANALYZE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resumeText }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Analysis failed");

      setAnalysis(result.analysis || "No analysis available.");
    } catch (err) {
      setError("Error analyzing resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        {/* <div className="flex "> */}
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
            {/* <ArrowLeft className="inline-block mr-2" /> */}
            <p className="text-green-400">Back To Dashboard</p>
          </Link>
        </div>
        {/* </div> */}

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
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                className="bg-green-100 resize-none text-green-900 border-green-500 placeholder-green-600"
                placeholder="No resume found..."
              />
            </div>

            <Button
              onClick={handleAnalyze}
              className="bg-green-800 hover:bg-green-500 text-black w-full"
              disabled={loading || !resumeText.trim()}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Analyzing...
                </span>
              ) : (
                "Analyze Resume"
              )}
            </Button>
          </CardContent>
        </Card>

        {analysis && !loading && (
          <Card className="mt-8 bg-zinc-800 border-zinc-600">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-green-300">
                Analysis Result
              </h2>
              <pre className="whitespace-pre-wrap text-green-400 bg-black p-4 rounded-md border border-green-500">
                {analysis}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
