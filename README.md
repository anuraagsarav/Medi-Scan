🩺 Medi-Scan
Medi-Scan is a full-stack web application that enables patients to securely upload, manage, and understand their medical records using AI. 
It offers Gemini-based medical document summarization, medication reminders, timeline and log visualizations, and BMI-based health insights—all in a user-friendly interface.

⚙️ Features
  🧠 AI-powered medical report summarization (Gemini API)
  📄 Secure document upload to AWS S3
  📧 Email reminders with medication timing + food instructions
  📊 Visual activity logs and hospital-wise timeline views
  ⚖️ BMI calculator with AI-generated diet suggestions
  🔐 OTP verification and JWT-based authentication

🛠 Tech Stack
  Frontend: Next.js 15, Tailwind CSS, TypeScript
  Backend: Node.js, Express, MongoDB Atlas
  Integrations: AWS S3, Gemini API, Nodemailer

🔧 Backend Setup
  cd backend
  npm install
  # Create a .env file with your credentials (see .env.example)
  npm start
  
💻 Frontend Setup
  cd frontend
  npm install
  # Create a .env.local file with:
  # NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
  npm run dev
