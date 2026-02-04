# Life Sync - Application Blueprint

## Overview
Life Sync is a modern, responsive schedule management application designed to work seamlessly on both mobile and desktop devices. It features an interactive calendar, event management capabilities, and a visually appealing user interface.

## Project Outline
### Current State
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4)
*   **Data:** Firebase Firestore for Events, Todos, Secret Items, Finance and User Profiles. 
*   **Firebase:** Initialized with environment variables and Google Sign-In enabled.
*   **Internationalization:** Custom Context (English/Korean)
*   **Theme:** Dark/Light mode via `next-themes`

### Features (Implemented)
*   **User Authentication:** Google Login and Guest Login functionality via Firebase Authentication.
*   **Main Entry Screen:** A welcoming landing page (`/`) that redirects authenticated users to the dashboard.
*   **Route Protection:** Middleware implemented to protect private routes, requiring authentication.
*   **User Profiles:** Firestore-based user profiles storing basic info, friends, and friend requests.
*   **Friend Management:** Dedicated `/friends` route for viewing friends, managing friend requests, and adding new friends by email.
*   **Content Sharing:** Ability to share Calendar events and Secret Space items with selected friends.
*   **Data Persistence (Migrated):** Events, Todos, and Secret Items are now stored in Firebase Firestore, supporting multi-user and sharing capabilities.
*   **Responsive Calendar:** Month view with event indicators. Add, update, and delete events with color labels.
*   **To-Do List:** Daily to-do management with completion toggle, sync with calendar, update, delete, and unlink.
*   **Finance Tracking:** Add, update, and delete income/expense transactions with categories.
*   **Secret Space:** Organize notes and folders, create, rename, update content, and delete items.
*   **Visual Design:** Modern vibrant palette, noise texture, sidebar navigation.
*   **Dark Mode:** Fully supported.
*   **Localization:** English and Korean support.

## Data Models
### User Document (Firestore Collection: `users`)
*   `uid` (string): Firebase Authentication User ID (Document ID)
*   `email` (string): User's email
*   `displayName` (string): User's display name (from Google, or custom)
*   `photoURL` (string): User's profile photo (from Google)
*   `friends` (array of strings): Array of UIDs of accepted friends.
*   `friendRequestsSent` (array of strings): Array of UIDs for pending friend requests sent by this user.
*   `friendRequestsReceived` (array of strings): Array of UIDs for pending friend requests received by this user.

### Calendar Event Document (Firestore Collection: `events`)
*   `id` (string): Document ID
*   `ownerUid` (string): UID of the user who owns the event
*   `title` (string): Event title
*   `date` (string): ISO date string YYYY-MM-DD
*   `description` (string, optional)
*   `color` (string): 'blue' | 'red' | 'green' | 'purple' | 'orange'
*   `isCompleted` (boolean, optional)
*   `sharedWith` (array of strings, optional): Array of UIDs of friends with whom this event is shared

### Todo Document (Firestore Collection: `todos`)
*   `id` (string): Document ID
*   `ownerUid` (string): UID of the user who owns the todo
*   `text` (string): Todo text
*   `isCompleted` (boolean)
*   `date` (string): YYYY-MM-DD (Target date for the todo)
*   `syncedEventId` (string, optional): ID of the linked calendar event

### Secret Item Document (Firestore Collection: `secretItems`)
*   `id` (string): Document ID
*   `ownerUid` (string): UID of the user who owns the secret item
*   `type` (string): 'folder' | 'note'
*   `name` (string): Item name
*   `parentId` (string | null): ID of the parent folder, null for root
*   `content` (string, optional): Only for notes
*   `updatedAt` (Firestore Timestamp): Last update timestamp
*   `sharedWith` (array of strings, optional): Array of UIDs of friends with whom this item is shared

### Finance Document (Firestore Collection: `finance`)
*   `id` (string): Document ID
*   `ownerUid` (string): UID of the user who owns the transaction
*   `type` (string): 'income' | 'expense'
*   `amount` (number): Transaction amount
*   `description` (string)
*   `date` (string): ISO date string YYYY-MM-DD
*   `category` (string, optional)
