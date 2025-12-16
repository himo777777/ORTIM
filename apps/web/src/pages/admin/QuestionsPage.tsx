import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminQuestions, useDeleteQuestion } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  HelpCircle,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BLOOM_LEVELS = [
  { value: 'KNOWLEDGE', label: 'Kunskap' },
  { value: 'COMPREHENSION', label: 'Förståelse' },
  { value: 'APPLICATION', label: 'Tillämpning' },
  { value: 'ANALYSIS', label: 'Analys' },
  { value: 'SYNTHESIS', label: 'Syntes' },
];

export default function QuestionsPage() {
  const [search, setSearch] = useState('');
  const [bloomFilter, setBloomFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [viewingQuestion, setViewingQuestion] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<{ id: string; code: string } | null>(null);

  const { data, isLoading } = useAdminQuestions({
    skip: page * 20,
    take: 20,
    search: search || undefined,
    bloomLevel: bloomFilter || undefined,
  });

  const deleteQuestion = useDeleteQuestion();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteQuestion.mutateAsync(deletingQuestion.id);
      setDeletingQuestion(null);
      toast({ title: 'Fråga borttagen' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kunde inte ta bort frågan';
      toast({ title: 'Fel', description: message, variant: 'destructive' });
    }
  };

  const viewedQuestion = viewingQuestion
    ? data?.questions.find((q) => q.id === viewingQuestion)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till admin
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            Frågebank
          </h1>
          <p className="text-muted-foreground mt-1">
            {data?.total || 0} frågor totalt
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Ny fråga
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök frågor..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={bloomFilter} onValueChange={(v) => { setBloomFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alla nivåer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alla nivåer</SelectItem>
            {BLOOM_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Questions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead className="w-[40%]">Fråga</TableHead>
                  <TableHead>Bloom</TableHead>
                  <TableHead>Kapitel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Inga frågor hittades
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-mono text-sm">
                        {question.questionCode}
                      </TableCell>
                      <TableCell>
                        <p className="line-clamp-2 text-sm">
                          {question.questionText}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BLOOM_LEVELS.find((l) => l.value === question.bloomLevel)?.label || question.bloomLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {question.chapter?.title || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {question.isActive ? (
                            <Badge variant="default" className="bg-green-500">Aktiv</Badge>
                          ) : (
                            <Badge variant="secondary">Inaktiv</Badge>
                          )}
                          {question.isExamQuestion && (
                            <Badge variant="outline">Examen</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingQuestion(question.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingQuestion({ id: question.id, code: question.questionCode })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Visar {page * 20 + 1} - {Math.min((page + 1) * 20, data.total)} av {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Föregående
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * 20 >= data.total}
              onClick={() => setPage(p => p + 1)}
            >
              Nästa
            </Button>
          </div>
        </div>
      )}

      {/* Question Preview Dialog */}
      <AlertDialog open={!!viewingQuestion} onOpenChange={() => setViewingQuestion(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="font-mono text-sm">{viewedQuestion?.questionCode}</span>
              {viewedQuestion?.isExamQuestion && <Badge>Examensfråga</Badge>}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p className="text-foreground text-base">{viewedQuestion?.questionText}</p>

                <div className="space-y-2">
                  <p className="font-medium text-foreground">Svarsalternativ:</p>
                  {viewedQuestion?.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 p-2 rounded ${opt.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/50'
                        }`}
                    >
                      {opt.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-medium">{opt.optionLabel}.</span>
                      <span>{opt.optionText}</span>
                    </div>
                  ))}
                </div>

                {viewedQuestion?.explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="font-medium text-foreground mb-1">Förklaring:</p>
                    <p className="text-sm">{viewedQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stäng</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuestion} onOpenChange={() => setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort fråga?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort fråga {deletingQuestion?.code}? Detta går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteQuestion.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Ta bort'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
