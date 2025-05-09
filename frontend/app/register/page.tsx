/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', phno: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'password') {
      if (value.length < 6) setPasswordStrength('Weak');
      else if (value.length < 10) setPasswordStrength('Medium');
      else setPasswordStrength('Strong');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Creating your account...', { position: 'bottom-right' });

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      let data: any;
      try {
        data = await res.json();
      } catch (jsonErr) {
        const text = await res.text();
        console.error('Non-JSON server response:', text);
        throw new Error('Unexpected server response. Please try again.');
      }

      if (!res.ok) {
        const msg = data?.msg || 'Registration failed';
        if (msg.toLowerCase().includes('email')) {
          toast.error('Email is already registered.', { duration: 3000, position: 'bottom-right' });
        } else {
          toast.error(msg, { duration: 3000, position: 'bottom-right' });
        }
        console.warn('Registration warning:', msg);
        throw new Error(msg);
      }

      toast.success('Registered! OTP sent to email', { duration: 3000, position: 'bottom-right' });
      localStorage.setItem('email', form.email);
      router.push('/verify-otp');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', { duration: 3000, position: 'bottom-right' });
    } finally {
      setLoading(false);
      toast.dismiss(toastId);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white p-6">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-white/10 bg-neutral-900/90">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-white tracking-tight">Create Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="bg-neutral-800 border border-white/30 text-white placeholder-white/60 focus:border-white focus:ring-white"
            />
            <Input
              type="text"
              name="phno"
              placeholder="Phone Number"
              value={form.phno}
              onChange={handleChange}
              required
              className="bg-neutral-800 border border-white/30 text-white placeholder-white/60 focus:border-white focus:ring-white"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="bg-neutral-800 border border-white/30 text-white placeholder-white/60 focus:border-white focus:ring-white pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-white/60 hover:text-gray-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.password && (
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
              disabled={loading || !form.email || !form.password || !form.phno}
              className="bg-white text-black hover:bg-gray-200 font-semibold tracking-wide"
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-white">Login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
