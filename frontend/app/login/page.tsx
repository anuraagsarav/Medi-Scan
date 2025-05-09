/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Logging in...', { position: 'bottom-right' });

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed');

      toast.success('Logged in successfully', { duration: 3000, position: 'bottom-right' });
      localStorage.setItem('userEmail', form.email);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message, { duration: 3000, position: 'bottom-right' });
    } finally {
      setLoading(false);
      toast.dismiss(toastId);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white p-6">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border border-white/10 bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-white">Welcome Back</CardTitle>
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
            <div className="flex justify-end items-center text-sm text-white/70">
              <Link href="/forgot-password" className="hover:underline text-white text-right">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-gray-200 font-semibold tracking-wide"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-center text-sm text-gray-400">
              Don’t have an account?{' '}
              <Link href="/register" className="underline hover:text-white">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
