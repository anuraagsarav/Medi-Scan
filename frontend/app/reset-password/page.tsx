/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem('resetEmail');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

    // Strength calculation
    if (value.length < 6) setPasswordStrength('Weak');
    else if (value.length < 10) setPasswordStrength('Medium');
    else setPasswordStrength('Strong');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to reset password');

      toast.success('Password reset successful', { position: 'bottom-right' });
      router.push('/login');
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
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="flex flex-col items-center gap-6">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} className="justify-center">
              <InputOTPGroup>
                {[...Array(3)].map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="border-white text-white"
                    style={{ caretColor: 'white' }}
                  />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator className="text-white" />
              <InputOTPGroup>
                {[...Array(3)].map((_, i) => (
                  <InputOTPSlot
                    key={i + 3}
                    index={i + 3}
                    className="border-white text-white"
                    style={{ caretColor: 'white' }}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <div className="relative w-full">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder="New Password"
                value={newPassword}
                onChange={handlePasswordChange}
                required
                className="w-full bg-neutral-800 border border-white/30 text-white placeholder-white/60 focus:border-white focus:ring-white pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-white/60 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {newPassword && (
              <p
                className={`text-xs mt-1 font-medium ${
                  passwordStrength === 'Weak'
                    ? 'text-red-400'
                    : passwordStrength === 'Medium'
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}
              >
                Strength: {passwordStrength}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="bg-white text-black hover:bg-gray-200 font-semibold tracking-wide w-full"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
