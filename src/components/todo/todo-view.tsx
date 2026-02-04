'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Check, Trash2, Calendar as CalendarIcon, Loader2, Unlink, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Todo } from '@/lib/types';
import { addTodo, toggleTodo, deleteTodo, unlinkTodo, updateTodo, syncTodo, getTodos } from '@/app/actions';
import { useLanguage } from '@/lib/i18n-context';
import { useAuth } from '@/lib/hooks/use-auth';

export function TodoView() {
  const { t, dateLocale } = useLanguage();
  const { userProfile, user } = useAuth();
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSyncChecked, setIsSyncChecked] = React.useState(false);
  
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = React.useState(true);

  const fetchTodos = React.useCallback(async () => {
    if (userProfile?.uid && user) {
      const idToken = await user.getIdToken();
      const fetchedTodos = await getTodos(userProfile.uid, idToken);
      if (fetchedTodos && 'error' in fetchedTodos) {
        console.error("Failed to fetch todos:", fetchedTodos.error);
        setTodos([]);
      } else {
        setTodos(fetchedTodos as Todo[]);
      }
    }
  }, [user, userProfile?.uid]);

  React.useEffect(() => {
    async function initialFetch() {
      if (userProfile?.uid && user) {
        setIsLoadingTodos(true);
        await fetchTodos();
        setIsLoadingTodos(false);
      } else if (!user) {
        setTodos([]);
        setIsLoadingTodos(false);
      }
    }
    initialFetch();
  }, [fetchTodos, user, userProfile?.uid]);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [syncColor, setSyncColor] = React.useState<'blue' | 'red' | 'green' | 'purple' | 'orange'>('purple');

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysTodos = todos.filter(todo => todo.date === today);

  const handleAction = async (action: () => Promise<any>) => {
    startTransition(async () => {
      const result = await action();
      if (result && !result.success) {
        console.error("Todo action failed:", result.message);
      }
      await fetchTodos();
    });
  };
  
  const handleFormSubmit = async (formData: FormData) => {
    if (!userProfile?.uid || !user) return;
    const idToken = await user.getIdToken();
    formData.append('ownerUid', userProfile.uid);
    
    await handleAction(() => addTodo(null, formData, idToken));

    formRef.current?.reset();
    setIsSyncChecked(false); 
  };

  const handleEditStart = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setSyncingId(null);
  };

  const handleEditSave = async (id: string) => {
    if (!editText.trim() || !userProfile?.uid || !user) return;
    const idToken = await user.getIdToken();
    await handleAction(() => updateTodo(id, editText, userProfile.uid, idToken));
    setEditingId(null);
  };

  const handleLateSyncStart = (todo: Todo) => {
    if (todo.syncedEventId) return;
    setSyncingId(todo.id);
    setEditingId(null);
  };

  const handleLateSyncSave = async (id: string) => {
    if (!userProfile?.uid || !user) return;
    const idToken = await user.getIdToken();
    await handleAction(() => syncTodo(id, syncColor, userProfile.uid, idToken));
    setSyncingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('todaysTodo')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), 'PPPP', { locale: dateLocale })}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border p-4 mb-8">
        <form 
          ref={formRef}
          action={handleFormSubmit}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="date" value={today} />
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <div className="flex-1 w-full">
               <input 
                 required
                 type="text" 
                 name="text"
                 placeholder={t('todoPlaceholder')}
                 className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
               />
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                   <input 
                      type="checkbox" 
                      name="sync" 
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                      checked={isSyncChecked}
                      onChange={(e) => setIsSyncChecked(e.target.checked)}
                   />
                   <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {t('syncCalendar')}
                   </span>
                </label>

                <div className={cn("transition-opacity duration-200 flex items-center gap-6", isSyncChecked ? "opacity-100" : "opacity-0 pointer-events-none")}>
                   {['blue', 'red', 'green', 'purple', 'orange'].map((color) => (
                      <label key={color} className="cursor-pointer">
                        <input type="radio" name="color" value={color} className="peer sr-only" defaultChecked={color === 'purple'} disabled={!isSyncChecked} />
                        <div className={cn(
                          "w-4 h-4 rounded-full ring-2 ring-transparent peer-checked:ring-offset-1 peer-checked:ring-foreground transition-all opacity-70 peer-checked:opacity-100",
                          {
                            'bg-blue-500': color === 'blue',
                            'bg-red-500': color === 'red',
                            'bg-green-500': color === 'green',
                            'bg-purple-500': color === 'purple',
                            'bg-orange-500': color === 'orange',
                          }
                        )} />
                      </label>
                    ))}
                </div>
             </div>
             
             <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
               {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('addTodo')}
             </Button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {isLoadingTodos ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-4" />
            {t('loadingTodos')}
          </div>
        ) : (
          todaysTodos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              {t('noTodos')}
            </div>
          ) : (
            todaysTodos.map((todo) => (
              <div 
                key={todo.id} 
                className={cn(
                  "group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card transition-all hover:shadow-sm gap-4",
                  todo.isCompleted ? "opacity-60 bg-muted/50" : ""
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                  <button
                    onClick={() => {
                      if (!userProfile?.uid || !user) return;
                      handleAction(async () => {
                        const idToken = await user.getIdToken();
                        return toggleTodo(todo.id, userProfile.uid, idToken);
                      });
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                      todo.isCompleted 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                  >
                    {todo.isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>
                  
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2 flex-1 w-full">
                      <input 
                        type="text" 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 h-8 px-2 text-sm rounded border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button onClick={() => handleEditSave(todo.id)} className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                       <span className={cn(
                         "text-sm font-medium truncate transition-all decoration-muted-foreground/50 cursor-pointer",
                         todo.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                       )} onClick={() => handleEditStart(todo)}>
                         {todo.text}
                       </span>
                       
                       <button onClick={() => handleEditStart(todo)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity">
                          <Edit2 className="w-3 h-3" />
                       </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:ml-4 justify-end">
                  {todo.syncedEventId ? (
                     <div className="flex items-center gap-1">
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                         <CalendarIcon className="w-3 h-3 mr-1" />
                         Synced
                       </span>
                       <button
                          onClick={() => {
                            if (!userProfile?.uid || !user) return;
                            handleAction(async () => {
                              const idToken = await user.getIdToken();
                              return unlinkTodo(todo.id, userProfile.uid, idToken);
                            });
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          title={t('unlink')}
                       >
                         <Unlink className="w-3 h-3" />
                       </button>
                     </div>
                  ) : (
                    syncingId === todo.id ? (
                      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex gap-1">
                          {['blue', 'red', 'green', 'purple', 'orange'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setSyncColor(color as "blue" | "red" | "green" | "purple" | "orange")}
                              className={cn(
                                "w-3 h-3 rounded-full transition-all",
                                {
                                  'bg-blue-500': color === 'blue',
                                  'bg-red-500': color === 'red',
                                  'bg-green-500': color === 'green',
                                  'bg-purple-500': color === 'purple',
                                  'bg-orange-500': color === 'orange',
                                  'ring-2 ring-offset-1 ring-foreground scale-110': syncColor === color
                                }
                              )}
                            />
                          ))}
                        </div>
                        <button onClick={() => handleLateSyncSave(todo.id)} className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-sm">{t('syncNow')}</button>
                        <button onClick={() => setSyncingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLateSyncStart(todo)}
                        className="opacity-0 group-hover:opacity-100 text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors border px-2 py-1 rounded-full"
                      >
                         <CalendarIcon className="w-3 h-3" /> {t('syncCalendar')}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => {
                      if (!userProfile?.uid || !user) return;
                      handleAction(async () => {
                        const idToken = await user.getIdToken();
                        return deleteTodo(todo.id, userProfile.uid, idToken);
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-2"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}