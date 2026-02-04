'use client';

import * as React from 'react';
import { DashboardView } from "@/components/dashboard-view";
import { getEvents, getTodos, getTransactions } from "@/app/actions";
import { useAuth } from "@/lib/hooks/use-auth";
import { CalendarEvent, Todo, Transaction } from "@/lib/types";
import { Loader2 } from 'lucide-react';



export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const idToken = await user.getIdToken();
          const [eventData, todoData, transactionData] = await Promise.all([
            getEvents(user.uid, idToken),
            getTodos(user.uid, idToken),
            getTransactions(user.uid, idToken)
          ]);
          setEvents(eventData as CalendarEvent[]);
          setTodos(todoData as Todo[]);
          setTransactions(transactionData as Transaction[]);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isAuthLoading) {
        // If auth is not loading and there's no user, clear data.
        setEvents([]);
        setTodos([]);
        setTransactions([]);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <DashboardView events={events} todos={todos} transactions={transactions} />;
}
