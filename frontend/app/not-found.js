"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function NotFoundPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fade-in",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4"
    >
      <h1 className="fade-in text-9xl font-extrabold text-[#25d442] tracking-widest drop-shadow-md">
        404
      </h1>
      <div className="bg-green-200 px-2 text-sm text-black rounded border-1 rotate-12 absolute mt-[-5rem]">
        Page Not Found
      </div>      
      <p className="fade-in text-xl mt-8 text-center text-gray-300">
        Whoa. You’ve drifted off the grid.
      </p>
      <p className="fade-in text-md text-gray-400 mb-8 mt-2 text-center max-w-md">
        This page doesn’t exist or has been moved. Let’s get you back on track.
      </p>
      <Link
        href="/"
        className="fade-in px-6 py-3 rounded-xl border border-green-500 text-green-500 hover:bg-green-600 hover:text-white transition-all duration-300 shadow-md"
      >
        Return to Home
      </Link>
    </div>
  );
}

