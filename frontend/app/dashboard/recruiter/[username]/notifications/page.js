"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";

// ✅ Enable relative time
dayjs.extend(relativeTime);

const NotificationPage = () => {
  const params = useParams();
  const router = useRouter();
  const shortUniName = params.shortUniName || "default"; // Fallback to 'default' if not specified
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "1"; // Default to user 1 if not specified
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allRead, setAllRead] = useState(false);

  // Error handler
  const ErrorHandler = {
    showErrorToast: (error, context) => {
      console.error(`${context}:`, error);
      // You can implement toast notifications here
    }
  };

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
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch('http://localhost:8000/api/auth/refresh/', {
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
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
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

  // Fetch notifications from the API
  const fetchNotifications = async () => {
    setLoading(true);
    
    try {
      const response = await makeAuthenticatedRequest(
        "http://127.0.0.1:8000/api/auth/notifications/",
        { method: 'GET' }
      );
      
      if (!response) {
        // Authentication failed, redirect handled by makeAuthenticatedRequest
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Notifications received:', data);
      
      // Handle different response formats
      let notificationData = [];
      
      if (Array.isArray(data)) {
        notificationData = data;
      } else if (data.results && Array.isArray(data.results)) {
        // Handle paginated response
        notificationData = data.results;
      } else if (data.notifications && Array.isArray(data.notifications)) {
        // Handle nested response
        notificationData = data.notifications;
      } else {
        console.warn("Unexpected notification data format:", data);
        notificationData = [];
      }
      
      // Transform the data to match your component's expected format
      const transformedNotifications = notificationData.map(notification => ({
        id: notification.id,
        title: notification.title || notification.subject || 'Notification',
        description: notification.message || notification.description || notification.body || 'No description',
        read: notification.read || notification.is_read || false,
        createdAt: notification.created_at || notification.createdAt || notification.timestamp || new Date().toISOString(),
        type: notification.type || 'general',
        ...notification // Keep any additional fields
      }));
      
      setNotifications(transformedNotifications);
      
      // Check if all notifications are read
      setAllRead(transformedNotifications.every(n => n.read));
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
      ErrorHandler.showErrorToast(err, 'Fetching notifications');
      
      // Set empty notifications on error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleReadStatus = async () => {
  const newReadStatus = !allRead;
  setAllRead(newReadStatus);
  
  // Update local state immediately for better UX
  const updated = notifications.map((n) => ({ ...n, read: newReadStatus }));
  setNotifications(updated);
  
  // Send bulk update to server using the correct endpoint
  try {
    const response = await makeAuthenticatedRequest(
      "http://127.0.0.1:8000/api/auth/notifications/read-all/", // Changed from /read/ to /read-all/
      {
        method: 'POST',
        body: JSON.stringify({ read: newReadStatus })
      }
    );
    
    if (!response || !response.ok) {
      console.warn('Failed to update notification status on server');
      // Optionally revert local changes if server update fails
      setAllRead(!newReadStatus);
      const revertedNotifications = notifications.map((n) => ({ ...n, read: !newReadStatus }));
      setNotifications(revertedNotifications);
    }
  } catch (err) {
    console.error('Error updating notification status:', err);
    // Revert local changes if server update fails
    setAllRead(!newReadStatus);
    const revertedNotifications = notifications.map((n) => ({ ...n, read: !newReadStatus }));
    setNotifications(revertedNotifications);
  }
};

  const markAsRead = async (notificationId) => {
    try {
      // Update local state immediately
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Send update to server
      const response = await makeAuthenticatedRequest(
        `http://127.0.0.1:8000/api/auth/notifications/${notificationId}/read/`,
        { method: 'POST' }
      );
      
      if (!response || !response.ok) {
        console.warn('Failed to mark notification as read on server');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href={`/dashboard/university/${shortUniName}`}>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <BellIcon className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold text-green-500">Notifications</h1>
            </div>
          </Link>
          {notifications.length > 0 && (
            <button
              onClick={toggleReadStatus}
              className="text-sm border border-green-500 text-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition"
            >
              Mark all as {allRead ? "Unread" : "Read"}
            </button>
          )}
        </header>

        {loading ? (
          <div className="text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">You have no notifications.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((note) => (
              <div
                key={note.id}
                onClick={() => !note.read && markAsRead(note.id)}
                className={`p-4 rounded-xl shadow-md border transition-all cursor-pointer ${
                  note.read
                    ? "bg-gray-100 border-gray-300 text-gray-600"
                    : "bg-white border-green-300 text-gray-800 shadow-lg"
                } hover:shadow-xl hover:scale-105`}
              >
                <div className="flex items-start justify-between">
                  <h2 className={`text-lg font-semibold ${
                    note.read ? "text-gray-500" : "text-green-600"
                  }`}>
                    {note.title}
                  </h2>
                  {!note.read && (
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
                <p className="text-sm mt-2 line-clamp-3">{note.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-green-500">
                    {dayjs(note.createdAt).fromNow()}
                  </p>
                  {note.type && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      note.type === 'urgent' ? 'bg-red-100 text-red-600' :
                      note.type === 'important' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {note.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;