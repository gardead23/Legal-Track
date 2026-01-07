# SoloScale Legal - Prototype

This is the high-fidelity MVP prototype for **SoloScale Legal**, a productized legal services platform.

## 🚀 Deployment Status
This app is currently configured as a **Client-Side Prototype** (SPA).
It is protected by a client-side password gate for stakeholder review.

**Access Code:** `legal2024`

## 🛠 Local Development

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Set Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## ☁️ Deploy to Vercel

1.  Push this repository to GitHub.
2.  Import the project into Vercel.
3.  Add the `API_KEY` environment variable in the Vercel Project Settings.
4.  Deploy.

## 🔐 Security Note
This prototype uses client-side environment variable injection for the Gemini API key (`vite.config.ts`).
**DO NOT** use this configuration for production with real users, as the API key is exposed in the browser bundle.
This is strictly for password-protected stakeholder demos.
