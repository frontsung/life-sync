'use client';

import * as React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO, 
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Edit2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarEvent, UserProfile } from '@/lib/types';
import { addEvent, deleteEvent, updateEvent, getUserProfile, getEvents } from '@/app/actions';
import { useLanguage } from '@/lib/i18n-context';
import { useAuth } from '@/lib/hooks/use-auth';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isPending, startTransition] = React.useTransition();
  const { t, dateLocale } = useLanguage();
  const { userProfile, user } = useAuth();

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(true);
  const [friendsProfiles, setFriendsProfiles] = React.useState<UserProfile[]>([]);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);
  const [formState, setFormState] = React.useState({
    title: '',
    description: '',
    color: 'blue' as CalendarEvent['color'],
    sharedWith: [] as string[]
  });

  const fetchEvents = React.useCallback(async () => {
    if (userProfile?.uid && user) {
      const idToken = await user.getIdToken();
      const fetchedEvents = await getEvents(userProfile.uid, idToken);
      if (fetchedEvents && 'error' in fetchedEvents) {
        console.error("Failed to fetch events:", fetchedEvents.error);
        setEvents([]);
      } else {
        setEvents(fetchedEvents as CalendarEvent[]);
      }
    }
  }, [user, userProfile?.uid]);

  React.useEffect(() => {
    async function initialFetch() {
      if (userProfile?.uid && user) {
        setIsLoadingEvents(true);
        await fetchEvents();
        setIsLoadingEvents(false);
      }
    }
    initialFetch();
  }, [fetchEvents, user, userProfile?.uid]);

  React.useEffect(() => {
    const fetchFriends = async () => {
      if (userProfile?.friends && userProfile.friends.length > 0 && user) {
        try {
          const idToken = await user.getIdToken();
          const friendPromises = userProfile.friends.map(uid => getUserProfile(uid, idToken));
          const profiles = await Promise.all(friendPromises);
          const validProfiles = profiles.filter(p => p && !('error' in p)) as UserProfile[];
          setFriendsProfiles(validProfiles);
        } catch (error) {
          console.error("Error fetching friends profiles:", error);
          setFriendsProfiles([]);
        }
      } else {
        setFriendsProfiles([]);
      }
    };
    fetchFriends();
  }, [userProfile, user]);

  React.useEffect(() => {
    setFormState({ title: '', description: '', color: 'blue', sharedWith: [] });
    setEditingEvent(null);
  }, [selectedDate]);

  React.useEffect(() => {
    if (editingEvent) {
      setFormState({
        title: editingEvent.title,
        description: editingEvent.description || '',
        color: editingEvent.color,
        sharedWith: editingEvent.sharedWith || []
      });
    } else {
      setFormState({ title: '', description: '', color: 'blue', sharedWith: [] });
    }
  }, [editingEvent]);

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  const handleShareToggle = (uid: string) => {
    setFormState(prevState => {
      const currentSharedWith = prevState.sharedWith || [];
      if (currentSharedWith.includes(uid)) {
        return { ...prevState, sharedWith: currentSharedWith.filter(id => id !== uid) };
      } else {
        return { ...prevState, sharedWith: [...currentSharedWith, uid] };
      }
    });
  };

  const handleEditClick = (event: CalendarEvent) => {
    setEditingEvent(event);
  };
  
  const handleDelete = (eventId: string) => {
    startTransition(async () => {
      if (!user || !userProfile?.uid) {
        console.error("User not authenticated for deleting event.");
        return;
      }
      const idToken = await user.getIdToken();
      const deleteResult = await deleteEvent(eventId, userProfile.uid, idToken);
      if (deleteResult && !deleteResult.success) {
        console.error("Failed to delete event:", deleteResult.message);
      } else {
        await fetchEvents();
      }
    });
  };
  
  const handleFormSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (!user || !userProfile?.uid) {
        console.error("User not authenticated for adding/updating event.");
        return;
      }
      const idToken = await user.getIdToken();
      formData.append('ownerUid', userProfile.uid);

      if (editingEvent) {
        const updateResult = await updateEvent(null, formData, idToken);
        if (updateResult && !updateResult.success) {
          console.error("Failed to update event:", updateResult.message);
        }
      } else {
        const addResult = await addEvent(null, formData, idToken);
        if (addResult && !addResult.success) {
          console.error("Failed to add event:", addResult.message);
        }
      }
      
      setEditingEvent(null);
      setFormState({ title: '', description: '', color: 'blue', sharedWith: [] });
      await fetchEvents();
    });
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('manageSchedule')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEE";
    const days = [];
    const startDate = startOfWeek(currentMonth, { locale: dateLocale });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-sm font-medium text-muted-foreground text-center py-2 uppercase">
          {format(addDays(startDate, i), dateFormat, { locale: dateLocale })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: dateLocale });
    const endDate = endOfWeek(monthEnd, { locale: dateLocale });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat, { locale: dateLocale });
        const cloneDay = day;
        
        const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
        
        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative h-24 sm:h-32 border p-2 transition-all cursor-pointer hover:bg-muted/50 flex flex-col justify-between",
              {
                "bg-muted/20 text-muted-foreground": !isSameMonth(day, monthStart),
                "bg-background text-foreground": isSameMonth(day, monthStart),
                "border-primary ring-1 ring-primary z-10": isSameDay(day, selectedDate),
                "border-border": !isSameDay(day, selectedDate),
              }
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-primary text-primary-foreground" : ""
              )}>
                {formattedDate}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 mt-1 overflow-hidden">
              {isLoadingEvents ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-[10px] sm:text-xs truncate px-1.5 py-0.5 rounded-sm font-semibold flex items-center gap-1",
                      event.isCompleted ? "opacity-60 line-through" : "",
                      {
                        'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100': event.color === 'blue',
                        'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100': event.color === 'red',
                        'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100': event.color === 'green',
                        'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-900': event.color === 'purple',
                        'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-900': event.color === 'orange',
                      }
                    )}
                  >
                    {event.isCompleted && <Check className="w-2.5 h-2.5 flex-shrink-0" />}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))
              )}
              {dayEvents.length > 3 && (
                <span className="text-[10px] text-muted-foreground pl-1">
                  +{dayEvents.length - 3} {t('more')}
                </span>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 border-l border-t border-border first:border-t-0">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-card rounded-xl shadow-sm border overflow-hidden">{rows}</div>;
  };

  const selectedDayEvents = (events || []).filter(e => isSameDay(parseISO(e.date), selectedDate));

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
             {t('eventsFor')} {format(selectedDate, 'PPP', { locale: dateLocale })}
          </h3>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingEvents ? (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                {t('loadingEvents')}
              </div>
            ) : (
              selectedDayEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  {t('noEvents')}
                </div>
              ) : (
                selectedDayEvents.map(event => (
                  <div
                    key={event.id}
                    className={cn(
                      "group flex flex-col gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-colors relative",
                      event.isCompleted ? "opacity-60 bg-muted/20" : "",
                      editingEvent?.id === event.id ? "ring-2 ring-primary bg-muted" : ""
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className={cn("font-medium text-sm", event.isCompleted ? "line-through text-muted-foreground" : "")}>
                        {event.isCompleted && <Check className="inline w-3.5 h-3.5 mr-1.5 text-green-500" />}
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                           onClick={() => handleEditClick(event)}
                           className="p-1 text-muted-foreground hover:text-primary transition-colors"
                           title={t('edit')}
                        >
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                       <span className={cn("w-2 h-2 rounded-full", {
                          'bg-blue-500': event.color === 'blue',
                          'bg-red-500': event.color === 'red',
                          'bg-green-500': event.color === 'green',
                          'bg-purple-500': event.color === 'purple',
                          'bg-orange-500': event.color === 'orange',
                       })} />
                       <span className="text-xs text-muted-foreground capitalize">{t('label')}: {event.color}</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
               {editingEvent ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
               {editingEvent ? t('edit') : t('addEvent')}
            </span>
            {editingEvent && (
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-6 px-2 text-xs">
                 <X className="w-3 h-3 mr-1" /> {t('cancel')}
              </Button>
            )}
          </h3>
          <form action={handleFormSubmit} className="space-y-4">
            
            <input type="hidden" name="id" value={editingEvent?.id || ''} />
            <input type="hidden" name="date" value={format(selectedDate, 'yyyy-MM-dd')} />
            {formState.sharedWith.map(uid => (
              <input type="hidden" name="sharedWith" value={uid} key={uid} />
            ))}
            
            <input type="hidden" name="ownerUid" value={userProfile?.uid || ''} />
            
            <div>
              <label htmlFor="title" className="block text-xs font-medium text-muted-foreground mb-1">{t('eventTitle')}</label>
              <input
                required
                type="text"
                id="title"
                name="title"
                value={formState.title}
                onChange={(e) => setFormState({...formState, title: e.target.value})}
                placeholder={t('eventTitlePlaceholder')}
                className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-xs font-medium text-muted-foreground mb-1">{t('description')}</label>
              <textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={(e) => setFormState({...formState, description: e.target.value})}
                placeholder={t('descriptionPlaceholder')}
                className="w-full h-20 px-3 py-2 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">{t('colorLabel')}</label>
              <div className="flex gap-3">
                {['blue', 'red', 'green', 'purple', 'orange'].map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      className="peer sr-only"
                      checked={formState.color === color}
                      onChange={() => setFormState({...formState, color: color as CalendarEvent['color']})}
                    />
                    <div className={cn(
                      "w-6 h-6 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-foreground transition-all",
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

            {friendsProfiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Share with friends</label>
                <div className="flex flex-wrap gap-2">
                  {friendsProfiles.map(friend => (
                    <div key={friend.uid} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`share-${friend.uid}`}
                        checked={formState.sharedWith.includes(friend.uid)}
                        onChange={() => handleShareToggle(friend.uid)}
                        className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <label htmlFor={`share-${friend.uid}`} className="text-sm text-muted-foreground">
                        {friend.displayName || friend.email}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingEvent ? t('save') : t('addEvent'))}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}