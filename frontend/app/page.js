"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, FileText, Rocket } from "lucide-react";
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

  const getJobs = async () => {
    try {
      const apiResponse = await fetch("https://681906185a4b07b9d1d1b8a6.mockapi.io/api/testingTVMVN/jobs", {
        cache: "no-store",
      });
      const result = await apiResponse.json();
      console.log("Fetched jobs:", result);
      return result;
    } catch (error) {
      console.error("Failed to fetch jobs", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs.slice(0, 4));

      const uniqueCategories = [...new Set(fetchedJobs.map(job => job.job_category || job.jobTitle.split(' ')[0]))];
      setAllCategories(uniqueCategories)
      setCategories(uniqueCategories.slice(0, 12));
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const nextSection = nextSectionRef.current;

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

  return (
    <div className="LandingContainer bg-[#fffff] text-white overflow-x-hidden">
      {/* Navbar - Fixed height and better responsive padding */}
      <nav className="Navbar px-4 lg:px-8 h-[60px] flex justify-between items-center sticky top-0 z-50 bg-black shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-1">
          <Link href={"/"}>
            <h1 className="text-lg lg:text-xl font-bold text-white">
              OG<span className="text-[#25d442]">nite</span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <Link href={'/login'}>
            <button className="border cursor-pointer border-[#60d562] text-[#4eda61] px-3 lg:px-4 py-1 rounded text-sm lg:text-base font-medium hover:text-black hover:bg-green-500 transition-colors">
              Login
            </button>
          </Link>
          <Dialog>
            <DialogTrigger className="ml-2 border cursor-pointer border-[#60d562] text-[#dceade]  bg-green-900 px-3 lg:px-4 py-1 rounded text-sm lg:text-base font-medium hover:text-black hover:bg-green-500 transition-colors">
              Signup
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md mx-4">
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
              className="w-[2px] h-[2px] bg-green-900 absolute rounded-full opacity-50"
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#25d442]/20 via-[#2E6F40]/15 to-transparent rounded-3xl blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
                
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
              <div className="absolute -top-4 lg:-top-8 -left-4 lg:-left-8 w-12 lg:w-16 h-12 lg:h-16 bg-gradient-to-br from-[#25d442] to-[#20b23a] rounded-2xl opacity-80 animate-bounce shadow-lg flex items-center justify-center">
                {/* <svg className="w-6 lg:w-8 h-6 lg:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg> */}
              </div>

              <div className="absolute top-1/4 -right-6 lg:-right-12 w-8 lg:w-12 h-8 lg:h-12 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-80 animate-ping shadow-lg"></div>

              <div className="absolute top-3/4 -left-3 lg:-left-6 w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-[#89c170] to-[#60d562] rounded-xl opacity-70 animate-bounce delay-200 shadow-md"></div>

              {/* Particle effects */}
              <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-[#25d442] rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#60d562] rounded-full animate-pulse opacity-50"></div>
            </div>
          </div>

          {/* Text content - Better responsive typography */}
          <div className="flex-1 text-center lg:text-left space-y-4 lg:space-y-6 max-w-2xl">
            {/* Main heading with responsive typography */}
            <div className="space-y-3 lg:space-y-4">
              {/* Badge/Tag */}
              <div className="inline-flex items-center px-3 lg:px-4 py-2 rounded-full bg-gradient-to-r from-[#25d442]/20 to-[#2E6F40]/20 border border-[#25d442]/30 backdrop-blur-sm">
              <Rocket width={15} height={15} className="text-green-800" />  <span className="text-[#25d442] ml-2 text-xs lg:text-sm font-medium"> Your Career Starts Here</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl md:text-xl xl:text-6xl font-bold text-black leading-tight">
                Welcome to{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">OG<span className="text-[#25d442]">nite</span></span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#25d442]/20 to-[#2E6F40]/20 blur-xl transform scale-110"></div>
                </span>
              </h1>

              {/* Animated underline */}
              <div className="w-24 lg:w-24 h-1 bg-gradient-to-r from-[#25d442] to-[#2E6F40] mx-auto lg:mx-0 rounded-full"></div>
            </div>

            {/* Enhanced description */}
            <div className="space-y-3 lg:space-y-4">
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 font-light leading-relaxed">
                Your gateway to a <span className="text-[#25d442] font-medium">smarter future</span>
              </p>
              <p className="text-base md:text-md lg:text-lg text-gray-800 leading-relaxed">
                Connect with top companies and kickstart your career journey with opportunities that matter.
              </p>
            </div>

            {/* Enhanced CTA buttons */}
            <div className="flex grid-cols-2 sm:flex-row gap-3 lg:gap-4 items-center lg:items-start lg:justify-start justify-center">
              <Link
                href="/login"
                className="group relative inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-[#2E6F40] to-[#25d442] text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-[#25d442]/25 transform hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10 text-sm lg:text-base">Explore Now</span>
                <svg className="w-4 lg:w-5 h-4 lg:h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-[#25d442] to-[#2E6F40] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <button className="group inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 border-2 hover:border-[#6ab792]   text-black font-medium  rounded-xl border-[#25d442] cursor-pointer bg-[#25d442]/10 backdrop-blur-sm transition-all duration-300">
                <svg className="w-4 lg:w-5 h-4 lg:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm lg:text-base">Watch Demo</span>
              </button>
            </div>

            {/* Stats - More compact on desktop */}
            {/* <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 pt-4 lg:pt-6">
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-white">1000+</div>
                <div className="text-xs lg:text-sm text-gray-400">Active Internships</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-white">500+</div>
                <div className="text-xs lg:text-sm text-gray-400">Partner Companies</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl lg:text-2xl font-bold text-white">10k+</div>
                <div className="text-xs lg:text-sm text-gray-400">Students Placed</div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Hot Roles Section - Better contained height */}
      <div
        ref={nextSectionRef}
        className="min-h-screen bg-green-800 text-black flex flex-col items-center justify-start opacity-0 py-16 lg:py-24"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-400 border-solid"></div>
            <p className="mt-4 text-gray-600">Loading internships...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full max-w-7xl px-4 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-black mb-8 lg:mb-12">
              Latest Internship Roles
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full">
              {jobs.map((job, index) => (
                <div
                  key={index}
                  ref={(el) => (jobCardsRef.current[index] = el)}
                  className="flex flex-col space-y-4 bg-white p-4 lg:p-6 rounded-xl shadow-xl transform transition-transform duration-500 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="text-lg lg:text-xl font-semibold line-clamp-2">{job?.jobTitle}</div>
                  <div className="text-sm text-gray-700 line-clamp-3">
                    {job?.jobDescription?.slice(0, 100)}...
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="bg-[#1e4328] text-white px-4 py-2 rounded-md hover:bg-[#2E6F40] text-sm transition-colors mt-auto"
                      >
                        View Details
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-white text-black max-w-2xl max-h-[80vh] overflow-y-auto">
                      {selectedJob && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="text-left">{selectedJob.jobTitle}</DialogTitle>
                            <DialogDescription className="text-left">{selectedJob.jobDescription}</DialogDescription>
                          </DialogHeader>

                          <div className="mt-4 space-y-3 text-sm">
                            {selectedJob.qualifications && (
                              <div>
                                <h4 className="font-semibold mb-2">Qualifications:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {(Array.isArray(selectedJob.qualifications)
                                    ? selectedJob.qualifications
                                    : selectedJob.qualifications.split(',')
                                  ).map((q, i) => (
                                    <li key={i}>{q.trim()}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div><strong>Location:</strong> {selectedJob.location}</div>
                            <div><strong>Salary:</strong> {selectedJob.salary_from}</div>
                            <div><strong>Contract Type:</strong> {selectedJob.contract_type || "Full Time"}</div>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* About Section - Better desktop layout */}
      <section className="py-16 lg:py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">
                About OG<span className="text-[#25d442]">nite</span>
              </h2>
              <p className="text-lg lg:text-xl text-green-400 mb-4">
                From <span className="font-semibold">Innovation</span> to Opportunity
              </p>
              <p className="text-gray-400 leading-relaxed">
                OGnite connects ambitious students with top companies and startups through exciting internships.
                Our mission is to empower the next generation of leaders by making career opportunities accessible to everyone.
              </p>
            </div>
            
            <div className="text-center lg:text-left">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[30vh]">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-400 border-solid"></div>
                  <p className="mt-4 text-gray-600">Loading Fields...</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl lg:text-2xl xl:text-3xl text-green-300 mb-6 lg:mb-8">
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
                        <button className="border  border-white px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm hover:text-black hover:bg-green-200 transition-colors">
                          Show more
                        </button>
                      </DialogTrigger>

                      <DialogContent className="bg-white text-black max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>All IT Categories</DialogTitle>
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
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">
                <FileText className="w-12 h-12 text-amber-700 mx-auto" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3">Create Your Profile</h3>
              <p className="text-gray-600 text-sm lg:text-base">
                Sign up, complete your profile, and let companies find you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">
                <Search className="w-12 h-12 text-teal-300 mx-auto" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3">Find Opportunities</h3>
              <p className="text-gray-600 text-sm lg:text-base">
                Browse curated internship listings that match your interests.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">
                <Rocket className="w-12 h-12 text-red-400 mx-auto" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3">Apply and Grow</h3>
              <p className="text-gray-600 text-sm lg:text-base">
                Apply easily, get hired, and kickstart your career journey!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*Contact Us Section */}
      <section id="partner" className="py-12 px-4 bg-[#26352a]">
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
    
    {/* Left Side - Text */}
    <div className="text-center md:text-left">
      <h2 className="text-3xl font-bold mb-4">Partner With Us</h2>
      <p className="text-lg text-gray-300">
        We're building the future of student opportunities. Whether you're a company, school, or individual passionate about creating impact, let's collaborate.
      </p>
            <div className="mt-6 text-gray-300 text-center md:text-left">
        <p>
          Prefer to email directly?{" "}
          <a href="mailto:partnerships@yourcompany.com" className="text-green-300 underline-none hover:text-green-600">
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
          className="p-3 border text-green-100 border-green-800 placeholder:text-green-100 rounded focus:outline-green-800"
        />
        
        <input 
          type="email" 
          placeholder="Your Email" 
          required 
          className="p-3 border text-green-100 placeholder:text-green-100 border-green-800 rounded focus:outline-green-800"
        />
        
        <textarea 
          placeholder="How would you like to partner with us?" 
          required 
          rows="4" 
          className="p-3 border text-green-100 resize-none placeholder:text-green-100 border-green-800 rounded focus:outline-green-800"
        ></textarea>
        
        <button 
          type="submit" 
          className="p-3 bg-green-700 border-green-200 rounded hover:bg-green-600 transition"
        >
          Get in Touch
        </button>
      </div>


    </div>

  </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-green-950 text-center py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <p className="text-sm">© {new Date().getFullYear()} TVMVN. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}