'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { 
  Folder, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ArrowLeft,
  Save,
  Loader2,
  Edit2,
  Search,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SecretItem } from '@/lib/db';
import { createSecretItem, updateNoteContent, deleteSecretItem, renameSecretItem } from '@/app/actions';
import { useLanguage } from '@/lib/i18n-context';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

interface SecretViewProps {
  items: SecretItem[];
}

export function SecretView({ items }: SecretViewProps) {
  const { t, dateLocale } = useLanguage();
  const { addToast } = useToast();
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [noteContent, setNoteContent] = React.useState('');
  
  // View State
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
  // Search State
  const [searchQuery, setSearchQuery] = React.useState('');

  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createType, setCreateType] = React.useState<'folder' | 'note'>('folder');
  const [newName, setNewName] = React.useState('');
  
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [itemToRename, setItemToRename] = React.useState<SecretItem | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<SecretItem | null>(null);

  // Derived state
  const isSearching = searchQuery.length > 0;
  
  // Filter and Sort items
  const currentItems = React.useMemo(() => {
    let filtered = [];
    if (isSearching) {
      filtered = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      filtered = items.filter(item => item.parentId === currentFolderId);
    }

    // Sort: Folders first, then alphabetical
    return filtered.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
  }, [items, currentFolderId, searchQuery, isSearching]);

  const breadcrumbs = React.useMemo(() => {
    if (isSearching) return [];
    const path = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = items.find(i => i.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  }, [currentFolderId, items, isSearching]);

  // Handlers for Dialogs
  const openCreateDialog = (type: 'folder' | 'note') => {
    setCreateType(type);
    setNewName('');
    setCreateDialogOpen(true);
  };

  const openRenameDialog = (item: SecretItem) => {
    setItemToRename(item);
    setNewName(item.name);
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (item: SecretItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    startTransition(async () => {
      await createSecretItem(currentFolderId, createType, newName);
      setCreateDialogOpen(false);
      addToast(`${createType === 'folder' ? t('folder') : t('note')} created`, 'success');
    });
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !itemToRename) return;

    if (newName !== itemToRename.name) {
      startTransition(async () => {
        await renameSecretItem(itemToRename.id, newName);
        setRenameDialogOpen(false);
        addToast('Item renamed', 'success');
      });
    } else {
      setRenameDialogOpen(false);
    }
  };

  const handleDeleteSubmit = () => {
    if (!itemToDelete) return;
    startTransition(async () => {
      await deleteSecretItem(itemToDelete.id);
      if (editingNoteId === itemToDelete.id) {
         setEditingNoteId(null);
      }
      setDeleteDialogOpen(false);
      addToast('Item deleted', 'error');
    });
  };

  const handleItemClick = (item: SecretItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id);
      setSearchQuery(''); // Clear search when entering folder
    } else {
      setEditingNoteId(item.id);
      setNoteContent(item.content || '');
    }
  };

  const handleSaveNote = () => {
    if (editingNoteId) {
      startTransition(async () => {
        await updateNoteContent(editingNoteId, noteContent);
        addToast('Note saved', 'success');
      });
    }
  };

  if (editingNoteId) {
    const note = items.find(i => i.id === editingNoteId);
    if (!note) return null; // Should handle error

    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-8 h-[calc(100vh-65px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setEditingNoteId(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {note.name}
            </h2>
          </div>
          <Button onClick={handleSaveNote} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
        <textarea 
          className="flex-1 w-full p-4 rounded-xl border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm leading-relaxed"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Start typing..."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
             {t('secretSpace')}
          </h2>
          
          {/* Breadcrumbs */}
          {!isSearching && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto pb-2">
              <button 
                 onClick={() => setCurrentFolderId(null)}
                 className={cn("hover:text-primary transition-colors", !currentFolderId && "font-bold text-primary")}
              >
                {t('root')}
              </button>
              {breadcrumbs.map((folder) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  <button 
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={cn("hover:text-primary transition-colors whitespace-nowrap", folder.id === currentFolderId && "font-bold text-primary")}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar: Search + Create + ViewToggle */}
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder={t('searchPlaceholder')} 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full sm:w-64 h-10 pl-9 pr-8 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
             />
             {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
               >
                 <X className="w-3 h-3" />
               </button>
             )}
           </div>
           
           <div className="flex items-center gap-2">
             {/* View Toggle */}
             <div className="flex bg-muted p-1 rounded-md">
               <button
                 onClick={() => setViewMode('grid')}
                 className={cn("p-1.5 rounded-sm transition-all", viewMode === 'grid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                 title={t('gridView')}
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
               <button
                 onClick={() => setViewMode('list')}
                 className={cn("p-1.5 rounded-sm transition-all", viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                 title={t('listView')}
               >
                 <List className="w-4 h-4" />
               </button>
             </div>

             {!isSearching && (
               <div className="flex gap-2">
                 <Button onClick={() => openCreateDialog('folder')} variant="outline" size="icon" title={t('createFolder')}>
                   <Plus className="w-4 h-4" />
                 </Button>
                 <Button onClick={() => openCreateDialog('note')} variant="outline" size="icon" title={t('createNote')}>
                   <FileText className="w-4 h-4" />
                 </Button>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentItems.length === 0 ? (
             <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
               {isSearching ? 'No results found.' : 'Empty folder'}
             </div>
          ) : (
             currentItems.map((item) => (
               <div 
                 key={item.id}
                 className="group relative flex flex-col items-center justify-center p-6 rounded-xl border bg-card hover:bg-muted/50 transition-all cursor-pointer aspect-square"
                 onClick={() => handleItemClick(item)}
               >
                 {item.type === 'folder' ? (
                   <Folder className="w-12 h-12 text-yellow-500 mb-3" />
                 ) : (
                   <FileText className="w-12 h-12 text-blue-500 mb-3" />
                 )}
                 <span className="text-sm font-medium text-center break-all line-clamp-2">
                   {item.name}
                 </span>
                 
                 {/* Hover Actions */}
                 <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       openRenameDialog(item);
                     }}
                     className="p-1.5 text-muted-foreground hover:text-primary hover:bg-background rounded-full transition-all shadow-sm"
                     title={t('rename')}
                   >
                     <Edit2 className="w-3 h-3" />
                   </button>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       openDeleteDialog(item);
                     }}
                     className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-background rounded-full transition-all shadow-sm"
                     title={t('delete')}
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </div>
               </div>
             ))
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 pl-6">{t('name')}</th>
                <th className="px-4 py-3 w-32">{t('fileType')}</th>
                <th className="px-4 py-3 w-48">{t('dateModified')}</th>
                <th className="px-4 py-3 w-20 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    {isSearching ? 'No results found.' : 'Empty folder'}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <td className="px-4 py-3 pl-6">
                      <div className="flex items-center gap-3">
                        {item.type === 'folder' ? (
                          <Folder className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-500" />
                        )}
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {t(item.type)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(item.updatedAt), 'PP p', { locale: dateLocale })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openRenameDialog(item);
                          }}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title={t('rename')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(item);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      
      {/* Create Dialog */}
      <Dialog 
        isOpen={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        title={createType === 'folder' ? t('createFolder') : t('createNote')}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('name')}</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !newName.trim()}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('confirm')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog 
        isOpen={renameDialogOpen} 
        onClose={() => setRenameDialogOpen(false)} 
        title={t('rename')}
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('name')}</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full h-10 px-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRenameDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !newName.trim()}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('confirm')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog 
        isOpen={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        title={t('delete')}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('confirmDelete')}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}