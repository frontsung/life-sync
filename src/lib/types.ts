// src/lib/types.ts
// Define common types used across the application

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  friends?: string[]; // Array of UIDs
  friendRequestsSent?: string[]; // Array of UIDs
  friendRequestsReceived?: string[]; // Array of UIDs
}

export interface CalendarEvent {
  id: string;
  ownerUid: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  description?: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
  isCompleted?: boolean;
  sharedWith?: string[]; // New: Array of UIDs of friends with whom this event is shared
}

export interface Todo {
  id: string;
  ownerUid: string;
  text: string;
  isCompleted: boolean;
  date: string; // YYYY-MM-DD (Target date for the todo)
  syncedEventId?: string;
}

export interface Transaction {
  id: string;
  ownerUid: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category: string;
}

export interface SecretItem {
  id: string;
  ownerUid: string;
  type: 'folder' | 'note';
  name: string;
  parentId: string | null;
  content?: string; // only for notes
  updatedAt: string;
  sharedWith?: string[]; // New: Array of UIDs of friends with whom this item is shared
}
