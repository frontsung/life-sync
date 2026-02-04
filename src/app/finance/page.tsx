'use client';

import * as React from 'react';
import { FinanceView } from "@/components/finance/finance-view";
import { getTransactions } from "@/app/actions";
import { useAuth } from "@/lib/hooks/use-auth";
import { Transaction } from "@/lib/types";
import { Loader2 } from 'lucide-react';

export default function FinancePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTransactions = React.useCallback(async () => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const data = await getTransactions(user.uid, idToken);
        if (data && 'error' in data) {
          console.error("Failed to fetch transactions:", data.error);
          setTransactions([]);
        } else {
          setTransactions(data as Transaction[]);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      }
    }
  }, [user]);

  React.useEffect(() => {
    async function initialFetch() {
      if (user) {
        setIsLoading(true);
        await fetchTransactions();
        setIsLoading(false);
      } else if (!isAuthLoading) {
        setIsLoading(false);
      }
    }
    initialFetch();
  }, [user, isAuthLoading, fetchTransactions]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please log in to view your finances.</p>
      </div>
    );
  }

  return <FinanceView transactions={transactions} ownerUid={user.uid} onDataChange={fetchTransactions} />;
}
