# Life Sync

Life Sync is a comprehensive personal management application built with Next.js and Firebase. It provides a centralized hub for managing your schedule, todos, finances, and private notes, all while offering social features to connect with friends.

## 🚀 Key Features

- **Dashboard**: A bird's-eye view of your upcoming events, pending todos, and recent financial transactions.
- **Schedule Management**: A full-featured calendar to track your events and appointments.
- **Todo Management**: Stay organized with a robust todo list, featuring the ability to sync tasks directly to your calendar.
- **Finance Management**: Track your income and expenses, categorized for better financial insight.
- **Secret Space**: A secure area for private notes and folders, protected by authentication and ownership checks.
- **Friends System**: Search for users by email, send/receive friend requests, and manage your connections.
- **Authentication**: Secure login via Google or Guest mode, powered by Firebase Authentication and server-side session cookies.
- **Internationalization**: Support for multiple languages to cater to a diverse user base.
- **Responsive Design**: A modern, mobile-friendly UI with a sidebar-based navigation system.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Admin SDK)
- **Authentication**: Firebase Authentication with Session Cookies
- **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Components**: Custom UI components based on Radix UI principles

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Firebase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd life-sync
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
    FIREBASE_PRIVATE_KEY="your_firebase_admin_private_key"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable React components.
- `src/lib`: Utility functions, hooks, and context providers.
- `public`: Static assets like images and icons.

## ☁️ Deployment

The easiest way to deploy this project is via the [Vercel Platform](https://vercel.com/new).

Ensure you configure all environment variables (including the Firebase Admin private key) in your Vercel project settings.

## 📄 License

This project is licensed under the MIT License.
