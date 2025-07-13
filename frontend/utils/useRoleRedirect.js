'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jwtDecode from 'jwt-decode';

export default function useRoleRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const role = decoded.role;

        if (role === 'candidate') {
          router.push('/dashboard/student');
        } else if (role === 'university') {
          router.push('/dashboard/university');
        } else if (role === 'recruiter') {
          router.push('/dashboard/recruiter');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Token decoding failed:', error);
        router.push('/login');
      }
    }
  }, [router]);
}
