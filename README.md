# PostoAI - AI Content Generator

**PostoAI** is a high-performance, full-stack application designed to automate marketing strategy and visual asset creation. It leverages advanced AI models to provide businesses with data-driven social media plans and high-quality imagery in seconds.

## Features

- **AI Marketing Strategy**: Generates detailed content plans including hooks, captions, CTAs, and hashtags using the Llama-3.3-70b model.
    
- **Vision-Powered Analysis**: Uses AI to analyze uploaded business photos and generate relevant marketing context.
    
- **AI Image Generation**: Integrated Stable Diffusion v1.5 for creating professional-grade visual content via Hugging Face.
    
- **Real-time Activity Logging**: Comprehensive tracking of all user generations and activities stored in Supabase.
    
- **Credit & Limit System**: Built-in usage management that tracks generation counts and applies a 5-generation free tier.
    
- **Optimized UX**: Features human-readable error handling, dynamic loading states, and double-click prevention for a seamless experience.
    

---

## Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher)
    
- **npm** or **yarn**
    
- **Supabase** project account
    
- **Groq Cloud** API key
    
- **Hugging Face** access token
    

### Local Setup

1. **Clone the Repository:**
    
    Bash
    
    ```
    git clone https://github.com/yourusername/posto-ai.git
    cd posto-ai
    ```
    
2. **Install Dependencies:**
    
    Bash
    
    ```
    npm install
    ```
    
1. **Configure Environment Variables:** Create a `.env.local` file in the root directory and add the required keys 
    
2. **Database Setup:** Run the provided SQL scripts in your Supabase SQL Editor to initialize the `profiles` and `user_activities` tables, and the `increment_generation_count` RPC function.
    
3. **Run the App:**
    
    Bash
    
    ```
    npm run dev
    ```
    
    Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.
    

---

## Environment Variables

The application requires the following environment variables to communicate with the database and AI services:

Code snippet

```
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Service Tokens
HUGGINGFACE_TOKEN=your_huggingface_access_token
GROQ_API_KEY=your_groq_cloud_api_key
```

---

## Live Deployment

The project is live and can be accessed at:

👉 **[PostoAI Live Link](https://posto-ai-nine.vercel.app/)**

---

_Developed by Lindita Morina as a final-year project for Computer Science and Engineering at “Isa Boletini” University._
