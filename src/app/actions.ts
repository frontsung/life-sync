// src/app/actions.ts

'use server'

import { revalidatePath } from 'next/cache';
import {
  CalendarEvent,
  Todo,
  Transaction,
  SecretItem
} from '@/lib/types';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { FieldValue } from 'firebase-admin/firestore';
import {
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // New import for Admin SDK

interface SimpleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}


// Helper to get or create user profile in Firestore after authentication
export async function getOrCreateUserProfile(firebaseUser: SimpleUser, idToken: string): Promise<UserProfile | { error: string } | null> {
  console.log("getOrCreateUserProfile called for user:", firebaseUser.uid);
  try {
    // 1. Verify the ID token using Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    // Sanity check: Ensure the UID from the client matches the UID from the verified token
    if (authUid !== firebaseUser.uid) {
      console.error("UID mismatch: Client UID does not match verified token UID.");
      return { error: "Authentication token mismatch." };
    }

    const userRef = adminDb.collection('users').doc(authUid); // Correct Admin SDK syntax
    const userSnap = await userRef.get(); // Use adminDb's get method

    if (!userSnap.exists) { // Use .exists instead of .exists() for Admin SDK doc snapshot
      console.log("User profile does not exist. Creating new profile.");
      // Create new profile if it doesn't exist
      const newProfile: UserProfile = {
        uid: authUid, // Use authUid
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName || 'Anonymous User',
        photoURL: firebaseUser.photoURL || '',
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
      };
      await userRef.set(newProfile); // Use adminDb's set method
      return newProfile;
    } else {
      console.log("User profile already exists.");
      return userSnap.data() as UserProfile;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating/fetching user profile';
    console.error("Error in getOrCreateUserProfile:", error); // Still log on server if accessible
    return { error: errorMessage }; // Return error to client
  }
}

// --- Auth Actions ---
/*
export async function logout() {
  console.log("Server action: logout");
  try {
    await signOut(auth);
    // Call the API route to clear the server-side session cookie
    await fetch('http://localhost:3000/api/sessionLogout', {
      method: 'POST',
    });
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
    console.error('Error during logout:', errorMessage);
    return { success: false, message: errorMessage };
  }
}
*/

// --- User & Friend Management Actions ---

export async function getUserProfile(uid: string, idToken: string): Promise<UserProfile | { error: string } | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== uid) {
      console.error("UID mismatch: Client UID does not match verified token UID for getUserProfile.");
      return { error: "Authentication token mismatch." };
    }

    const userRef = adminDb.collection('users').doc(authUid);
    const userSnap = await userRef.get();
    return userSnap.exists ? (userSnap.data() as UserProfile) : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching user profile';
    console.error('Error in getUserProfile:', errorMessage);
    return { error: errorMessage };
  }
}

export async function searchUsersByEmail(searchEmail: string, idToken: string): Promise<UserProfile[] | { error: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid; // Ensure authenticated user is making the request

    const usersRef = adminDb.collection('users');
    const q = usersRef.where('email', '==', searchEmail);
    const querySnapshot = await q.get();
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error searching users';
    console.error('Error in searchUsersByEmail:', errorMessage);
    return { error: errorMessage };
  }
}

export async function sendFriendRequest(senderUid: string, receiverEmail: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== senderUid) {
      return { success: false, message: 'Authentication mismatch: You can only send requests as yourself.' };
    }

    if (senderUid === null) {
      return { success: false, message: 'Sender UID is missing.' };
    }
    
    // Pass idToken to searchUsersByEmail
    const searchResult = await searchUsersByEmail(receiverEmail, idToken);
    if (searchResult && 'error' in searchResult) { // Handle error from server action
      return { success: false, message: `Error searching receiver: ${searchResult.error}` };
    }
    const receiverUsers = searchResult as UserProfile[]; // Cast if no error
    
    if (receiverUsers.length === 0) {
      return { success: false, message: 'User not found.' };
    }
    const receiverUser = receiverUsers[0]; // Assuming email is unique

    if (senderUid === receiverUser.uid) {
      return { success: false, message: 'Cannot send friend request to yourself.' };
    }
    
    // Check if already friends
    // Pass idToken to getUserProfile
    const senderProfileResult = await getUserProfile(senderUid, idToken);
    if (senderProfileResult && 'error' in senderProfileResult) { // Handle error
      return { success: false, message: `Error fetching sender profile: ${senderProfileResult.error}` };
    }
    const senderProfile = senderProfileResult as UserProfile; // Cast if no error

    if (senderProfile?.friends?.includes(receiverUser.uid)) {
      return { success: false, message: 'Already friends.' };
    }
    // Check if request already sent
    if (senderProfile?.friendRequestsSent?.includes(receiverUser.uid)) {
      return { success: false, message: 'Friend request already sent.' };
    }
    // Check if request already received
    if (senderProfile?.friendRequestsReceived?.includes(receiverUser.uid)) {
      return { success: false, message: 'User has already sent you a friend request. Please accept it.' };
    }


    // Add to sender's sent list
    await adminDb.collection('users').doc(senderUid).update({
      friendRequestsSent: arrayUnion(receiverUser.uid),
    });

    // Add to receiver's received list
    await adminDb.collection('users').doc(receiverUser.uid).update({
      friendRequestsReceived: arrayUnion(senderUid),
    });

    revalidatePath('/friends');
    return { success: true, message: `Friend request sent to ${receiverUser.displayName || receiverUser.email}.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send friend request.';
    console.error('Error sending friend request:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function acceptFriendRequest(accepterUid: string, senderUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== accepterUid) {
      return { success: false, message: 'Authentication mismatch: You can only accept requests as yourself.' };
    }

    // Add each other to friends list
    await adminDb.collection('users').doc(accepterUid).update({
      friends: arrayUnion(senderUid),
      friendRequestsReceived: arrayRemove(senderUid),
    });
    await adminDb.collection('users').doc(senderUid).update({
      friends: arrayUnion(accepterUid),
      friendRequestsSent: arrayRemove(accepterUid),
    });

    revalidatePath('/friends');
    return { success: true, message: 'Friend request accepted.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept friend request.';
    console.error('Error accepting friend request:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function rejectFriendRequest(rejecterUid: string, senderUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== rejecterUid) {
      return { success: false, message: 'Authentication mismatch: You can only reject requests as yourself.' };
    }

    // Remove from rejecter's received list
    await adminDb.collection('users').doc(rejecterUid).update({
      friendRequestsReceived: arrayRemove(senderUid),
    });
    // Remove from sender's sent list
    await adminDb.collection('users').doc(senderUid).update({
      friendRequestsSent: arrayRemove(rejecterUid),
    });

    revalidatePath('/friends');
    return { success: true, message: 'Friend request rejected.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject friend request.';
    console.error('Error rejecting friend request:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function removeFriend(userUid: string, friendToRemoveUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      return { success: false, message: 'Authentication mismatch: You can only remove friends for yourself.' };
    }

    // Remove from user's friends list
    await adminDb.collection('users').doc(userUid).update({
      friends: arrayRemove(friendToRemoveUid),
    });
    // Remove user from friend's friends list
    await adminDb.collection('users').doc(friendToRemoveUid).update({
      friends: arrayRemove(userUid),
    });

    revalidatePath('/friends');
    return { success: true, message: 'Friend removed.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove friend.';
    console.error('Error removing friend:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

// --- Events ---

export async function getEvents(userUid: string, idToken: string): Promise<CalendarEvent[] | { error: string }> {
  if (!userUid) return [];
  if (typeof idToken !== 'string' || idToken === '') {
    console.error("Invalid idToken received by getEvents.");
    return { error: "Invalid authentication token." };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      console.error("UID mismatch: Client UID does not match verified token UID for getEvents.");
      return { error: "Authentication token mismatch." };
    }

    const q = adminDb.collection('events').where('ownerUid', '==', authUid);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CalendarEvent[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching events';
    console.error("Error in getEvents:", error);
    return { error: errorMessage };
  }
}

export async function addEvent(_prevState: unknown, formData: FormData, idToken: string): Promise<{ message: string; success: boolean }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    const ownerUid = formData.get('ownerUid') as string;
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as CalendarEvent['color'] || 'blue';
    const sharedWith = formData.getAll('sharedWith') as string[];

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only add events as yourself.', success: false };
    }

    if (!ownerUid || !title || !date) {
      return { message: 'Owner UID, Title and Date are required', success: false };
    }

    const newEvent: Omit<CalendarEvent, 'id'> = {
      ownerUid: authUid, // Ensure ownerUid comes from verified token
      title,
      date,
      description,
      color,
      isCompleted: false,
      sharedWith
    };

    await adminDb.collection('events').add(newEvent);
    revalidatePath('/');
    revalidatePath('/schedule');
    return { message: 'Event added successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add event.';
    console.error('Error adding event:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function updateEvent(_prevState: unknown, formData: FormData, idToken: string): Promise<{ message: string; success: boolean }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    const id = formData.get('id') as string;
    const ownerUid = formData.get('ownerUid') as string; // from form
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as CalendarEvent['color'];
    const sharedWith = formData.getAll('sharedWith') as string[];

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only update your own events.', success: false };
    }

    if (!id || !ownerUid || !title || !date) {
      return { message: 'ID, Owner UID, Title and Date are required', success: false };
    }

    const eventRef = adminDb.collection('events').doc(id); // Use adminDb
    const eventSnap = await eventRef.get(); // Get snapshot to check owner
    
    if (!eventSnap.exists) {
      return { message: 'Event not found.', success: false };
    }
    const existingEvent = eventSnap.data();

    // Ensure the event owner matches the authenticated user, even if form was tampered with
    if (existingEvent?.ownerUid !== authUid) {
      return { message: 'Unauthorized: You do not own this event.', success: false };
    }

    await eventRef.update({ // Use adminDb update method
      ownerUid: authUid, // Ensure ownerUid comes from verified token
      title,
      date,
      description,
      color,
      sharedWith
    });
    revalidatePath('/');
    revalidatePath('/schedule');
    return { message: 'Event updated successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update event.';
    console.error('Error updating event:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function deleteEvent(id: string, userUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      return { success: false, message: 'Authentication mismatch: You can only delete your own events.' };
    }

    const eventRef = adminDb.collection('events').doc(id);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return { success: false, message: 'Event not found.' };
    }
    const existingEvent = eventSnap.data();

    // Ensure the event owner matches the authenticated user
    if (existingEvent?.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this event.' };
    }

    // Delete associated todos first (if any)
    const qTodos = adminDb.collection('todos').where('syncedEventId', '==', id);
    const todoSnapshot = await qTodos.get();
    const deleteTodoPromises: Promise<FirebaseFirestore.WriteResult>[] = [];
    todoSnapshot.forEach((d) => {
      deleteTodoPromises.push(adminDb.collection('todos').doc(d.id).delete());
    });
    await Promise.all(deleteTodoPromises);

    await eventRef.delete(); // Delete the event
    revalidatePath('/');
    revalidatePath('/schedule');
    return { success: true, message: 'Event deleted successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete event.';
    console.error('Error deleting event:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

// --- Todos ---

export async function getTodos(userUid: string, idToken: string): Promise<Todo[] | { error: string }> {
  if (!userUid) return [];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      console.error("UID mismatch: Client UID does not match verified token UID for getTodos.");
      return { error: "Authentication token mismatch." };
    }

    const q = adminDb.collection('todos').where('ownerUid', '==', authUid);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Todo[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching todos';
    console.error("Error in getTodos:", errorMessage);
    return { error: errorMessage };
  }
}

export async function addTodo(_prevState: unknown, formData: FormData, idToken: string): Promise<{ message: string; success: boolean }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    const ownerUid = formData.get('ownerUid') as string; // From form
    const text = formData.get('text') as string;
    const date = formData.get('date') as string;
    const sync = formData.get('sync') === 'on';
    const color = formData.get('color') as CalendarEvent['color'] || 'purple';

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only add todos as yourself.', success: false };
    }

    if (!ownerUid || !text || !date) {
      return { message: 'Owner UID, Text and Date are required', success: false };
    }

    let syncedEventId: string | undefined;

    // If sync is requested, create an event in Firestore
    if (sync) {
      const newEvent: Omit<CalendarEvent, 'id'> = {
        ownerUid: authUid, // Ensure ownerUid comes from verified token
        title: `[Todo] ${text}`,
        date: date,
        description: 'Synced from Todo List',
        color: color,
        isCompleted: false,
        sharedWith: []
      };
      const docRef = await adminDb.collection('events').add(newEvent); // Use adminDb
      syncedEventId = docRef.id;
    }

    const newTodo: Omit<Todo, 'id'> = {
      ownerUid: authUid, // Ensure ownerUid comes from verified token
      text,
      isCompleted: false,
      date,
      ...(syncedEventId && { syncedEventId })
    };

    await adminDb.collection('todos').add(newTodo); // Use adminDb
    revalidatePath('/todo');
    revalidatePath('/');
    revalidatePath('/schedule');
    return { message: 'Todo added successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add todo.';
    console.error('Error adding todo:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function updateTodo(id: string, text: string, ownerUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { success: false, message: 'Authentication mismatch: You can only update your own todos.' };
    }

    const todoRef = adminDb.collection('todos').doc(id);
    const todoSnap = await todoRef.get();

    if (!todoSnap.exists) {
      return { success: false, message: 'Todo not found.' };
    }
    const todoData = todoSnap.data() as Todo;

    if (todoData.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this todo.' };
    }

    await todoRef.update({ text }); // Use adminDb update

    // If synced, update calendar event title too
    if (todoData?.syncedEventId) {
      const eventRef = adminDb.collection('events').doc(todoData.syncedEventId);
      await eventRef.update({ title: `[Todo] ${text}` }); // Use adminDb update
      revalidatePath('/schedule');
    }

    revalidatePath('/todo');
    revalidatePath('/');
    return { success: true, message: 'Todo updated successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update todo.';
    console.error('Error updating todo:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function syncTodo(id: string, color: CalendarEvent['color'], ownerUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  if (!ownerUid) return { success: false, message: 'Owner UID is missing.' };

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { success: false, message: 'Authentication mismatch: You can only sync your own todos.' };
    }

    const todoRef = adminDb.collection('todos').doc(id);
    const todoSnap = await todoRef.get();

    if (!todoSnap.exists) {
      return { success: false, message: 'Todo not found.' };
    }
    const todo = todoSnap.data() as Todo;

    if (todo.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this todo.' };
    }

    if (todo.syncedEventId) {
      return { success: false, message: 'Todo is already synced.' };
    }

    const newEvent: Omit<CalendarEvent, 'id'> = {
      ownerUid: authUid,
      title: `[Todo] ${todo.text}`,
      date: todo.date,
      description: 'Synced from Todo List',
      color: color,
      isCompleted: todo.isCompleted,
      sharedWith: []
    };

    const docRef = await adminDb.collection('events').add(newEvent);
    await todoRef.update({ syncedEventId: docRef.id });

    revalidatePath('/todo');
    revalidatePath('/schedule');
    revalidatePath('/');
    return { success: true, message: 'Todo synced successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync todo.';
    console.error('Error syncing todo:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function toggleTodo(id: string, ownerUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { success: false, message: 'Authentication mismatch: You can only toggle your own todos.' };
    }

    const todoRef = adminDb.collection('todos').doc(id);
    const todoSnap = await todoRef.get();

    if (!todoSnap.exists) {
      return { success: false, message: 'Todo not found.' };
    }
    const todo = todoSnap.data() as Todo;

    if (todo.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this todo.' };
    }

    const newCompletionStatus = !todo.isCompleted;
    await todoRef.update({ isCompleted: newCompletionStatus }); // Use adminDb update

    // If there is a synced event, update its completion status too
    if (todo.syncedEventId) {
      const eventRef = adminDb.collection('events').doc(todo.syncedEventId);
      await eventRef.update({ isCompleted: newCompletionStatus }); // Use adminDb update
      revalidatePath('/schedule');
    }

    revalidatePath('/todo');
    revalidatePath('/');
    return { success: true, message: 'Todo toggled successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle todo.';
    console.error('Error toggling todo:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function deleteTodo(id: string, ownerUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { success: false, message: 'Authentication mismatch: You can only delete your own todos.' };
    }

    const todoRef = adminDb.collection('todos').doc(id);
    const todoSnap = await todoRef.get();

    if (!todoSnap.exists) {
      return { success: false, message: 'Todo not found.' };
    }
    const todoToDelete = todoSnap.data() as Todo;

    if (todoToDelete.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this todo.' };
    }

    if (todoToDelete?.syncedEventId) {
      await adminDb.collection('events').doc(todoToDelete.syncedEventId).delete();
      revalidatePath('/schedule');
    }

    await todoRef.delete();
    revalidatePath('/todo');
    revalidatePath('/');
    return { success: true, message: 'Todo deleted successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo.';
    console.error('Error deleting todo:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

export async function unlinkTodo(id: string, ownerUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { success: false, message: 'Authentication mismatch: You can only unlink your own todos.' };
    }

    const todoRef = adminDb.collection('todos').doc(id);
    const todoSnap = await todoRef.get();

    if (!todoSnap.exists) {
      return { success: false, message: 'Todo not found.' };
    }
    const todoToUnlink = todoSnap.data() as Todo;

    if (todoToUnlink.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this todo.' };
    }

    if (todoToUnlink && todoToUnlink.syncedEventId) {
       // Remove the calendar event
       await adminDb.collection('events').doc(todoToUnlink.syncedEventId).delete();
       
       // Update todo to remove syncedEventId
       await todoRef.update({ syncedEventId: null });
       
       revalidatePath('/todo');
       revalidatePath('/schedule');
       revalidatePath('/');
    }
    return { success: true, message: 'Todo unlinked successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unlink todo.';
    console.error('Error unlinking todo:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

// --- Finance ---

export async function getTransactions(userUid: string, idToken: string): Promise<Transaction[] | { error: string }> {
  if (!userUid) return [];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      console.error("UID mismatch: Client UID does not match verified token UID for getTransactions.");
      return { error: "Authentication token mismatch." };
    }

    const q = adminDb.collection('finance').where('ownerUid', '==', authUid);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Transaction[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching transactions';
    console.error("Error in getTransactions:", errorMessage);
    return { error: errorMessage };
  }
}

export async function addTransaction(_prevState: unknown, formData: FormData, idToken: string): Promise<{ message: string; success: boolean }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    const ownerUid = formData.get('ownerUid') as string;
    const type = formData.get('type') as 'income' | 'expense';
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only add transactions as yourself.', success: false };
    }

    if (!ownerUid || !type || isNaN(amount) || !description || !date) {
      return { message: 'All fields are required', success: false };
    }

    const newTransaction: Omit<Transaction, 'id'> = {
      ownerUid: authUid, // Ensure ownerUid comes from verified token
      type,
      amount,
      description,
      date,
      category
    };

    await adminDb.collection('finance').add(newTransaction);
    revalidatePath('/finance');
    revalidatePath('/'); // Revalidate dashboard
    return { message: 'Transaction added successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add transaction.';
    console.error('Error adding transaction:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function updateTransaction(_prevState: unknown, formData: FormData, idToken: string): Promise<{ message: string; success: boolean }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    const id = formData.get('id') as string;
    const ownerUid = formData.get('ownerUid') as string;
    const type = formData.get('type') as 'income' | 'expense';
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only update your own transactions.', success: false };
    }

    if (!id || !ownerUid || !type || isNaN(amount) || !description || !date) {
      return { message: 'All fields are required', success: false };
    }

    const transactionRef = adminDb.collection('finance').doc(id);
    const transactionSnap = await transactionRef.get();
    const transaction = transactionSnap.data() as Transaction;

    if (!transactionSnap.exists || transaction.ownerUid !== authUid) { // Check existence and ownership
      return { message: 'Transaction not found or not authorized', success: false };
    }
    
    await transactionRef.update({
      type,
      amount,
      description,
      category,
      date
    });

    revalidatePath('/finance');
    revalidatePath('/'); // Revalidate dashboard
    return { message: 'Transaction updated successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction.';
    console.error('Error updating transaction:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function deleteTransaction(id: string, userUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      return { success: false, message: 'Authentication mismatch: You can only delete your own transactions.' };
    }

    const transactionRef = adminDb.collection('finance').doc(id);
    const transactionSnap = await transactionRef.get();
    const transaction = transactionSnap.data() as Transaction;
    
    if (!transactionSnap.exists || transaction.ownerUid !== authUid) {
      return { success: false, message: 'Transaction not found or not authorized.' };
    }

    await transactionRef.delete();
    revalidatePath('/finance');
    revalidatePath('/');
    return { success: true, message: 'Transaction deleted successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction.';
    console.error('Error deleting transaction:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

// --- Secret Space ---

export async function getSecretItems(userUid: string, idToken: string): Promise<SecretItem[] | { error: string }> {
  if (!userUid) return [];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== userUid) {
      console.error("UID mismatch: Client UID does not match verified token UID for getSecretItems.");
      return { error: "Authentication token mismatch." };
    }

    const q = adminDb.collection('secretItems').where('ownerUid', '==', authUid);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        updatedAt: (data.updatedAt?.toDate?.() ?? new Date()).toISOString(),
      };
    }) as unknown as SecretItem[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching secret items';
    console.error("Error in getSecretItems:", errorMessage);
    return { error: errorMessage };
  }
}

export async function createSecretItem(parentId: string | null, type: 'folder' | 'note', name: string, sharedWith: string[] = [], ownerUid: string, idToken: string): Promise<{ message: string; success: boolean }> {
  if (!ownerUid || !name) return { message: 'Owner UID and Name are required', success: false };

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only create secret items as yourself.', success: false };
    }

    const newItemData: { [key: string]: any } = {
      ownerUid: authUid,
      type,
      name,
      parentId,
      updatedAt: FieldValue.serverTimestamp(),
      sharedWith
    };

    if (type === 'note') {
      newItemData.content = '';
    }

    await adminDb.collection('secretItems').add(newItemData);
    revalidatePath('/secret');
    return { message: 'Created successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create secret item.';
    console.error('Error creating secret item:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function renameSecretItem(id: string, name: string, sharedWith: string[] = [], ownerUid: string, idToken: string): Promise<{ message: string; success: boolean }> {
  if (!ownerUid || !id || !name) return { message: 'Owner UID, ID and Name are required', success: false };

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only rename your own secret items.', success: false };
    }

    const itemRef = adminDb.collection('secretItems').doc(id);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return { message: 'Secret item not found.', success: false };
    }
    const existingItem = itemSnap.data();

    if (existingItem?.ownerUid !== authUid) {
      return { message: 'Unauthorized: You do not own this secret item.', success: false };
    }

    await itemRef.update({ name, sharedWith, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath('/secret');
    return { message: 'Renamed successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to rename secret item.';
    console.error('Error renaming secret item:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function updateNoteContent(id: string, content: string, ownerUid: string, idToken: string): Promise<{ message: string; success: boolean }> {
  if (!ownerUid || !id) return { message: 'Owner UID and ID are required', success: false };

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { message: 'Authentication mismatch: You can only update your own notes.', success: false };
    }

    const itemRef = adminDb.collection('secretItems').doc(id);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return { message: 'Secret item not found.', success: false };
    }
    const existingItem = itemSnap.data();

    if (existingItem?.ownerUid !== authUid) {
      return { message: 'Unauthorized: You do not own this note.', success: false };
    }

    await itemRef.update({ content, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath('/secret');
    return { message: 'Note updated successfully', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update note.';
    console.error('Error updating note:', errorMessage);
    return { message: errorMessage, success: false };
  }
}

export async function deleteSecretItem(id: string, ownerUid: string, idToken: string): Promise<{ success: boolean; message: string }> {
  if (!ownerUid || !id) return { message: 'Owner UID and ID are required', success: false };

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const authUid = decodedToken.uid;

    if (authUid !== ownerUid) {
      return { success: false, message: 'Authentication mismatch: You can only delete your own secret items.' };
    }

    const itemRef = adminDb.collection('secretItems').doc(id);
    const itemSnap = await itemRef.get();

    if (!itemSnap.exists) {
      return { success: false, message: 'Secret item not found.' };
    }
    const item = itemSnap.data() as SecretItem;

    if (item.ownerUid !== authUid) {
      return { success: false, message: 'Unauthorized: You do not own this secret item.' };
    }

    // Recursive delete helper (if it's a folder)
    const getIdsToDelete = async (itemId: string): Promise<string[]> => {
      const childrenQuery = adminDb.collection('secretItems').where('parentId', '==', itemId);
      const childrenSnapshot = await childrenQuery.get();
      let ids = [itemId];
      for (const d of childrenSnapshot.docs) {
        ids = [...ids, ...await getIdsToDelete(d.id)];
      }
      return ids;
    };

    const idsToDelete = await getIdsToDelete(id);
    const deletePromises: Promise<FirebaseFirestore.WriteResult>[] = [];
    for (const deleteId of idsToDelete) {
      deletePromises.push(adminDb.collection('secretItems').doc(deleteId).delete());
    }
    await Promise.all(deletePromises);

    revalidatePath('/secret');
    return { success: true, message: 'Deleted successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete secret item.';
    console.error('Error deleting secret item:', errorMessage);
    return { success: false, message: errorMessage };
  }
}