'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Moon, Sun, Monitor, AlertTriangle, ArrowLeft, Shield, 
  Palette, User, Lock, Settings, Check,
  Eye, EyeOff, Trash2, Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EnhancedSettingsPage() {
  // Get username from URL params (mock implementation for artifact)
  const username = "unilag"; // In real app: const username = useParams().username;
  
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [deleteAccountInfo, setDeleteAccountInfo] = useState({
    password: '',
    confirmationText: '',
    confirm_deletion: false
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [savingButton, setSavingButton] = useState(''); 
  const [currentTheme, setCurrentTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Use consistent base URL
  const API_BASE_URL = 'http://127.0.0.1:8000';

  // Toast notification system
  const showToast = (type, message, description = '') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-emerald-600 text-white border border-emerald-500' 
        : 'bg-red-600 text-white border border-red-500'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-xl">${type === 'success' ? '✅' : '❌'}</div>
        <div class="flex-1">
          <div class="font-semibold">${message}</div>
          ${description ? `<div class="text-sm opacity-90 mt-1">${description}</div>` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  };

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
      showToast('error', 'Authentication Error', 'Please log in again.');
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
          showToast('error', 'Session Expired', 'Please log in again.');
          return null;
        }
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        showToast('error', 'Request Timeout', 'The request took too long to complete.');
      } else {
        console.error('Request failed:', error);
        showToast('error', 'Network Error', 'Please check your connection and try again.');
      }
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
        showToast('error', 'Failed to Load Theme', 'Using default theme.');
      }
    } catch (error) {
      console.error('Error fetching theme preference:', error);
      showToast('error', 'Connection Error', 'Could not load your theme preference.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Save theme preference to backend
  const saveThemePreference = async (selectedTheme) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/auth/theme/`,
        {
          method: 'PUT',
          body: JSON.stringify({ theme: selectedTheme })
        }
      );
      
      if (response && response.ok) {
        setCurrentTheme(selectedTheme);
        showToast('success', 'Theme Updated!', 'Your theme preference has been saved.');
      } else {
        const errorText = response ? await response.text() : 'Unknown error';
        console.error('Failed to save theme preference:', response?.status, errorText);
        throw new Error(`Failed to save theme preference: ${response?.status}`);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
      showToast('error', 'Save Failed', 'Could not save your theme preference.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Validation
    if (!passwordInfo.currentPassword || !passwordInfo.newPassword || !passwordInfo.confirmNewPassword) {
      showToast('error', 'Missing Information', 'All password fields are required.');
      return;
    }

    if (passwordInfo.newPassword !== passwordInfo.confirmNewPassword) {
      showToast('error', 'Passwords Don\'t Match', 'Please ensure both new password fields match.');
      return;
    }

    if (passwordInfo.newPassword.length < 6) {
      showToast('error', 'Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }

    setSavingButton('password');
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/auth/change-password/`,
        {
          method: 'POST',
          body: JSON.stringify({
            old_password: passwordInfo.currentPassword,
            new_password: passwordInfo.newPassword,
            confirm_new_password: passwordInfo.confirmNewPassword
          })
        }
      );

      if (response && response.ok) {
        // Clear password fields on success
        setPasswordInfo({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        
        showToast('success', 'Password Updated!', 'Your password has been changed successfully.');
      } else {
        const errorData = response ? await response.json() : {};
        let errorMessage = 'Failed to change password.';
        
        // Handle specific error messages from the API
        if (errorData.old_password) {
          errorMessage = 'Current password is incorrect.';
        } else if (errorData.new_password) {
          errorMessage = errorData.new_password[0] || 'New password is invalid.';
        } else if (errorData.confirm_new_password) {
          errorMessage = 'Password confirmation does not match.';
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }

        showToast('error', 'Password Change Failed', errorMessage);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('error', 'Update Failed', 'Could not update your password.');
    } finally {
      setSavingButton('');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Validation
    if (!deleteAccountInfo.password) {
      showToast('error', 'Password Required', 'Please enter your current password.');
      return;
    }

    if (deleteAccountInfo.confirmationText !== 'DELETE') {
      showToast('error', 'Confirmation Required', 'Please type "DELETE" to confirm account deletion.');
      return;
    }

    setSavingButton('delete');
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/auth/delete-account/`,
        {
          method: 'POST',
          body: JSON.stringify({
            password: deleteAccountInfo.password,
            confirm_deletion: true
          })
        }
      );

      if (response && response.ok) {
        // Clear all tokens and user data
        clearTokens();
        
        showToast('success', 'Account Deleted', 'Your account has been permanently deleted.');

        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);

      } else {
        const errorData = response ? await response.json() : {};
        let errorMessage = 'Failed to delete account.';
        
        // Handle specific error messages from the API
        if (errorData.password) {
          errorMessage = 'Incorrect password provided.';
        } else if (errorData.confirm_deletion) {
          errorMessage = 'Account deletion must be confirmed.';
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }

        showToast('error', 'Deletion Failed', errorMessage);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Delete Failed', 'Could not delete your account.');
    } finally {
      setSavingButton('');
      setIsDeleteDialogOpen(false);
      setDeleteAccountInfo({
        password: '',
        confirmationText: '',
        confirm_deletion: false
      });
    }
  };

  // Load theme preference on component mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      fetchThemePreference();
    } else {
      console.warn('No access token found, skipping data fetch');
      showToast('error', 'Authentication Required', 'Please log in to access settings.');
      setInitialLoading(false);
    }
  }, []);

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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-400 border-t-transparent mx-auto mb-6"></div>
          <div className="space-y-2">
            <p className="text-emerald-700 text-xl font-semibold">Loading Settings</p>
            <p className="text-emerald-600">Please wait while we prepare your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-emerald-200 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => window.history.back()}
                className="flex items-center gap-3 text-emerald-700 hover:text-emerald-800 transition-colors group"
              >
                <div className="p-2 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Building2 className="h-5 w-5" />
                <span className="font-medium">University Settings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
                Account Settings
              </h1>
              <p className="text-slate-600 text-lg mt-1">
                Manage your university account preferences and security
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Security & Authentication Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-800">Security & Authentication</CardTitle>
                  <CardDescription className="text-slate-600">
                    Update your password and manage account security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Password */}
                <div className="space-y-3">
                  <Label htmlFor="current-password" className="text-sm font-semibold text-slate-700">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="current-password" 
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordInfo.currentPassword}
                      onChange={(e) => setPasswordInfo(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                      className="pr-12 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({
                        ...prev,
                        current: !prev.current
                      }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-3">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-slate-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordInfo.newPassword}
                      onChange={(e) => setPasswordInfo(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      className="pr-12 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({
                        ...prev,
                        new: !prev.new
                      }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <Label htmlFor="confirm-new-password" className="text-sm font-semibold text-slate-700">
                  Confirm New Password
                </Label>
                <div className="relative max-w-md">
                  <Input 
                    id="confirm-new-password" 
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwordInfo.confirmNewPassword}
                    onChange={(e) => setPasswordInfo(prev => ({
                      ...prev,
                      confirmNewPassword: e.target.value
                    }))}
                    className="pr-12 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({
                      ...prev,
                      confirm: !prev.confirm
                    }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Password Requirements:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${passwordInfo.newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    At least 6 characters long
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${passwordInfo.newPassword && passwordInfo.confirmNewPassword && passwordInfo.newPassword === passwordInfo.confirmNewPassword ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    Passwords match
                  </li>
                </ul>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={savingButton === 'password'}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 font-semibold transition-all duration-300 transform hover:scale-105"
              >
                {savingButton === 'password' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Theme Preferences Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-800">Theme & Appearance</CardTitle>
                  <CardDescription className="text-slate-600">
                    Customize your dashboard appearance and theme
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-slate-700">Choose Theme</Label>
                  <p className="text-sm text-slate-600">
                    Select your preferred dashboard theme for better visibility
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    Current: <span className="capitalize">{currentTheme}</span>
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      disabled={loading}
                      className="border-purple-300 hover:bg-purple-50 min-w-[120px] justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <ThemeIcon themeType={currentTheme} />
                        <span className="capitalize">{currentTheme}</span>
                      </div>
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => saveThemePreference("light")}
                      className="cursor-pointer hover:bg-amber-50"
                    >
                      <Sun className="h-4 w-4 mr-3 text-amber-600" />
                      <span>Light Theme</span>
                      {currentTheme === 'light' && <Check className="h-4 w-4 ml-auto text-emerald-600" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => saveThemePreference("dark")}
                      className="cursor-pointer hover:bg-slate-100"
                    >
                      <Moon className="h-4 w-4 mr-3 text-slate-600" />
                      <span>Dark Theme</span>
                      {currentTheme === 'dark' && <Check className="h-4 w-4 ml-auto text-emerald-600" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-red-300 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-orange-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-700">Danger Zone</CardTitle>
                  <CardDescription className="text-slate-600">
                    Irreversible and destructive actions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 border-2 border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-orange-50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 rounded-full bg-red-200">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 text-lg mb-2">Delete University Account</h3>
                    <div className="space-y-2 text-sm text-red-700 mb-4">
                      <p className="font-medium">⚠️ This action cannot be undone!</p>
                      <p>Deleting your account will permanently remove:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-red-600">
                        <li>All student records and data</li>
                        <li>Job applications and employer connections</li>
                        <li>University profile and settings</li>
                        <li>All historical data and analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 font-semibold py-3 transition-all duration-300 transform hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md border-red-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-3 text-red-700">
                        <div className="p-2 rounded-full bg-red-100">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        Confirm Account Deletion
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4 text-slate-700">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="font-semibold text-red-800 mb-2">⚠️ PERMANENT ACTION</p>
                          <p className="text-sm">This will permanently delete your university account and all associated data. This action cannot be reversed.</p>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="font-medium">To confirm deletion:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
                            <li>Enter your current password</li>
                            <li>Type "DELETE" in the confirmation field</li>
                          </ol>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete-password" className="font-medium">Current Password</Label>
                        <Input
                          id="delete-password"
                          type="password"
                          placeholder="Enter your current password"
                          value={deleteAccountInfo.password}
                          onChange={(e) => setDeleteAccountInfo(prev => ({
                            ...prev,
                            password: e.target.value
                          }))}
                          className="border-red-300 focus:border-red-500 focus:ring-red-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation" className="font-medium">
                          Type <span className="font-mono font-bold text-red-600 bg-red-100 px-1 rounded">DELETE</span> to confirm
                        </Label>
                        <Input
                          id="delete-confirmation"
                          placeholder="DELETE"
                          value={deleteAccountInfo.confirmationText}
                          onChange={(e) => setDeleteAccountInfo(prev => ({
                            ...prev,
                            confirmationText: e.target.value
                          }))}
                          className="border-red-300 focus:border-red-500 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel 
                        onClick={() => {
                          setDeleteAccountInfo({
                            password: '',
                            confirmationText: '',
                            confirm_deletion: false
                          });
                        }}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={savingButton === 'delete' || 
                                 !deleteAccountInfo.password || 
                                 deleteAccountInfo.confirmationText !== 'DELETE'}
                        className="bg-red-600 hover:bg-red-700 min-w-[120px]"
                      >
                        {savingButton === 'delete' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}