"use client";

import { Button } from "@/components/ui/button";
import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import { Loader } from "lucide-react";
import { API_URL } from "@/server";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setAuthUser } from "@/store/authSlice";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

const Signup = () => {

  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.username || !formData.email || !formData.password || !formData.passwordConfirm) {
      toast.error("All fields are required!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast.error("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      if (!API_URL) {
        console.error("API_URL is not defined");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/users/signup`, formData, { withCredentials: true });
      toast.success("Signup successful! Redirecting...");
      const user = response.data.data.user;
      dispatch(setAuthUser(user));
      router.push("/auth/verify");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Signup failed!";
        toast.error(errorMessage.includes("email already exists") ? "User already exists! Try logging in." : errorMessage);
      } else {
        console.error("Unexpected error:", error);
        toast.error("Something went wrong! Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200">
      <div className="relative flex w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Right Side - Slanted Section */}
      <div className="relative flex-1 bg-black text-white p-10 flex items-center justify-start">
        <div
          className="absolute inset-0 bg-black"
          style={{ clipPath: "polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)" }}
        ></div>

        <div className="relative text-left pl-4 z-10">
          <h2 className="text-2xl font-bold">Your Health, Our Priority</h2>
          <p className="mt-2 text-lg">Track and manage your medical records with ease using Medi-Scan.</p>
        </div>
      </div>

        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-10 z-10">
          <div className="w-full max-w-md">
          <div className="text-left">
            <h1 className="font-bold text-3xl mb-4">Sign-Up</h1>
            
          </div>

          <form onSubmit={submitHandler}>
              <div className="mb-4">
                <label className="block text-sm font-bold">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-200 rounded-md outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-200 rounded-md outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-200 rounded-md outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold">Confirm Password</label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-200 rounded-md outline-none"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full border-2 border-black bg-white text-black hover:bg-gray-100 transition-all duration-200 rounded-full px-6 py-2" 
                size="lg"
                >
                  {loading ? <Loader className="animate-spin" /> : "Sign Up"}
              </Button>


            </form>
            <p className="text-center mt-4">
              Already have an account? <Link href="/auth/login" className="text-blue-600">Login</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default Signup;
