import { useState } from 'react';
import { Bookmark, BookmarkCheck, Trash2, ExternalLink, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudyStore, Bookmark as BookmarkType } from '@/stores/studyStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface BookmarkPanelProps {
  className?: string;
}

export function BookmarkPanel({ className }: BookmarkPanelProps) {
  const { bookmarks, removeBookmark } = useStudyStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || bookmark.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedBookmarks = filteredBookmarks.reduce(
    (acc, bookmark) => {
      const type = bookmark.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(bookmark);
      return acc;
    },
    {} as Record<string, BookmarkType[]>
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chapter':
        return 'Kapitel';
      case 'algorithm':
        return 'Algoritmer';
      case 'quiz':
        return 'Quiz';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return '📖';
      case 'algorithm':
        return '🔄';
      case 'quiz':
        return '❓';
      default:
        return '📌';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bookmark className="h-5 w-5" />
          {bookmarks.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {bookmarks.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Bokmärken
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök bokmärken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                  Alla typer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('chapter')}>
                  📖 Kapitel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('algorithm')}>
                  🔄 Algoritmer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('quiz')}>
                  ❓ Quiz
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bookmarks list */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookmarkCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  {bookmarks.length === 0
                    ? 'Inga bokmärken ännu'
                    : 'Inga matchande bokmärken'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Klicka på bokmärkesikonen på en sida för att spara den
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedBookmarks).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <span>{getTypeIcon(type)}</span>
                      {getTypeLabel(type)}
                      <span className="text-xs">({items.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {items.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="group flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <a
                              href={bookmark.url}
                              className="font-medium text-sm hover:underline line-clamp-1"
                            >
                              {bookmark.title}
                            </a>
                            {bookmark.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {bookmark.description}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(bookmark.createdAt), {
                                addSuffix: true,
                                locale: sv,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              asChild
                            >
                              <a href={bookmark.url}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeBookmark(bookmark.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Bookmark button for individual pages
interface BookmarkButtonProps {
  contentId: string;
  contentType: 'chapter' | 'algorithm' | 'quiz';
  title: string;
  description?: string;
  url?: string;
  className?: string;
}

export function BookmarkButton({
  contentId,
  contentType,
  title,
  description,
  url,
  className,
}: BookmarkButtonProps) {
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useStudyStore();

  const bookmarked = isBookmarked(contentId);
  const bookmark = bookmarks.find((b) => b.contentId === contentId);

  const handleToggle = () => {
    if (bookmarked && bookmark) {
      removeBookmark(bookmark.id);
    } else {
      addBookmark({
        contentId,
        type: contentType,
        title,
        description,
        url: url || window.location.pathname,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(
        bookmarked && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-5 w-5 fill-current" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  );
}
