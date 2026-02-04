// src/components/friends/friends-list.tsx
'use client';

import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types'; // We will define this type later
import Image from 'next/image';

interface FriendsListProps {
  friends: UserProfile[]; // Array of friend profiles
  isRequest?: boolean; // If true, display as friend requests
}

export function FriendsList({ friends, isRequest = false }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {isRequest ? (
          <p>No pending friend requests.</p>
        ) : (
          <p>You have no friends yet. Add some!</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <div key={friend.uid} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
          <div className="flex items-center space-x-4">
            <Image
              src={friend.photoURL || '/default-avatar.png'} // Placeholder for default avatar
              alt={friend.displayName || 'User'}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-foreground">{friend.displayName || 'Anonymous User'}</p>
              <p className="text-sm text-muted-foreground">{friend.email}</p>
            </div>
          </div>
          {isRequest ? (
            <div className="space-x-2">
              <Button size="sm" variant="default" onClick={() => console.log('Accept request', friend.uid)}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => console.log('Reject request', friend.uid)}>Reject</Button>
            </div>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => console.log('Remove friend', friend.uid)}>Remove</Button>
          )}
        </div>
      ))}
    </div>
  );
}