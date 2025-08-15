'use client';

import { useState, useEffect } from 'react';
import SettingsSection from '@/components/settingsSection';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
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
import Link from "next/link";
import {useParams, useRouter} from 'next/navigation';

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;
  
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
  
  const [savingButton, setSavingButton] = useState(''); 
  const [currentTheme, setCurrentTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    } finally {
      setInitialLoading(false);
    }
  };

  // Save theme preference to backend using PUT method
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

  // Handle password change
  const handlePasswordChange = async () => {
    // Validation
    if (!passwordInfo.currentPassword || !passwordInfo.newPassword || !passwordInfo.confirmNewPassword) {
      toast.error('All password fields are required.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Please fill in all password fields.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
      return;
    }

    if (passwordInfo.newPassword !== passwordInfo.confirmNewPassword) {
      toast.error('New passwords do not match.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Please ensure both new password fields match.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
      return;
    }

    if (passwordInfo.newPassword.length < 6) {
      toast.error('Password too short.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Password must be at least 6 characters long.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
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
        
        toast.success('Password changed successfully!', {
          style: {
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #22c55e',
          },
          description: 'Your password has been updated.',
          duration: 4000,
          position: 'top-right',
          icon: '✅',
        });
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

        toast.error(errorMessage, {
          style: {
            background: '#000000',
            color: '#ff7a7a',
            border: '1px solid #ff7a7a',
          },
          description: 'Please check your inputs and try again.',
          duration: 4000,
          position: 'top-right',
          icon: '❌',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password.', {
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

  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Validation
    if (!deleteAccountInfo.password) {
      toast.error('Password is required to delete your account.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Please enter your current password.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
      return;
    }

    if (deleteAccountInfo.confirmationText !== 'DELETE') {
      toast.error('Confirmation text is incorrect.', {
        style: {
          background: '#000000',
          color: '#ff7a7a',
          border: '1px solid #ff7a7a',
        },
        description: 'Please type "DELETE" to confirm account deletion.',
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
      return;
    }

    // Set confirm_deletion to true when user types DELETE correctly
    const confirm_deletion = deleteAccountInfo.confirmationText === 'DELETE';

    setSavingButton('delete');
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/auth/delete-account/`,
        {
          method: 'POST',
          body: JSON.stringify({
            password: deleteAccountInfo.password,
            confirm_deletion: confirm_deletion
          })
        }
      );

      if (response && response.ok) {
        // Clear all tokens and user data
        clearTokens();
        
        toast.success('Account deleted successfully!', {
          style: {
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #22c55e',
          },
          description: 'Your account has been permanently deleted.',
          duration: 4000,
          position: 'top-right',
          icon: '✅',
        });

        // Redirect to home/login page after a short delay
        setTimeout(() => {
          router.push('/login');
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

        toast.error(errorMessage, {
          style: {
            background: '#000000',
            color: '#ff7a7a',
            border: '1px solid #ff7a7a',
          },
          description: 'Please check your inputs and try again.',
          duration: 4000,
          position: 'top-right',
          icon: '❌',
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account.', {
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
      setInitialLoading(false);
    }
  }, []);

  const handleSave = async (data, type) => {
    if (type === 'password') {
      await handlePasswordChange();
      return;
    }

    // Fallback for other types
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-muted py-10 px-6 md:px-20">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-10 px-6 md:px-20">
      <Link href={`/dashboard/university/${username}`}>
        <p className="dark:text-green-200 text-green-800 cursor-pointer hover:underline">← Back to Dashboard</p>
      </Link>
      <h1 className="text-4xl font-bold mb-8 dark:text-green-300 text-green-800">Settings</h1>

      {/* Password and Security */}
      <SettingsSection title="Password & Security">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input 
              id="current-password" 
              type="password" 
              placeholder="********"
              value={passwordInfo.currentPassword}
              onChange={(e) => setPasswordInfo(prev => ({
                ...prev,
                currentPassword: e.target.value
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              type="password" 
              placeholder="********"
              value={passwordInfo.newPassword}
              onChange={(e) => setPasswordInfo(prev => ({
                ...prev,
                newPassword: e.target.value
              }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <Input 
              id="confirm-new-password" 
              type="password" 
              placeholder="********"
              value={passwordInfo.confirmNewPassword}
              onChange={(e) => setPasswordInfo(prev => ({
                ...prev,
                confirmNewPassword: e.target.value
              }))}
            />
          </div>
        </div>
        <Button
          onClick={() => handleSave(passwordInfo, 'password')}
          disabled={savingButton === 'password'}
          className="mt-6"
        >
          {savingButton === 'password' ? 'Updating...' : 'Update Password'}
        </Button>
      </SettingsSection>

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

      <SettingsSection title="Danger Zone ⚠️">
        <div className="space-y-4">
          <div className="p-4 border-2 border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Delete Account</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain. 
              This action will permanently delete your profile, posts, and all associated data.
            </p>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete Account Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Account
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
                    <p className="font-semibold">To confirm, please:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Enter your current password</li>
                      <li>Type "DELETE" in the confirmation field</li>
                    </ol>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Current Password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      placeholder="Enter your current password"
                      value={deleteAccountInfo.password}
                      onChange={(e) => setDeleteAccountInfo(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm
                    </Label>
                    <Input
                      id="delete-confirmation"
                      placeholder="DELETE"
                      value={deleteAccountInfo.confirmationText}
                      onChange={(e) => setDeleteAccountInfo(prev => ({
                        ...prev,
                        confirmationText: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel 
                    onClick={() => {
                      setDeleteAccountInfo({
                        password: '',
                        confirmationText: '',
                        confirm_deletion: false
                      });
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={savingButton === 'delete' || 
                             !deleteAccountInfo.password || 
                             deleteAccountInfo.confirmationText !== 'DELETE'}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {savingButton === 'delete' ? 'Deleting...' : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}