'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function HomePage() {
  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-black text-white font-roboto overflow-x-hidden overflow-y-hidden">
      <section className="relative overflow-hidden flex flex-col justify-center items-center text-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl z-10"
        >
          <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">Welcome to Medi-Scan</h1>
          <p className="text-lg md:text-xl mb-10 text-white/80">
            Your secure, intelligent hub for managing medical records, AI summaries, medication reminders,
            and vital tracking — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
            <Link href="/login">
              <Button className="w-full sm:w-auto bg-white text-black hover:bg-gray-200">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="w-full sm:w-auto border border-white text-white hover:bg-white hover:text-black transition">Register</Button>
            </Link>
          </div>
          <a onClick={scrollToFeatures} href="#features" className="cursor-pointer text-sm text-white/70 hover:text-white underline underline-offset-4 transition">
            See what makes us different ↓
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,white,transparent)]"
        />
      </section>

      <section
        id="features"
        className="relative min-h-screen flex flex-col justify-center px-6 py-12 max-w-7xl mx-auto overflow-hidden"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-12 text-center tracking-tight"
        >
          Medi-Scan Key Features
        </motion.h2>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {[ 
            [
              "Smart Medical Record Management",
              [
                "Upload and organize your medical files by hospital.",
                "View files instantly with secure preview.",
                "Easily delete outdated files."
              ]
            ],
            [
              "Medication Reminders",
              [
                "Set reminders with multiple time slots per day.",
                "Choose before/after food instructions.",
                "Pause, resume, or delete reminders anytime."
              ]
            ],
            [
              "BMI & Personalized Diet Plan",
              [
                "Calculate BMI using height and weight.",
                "Get a personalized diet plan based on your eating habits.",
                "AI-powered suggestions tailored to your health goals."
              ]
            ],
            [
              "AI-Powered Medical File Summarizer",
              [
                "Instantly generate readable summaries from medical PDFs.",
                "View summaries in a clean interface.",
                "Download summaries as PDF for later reference."
              ]
            ]
          ].map(([title, points], i) => (
            <motion.div
              key={title as string}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white text-black rounded-xl shadow-md hover:shadow-xl transition h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-black/80 font-medium space-y-2">
                  {(points as string[]).map((point, index) => (
                    <p key={index} className="leading-relaxed">• {point}</p>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="mt-auto text-center py-6 border-t border-white/20 text-sm">
        <p>&copy; 2025 Medi-Scan. All rights reserved.</p>
      </footer>
    </main>
  );
}