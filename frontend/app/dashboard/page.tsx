/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Upload, Folder, ChevronLeft, ChevronRight, Bell, ClipboardCheck, HeartPulse, LineChart, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [hospital, setHospital] = useState('');
  const [purpose, setPurpose] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState('');
  const [folders, setFolders] = useState<string[]>([]);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [medication, setMedication] = useState('');
  const [times, setTimes] = useState([
    { timeOfDay: '', exactTime: '', foodInstruction: '' },
  ]);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showBmiDialog, setShowBmiDialog] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [meals, setMeals] = useState({ breakfast: '', lunch: '', dinner: '', snacks: '' });
  const [bmiResult, setBmiResult] = useState<{ bmi: string; category: string; diet: string } | null>(null);
  const [dietPlan, setDietPlan] = useState('');
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [uploadStats, setUploadStats] = useState<any[]>([]);
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  const [filterHospital, setFilterHospital] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    setUserEmail(storedEmail);
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/files/folders', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load folders');
      const uniqueFolders = Array.from(
        new Set(
          data.map((f: any) => f.hospital?.trim())
        )
      ) as string[];
      setFolders(uniqueFolders);
    } catch (err: any) {
      console.error('Error loading folders:', err);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('userEmail');
    await fetch('http://localhost:5000/api/auth/logout', { credentials: 'include' });
    router.push('/login');
  };

  const handleUploadClick = () => {
    setUploadDate(new Date().toLocaleString());
    setShowUploadDialog(true);
  };

  const handleFileUpload = async () => {
    if (!file || !hospital || !purpose) {
      toast.error('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hospital', hospital);
    formData.append('purpose', purpose);
    formData.append('date', uploadDate);

    try {
      const res = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Upload failed');

      toast.success('File uploaded successfully!');
      setShowUploadDialog(false);
      setHospital('');
      setPurpose('');
      setFile(null);
      fetchFolders();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reminders/my-reminders', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load reminders');
      setReminders(data);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  const handlePause = async (id: string) => {
    await fetch(`http://localhost:5000/api/reminders/pause/${id}`, {
      method: 'PATCH',
      credentials: 'include',
    });
    fetchReminders();
  };

  const handleResume = async (id: string) => {
    await fetch(`http://localhost:5000/api/reminders/resume/${id}`, {
      method: 'PATCH',
      credentials: 'include',
    });
    fetchReminders();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reminders/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Delete failed');

      toast.success('Reminder deleted');
      fetchReminders();
    } catch (err: any) {
      console.error('Failed to delete reminder:', err);
      toast.error(err.message || 'Delete failed');
    }
  };

  useEffect(() => {
    if (showViewDialog) fetchReminders();
  }, [showViewDialog]);

  const cleanMarkdown = (markdown: string) => {
    return markdown
      .replace(/[*#`|\-]+/g, '')             // Remove *, #, `, |, -
      .replace(/^\s*\n/gm, '')              // Remove empty lines
      .replace(/\n{2,}/g, '\n')             // Collapse multiple newlines
      .trim();
  };

  const handleBMISubmit = async () => {
    if (!height || !weight || !meals.breakfast || !meals.lunch || !meals.dinner || !meals.snacks) {
      toast.error("All fields are required");
      return;
    }

    await toast.promise(
      (async () => {
        const res = await fetch("http://localhost:5000/api/bmi/diet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            height: parseFloat(height),
            weight: parseFloat(weight),
            meals
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || 'Failed to generate diet');
        }

        setBmiResult({
          bmi: data.bmi,
          category: data.category,
          diet: cleanMarkdown(data.diet),
        });

        setDietPlan(data.diet);
      })(),
      {
        loading: 'Generating BMI & Diet...',
        success: 'Diet plan generated!',
        error: 'Failed to calculate BMI or fetch diet plan.',
      }
    );
  };

  const fetchUploadStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/files/stats?year=${selectedYear}&month=${selectedMonth}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load statistics');
      setUploadStats(data.stats);
      setUploadLogs(data.logs);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
      toast.error('Failed to load statistics');
    }
  };

  useEffect(() => {
    if (showLogsDialog) {
      fetchUploadStats();
    }
  }, [showLogsDialog, selectedYear, selectedMonth]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black to-neutral-900 text-white">
      <aside className="w-64 bg-neutral-900 border-r border-white/10 shadow-xl flex flex-col justify-between">
        <div className="p-6 space-y-10">
          <div className="flex justify-center">
            <h1 className="text-xl font-bold">Medi-Scan</h1>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleUploadClick}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Medical File
            </Button>

            <Button
              onClick={() => setShowReminderDialog(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Bell className="mr-2 h-4 w-4" /> Set Reminder
            </Button>

            <Button
              onClick={() => setShowViewDialog(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <ClipboardCheck className="mr-2 h-4 w-4" /> View Reminders
            </Button>

            <Button onClick={() => setShowBmiDialog(true)} className="bg-white text-black hover:bg-gray-200">
              <HeartPulse className="mr-2 h-4 w-4" /> Calculate BMI
            </Button>

            <Button onClick={() => router.push('/dashboard/timeline')} className="bg-white text-black hover:bg-gray-200">
              <ScrollText className="mr-2 h-4 w-4" /> Medical Timeline
            </Button>

            <Button onClick={() => setShowLogsDialog(true)} className="bg-white text-black hover:bg-gray-200">
              <LineChart className="mr-2 h-4 w-4" /> Logs
            </Button>
          </div>
        </div>

        <div className="p-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarFallback className="h-10 w-10 rounded-lg bg-white text-black font-bold flex items-center justify-center">
                    {userEmail?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left text-sm max-w-[120px]">
                  <span className="font-medium truncate">{userEmail || 'User'}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" className="w-56 bg-white text-black">
              <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDialog(true)}>
                Future updates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 p-6 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl">
          <Carousel className="mx-auto" opts={{ loop: true }}>
            <CarouselContent className="-ml-5">
              {folders.filter((folder) => typeof folder === 'string' && folder.trim() !== '').map((folder, index) => {
                const trimmed = folder.trim();
                return (
                  <CarouselItem key={`${trimmed}-${index}`} className="pl-5 basis-1/3">
                    <div className="relative p-3 transition-transform duration-500 ease-out transform-gpu hover:scale-[1.02] hover:-translate-y-1">
                      <div 
                        onClick={() => router.push(`/dashboard/folder/${encodeURIComponent(trimmed)}`)}
                        className="relative h-[400px] lg:h-[450px] rounded-3xl bg-gradient-to-b from-neutral-800 to-neutral-900 text-white flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                      >
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20 opacity-0 transition-opacity duration-500 hover:opacity-100" />
                        
                        {/* Border */}
                        <div className="absolute inset-0 rounded-3xl border border-white/10 transition-colors duration-500 hover:border-white/30" />
                        
                        {/* Shadow */}
                        <div className="absolute inset-0 rounded-3xl shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-white/10" />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center">
                          <Folder className="w-10 h-10 mb-4 transition-transform duration-500 ease-out transform-gpu hover:scale-110" />
                          <span className="text-2xl font-bold text-center px-6 truncate max-w-full transition-colors duration-500">
                            {trimmed}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white text-black rounded-full shadow hover:scale-110 transition" />
            <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white text-black rounded-full shadow hover:scale-110 transition" />
          </Carousel>
        </div>
        {children}
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-neutral-900 border border-white/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Feature Coming Soon</DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-white/80">This feature will be available in a future update.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-neutral-900 border border-white/20 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Medical File</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left: Drag & Drop Area */}
            <div
              className="w-full lg:w-1/2 flex flex-col items-center justify-center border-2 border-dashed border-white/30 rounded-xl p-6 cursor-pointer hover:border-white/50 transition"
              onClick={() => document.getElementById('hiddenFileInput')?.click()}
            >
              <Upload className="h-10 w-10 text-white mb-2" />
              <p className="text-white text-center text-sm">Drag and Drop file</p>
              <p className="text-white text-sm mb-2">or</p>
              <Button className="bg-blue-500 text-white hover:bg-blue-600">Browse</Button>
              <input
                id="hiddenFileInput"
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <p className="mt-3 text-sm text-green-400 text-center">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Right: Input Fields */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div>
                <Label>Hospital Name</Label>
                <Input
                  className="bg-neutral-800 text-white border border-white/20"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="Enter hospital name"
                />
              </div>
              <div>
                <Label>Purpose of Visit</Label>
                <Input
                  className="bg-neutral-800 text-white border border-white/20"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Enter purpose"
                />
              </div>
              <div>
                <Label>Upload Date</Label>
                <Input
                  className="bg-neutral-800 text-white border border-white/20"
                  value={uploadDate}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Bottom Right: Upload Button */}
          <div className="flex justify-end mt-6">
            <Button onClick={handleFileUpload} className="bg-white text-black hover:bg-gray-200 font-semibold">
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="bg-neutral-900 border border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Set Medication Reminder</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Medication Name</Label>
              <Input
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="Enter medication name"
                className="bg-neutral-800 text-white"
              />
            </div>

            {times.map((time, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4">
                <div className="w-full">
                  <Label>Time of Day</Label>
                  <select
                    className="w-full bg-neutral-800 text-white border border-white/20 p-2 rounded"
                    value={time.timeOfDay}
                    onChange={(e) => {
                      const newTimes = [...times];
                      newTimes[index].timeOfDay = e.target.value;
                      setTimes(newTimes);
                    }}
                  >
                    <option value="">Select</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>

                <div className="w-full">
                  <Label>Exact Time</Label>
                  <Input
                    type="time"
                    className="bg-neutral-800 text-white"
                    value={time.exactTime}
                    onChange={(e) => {
                      const newTimes = [...times];
                      newTimes[index].exactTime = e.target.value;
                      setTimes(newTimes);
                    }}
                  />
                </div>

                <div className="w-full">
                  <Label>Before/After Food</Label>
                  <select
                    className="w-full bg-neutral-800 text-white border border-white/20 p-2 rounded"
                    value={time.foodInstruction}
                    onChange={(e) => {
                      const newTimes = [...times];
                      newTimes[index].foodInstruction = e.target.value;
                      setTimes(newTimes);
                    }}
                  >
                    <option value="">Select</option>
                    <option value="Before Food">Before Food</option>
                    <option value="After Food">After Food</option>
                  </select>
                </div>
              </div>
            ))}

            <Button
              onClick={() => setTimes([...times, { timeOfDay: '', exactTime: '', foodInstruction: '' }])}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              + Add Time
            </Button>

            <div className="flex justify-end pt-4">
              <Button
                onClick={async () => {
                  const validTimes = times.filter(
                    (t) => t.timeOfDay && t.exactTime && t.foodInstruction
                  );

                  if (!medication || validTimes.length === 0) {
                    toast.error('Please enter medication name and at least one valid time.');
                    return;
                  }

                  const res = await fetch('http://localhost:5000/api/reminders/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ medication, times: validTimes }),
                  });

                  const data = await res.json();
                  if (!res.ok) return toast.error(data.msg);

                  toast.success('Reminder created!');
                  setShowReminderDialog(false);
                  setMedication('');
                  setTimes([{ timeOfDay: '', exactTime: '', foodInstruction: '' }]);
                }}
                className="bg-white text-black hover:bg-gray-200 font-semibold"
              >
                Save Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-neutral-900 text-white max-w-2xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">My Reminders</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {reminders.length === 0 && (
              <p className="text-center text-white/70">No reminders set.</p>
            )}

            {reminders.map((r) => (
              <div
                key={r._id}
                className="flex justify-between items-center bg-neutral-800 p-4 rounded-xl border border-white/10"
              >
                <div>
                  <p className="text-lg font-bold">{r.medication}</p>

                  {Array.isArray(r.times) && r.times.length > 0 ? (
                    r.times.map((t: any, i: number) => (
                      <p key={i} className="text-sm text-gray-300">
                        {t.timeOfDay || '—'} at {t.exactTime || '—'}
                        {t.foodInstruction && ` • ${t.foodInstruction}`}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No times set.</p>
                  )}

                  <p className="text-xs text-gray-400">
                    Status: {r.active ? 'Active' : 'Paused'}
                  </p>
                </div>

                <div className="flex gap-3">
                  {r.active ? (
                    <Button
                      onClick={() => handlePause(r._id)}
                      className="bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleResume(r._id)}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(r._id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBmiDialog} onOpenChange={setShowBmiDialog}>
        <DialogContent className="bg-neutral-900 text-white max-w-xl border border-white/20">
          <DialogHeader>
            <DialogTitle>BMI & Personalized Diet Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Height (cm)</Label>
                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="bg-neutral-800 text-white" />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-neutral-800 text-white" />
              </div>
            </div>
            <div>
              <Label>Breakfast</Label>
              <Input value={meals.breakfast} onChange={(e) => setMeals({ ...meals, breakfast: e.target.value })} className="bg-neutral-800 text-white" />
            </div>
            <div>
              <Label>Lunch</Label>
              <Input value={meals.lunch} onChange={(e) => setMeals({ ...meals, lunch: e.target.value })} className="bg-neutral-800 text-white" />
            </div>
            <div>
              <Label>Dinner</Label>
              <Input value={meals.dinner} onChange={(e) => setMeals({ ...meals, dinner: e.target.value })} className="bg-neutral-800 text-white" />
            </div>
            <div>
              <Label>Snacks</Label>
              <Input value={meals.snacks} onChange={(e) => setMeals({ ...meals, snacks: e.target.value })} className="bg-neutral-800 text-white" />
            </div>
            <div className="flex justify-between mt-4">
              <Button
                onClick={() => {
                  setHeight('');
                  setWeight('');
                  setMeals({ breakfast: '', lunch: '', dinner: '', snacks: '' });
                  setBmiResult(null);
                  setDietPlan('');
                }}
                className="bg-red-600 text-white hover:bg-red-700 font-semibold"
              >
                Clear All
              </Button>
              <Button onClick={handleBMISubmit} className="bg-white text-black border border-white hover:bg-black hover:text-white hover:border-white transition">
                Generate Diet
              </Button>
            </div>
            {bmiResult && bmiResult.diet && (
              <div className="mt-6 bg-neutral-900 text-white p-4 rounded-lg max-h-[300px] overflow-y-auto whitespace-pre-line border border-white/20">
                <p><strong>BMI:</strong> {bmiResult.bmi} ({bmiResult.category})</p>
                <hr className="my-3 border-white/20" />
                <div>{cleanMarkdown(bmiResult.diet)}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="bg-neutral-900 text-white max-w-7xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="sr-only">Upload Statistics and Logs</DialogTitle>
            <div className="flex flex-col h-full">
              <div className="grid grid-cols-2 gap-8">
                {/* Left side: Graph */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">Upload Statistics</h2>
                  <div className="flex gap-4 mb-6">
                    <div className="w-1/2">
                      <Label className="mb-2 block text-sm font-medium">Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="bg-neutral-800 text-white border-white/20">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 text-white border-white/20">
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/2">
                      <Label className="mb-2 block text-sm font-medium">Month</Label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="bg-neutral-800 text-white border-white/20">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 text-white border-white/20">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <SelectItem key={month} value={month.toString()}>
                              {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-6 h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={uploadStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.2)' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="uploads" name="Uploads" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80' }} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right side: Logbook */}
                <div>
                  <h2 className="text-xl font-semibold flex items-center mb-6">
                    <ScrollText className="mr-2 h-5 w-5" /> Upload Logbook
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Filter by Hospital</Label>
                      <Select value={filterHospital} onValueChange={setFilterHospital}>
                        <SelectTrigger className="bg-neutral-800 text-white border-white/20">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 text-white border-white/20">
                          <SelectItem value="all">All Hospitals</SelectItem>
                          {Array.from(new Set(uploadLogs.map(log => log.hospital))).map(hospital => (
                            <SelectItem key={hospital} value={hospital}>
                              {hospital}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Filter by Date</Label>
                      <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-neutral-800 text-white border-white/20 h-10"
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-6 h-[600px] overflow-y-auto">
                    {uploadLogs.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-white/70">No uploads found for selected period.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {uploadLogs
                          .filter(log => {
                            const matchHospital = !filterHospital || filterHospital === 'all' || log.hospital === filterHospital;
                            const matchDate = !filterDate || new Date(log.date).toLocaleDateString() === new Date(filterDate).toLocaleDateString();
                            return matchHospital && matchDate;
                          })
                          .map((log, index) => (
                            <div key={index} className="bg-neutral-700/50 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-white">{log.fileName}</h4>
                                  <p className="text-sm text-white/70 mt-1">{log.hospital}</p>
                                </div>
                                <span className="text-xs text-white/50 whitespace-nowrap">
                                  {log.date}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}