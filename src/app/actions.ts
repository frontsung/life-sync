'use server'

import { revalidatePath } from 'next/cache';
import { 
  CalendarEvent, 
  Todo, 
  Transaction,
  SecretItem,
  readEvents, 
  writeEvents, 
  readTodos, 
  writeTodos,
  readTransactions,
  writeTransactions,
  readSecretItems,
  writeSecretItems
} from '@/lib/db';

// --- Events ---

export async function getEvents() {
  return await readEvents();
}

export async function addEvent(_prevState: unknown, formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const color = formData.get('color') as CalendarEvent['color'] || 'blue';

  if (!title || !date) {
    return { message: 'Title and Date are required', success: false };
  }

  const events = await readEvents();
  const newEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    title,
    date,
    description,
    color,
    isCompleted: false
  };

  await writeEvents([...events, newEvent]);
  revalidatePath('/');
  revalidatePath('/schedule');
  return { message: 'Event added successfully', success: true };
}

export async function updateEvent(_prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const color = formData.get('color') as CalendarEvent['color'];

  if (!id || !title || !date) {
    return { message: 'ID, Title and Date are required', success: false };
  }

  const events = await readEvents();
  const updatedEvents = events.map(event => {
    if (event.id === id) {
      return { ...event, title, date, description, color };
    }
    return event;
  });

  await writeEvents(updatedEvents);
  revalidatePath('/');
  revalidatePath('/schedule');
  return { message: 'Event updated successfully', success: true };
}

export async function deleteEvent(id: string) {
  const events = await readEvents();
  
  // Update: If a calendar event is linked to a todo, delete the todo as well
  const todos = await readTodos();
  const todoLinked = todos.find(t => t.syncedEventId === id);

  if (todoLinked) {
    const filteredTodos = todos.filter(t => t.id !== todoLinked.id);
    await writeTodos(filteredTodos);
    revalidatePath('/todo');
  }

  const filteredEvents = events.filter(event => event.id !== id);
  await writeEvents(filteredEvents);
  revalidatePath('/');
  revalidatePath('/schedule');
}

// --- Todos ---

export async function getTodos() {
  return await readTodos();
}

export async function addTodo(_prevState: unknown, formData: FormData) {
  const text = formData.get('text') as string;
  const date = formData.get('date') as string; // Defaults to today from client
  const sync = formData.get('sync') === 'on';
  const color = formData.get('color') as CalendarEvent['color'] || 'purple';

  if (!text || !date) {
    return { message: 'Text is required', success: false };
  }

  const todos = await readTodos();
  let syncedEventId: string | undefined;

  // If sync is requested, create an event
  if (sync) {
    const events = await readEvents();
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: `[Todo] ${text}`,
      date: date,
      description: 'Synced from Todo List',
      color: color,
      isCompleted: false
    };
    await writeEvents([...events, newEvent]);
    syncedEventId = newEvent.id;
  }

  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    isCompleted: false,
    date,
    syncedEventId
  };

  await writeTodos([...todos, newTodo]);
  revalidatePath('/todo');
  revalidatePath('/');
  revalidatePath('/schedule');
  return { message: 'Todo added successfully', success: true };
}

export async function updateTodo(id: string, text: string) {
  const todos = await readTodos();
  let syncedEventId: string | undefined;

  const updatedTodos = todos.map(todo => {
    if (todo.id === id) {
      syncedEventId = todo.syncedEventId;
      return { ...todo, text };
    }
    return todo;
  });
  await writeTodos(updatedTodos);

  // If synced, update calendar event title too
  if (syncedEventId) {
    const events = await readEvents();
    const updatedEvents = events.map(event => {
      if (event.id === syncedEventId) {
        return { ...event, title: `[Todo] ${text}` };
      }
      return event;
    });
    await writeEvents(updatedEvents);
    revalidatePath('/schedule');
  }

  revalidatePath('/todo');
  revalidatePath('/');
}

export async function syncTodo(id: string, color: CalendarEvent['color']) {
  const todos = await readTodos();
  const todo = todos.find(t => t.id === id);

  if (!todo || todo.syncedEventId) return; // Already synced or not found

  const events = await readEvents();
  const newEvent: CalendarEvent = {
    id: crypto.randomUUID(),
    title: `[Todo] ${todo.text}`,
    date: todo.date,
    description: 'Synced from Todo List',
    color: color,
    isCompleted: todo.isCompleted
  };

  await writeEvents([...events, newEvent]);
  
  const updatedTodos = todos.map(t => {
    if (t.id === id) {
      return { ...t, syncedEventId: newEvent.id };
    }
    return t;
  });
  await writeTodos(updatedTodos);

  revalidatePath('/todo');
  revalidatePath('/schedule');
  revalidatePath('/');
}

export async function toggleTodo(id: string) {
  const todos = await readTodos();
  let syncedEventId: string | undefined;
  let newCompletionStatus: boolean = false;

  const updatedTodos = todos.map(todo => {
    if (todo.id === id) {
      syncedEventId = todo.syncedEventId;
      newCompletionStatus = !todo.isCompleted;
      return { ...todo, isCompleted: newCompletionStatus };
    }
    return todo;
  });
  await writeTodos(updatedTodos);

  // If there is a synced event, update its completion status too
  if (syncedEventId) {
    const events = await readEvents();
    const updatedEvents = events.map(event => {
      if (event.id === syncedEventId) {
        return { ...event, isCompleted: newCompletionStatus };
      }
      return event;
    });
    await writeEvents(updatedEvents);
    revalidatePath('/schedule');
  }

  revalidatePath('/todo');
  revalidatePath('/');
}

export async function deleteTodo(id: string) {
  const todos = await readTodos();
  const todoToDelete = todos.find(t => t.id === id);
  
  if (todoToDelete?.syncedEventId) {
    const events = await readEvents();
    const filteredEvents = events.filter(e => e.id !== todoToDelete.syncedEventId);
    await writeEvents(filteredEvents);
    revalidatePath('/schedule');
  }

  const filteredTodos = todos.filter(t => t.id !== id);
  await writeTodos(filteredTodos);
  revalidatePath('/todo');
  revalidatePath('/');
}

export async function unlinkTodo(id: string) {
  const todos = await readTodos();
  const todoToUnlink = todos.find(t => t.id === id);

  if (todoToUnlink && todoToUnlink.syncedEventId) {
     // Remove the calendar event
     const events = await readEvents();
     const filteredEvents = events.filter(e => e.id !== todoToUnlink.syncedEventId);
     await writeEvents(filteredEvents);
     
     // Update todo to remove syncedEventId
     const updatedTodos = todos.map(t => {
       if (t.id === id) {
         return { ...t, syncedEventId: undefined };
       }
       return t;
     });
     await writeTodos(updatedTodos);
     
     revalidatePath('/todo');
     revalidatePath('/schedule');
     revalidatePath('/');
  }
}

// --- Finance ---

export async function getTransactions() {
  return await readTransactions();
}

export async function addTransaction(_prevState: unknown, formData: FormData) {
  const type = formData.get('type') as 'income' | 'expense';
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const date = formData.get('date') as string;

  if (!type || isNaN(amount) || !description || !date) {
    return { message: 'All fields are required', success: false };
  }

  const transactions = await readTransactions();
  const newTransaction: Transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    description,
    date,
    category
  };

  await writeTransactions([...transactions, newTransaction]);
  revalidatePath('/finance');
  revalidatePath('/'); // Revalidate dashboard
  return { message: 'Transaction added successfully', success: true };
}

export async function updateTransaction(_prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string;
  const type = formData.get('type') as 'income' | 'expense';
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const date = formData.get('date') as string;

  if (!id || !type || isNaN(amount) || !description || !date) {
    return { message: 'All fields are required', success: false };
  }

  const transactions = await readTransactions();
  const updatedTransactions = transactions.map(t => {
    if (t.id === id) {
      return { ...t, type, amount, description, category, date };
    }
    return t;
  });

  await writeTransactions(updatedTransactions);
  revalidatePath('/finance');
  revalidatePath('/'); 
  return { message: 'Transaction updated successfully', success: true };
}

export async function deleteTransaction(id: string) {
  const transactions = await readTransactions();
  const filteredTransactions = transactions.filter(t => t.id !== id);
  await writeTransactions(filteredTransactions);
  revalidatePath('/finance');
  revalidatePath('/');
}

// --- Secret Space ---

export async function getSecretItems() {
  return await readSecretItems();
}

export async function createSecretItem(parentId: string | null, type: 'folder' | 'note', name: string) {
  if (!name) return { message: 'Name is required', success: false };

  const items = await readSecretItems();
  const newItem: SecretItem = {
    id: crypto.randomUUID(),
    type,
    name,
    parentId,
    updatedAt: new Date().toISOString(),
    content: type === 'note' ? '' : undefined
  };

  await writeSecretItems([...items, newItem]);
  revalidatePath('/secret');
  return { message: 'Created successfully', success: true };
}

export async function renameSecretItem(id: string, name: string) {
  const items = await readSecretItems();
  const updatedItems = items.map(item => {
    if (item.id === id) {
      return { ...item, name, updatedAt: new Date().toISOString() };
    }
    return item;
  });
  await writeSecretItems(updatedItems);
  revalidatePath('/secret');
}

export async function updateNoteContent(id: string, content: string) {
  const items = await readSecretItems();
  const updatedItems = items.map(item => {
    if (item.id === id) {
      return { ...item, content, updatedAt: new Date().toISOString() };
    }
    return item;
  });
  await writeSecretItems(updatedItems);
  revalidatePath('/secret');
}

export async function deleteSecretItem(id: string) {
  const items = await readSecretItems();
  
  // Recursive delete helper
  const getIdsToDelete = (itemId: string): string[] => {
    const children = items.filter(i => i.parentId === itemId);
    let ids = [itemId];
    for (const child of children) {
      ids = [...ids, ...getIdsToDelete(child.id)];
    }
    return ids;
  };

  const idsToDelete = getIdsToDelete(id);
  const filteredItems = items.filter(item => !idsToDelete.includes(item.id));
  
  await writeSecretItems(filteredItems);
  revalidatePath('/secret');
}
