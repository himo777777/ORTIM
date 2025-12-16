import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlgorithms, useAlgorithm } from '@/hooks/useAlgorithm';
import { AlgorithmViewer, AlgorithmCard } from '@/components/algorithm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, GitBranch, Search, AlertTriangle } from 'lucide-react';

export default function AlgorithmsPage() {
  const { algorithmId } = useParams<{ algorithmId: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  // If viewing a specific algorithm
  if (algorithmId) {
    return <AlgorithmDetail algorithmId={algorithmId} />;
  }

  // List view
  return <AlgorithmsList searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
}

function AlgorithmsList({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const { data: algorithms, isLoading, error } = useAlgorithms();

  const filteredAlgorithms = algorithms?.filter(
    (algo) =>
      algo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Kunde inte ladda algoritmer</h1>
        <p className="text-muted-foreground">
          Något gick fel. Försök igen senare.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-primary" />
            Kliniska Algoritmer
          </h1>
          <p className="text-muted-foreground mt-1">
            Interaktiva beslutsträd för klinisk handläggning
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök algoritmer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Algorithms Grid */}
      {filteredAlgorithms && filteredAlgorithms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAlgorithms.map((algorithm) => (
            <AlgorithmCard
              key={algorithm.id}
              id={algorithm.id}
              code={algorithm.code}
              title={algorithm.title}
              description={algorithm.description ?? undefined}
              relatedChapterTitle={undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inga algoritmer hittades</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? `Inga algoritmer matchar "${searchQuery}"`
              : 'Det finns inga algoritmer tillgängliga ännu.'}
          </p>
        </div>
      )}
    </div>
  );
}

function AlgorithmDetail({ algorithmId }: { algorithmId: string }) {
  const navigate = useNavigate();
  const { data: algorithm, isLoading, error } = useAlgorithm(algorithmId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (error || !algorithm) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Algoritmen hittades inte</h1>
        <p className="text-muted-foreground mb-6">
          Den begärda algoritmen kunde inte hittas.
        </p>
        <Button onClick={() => navigate('/algorithms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till algoritmer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/algorithms')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Alla algoritmer
      </Button>

      <AlgorithmViewer
        id={algorithm.id}
        title={algorithm.title}
        description={algorithm.description ?? undefined}
        svgContent={algorithm.svgContent}
        relatedChapterId={undefined}
      />
    </div>
  );
}
