<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
TaskMaster

TaskMaster, part of the AIBRY family of software, is a low-overwhelm, highly structured life manager designed for clarity and focus. It specifically addresses executive dysfunction by utilizing AI to break down complex tasks into manageable, low-pressure steps.
Tech Stack

    Framework: React 19 + Vite

    Auth & Database: Supabase (PostgreSQL) with SSR

    Styling: Tailwind CSS v4 + shadcn/ui

    AI: Google Gemini 1.5 Flash

Getting Started
Prerequisites

    Node.js (v18 or higher)

    A Supabase project

    A Google AI Studio API Key


1. Installation

Install the necessary dependencies:

npm install


2. Configuration

Create a .env file in the root directory and add your keys:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key


3. Development

Run the app locally:

npm run dev


## Deployment

This app is configured for seamless deployment on **Vercel**. 

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Ftaskmaster&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY,VITE_GEMINI_API_KEY)

### Post-Deployment Setup
1. **Supabase SQL**: Run the RLS and Profile trigger scripts in your Supabase SQL Editor.
2. **Authentication**: In the Supabase Dashboard, set your site URL to your new Vercel domain and add the redirect URL: `https://your-domain.vercel.app/auth/confirm`.