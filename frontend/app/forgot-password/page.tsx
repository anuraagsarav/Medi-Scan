/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');

      toast.success('OTP sent to your email', { position: 'bottom-right' });

      // Store email for next step
      localStorage.setItem('resetEmail', email);

      // Navigate to reset password page
      router.push('/reset-password');
    } catch (err: any) {
      toast.error(err.message, { position: 'bottom-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white p-6">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-white/10 bg-neutral-900/90">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-white tracking-tight">
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-neutral-800 border border-white/30 text-white placeholder-white/60 focus:border-white focus:ring-white"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-gray-200 font-semibold tracking-wide"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
