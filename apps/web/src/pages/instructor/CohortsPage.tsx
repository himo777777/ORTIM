import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCohorts } from '@/hooks/useInstructor';
import { CohortCard } from '@/components/instructor';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Plus, Search, AlertTriangle } from 'lucide-react';

export default function CohortsPage() {
  const { data: cohorts, isLoading, error } = useCohorts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
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
        <h1 className="text-2xl font-bold mb-2">Kunde inte ladda kohorter</h1>
        <p className="text-muted-foreground">
          Något gick fel. Försök igen senare.
        </p>
      </div>
    );
  }

  const filteredCohorts = cohorts?.filter((cohort) => {
    // Filter by status
    if (filter === 'active' && !cohort.isActive) return false;
    if (filter === 'completed' && cohort.isActive) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cohort.name.toLowerCase().includes(query) ||
        cohort.course.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Kohorter
          </h1>
          <p className="text-muted-foreground mt-1">
            Hantera dina kurskohorter och deltagare
          </p>
        </div>
        <Link to="/instructor/cohorts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny kohort
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök kohorter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">Alla</TabsTrigger>
            <TabsTrigger value="active">Aktiva</TabsTrigger>
            <TabsTrigger value="completed">Avslutade</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cohorts grid */}
      {filteredCohorts && filteredCohorts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCohorts.map((cohort) => (
            <CohortCard
              key={cohort.id}
              id={cohort.id}
              name={cohort.name}
              courseName={cohort.course.name}
              courseCode={cohort.course.code}
              startDate={cohort.startDate}
              endDate={cohort.endDate}
              participantCount={cohort._count.enrollments}
              isActive={cohort.isActive}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filter !== 'all'
                ? 'Inga kohorter matchar filtreringen'
                : 'Inga kohorter än'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filter !== 'all'
                ? 'Prova att justera sökningen eller filtret'
                : 'Skapa din första kohort för att komma igång'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link to="/instructor/cohorts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa kohort
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
