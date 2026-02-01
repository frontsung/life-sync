import fs from 'fs/promises';
import path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  description?: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
  isCompleted?: boolean;
}

export interface Todo {
  id: string;
  text: string;
  isCompleted: boolean;
  date: string; // YYYY-MM-DD (Target date for the todo)
  syncedEventId?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category: string;
}

export interface SecretItem {
  id: string;
  type: 'folder' | 'note';
  name: string;
  parentId: string | null;
  content?: string; // only for notes
  updatedAt: string;
}

const EVENTS_DB_PATH = path.join(process.cwd(), 'src', 'data', 'events.json');
const TODOS_DB_PATH = path.join(process.cwd(), 'src', 'data', 'todos.json');
const FINANCE_DB_PATH = path.join(process.cwd(), 'src', 'data', 'finance.json');
const SECRET_DB_PATH = path.join(process.cwd(), 'src', 'data', 'secret.json');

// --- Events ---

export async function readEvents(): Promise<CalendarEvent[]> {
  try {
    const data = await fs.readFile(EVENTS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeEvents(events: CalendarEvent[]): Promise<void> {
  await fs.writeFile(EVENTS_DB_PATH, JSON.stringify(events, null, 2), 'utf-8');
}

// --- Todos ---

export async function readTodos(): Promise<Todo[]> {
  try {
    const data = await fs.readFile(TODOS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  await fs.writeFile(TODOS_DB_PATH, JSON.stringify(todos, null, 2), 'utf-8');
}

// --- Finance ---

export async function readTransactions(): Promise<Transaction[]> {
  try {
    const data = await fs.readFile(FINANCE_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeTransactions(transactions: Transaction[]): Promise<void> {
  await fs.writeFile(FINANCE_DB_PATH, JSON.stringify(transactions, null, 2), 'utf-8');
}

// --- Secret Space ---

export async function readSecretItems(): Promise<SecretItem[]> {
  try {
    const data = await fs.readFile(SECRET_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeSecretItems(items: SecretItem[]): Promise<void> {
  await fs.writeFile(SECRET_DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
}