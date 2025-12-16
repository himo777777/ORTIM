import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCohort, useCohortParticipants, useCohortStats } from '@/hooks/useInstructor';
import { ParticipantTable } from '@/components/instructor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  BookOpen,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  Settings,
  FileDown,
} from 'lucide-react';

export default function CohortDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cohort, isLoading: cohortLoading, error: cohortError } = useCohort(id || '');
  const { data: participants, isLoading: participantsLoading } = useCohortParticipants(id || '');
  const { data: stats, isLoading: statsLoading } = useCohortStats(id || '');

  if (cohortLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (cohortError || !cohort) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Kohorten hittades inte</h1>
        <p className="text-muted-foreground mb-6">
          Den begärda kohorten kunde inte hittas.
        </p>
        <Button onClick={() => navigate('/instructor/cohorts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till kohorter
        </Button>
      </div>
    );
  }

  // Calculate OSCE stats from participants
  const osceStats = participants?.reduce(
    (acc, p) => ({
      completed: acc.completed + (p.osce.completed === p.osce.total ? 1 : 0),
      passed: acc.passed + (p.osce.passed === p.osce.total ? 1 : 0),
    }),
    { completed: 0, passed: 0 }
  ) || { completed: 0, passed: 0 };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/instructor/cohorts')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Alla kohorter
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{cohort.name}</h1>
            <Badge variant={cohort.isActive ? 'default' : 'secondary'}>
              {cohort.isActive ? 'Aktiv' : 'Avslutad'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(cohort.startDate).toLocaleDateString('sv-SE')}
              {cohort.endDate && ` - ${new Date(cohort.endDate).toLocaleDateString('sv-SE')}`}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Inställningar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deltagare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                stats?.totalParticipants || cohort.enrollments.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              registrerade deltagare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kapitel klara</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                `${stats?.averageProgress || 0}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              genomsnittlig progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OSCE genomförda</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participantsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                osceStats.completed
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              av {stats?.totalParticipants || participants?.length || 0} deltagare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Godkänd OSCE</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {participantsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                osceStats.passed
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {osceStats.completed > 0
                ? `${Math.round((osceStats.passed / osceStats.completed) * 100)}% godkända`
                : 'Inga bedömda'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Deltagare
            </CardTitle>
            <Link to={`/instructor/cohorts/${id}/osce`}>
              <Button size="sm">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                OSCE-bedömning
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {participantsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : participants && participants.length > 0 ? (
            <ParticipantTable
              participants={participants}
              cohortId={id || ''}
            />
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga deltagare ännu</h3>
              <p className="text-muted-foreground">
                Deltagare som registreras i denna kohort visas här.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
