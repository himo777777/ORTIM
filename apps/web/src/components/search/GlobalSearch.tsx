import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, HelpCircle, GitBranch, Command } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChapterList } from '@/hooks/useCourse';
import { useAlgorithms } from '@/hooks/useAlgorithm';

interface SearchResult {
  id: string;
  type: 'chapter' | 'quiz' | 'algorithm';
  title: string;
  description?: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  const { data: chapters } = useChapterList();
  const { data: algorithms } = useAlgorithms();

  // Search logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = debouncedQuery.toLowerCase();

    // Search chapters
    if (chapters) {
      chapters.forEach((chapter: { id: string; title: string; slug: string; partTitle?: string }) => {
        if (
          chapter.title.toLowerCase().includes(lowerQuery) ||
          chapter.slug.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: chapter.id,
            type: 'chapter',
            title: chapter.title,
            description: chapter.partTitle || undefined,
            url: `/chapter/${chapter.slug}`,
          });
        }
      });
    }

    // Search algorithms
    if (algorithms) {
      algorithms.forEach((algo) => {
        if (
          algo.title.toLowerCase().includes(lowerQuery) ||
          algo.code.toLowerCase().includes(lowerQuery) ||
          algo.description?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: algo.id,
            type: 'algorithm',
            title: algo.title,
            description: algo.description ?? undefined,
            url: `/algorithms?code=${algo.code}`,
          });
        }
      });
    }

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [debouncedQuery, chapters, algorithms]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    },
    [results, selectedIndex, onOpenChange]
  );

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery('');
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'chapter':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'algorithm':
        return <GitBranch className="h-4 w-4" />;
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Sök</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sök kapitel, algoritmer..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <ScrollArea className="max-h-80">
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <div className="text-muted-foreground">{getIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    {result.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {result.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {result.type === 'chapter'
                      ? 'Kapitel'
                      : result.type === 'algorithm'
                        ? 'Algoritm'
                        : 'Quiz'}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {query && results.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Inga resultat för "{query}"</p>
          </div>
        )}

        {!query && (
          <div className="p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Tips:</p>
            <ul className="space-y-1">
              <li>• Sök efter kapitelnamn</li>
              <li>• Sök efter algoritmkoder (ex: "ATLS")</li>
              <li>
                • Använd <kbd className="px-1 rounded bg-muted">↑</kbd>{' '}
                <kbd className="px-1 rounded bg-muted">↓</kbd> för att navigera
              </li>
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Search trigger button
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClick();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClick]);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline text-sm">Sök...</span>
      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}
