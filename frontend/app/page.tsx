"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store"; 
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import axios from "axios";
import { API_URL } from "@/server";
import { setAuthUser } from "@/store/authSlice";
import { ToastContainer, toast } from "react-toastify";

const HomePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  const logoutHandler = async () => {
    try {
      await axios.post(`${API_URL}/users/logout`);
      dispatch(setAuthUser(null));
      toast.success("Logout successful!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="h-[12vh] shadow-md">
      <div className="w-[80%] mx-auto flex items-center justify-between h-full">
        <h1 className="text-3xl font-bold uppercase">Medi-Scan</h1>
        {!user && (
          <Link href="/auth/signup">
            <Button size={"lg"}>Register</Button>
          </Link>
        )}

        {user && (
          <div className="flex items-center space-x-2">
            <Avatar onClick={logoutHandler} className="cursor-pointer">
              <AvatarFallback className="font-bold uppercase">
                {user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button>Dashboard</Button>
            <Button variant={"ghost"} size={"sm"}>
              {user?.isVerified ? "Verified" : "Not Verified"}
            </Button>
          </div>
        )}
      </div>
      <h1 className="flex items-center justify-center h-[80vh] text-5xl font-bold">Home Page</h1>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default HomePage;
