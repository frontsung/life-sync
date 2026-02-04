// src/app/friends/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { FriendsList } from '@/components/friends/friends-list'; // Will create this
import { AddFriend } from '@/components/friends/add-friend';   // Will create this

export default function FriendsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'add' | 'requests'

  useEffect(() => {
    if (!isLoading && !user) {
      // If not logged in, redirect to login page
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // TODO: Fetch friends data from Firestore
  const friends = [];
  const friendRequests = [];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Friends Management</h1>
      
      <div className="flex space-x-4 border-b border-muted">
        <button 
          className={`py-2 px-4 ${activeTab === 'friends' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('friends')}
        >
          My Friends
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('requests')}
        >
          Friend Requests ({friendRequests.length})
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'add' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('add')}
        >
          Add Friend
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'friends' && <FriendsList friends={friends} />}
        {activeTab === 'requests' && <FriendsList friends={friendRequests} isRequest={true} />}
        {activeTab === 'add' && <AddFriend />}
      </div>
    </div>
  );
}