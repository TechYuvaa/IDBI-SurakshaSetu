# IDBI SuRakshaSetu

A real-time fraud and scam protection web application built for the IDBI Innovate 2026 Hackathon (Open Innovation track). "Setu" (bridge) acts as the protective bridge between a customer and their bank, analyzing threats and caching fraud before money is lost.

## Features
- **Cybersecurity Command Center:** Futuristic dashboard with real-time threat monitoring and animations.
- **Scam Message Checker:** Uses heuristic analysis (simulated NLP) to classify suspicious messages, links, and OTP phishing attempts.
- **Transaction Monitor:** Simulates and scores live transactions based on rule-based anomalies (unusual time, new beneficiary, large amounts, unrecognized devices).
- **Safety Score Profile:** Visual breakdown of user's security posture and recommendations.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS v4, Framer Motion, Lucide React
- Backend: Serverless Node.js functions in `/api` (Vercel-compatible)
- Fonts: Fraunces, Inter, JetBrains Mono

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` to view the app.

*(Note: The `/api` routes are designed to run serverlessly on Vercel, but Vite's proxy can be configured if you run a separate local backend. In this mock setup, we fetch from the same origin. Vercel dev will automatically map `/api` to the serverless functions).*

## Vercel Deployment

This project is built for zero-config Vercel deployment:
1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Vercel will automatically detect Vite and the `/api` folder.
4. Deploy! No extra configuration is required.
