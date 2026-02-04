// src/components/friends/add-friend.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/use-auth';
import { searchUsersByEmail, sendFriendRequest } from '@/app/actions'; // Import actions

export function AddFriend() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { user, userProfile } = useAuth(); // Get userProfile for senderUid

  const handleSendFriendRequest = async () => {
    setMessage(''); // Clear previous messages
    if (!user || !userProfile?.uid || !email) {
      setMessage('Please log in and enter an email address.');
      return;
    }

    try {
      const idToken = await user.getIdToken();

      // Implement server action to send friend request
      // This will involve searching for the user by email in Firestore
      // and updating friendRequestsReceived for the target user
      // and friendRequestsSent for the current user.

      const searchResult = await searchUsersByEmail(email, idToken); // Call with idToken
      if (searchResult && 'error' in searchResult) {
        setMessage(`Error searching user: ${searchResult.error}`);
        return;
      }
      if (!searchResult || searchResult.length === 0) {
        setMessage(`User with email "${email}" not found.`);
        return;
      }

      // Assuming email is unique and we take the first result


      // Send friend request
      const requestResult = await sendFriendRequest(userProfile.uid, email, idToken); // Call with idToken
      if (requestResult && !requestResult.success) {
        setMessage(`Failed to send request: ${requestResult.message}`);
      } else {
        setMessage(`Friend request sent to ${email}!`);
      }

    } catch (error) {
      console.error('Error in sending friend request:', error);
      setMessage(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Clear email after sending
    setEmail('');
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
      <h3 className="font-semibold text-lg text-foreground">Send Friend Request</h3>
      <p className="text-sm text-muted-foreground">Enter the email of the user you want to add as a friend.</p>
      <div className="flex space-x-2">
        <Input 
          type="email" 
          placeholder="Friend's email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="flex-1"
        />
        <Button onClick={handleSendFriendRequest}>Send Request</Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}