import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCohorts,
  usePilotResults,
  useCohortEPAAssessments,
} from '@/hooks/useInstructor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Star,
  BookOpen,
  Activity,
  Target,
  TrendingUp,
  FileDown,
  ClipboardList,
} from 'lucide-react';

// Kirkpatrick level descriptions
const KIRKPATRICK_LEVELS = {
  REACTION: { label: 'Reaktion', description: 'Deltagarnas nöjdhet', icon: Star },
  LEARNING: { label: 'Lärande', description: 'Kunskapsinhämtning', icon: BookOpen },
  BEHAVIOR: { label: 'Beteende', description: 'Beteendeförändring', icon: Activity },
  RESULTS: { label: 'Resultat', description: 'Organisatoriska resultat', icon: Target },
};

export default function PilotResultsPage() {
  const navigate = useNavigate();
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  // Queries
  const { data: cohorts } = useCohorts();
  const { data: pilotResults, isLoading: resultsLoading } = usePilotResults(
    selectedCohort !== 'all' ? selectedCohort : undefined
  );
  const { data: epaData, isLoading: epaLoading } = useCohortEPAAssessments(
    selectedCohort !== 'all' ? selectedCohort : ''
  );

  const exportToCSV = () => {
    if (!pilotResults) return;

    // Create CSV content
    const headers = ['Nivå', 'Typ', 'Antal', 'Genomsnitt'];
    const rows = [
      ['Reaktion', 'Nöjdhet', pilotResults.summary.reactionCount.toString(), pilotResults.summary.averageSatisfaction?.toFixed(2) || 'N/A'],
      ['Lärande', 'Kunskapstest', pilotResults.summary.learningCount.toString(), 'N/A'],
      ['Beteende', 'Audit', pilotResults.summary.behaviorCount.toString(), 'N/A'],
      ['Resultat', 'Process', pilotResults.summary.resultsCount.toString(), 'N/A'],
    ];

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pilot-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/instructor')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka till instruktör
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Pilotresultat
          </h1>
          <p className="text-muted-foreground mt-1">
            Kirkpatrick-utvärdering och EPA-sammanställning
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Välj kohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla kohorter</SelectItem>
              {cohorts?.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deltagare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {pilotResults?.summary.totalParticipants || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              utvärderade deltagare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nöjdhet</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {pilotResults?.summary.averageSatisfaction?.toFixed(1) || 'N/A'}
                <span className="text-sm font-normal text-muted-foreground">/5</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              genomsnittlig nöjdhet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reaktionssvar</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {pilotResults?.summary.reactionCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Kirkpatrick nivå 1
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lärande</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {pilotResults?.summary.learningCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Kirkpatrick nivå 2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kirkpatrick Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Kirkpatrick-utvärdering</CardTitle>
          <CardDescription>
            Fyra nivåer av kursutvärdering enligt Kirkpatrick-modellen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(KIRKPATRICK_LEVELS).map(([key, level]) => {
              const Icon = level.icon;
              const count = pilotResults?.summary[`${key.toLowerCase()}Count` as keyof typeof pilotResults.summary] || 0;
              const assessments = pilotResults?.assessments[key] || [];

              return (
                <div
                  key={key}
                  className="p-4 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {level.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={Number(count) > 0 ? 'default' : 'secondary'}>
                      {String(count)} svar
                    </Badge>
                  </div>

                  {key === 'REACTION' && pilotResults?.summary.averageSatisfaction && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Genomsnittlig nöjdhet</span>
                        <span className="font-medium">
                          {pilotResults.summary.averageSatisfaction.toFixed(1)}/5
                        </span>
                      </div>
                      <Progress
                        value={(pilotResults.summary.averageSatisfaction / 5) * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  {assessments.length > 0 && key !== 'REACTION' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Senaste: {new Date(assessments[0].assessedAt).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* EPA Summary (if cohort selected) */}
      {selectedCohort !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              EPA-sammanställning
            </CardTitle>
            <CardDescription>
              Entrustable Professional Activities per deltagare
            </CardDescription>
          </CardHeader>
          <CardContent>
            {epaLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : epaData?.participants && epaData.participants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deltagare</TableHead>
                    <TableHead className="text-center">EPAs bedömda</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="text-center">Genomsnittlig nivå</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epaData.participants.map((participant) => {
                    const avgLevel = participant.assessments.length > 0
                      ? participant.assessments.reduce((sum, a) => sum + a.entrustmentLevel, 0) / participant.assessments.length
                      : 0;

                    return (
                      <TableRow key={participant.userId}>
                        <TableCell className="font-medium">
                          {participant.firstName} {participant.lastName}
                        </TableCell>
                        <TableCell className="text-center">
                          {participant.completedEPAs} / {participant.totalEPAs}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(participant.completedEPAs / participant.totalEPAs) * 100}
                              className="h-2 flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {Math.round((participant.completedEPAs / participant.totalEPAs) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {avgLevel > 0 ? (
                            <Badge variant={avgLevel >= 3 ? 'default' : 'secondary'}>
                              Nivå {avgLevel.toFixed(1)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ingen EPA-data tillgänglig för denna kohort.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Evaluations */}
      {pilotResults?.assessments.REACTION && pilotResults.assessments.REACTION.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Senaste utvärderingar</CardTitle>
            <CardDescription>
              De senaste kursutvärderingarna (Kirkpatrick Nivå 1)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-center">Betyg</TableHead>
                  <TableHead>Kommentar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pilotResults.assessments.REACTION.slice(0, 10).map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(assessment.assessedAt).toLocaleDateString('sv-SE')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{assessment.assessmentType}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {assessment.score !== null ? (
                        <span className="font-medium">
                          {assessment.score.toFixed(1)}/{assessment.maxScore || 5}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {assessment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
