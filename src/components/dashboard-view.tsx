'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Wallet, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { CalendarEvent, Todo, Transaction } from '@/lib/db';
import { useLanguage } from '@/lib/i18n-context';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
  events: CalendarEvent[];
  todos: Todo[];
  transactions: Transaction[];
}

export function DashboardView({ events, todos, transactions }: DashboardViewProps) {
  const { t, dateLocale } = useLanguage();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todaysEvents = events.filter(e => e.date === today);
  const todaysTodos = todos.filter(t => t.date === today);
  
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('dashboard')}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'PPP', { locale: dateLocale })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold flex items-center gap-2">
               <CalendarIcon className="w-5 h-5 text-primary" />
               {t('todaysSchedule')}
             </h3>
             <Link href="/schedule" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
               {t('viewAll')} <ArrowRight className="w-3 h-3" />
             </Link>
          </div>
          <div className="flex-1 space-y-3">
             {todaysEvents.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-sm min-h-[150px]">
                 {t('noEvents')}
               </div>
             ) : (
               todaysEvents.slice(0, 4).map(event => (
                 <div key={event.id} className={cn("p-3 rounded-lg border bg-muted/20 text-sm flex items-start gap-3", event.isCompleted ? "opacity-60" : "")}>
                    <span className={cn("w-2 h-2 mt-1.5 rounded-full flex-shrink-0", {
                        'bg-blue-500': event.color === 'blue',
                        'bg-red-500': event.color === 'red',
                        'bg-green-500': event.color === 'green',
                        'bg-purple-500': event.color === 'purple',
                        'bg-orange-500': event.color === 'orange',
                    })} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate", event.isCompleted ? "line-through text-muted-foreground" : "")}>{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground truncate">{event.description}</p>}
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Today's Todo */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold flex items-center gap-2">
               <CheckSquare className="w-5 h-5 text-primary" />
               {t('todaysTodo')}
             </h3>
             <Link href="/todo" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
               {t('viewAll')} <ArrowRight className="w-3 h-3" />
             </Link>
          </div>
          <div className="flex-1 space-y-3">
             {todaysTodos.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-sm min-h-[150px]">
                 {t('noTodos')}
               </div>
             ) : (
               todaysTodos.slice(0, 4).map(todo => (
                 <div key={todo.id} className={cn("p-3 rounded-lg border bg-muted/20 text-sm flex items-center gap-3", todo.isCompleted ? "opacity-60" : "")}>
                    <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0", todo.isCompleted ? "bg-green-500 border-green-500" : "border-muted-foreground")} />
                    <span className={cn("truncate flex-1", todo.isCompleted ? "line-through text-muted-foreground" : "")}>{todo.text}</span>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Finance Summary */}
        <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold flex items-center gap-2">
               <Wallet className="w-5 h-5 text-primary" />
               {t('financeSummary')}
             </h3>
             <Link href="/finance" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
               {t('viewAll')} <ArrowRight className="w-3 h-3" />
             </Link>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4 min-h-[150px]">
             <div className="text-center p-4 bg-primary/5 rounded-xl">
               <p className="text-sm text-muted-foreground mb-1">{t('totalBalance')}</p>
               <p className={cn("text-3xl font-bold", balance >= 0 ? "text-primary" : "text-destructive")}>
                 {balance.toLocaleString()} ₩
               </p>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-3 rounded-lg border bg-muted/20 text-center">
                 <p className="text-xs text-muted-foreground mb-1">{t('income')}</p>
                 <p className="font-semibold text-green-600">+{income.toLocaleString()}</p>
               </div>
               <div className="p-3 rounded-lg border bg-muted/20 text-center">
                 <p className="text-xs text-muted-foreground mb-1">{t('expense')}</p>
                 <p className="font-semibold text-red-600">-{expense.toLocaleString()}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
