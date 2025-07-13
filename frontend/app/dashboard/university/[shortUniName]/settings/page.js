'use client';

import { useState, useEffect } from 'react';
import SettingsSection from '@/components/settingsSection';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {useParams} from 'next/navigation';

export default function SettingsPage() {
  const params = useParams();
  const shortUniName = params.shortUniName
  const [accountInfo, setAccountInfo] = useState({});
  const [passwordInfo, setPasswordInfo] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [savingButton, setSavingButton] = useState(''); 
  const [activityTrackingEnabled, setActivityTrackingEnabled] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  // Use consistent base URL
  const API_BASE_URL = 'http://127.0.0.1:8000';

  // Authentication helpers
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
      clearTokens();
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
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
      console.error('Token refresh failed:', error);
      clearTokens();
      return null;
    }
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    let token = getAccessToken();
    
    if (!token) {
      console.error('No access token found');
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
          console.error('Token refresh failed');
          return null;
        }
      }
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  };

  // Fetch current theme preference from backend
  const fetchThemePreference = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/auth/theme/`,
        { method: 'GET' }
      );
      
      if (response && response.ok) {
        const data = await response.json();
        setCurrentTheme(data.theme || 'light');
      } else if (response) {
        console.error('Failed to fetch theme preference:', response.status);
      }
    } catch (error) {
      console.error('Error fetching theme preference:', error);
    }
  };

  // Save theme preference to backend using PUT method
  const saveThemePreference = async (selectedTheme) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/auth/theme/`,
        {
          method: 'PUT', // Changed from POST to PUT
          body: JSON.stringify({ theme: selectedTheme })
        }
      );
      
      if (response && response.ok) {
        setCurrentTheme(selectedTheme);
        setTheme(selectedTheme);
        toast.success('Theme preference saved!', {
          style: {
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #22c55e',
          },
          description: 'Your theme has been updated.',
          duration: 3000,
          position: 'top-right',
          icon: '✅',
        });
      } else {
        const errorText = response ? await response.text() : 'Unknown error';
        console.error('Failed to save theme preference:', response?.status, errorText);
        throw new Error(`Failed to save theme preference: ${response?.status}`);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
      toast.error('Failed to save theme preference.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Please try again later.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load theme preference on component mount
  useEffect(() => {
    // Check if user is authenticated before fetching
    const token = getAccessToken();
    if (token) {
      fetchThemePreference();
    } else {
      console.warn('No access token found, skipping theme preference fetch');
    }
  }, []);

  const handleSave = async (data, type) => {
    setSavingButton(type);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); 

      toast.success('Changes saved successfully!', {
        style: {
          background: '#000000',
          color: '#ffffff',
          border: '1px solid #22c55e',
        },
        description: 'Everything is up-to-date.',
        duration: 4000,
        position: 'top-right',
        icon: '✅',
      });
    } catch (error) {
      toast.error('Failed to save changes.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Please try again later.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
    } finally {
      setSavingButton('');
    }
  };

  const ThemeIcon = ({ themeType }) => {
    switch (themeType) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted py-10 px-6 md:px-20">
     <Link href={`/dashboard/university/${shortUniName}`}> <p className = "dark:text-green-200 text-green-800 cursor-pointer">Back to Dashboard</p></Link>
      <h1 className="text-4xl font-bold mb-8 dark:text-green-300 text-green-800">Settings</h1>

      {/* Account Information */}
      <SettingsSection title="Account Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input id="fullname" placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+1 234 567 890" />
          </div>
        </div>
        <Button
          onClick={() => handleSave(accountInfo, 'account')}
          disabled={savingButton === 'account'}
          className="mt-6"
        >
          {savingButton === 'account' ? 'Saving...' : 'Save Changes'}
        </Button>
      </SettingsSection>

      {/* Password and Security */}
      <SettingsSection title="Password & Security">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" placeholder="********" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" placeholder="********" />
          </div>
        </div>
        <Button
          onClick={() => handleSave(passwordInfo, 'password')}
          disabled={savingButton === 'password'}
          className="mt-6"
        >
          {savingButton === 'password' ? 'Saving...' : 'Update Password'}
        </Button>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection title="Notification Settings">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Email Notifications</Label>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <Label>SMS Notifications</Label>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <Label>Push Notifications</Label>
            <Switch />
          </div>
        </div>
        <Button
          onClick={() => handleSave(notificationSettings, 'notification')}
          disabled={savingButton === 'notification'}
          className="mt-6"
        >
          {savingButton === 'notification' ? 'Saving...' : 'Save Changes'}
        </Button>
      </SettingsSection>

      {/* Theme Settings */}
      <SettingsSection title="Theme Preference">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Choose your preferred theme</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={loading}>
                  <ThemeIcon themeType={currentTheme} />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => saveThemePreference("light")}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => saveThemePreference("dark")}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">
            Current theme: <span className="font-medium capitalize">{currentTheme}</span>
          </p>
        </div>
      </SettingsSection>

      {/* Activity Tracking Toggle for Candidates */}
      {true /* Replace this with a check for candidate role */ && (
        <SettingsSection title="Activity Tracking">
          <div className="flex items-center justify-between">
            <Label>Allow University to Track Activity</Label>
            <Switch
              checked={activityTrackingEnabled}
              onCheckedChange={(checked) => setActivityTrackingEnabled(checked)}
            />
          </div>
        </SettingsSection>
      )}

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone ⚠️">
        <div className="space-y-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => toast.error('Account deactivation in progress.', {
              style: {
                background: '#000000',
                color: '#ff7a7a',
                border: '1px solid #ff7a7a',
              },
              description: 'Please wait...',
              duration: 4000,
              position: 'top-right',
              icon: '⚡',
            })}
          >
            Deactivate Account
          </Button>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => toast.error('Permanent deletion started.', {
              style: {
                background: '#000000',
                color: '#ff7a7a',
                border: '1px solid #ff7a7a',
              },
              description: 'This cannot be undone!',
              duration: 4000,
              position: 'top-right',
              icon: '🔥',
            })}
          >
            Delete Account Permanently
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}