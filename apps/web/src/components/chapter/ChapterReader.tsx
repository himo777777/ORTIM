import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChapterNav } from './ChapterNav';
import { LearningObjectives } from './LearningObjectives';
import { db } from '@/lib/db';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ListChecks,
  Clock,
} from 'lucide-react';

interface LearningObjective {
  id: string;
  code: string;
  description: string;
  completed?: boolean;
}

interface ChapterReaderProps {
  chapterId: string;
  chapterNumber: number;
  title: string;
  content: string;
  learningObjectives: LearningObjective[];
  estimatedReadTime: number;
  previousChapter?: { id: string; title: string };
  nextChapter?: { id: string; title: string };
  onComplete: () => void;
}

export function ChapterReader({
  chapterId,
  chapterNumber,
  title,
  content,
  learningObjectives,
  estimatedReadTime,
  previousChapter,
  nextChapter,
  onComplete,
}: ChapterReaderProps) {
  const navigate = useNavigate();
  const [readProgress, setReadProgress] = useState(0);
  const [showObjectives, setShowObjectives] = useState(false);
  const [completedObjectives, setCompletedObjectives] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
      setReadProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save progress when leaving
  useEffect(() => {
    return () => {
      db.updateProgress(chapterId, {
        readProgress,
        quizPassed: readProgress >= 90,
      }).catch(console.error);
    };
  }, [chapterId, readProgress]);

  const handleObjectiveToggle = (objectiveId: string) => {
    const newCompleted = new Set(completedObjectives);
    if (newCompleted.has(objectiveId)) {
      newCompleted.delete(objectiveId);
    } else {
      newCompleted.add(objectiveId);
    }
    setCompletedObjectives(newCompleted);
  };

  const handleComplete = () => {
    db.updateProgress(chapterId, {
      readProgress: 100,
      quizPassed: true,
    }).catch(console.error);
    onComplete();
  };

  const allObjectivesCompleted =
    completedObjectives.size === learningObjectives.length && learningObjectives.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur border-b pb-4 mb-6 -mx-6 px-6 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
              {chapterNumber}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {estimatedReadTime} min
                </span>
                <span className="flex items-center gap-1">
                  <ListChecks className="h-4 w-4" />
                  {learningObjectives.length} lärandemål
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowObjectives(!showObjectives)}
          >
            <ListChecks className="h-4 w-4 mr-2" />
            Lärandemål
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <Progress value={readProgress} className="h-1 flex-1" />
          <span className="text-xs text-muted-foreground">{readProgress}%</span>
        </div>
      </div>

      {/* Learning Objectives Panel */}
      {showObjectives && (
        <LearningObjectives
          objectives={learningObjectives}
          completedIds={completedObjectives}
          onToggle={handleObjectiveToggle}
          onClose={() => setShowObjectives(false)}
        />
      )}

      {/* Content */}
      <article className="prose prose-slate dark:prose-invert max-w-none mb-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-foreground/90">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                {children}
              </blockquote>
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <code className={cn('block', className)} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-4 py-2">{children}</td>
            ),
            img: ({ src, alt }) => (
              <figure className="my-6">
                <img
                  src={src}
                  alt={alt || ''}
                  className="rounded-lg shadow-md max-w-full h-auto mx-auto"
                />
                {alt && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-2">
                    {alt}
                  </figcaption>
                )}
              </figure>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      {/* Completion Section */}
      {readProgress >= 80 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
              Bra jobbat!
            </h3>
          </div>
          <p className="text-green-700 dark:text-green-200 mb-4">
            Du har läst igenom kapitlet. Markera det som slutfört när du känner dig redo.
          </p>
          {learningObjectives.length > 0 && !allObjectivesCompleted && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              Tips: Gå igenom lärandemålen för att säkerställa att du förstått allt.
            </p>
          )}
          <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Markera som slutfört
          </Button>
        </div>
      )}

      {/* Chapter Navigation */}
      <ChapterNav
        previousChapter={previousChapter}
        nextChapter={nextChapter}
      />
    </div>
  );
}
