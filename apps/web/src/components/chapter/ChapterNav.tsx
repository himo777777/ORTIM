import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChapterInfo {
  id: string;
  title: string;
}

interface ChapterNavProps {
  previousChapter?: ChapterInfo;
  nextChapter?: ChapterInfo;
}

export function ChapterNav({ previousChapter, nextChapter }: ChapterNavProps) {
  return (
    <div className="flex items-stretch gap-4 py-6 border-t">
      {previousChapter ? (
        <Link
          to={`/chapter/${previousChapter.id}`}
          className={cn(
            'flex-1 group flex items-center gap-3 p-4 rounded-lg border',
            'hover:bg-accent hover:border-accent transition-colors'
          )}
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <div className="text-left">
            <span className="text-xs text-muted-foreground">Föregående kapitel</span>
            <p className="font-medium line-clamp-1">{previousChapter.title}</p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {nextChapter ? (
        <Link
          to={`/chapter/${nextChapter.id}`}
          className={cn(
            'flex-1 group flex items-center justify-end gap-3 p-4 rounded-lg border',
            'hover:bg-accent hover:border-accent transition-colors'
          )}
        >
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Nästa kapitel</span>
            <p className="font-medium line-clamp-1">{nextChapter.title}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
