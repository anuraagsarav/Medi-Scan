/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function VerifyOTPPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
      checkVerification(storedEmail);
    }
  }, []);

  const checkVerification = async (email: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/is-verified?email=${email}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        toast.info('Email is already verified. Redirecting to login...', { position: 'bottom-right' });
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err) {
      console.error('Verification check failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'OTP verification failed');

      toast.success('OTP verified successfully', { position: 'bottom-right' });
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message, { position: 'bottom-right' });
    } finally {
      setSubmitting(false);
    }
  };

  const resendOTP = async () => {
    if (!email) return toast.error('No email found to resend OTP.');

    try {
      const res = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to resend OTP');

      if (data.verified) {
        toast.info('Email already verified. Redirecting to login...', { position: 'bottom-right' });
        return setTimeout(() => router.push('/login'), 2000);
      }

      toast.success('OTP resent to your email');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border border-white/10 bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-white">Verify OTP</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} className="justify-center">
              <InputOTPGroup>
                {[...Array(3)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="border-white text-white" style={{ caretColor: 'white' }} />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator className="border-white text-white" />
              <InputOTPGroup>
                {[...Array(3)].map((_, i) => (
                  <InputOTPSlot key={i + 3} index={i + 3} className="border-white text-white" style={{ caretColor: 'white' }} />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <Button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="bg-white text-black hover:bg-gray-200 font-semibold w-full"
            >
              {submitting ? 'Verifying...' : 'Verify'}
            </Button>

            <button
              type="button"
              onClick={resendOTP}
              disabled={isVerified}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Resend OTP
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
