'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Transaction } from '@/lib/db';
import { addTransaction, deleteTransaction, updateTransaction } from '@/app/actions';
import { useLanguage } from '@/lib/i18n-context';

interface FinanceViewProps {
  transactions: Transaction[];
}

export function FinanceView({ transactions }: FinanceViewProps) {
  const { t, dateLocale } = useLanguage();
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  
  // Edit State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  // We use controlled inputs for the form to support both Add and Edit modes easily
  const [formState, setFormState] = React.useState({
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    category: ''
  });

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setFormState({
      type: t.type,
      date: t.date,
      description: t.description,
      amount: t.amount.toString(),
      category: t.category
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormState({
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      amount: '',
      category: ''
    });
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          {t('financeManagement')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('financeDesc')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-1">
           <span className="text-sm text-muted-foreground font-medium">{t('totalBalance')}</span>
           <span className={cn("text-2xl font-bold", balance >= 0 ? "text-primary" : "text-destructive")}>
             {balance.toLocaleString()} ₩
           </span>
        </div>
        <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-1">
           <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
             <ArrowUpCircle className="w-4 h-4 text-green-500" /> {t('totalIncome')}
           </span>
           <span className="text-2xl font-bold text-green-600">
             +{income.toLocaleString()} ₩
           </span>
        </div>
        <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-1">
           <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
             <ArrowDownCircle className="w-4 h-4 text-red-500" /> {t('totalExpense')}
           </span>
           <span className="text-2xl font-bold text-red-600">
             -{expense.toLocaleString()} ₩
           </span>
        </div>
      </div>

      {/* Add/Edit Transaction Form */}
      <div className={cn("bg-card rounded-xl shadow-sm border p-6 mb-8 transition-colors", editingId ? "border-primary ring-1 ring-primary" : "")}>
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-semibold flex items-center gap-2">
             {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
             {editingId ? t('edit') : t('addTransaction')}
           </h3>
           {editingId && (
             <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-6 px-2 text-xs">
                <X className="w-3 h-3 mr-1" /> {t('cancel')}
             </Button>
           )}
        </div>
        <form 
          ref={formRef}
          action={async (formData) => {
            if (editingId) {
              await updateTransaction(null, formData);
              handleCancelEdit();
            } else {
              await addTransaction(null, formData);
              setFormState({
                type: 'expense',
                date: format(new Date(), 'yyyy-MM-dd'),
                description: '',
                amount: '',
                category: ''
              });
            }
          }} 
          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          <input type="hidden" name="id" value={editingId || ''} />

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('type')}</label>
            <select 
              name="type" 
              value={formState.type}
              onChange={(e) => setFormState({...formState, type: e.target.value})}
              className="w-full h-10 px-3 rounded-md border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="expense">{t('expense')}</option>
              <option value="income">{t('income')}</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('date')}</label>
            <input 
              type="date" 
              name="date" 
              required 
              value={formState.date}
              onChange={(e) => setFormState({...formState, date: e.target.value})}
              className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          <div className="md:col-span-3">
             <label className="block text-xs font-medium text-muted-foreground mb-1">{t('description')}</label>
             <input 
               type="text" 
               name="description" 
               required 
               value={formState.description}
               onChange={(e) => setFormState({...formState, description: e.target.value})}
               placeholder={t('descPlaceholder')} 
               className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             />
          </div>

          <div className="md:col-span-2">
             <label className="block text-xs font-medium text-muted-foreground mb-1">{t('amount')}</label>
             <input 
               type="number" 
               name="amount" 
               required 
               min="0" 
               value={formState.amount}
               onChange={(e) => setFormState({...formState, amount: e.target.value})}
               placeholder="0" 
               className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             />
          </div>

          <div className="md:col-span-2">
             <label className="block text-xs font-medium text-muted-foreground mb-1">{t('category')}</label>
             <input 
               type="text" 
               name="category" 
               value={formState.category}
               onChange={(e) => setFormState({...formState, category: e.target.value})}
               placeholder={t('categoryPlaceholder')} 
               className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
             />
          </div>

          <div className="md:col-span-1">
             <Button type="submit" size="icon" disabled={isPending} className="w-full">
               {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
             </Button>
          </div>
        </form>
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3">{t('date')}</th>
                <th className="px-6 py-3">{t('description')}</th>
                <th className="px-6 py-3">{t('category')}</th>
                <th className="px-6 py-3 text-right">{t('amount')}</th>
                <th className="px-6 py-3 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {t('noTransactions')}
                  </td>
                </tr>
              ) : (
                transactions.slice().reverse().map((transaction) => (
                  <tr key={transaction.id} className={cn("border-b last:border-0 transition-colors", editingId === transaction.id ? "bg-muted/50" : "hover:bg-muted/30")}>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
                    <td className="px-6 py-4 font-medium">{transaction.description}</td>
                    <td className="px-6 py-4 text-muted-foreground">{transaction.category}</td>
                    <td className={cn("px-6 py-4 text-right font-medium", transaction.type === 'income' ? "text-green-600" : "text-red-600")}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ₩
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEditClick(transaction)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => startTransition(() => deleteTransaction(transaction.id))}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}