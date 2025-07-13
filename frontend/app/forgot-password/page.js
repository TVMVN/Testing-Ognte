'use client'
import React, { useState } from 'react';
import Link from 'next/link';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    if (!email.includes('@') || username.trim().length === 0) {
      setError('Please provide a valid username and email address.');
      setIsSubmitting(false);
      return;
    }

    // Simulate sending reset link
    setTimeout(() => {
      setMessage(
        `If an account exists for ${username}, a reset link has been sent to ${email}.`
      );
      setIsSubmitting(false);
    }, 1500);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-8">
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-green-200">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Forgot Password?</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Don't worry, we'll help you reset it
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-green-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-green-50 border border-green-300 text-green-900 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-green-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-green-50 border border-green-300 text-green-900 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm font-medium">{message}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              isSubmitting
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </div>

        <div className="pt-4 border-t border-green-100">
          <div className="text-sm text-center text-gray-600">
            Remembered your password?{" "}
            <Link href="/login" className="text-green-600 font-medium hover:text-green-700 hover:underline transition-colors duration-200">
              Go back to login
            </Link>
          </div>
        </div>

        {/* Additional help section */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Need more help?</h3>
          <p className="text-xs text-green-700 mb-3">
            If you're still having trouble accessing your account, try these options:
          </p>
          <div className="space-y-2">
            <Link href="/contact" className="block text-xs text-green-600 hover:text-green-700 hover:underline transition-colors duration-200">
              • Contact our support team
            </Link>
            <Link href="/help" className="block text-xs text-green-600 hover:text-green-700 hover:underline transition-colors duration-200">
              • Visit our help center
            </Link>
            <Link href="/faq" className="block text-xs text-green-600 hover:text-green-700 hover:underline transition-colors duration-200">
              • Check frequently asked questions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;