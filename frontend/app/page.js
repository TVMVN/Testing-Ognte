"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, FileText, Rocket, MapPin, Clock, DollarSign, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef(null);
  const nextSectionRef = useRef(null);
  const particleContainerRef = useRef(null);
  const jobCardsRef = useRef([]);
  const [dots, setDots] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getJobs = async () => {
    try {
      setError(null);
      const apiResponse = await fetch("http://localhost:8000/api/applications/public/jobs/", {
        method: "GET",
        cache: "no-store",
      });
      
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }
      
      const result = await apiResponse.json();
      console.log("Fetched jobs:", result);
      
      // Return the results array from your API structure
      return result.results || [];
    } catch (error) {
      console.error("Failed to fetch jobs", error);
      setError("Failed to load internships. Please try again later.");
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs.slice(0, 8));

      // Extract unique industries from your data
      const uniqueCategories = [...new Set(fetchedJobs.map(job => job.industry).filter(Boolean))];
      setAllCategories(uniqueCategories);
      setCategories(uniqueCategories.slice(0, 12));
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const nextSection = nextSectionRef.current;

    if (!hero || !nextSection) return;

    // Create a timeline that controls both the hero zoom and next section reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=150%", // Increased scroll distance
        scrub: 1, // Smoother scrubbing
        pin: true,
        anticipatePin: 1,
      },
    });

    // First part: Scale up the hero content while keeping it visible
    tl.to(hero, {
      scale: 2.5, // Reduced scale to prevent too much zoom
      duration: 0.6,
      ease: "power2.out",
    })
    // Second part: Fade out hero while scaling continues, and bring in next section
    .to(hero, {
      scale: 3.5,
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
    }, "-=0.1") // Start slightly before the previous animation ends
    .fromTo(
      nextSection,
      { 
        opacity: 0, 
        y: 100,
        scale: 0.9 
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 0.4, 
        ease: "power2.out" 
      },
      "-=0.3" // Start the next section animation earlier to eliminate gap
    );

    // Generate dots for background animation
    const newDots = [];
    for (let i = 0; i < 300; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newDots.push({ id: i, top, left });
    }
    setDots(newDots);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    if (!particleContainerRef.current) return;
    
    const particles = Array.from(particleContainerRef.current?.children || []);
    particles.forEach((dot) => {
      const duration = Math.random() * 10 + 5;
      const yMove = Math.random() * 100 - 50;
      const xMove = Math.random() * 100 - 50;

      gsap.to(dot, {
        x: xMove,
        y: yMove,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: duration,
      });
    });
  }, [dots]);

  const formatSalary = (salary) => {
    if (!salary) return "Not specified";
    
    const { amount, currency, status } = salary;
    if (amount === "0.00" || !amount) return status === "unpaid" ? "Unpaid" : "Not specified";
    
    const currencySymbol = currency === "dollar" ? "$" : "₦";
    return `${currencySymbol}${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <div className="LandingContainer bg-white text-white overflow-x-hidden">
      {/* Navbar - Fixed height and better responsive padding */}
      <nav className="Navbar px-4 lg:px-8 h-[60px] flex justify-between items-center sticky top-0 z-50 bg-black shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-1">
          <Link href={"/"}>
            <h1 className="text-lg lg:text-xl font-bold text-white cursor-pointer">
              OG<span className="text-[#22c55e]">nite</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <Link href={'/login'}>
            <button className="border cursor-pointer border-[#16a34a] text-[#22c55e] px-3 lg:px-4 py-1 rounded text-sm lg:text-base font-medium hover:text-black hover:bg-green-500 transition-colors">
              Login
            </button>
          </Link>
          <Dialog>
            <DialogTrigger className="ml-2 border cursor-pointer border-[#16a34a] text-[#dcfce7] bg-green-800 px-3 lg:px-4 py-1 rounded text-sm lg:text-base font-medium hover:text-black hover:bg-green-500 transition-colors">
              Signup
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md mx-4">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl sm:text-2xl text-green-800 mb-2 cursor-pointer">Sign Up</DialogTitle>
                <DialogDescription className="text-gray-600 cursor-pointer">
                  Begin Your Smart Journey at OGnite!
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Link
                  href="/register"
                  className="border-2 border-green-600 rounded-xl py-3 px-4 bg-green-600 text-white font-medium hover:bg-green-700 hover:border-green-700 transition-all duration-200 text-center cursor-pointer"
                >
                  Register as a Candidate
                </Link>
                <Link
                  href="/register/recruiter-registration"
                  className="border-2 border-green-600 rounded-xl py-3 px-4 bg-white text-green-600 font-medium hover:bg-green-50 transition-all duration-200 text-center cursor-pointer"
                >
                  Register as a Recruiter
                </Link>
                <Link
                  href="/register/university-registration"
                  className="border-2 border-green-600 rounded-xl py-3 px-4 bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-all duration-200 text-center cursor-pointer"
                >
                  Register as a University
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      {/* Hero Section - Improved height and spacing */}
      <div
        ref={heroRef}
        className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden py-8 lg:py-0"
      >
        {/* Animated dots background */}
        <div
          ref={particleContainerRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        >
          {dots.map((dot) => (
            <div
              key={dot.id}
              className="w-[2px] h-[2px] bg-green-700 absolute rounded-full opacity-50"
              style={{ top: `${dot.top}%`, left: `${dot.left}%` }}
            />
          ))}
        </div>

        {/* Hero content container - Better responsive layout */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full max-w-7xl mx-auto px-4 lg:px-8 gap-8 lg:gap-16">
          
          {/* Illustration Section - Reduced size on desktop */}
          <div className="flex-1 flex justify-center lg:justify-end order-first lg:order-last max-w-lg lg:max-w-xl">
            <div className="relative w-full">
              {/* Main illustration container with controlled sizing */}
              <div className="relative group">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/20 via-[#15803d]/15 to-transparent rounded-3xl blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
                
                {/* SVG Container - Controlled max size */}
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl p-4 lg:p-6 border border-white/10 shadow-2xl max-w-md lg:max-w-lg mx-auto">
                  <img
                    src='/assets/Working.svg'
                    alt="Professional illustration showing career growth and opportunities"
                    className="w-full h-auto object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                    width="500"
                    height="400"
                  />
                </div>
                
                {/* Decorative grid overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none"></div>
              </div>

              {/* Floating elements - Responsive positioning */}
              <div className="absolute -top-4 lg:-top-8 -left-4 lg:-left-8 w-12 lg:w-16 h-12 lg:h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl opacity-80 animate-bounce shadow-lg flex items-center justify-center">
              </div>

              <div className="absolute top-1/4 -right-6 lg:-right-12 w-8 lg:w-12 h-8 lg:h-12 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-80 animate-ping shadow-lg"></div>

              <div className="absolute top-3/4 -left-3 lg:-left-6 w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-xl opacity-70 animate-bounce delay-200 shadow-md"></div>

              {/* Particle effects */}
              <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-[#22c55e] rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#16a34a] rounded-full animate-pulse opacity-50"></div>
            </div>
          </div>

          {/* Text content - Better responsive typography */}
          <div className="flex-1 text-center lg:text-left space-y-4 lg:space-y-6 max-w-2xl">
            {/* Main heading with responsive typography */}
            <div className="space-y-3 lg:space-y-4">
              {/* Badge/Tag */}
              <div className="inline-flex items-center px-3 lg:px-4 py-2 rounded-full bg-gradient-to-r from-[#22c55e]/20 to-[#15803d]/20 border border-[#22c55e]/30 backdrop-blur-sm">
                <Rocket width={15} height={15} className="text-green-800" />  
                <span className="text-[#22c55e] ml-2 text-xs lg:text-sm font-medium cursor-pointer"> Your Career Starts Here</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl md:text-xl xl:text-6xl font-bold text-black leading-tight cursor-pointer">
                Welcome to{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">OG<span className="text-[#22c55e]">nite</span></span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/20 to-[#15803d]/20 blur-xl transform scale-110"></div>
                </span>
              </h1>

              {/* Animated underline */}
              <div className="w-24 lg:w-24 h-1 bg-gradient-to-r from-[#22c55e] to-[#15803d] mx-auto lg:mx-0 rounded-full"></div>
            </div>

            {/* Enhanced description */}
            <div className="space-y-3 lg:space-y-4">
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 font-light leading-relaxed cursor-pointer">
                Your gateway to a <span className="text-[#22c55e] font-medium">smarter future</span>
              </p>
              <p className="text-base md:text-md lg:text-lg text-gray-800 leading-relaxed cursor-pointer">
                Connect with top companies and kickstart your career journey with opportunities that matter.
              </p>
            </div>

            {/* Enhanced CTA buttons */}
            <div className="flex grid-cols-2 sm:flex-row gap-3 lg:gap-4 items-center lg:items-start lg:justify-start justify-center">
              <Link
                href="/login"
                className="group relative inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-[#15803d] to-[#22c55e] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[#22c55e]/25 transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <span className="relative z-10 text-sm lg:text-base">Explore Now</span>
                <svg className="w-4 lg:w-5 h-4 lg:h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e] to-[#15803d] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <button className="group inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 border-2 hover:border-[#4ade80] text-black font-medium rounded-xl border-[#22c55e] cursor-pointer bg-[#22c55e]/10 backdrop-blur-sm transition-all duration-300">
                <svg className="w-4 lg:w-5 h-4 lg:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm lg:text-base">Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hot Roles Section - Better contained height */}
      <div
        ref={nextSectionRef}
        className="min-h-screen bg-green-50 text-black flex flex-col items-center justify-start opacity-0 py-16 lg:py-24"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-solid"></div>
            <p className="mt-4 text-gray-600 cursor-pointer">Loading internships...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-red-500 text-lg mb-4 cursor-pointer">⚠️ {error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full max-w-7xl px-4 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-black mb-8 lg:mb-12 cursor-pointer">
              Latest Internship Roles
            </h2>

            {jobs.length === 0 ? (
              <div className="text-center text-gray-600 cursor-pointer">
                <p>No internships available at the moment.</p>
                <p className="text-sm mt-2">Please check back later for new opportunities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full">
                {jobs.map((job, index) => (
                  <div
                    key={job.id || index}
                    ref={(el) => (jobCardsRef.current[index] = el)}
                    className="flex flex-col space-y-4 bg-white p-4 lg:p-6 rounded-xl shadow-xl transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg lg:text-xl font-semibold line-clamp-2 cursor-pointer">{job.title}</div>
                      {job.is_remote && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap cursor-pointer">
                          Remote
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-700 line-clamp-3 cursor-pointer">
                      {job.description?.slice(0, 100)}...
                    </div>

                    <div className="flex flex-col space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2 cursor-pointer">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span>{job.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 cursor-pointer">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{formatSalary(job.salary)}</span>
                      </div>

                      <div className="flex items-center gap-2 cursor-pointer">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span>{job.duration_of_internship} months</span>
                      </div>

                      <div className="flex items-center gap-2 cursor-pointer">
                        <Users className="w-4 h-4 text-green-600" />
                        <span>{job.number_of_slots} slot{job.number_of_slots !== 1 ? 's' : ''}</span>
                      </div>

                      {job.industry && (
                        <div className="mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded cursor-pointer">
                            {job.industry}
                          </span>
                        </div>
                      )}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="bg-[#15803d] text-white px-4 py-2 rounded-md hover:bg-[#166534] text-sm transition-colors mt-auto cursor-pointer"
                        >
                          View Details
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-white text-black max-w-2xl max-h-[80vh] overflow-y-auto">
                        {selectedJob && (
                          <>
                            <DialogHeader>
                              <DialogTitle className="text-left cursor-pointer">{selectedJob.title}</DialogTitle>
                              <DialogDescription className="text-left cursor-pointer">{selectedJob.description}</DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 space-y-3 text-sm">
                              {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 cursor-pointer">Required Skills:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedJob.required_skills.map((skill, i) => (
                                      <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs cursor-pointer">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="cursor-pointer"><strong>Company:</strong> {selectedJob.recruiter?.company_name}</div>
                              <div className="cursor-pointer"><strong>Location:</strong> {selectedJob.location} {selectedJob.is_remote && '(Remote)'}</div>
                              <div className="cursor-pointer"><strong>Salary:</strong> {formatSalary(selectedJob.salary)}</div>
                              <div className="cursor-pointer"><strong>Duration:</strong> {selectedJob.duration_of_internship} months</div>
                              <div className="cursor-pointer"><strong>Available Slots:</strong> {selectedJob.number_of_slots}</div>
                              <div className="cursor-pointer"><strong>Industry:</strong> {selectedJob.industry}</div>
                              <div className="cursor-pointer"><strong>Application Deadline:</strong> {new Date(selectedJob.application_deadline).toLocaleDateString()}</div>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* About Section - Better desktop layout */}
      <section className="py-16 lg:py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 cursor-pointer">
                About OG<span className="text-[#22c55e]">nite</span>
              </h2>
              <p className="text-lg lg:text-xl text-green-400 mb-4 cursor-pointer">
                From <span className="font-semibold">Innovation</span> to Opportunity
              </p>
              <p className="text-gray-400 leading-relaxed cursor-pointer">
                OGnite connects ambitious students with top companies and startups through exciting internships.
                Our mission is to empower the next generation of leaders by making career opportunities accessible to everyone.
              </p>
            </div>
            
            <div className="text-center lg:text-left">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[30vh]">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-400 border-solid"></div>
                  <p className="mt-4 text-gray-600 cursor-pointer">Loading Fields...</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl lg:text-2xl xl:text-3xl text-green-300 mb-6 lg:mb-8 cursor-pointer">
                    Explore your field of Interest
                  </h2>
                  <div className="flex flex-wrap gap-3 lg:gap-4">
                    {categories.map((category, index) => (
                      <div
                        key={index}
                        className="border border-white px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm cursor-pointer hover:text-black hover:bg-green-100 transition-colors"
                      >
                        {category}
                      </div>
                    ))}

                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="border border-white px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm hover:text-black hover:bg-green-200 transition-colors cursor-pointer">
                          Show more
                        </button>
                      </DialogTrigger>

                      <DialogContent className="bg-white text-black max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="cursor-pointer">All Industries</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-wrap gap-3 mt-6 max-h-[60vh] overflow-y-auto">
                          {allCategories.map((category, index) => (
                            <div
                              key={index}
                              className="border border-black px-4 py-2 rounded-full text-xs cursor-pointer hover:bg-green-100 transition-colors"
                            >
                              {category}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works - Better desktop spacing */}
      <section className="py-16 lg:py-24 bg-green-100 text-black">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12 cursor-pointer">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">
                <FileText className="w-12 h-12 text-amber-700 mx-auto" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 cursor-pointer">Create Your Profile</h3>
              <p className="text-gray-600 text-sm lg:text-base cursor-pointer">
                Sign up, complete your profile, and let companies find you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">
                <Search className="w-12 h-12 text-teal-600 mx-auto" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 cursor-pointer">Find Opportunities</h3>
              <p className="text-gray-600 text-sm lg:text-base cursor-pointer">
                Browse curated internship listings that match your interests.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">
                <Rocket className="w-12 h-12 text-red-500 mx-auto" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 cursor-pointer">Apply and Grow</h3>
              <p className="text-gray-600 text-sm lg:text-base cursor-pointer">
                Apply easily, get hired, and kickstart your career journey!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*Contact Us Section */}
      <section id="partner" className="py-12 px-4 bg-[#14532d]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
          
          {/* Left Side - Text */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-4 cursor-pointer">Partner With Us</h2>
            <p className="text-lg text-gray-300 cursor-pointer">
              We're building the future of student opportunities. Whether you're a company, school, or individual passionate about creating impact, let's collaborate.
            </p>
            <div className="mt-6 text-gray-300 text-center md:text-left">
              <p className="cursor-pointer">
                Prefer to email directly?{" "}
                <a href="mailto:partnerships@yourcompany.com" className="text-green-300 underline-none hover:text-green-600 cursor-pointer">
                  partnerships@yourcompany.com
                </a>
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div>
            <div className="flex flex-col gap-4 max-w-md mx-auto md:mx-0">
              <input 
                type="text" 
                placeholder="Your Name or Company" 
                required 
                className="p-3 border text-green-100 border-green-700 placeholder:text-green-200 bg-green-800/50 rounded focus:outline-green-600 focus:border-green-500 cursor-pointer"
              />
              
              <input 
                type="email" 
                placeholder="Your Email" 
                required 
                className="p-3 border text-green-100 placeholder:text-green-200 border-green-700 bg-green-800/50 rounded focus:outline-green-600 focus:border-green-500 cursor-pointer"
              />
              
              <textarea 
                placeholder="How would you like to partner with us?" 
                required 
                rows="4" 
                className="p-3 border text-green-100 resize-none placeholder:text-green-200 border-green-700 bg-green-800/50 rounded focus:outline-green-600 focus:border-green-500 cursor-pointer"
              ></textarea>
              
              <button 
                type="submit" 
                className="p-3 bg-green-600 border-green-500 text-white rounded hover:bg-green-700 transition cursor-pointer font-medium"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-green-900 text-center py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <p className="text-sm cursor-pointer">© {new Date().getFullYear()} TVMVN. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}