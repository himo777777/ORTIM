import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useCohorts,
  useCohortParticipants,
  useOsceAssessments,
  useCreateOsceAssessment,
  useUpdateOsceAssessment,
  useOSCEStations,
} from '@/hooks/useInstructor';
import { OsceAssessmentForm } from '@/components/instructor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  GraduationCap,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// Type matching the API response
interface ApiOsceAssessment {
  id: string;
  stationNumber: number;
  stationName: string;
  passed: boolean;
  score: number | null;
  comments: string | null;
  assessedAt: string;
  assessor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function TTTOSCEPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedEnrollmentId = searchParams.get('participant');
  const [currentEnrollmentId, setCurrentEnrollmentId] = useState<string>(selectedEnrollmentId || '');

  // Fetch all cohorts and find the TTT cohort
  const { data: cohorts, isLoading: cohortsLoading } = useCohorts();
  const tttCohort = cohorts?.find(c => c.course?.code === 'ORTAC-TTT-2025');

  const { data: participants, isLoading: participantsLoading } = useCohortParticipants(tttCohort?.id || '');
  const { data: assessments, isLoading: assessmentsLoading } = useOsceAssessments(currentEnrollmentId);
  const { data: allStations, isLoading: stationsLoading } = useOSCEStations();
  const createAssessment = useCreateOsceAssessment();
  const updateAssessment = useUpdateOsceAssessment();

  // Filter TTT stations only (code starts with 'OSCE-TTT-')
  const tttStations = allStations?.filter(s => s.code.startsWith('OSCE-TTT-')) || [];

  // Find selected participant by enrollmentId
  const selectedParticipant = participants?.find(p => p.enrollmentId === currentEnrollmentId);

  // Update URL when participant changes
  const handleParticipantChange = (enrollmentId: string) => {
    setSearchParams({ participant: enrollmentId });
    setCurrentEnrollmentId(enrollmentId);
  };

  // Sync state when URL changes
  useEffect(() => {
    if (selectedEnrollmentId && selectedEnrollmentId !== currentEnrollmentId) {
      setCurrentEnrollmentId(selectedEnrollmentId);
    }
  }, [selectedEnrollmentId, currentEnrollmentId]);

  const handleSaveAssessment = async (data: {
    stationNumber: number;
    stationName: string;
    passed: boolean;
    score?: number;
    comments?: string;
  }) => {
    if (!currentEnrollmentId) return;

    // Check if assessment exists for this station
    const existingAssessment = assessments?.find((a: ApiOsceAssessment) => a.stationNumber === data.stationNumber);

    if (existingAssessment) {
      await updateAssessment.mutateAsync({
        assessmentId: existingAssessment.id,
        enrollmentId: currentEnrollmentId,
        data: {
          passed: data.passed,
          score: data.score,
          comments: data.comments,
        },
      });
    } else {
      await createAssessment.mutateAsync({
        enrollmentId: currentEnrollmentId,
        data: {
          stationNumber: data.stationNumber,
          stationName: data.stationName,
          passed: data.passed,
          score: data.score,
          comments: data.comments,
        },
      });
    }
  };

  if (cohortsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!tttCohort) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Ingen TTT-kohort hittades</h1>
        <p className="text-muted-foreground mb-6">
          Det finns ingen aktiv instruktörsträningskohort (ORTAC-TTT-2025).
        </p>
        <Button onClick={() => navigate('/instructor')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till dashboard
        </Button>
      </div>
    );
  }

  // Calculate overall OSCE status from assessments
  const totalStations = tttStations.length || 4;
  const getOverallStatus = () => {
    if (!assessments || assessments.length === 0) return 'pending';
    // Only count TTT assessments (station numbers 101-104)
    const tttAssessments = assessments.filter((a: ApiOsceAssessment) => a.stationNumber >= 101);
    if (tttAssessments.length < totalStations) return 'in_progress';
    const allPassed = tttAssessments.every((a: ApiOsceAssessment) => a.passed);
    return allPassed ? 'passed' : 'failed';
  };

  const overallStatus = getOverallStatus();

  // Helper to get OSCE status badge for participant
  const getParticipantOsceStatus = (osce: { completed: number; passed: number; total: number }) => {
    if (osce.completed === 0) return null;
    if (osce.passed === osce.total && osce.completed === osce.total) {
      return <Badge variant="default" className="bg-green-500">Godkänd</Badge>;
    }
    if (osce.completed === osce.total && osce.passed < osce.total) {
      return <Badge variant="destructive">Underkänd</Badge>;
    }
    return <Badge variant="secondary">Pågående</Badge>;
  };

  // Calculate total score for TTT assessments
  const tttAssessments = assessments?.filter((a: ApiOsceAssessment) => a.stationNumber >= 101) || [];
  const totalScore = tttAssessments.reduce((sum: number, a: ApiOsceAssessment) => sum + (a.score || 0), 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/instructor')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka till dashboard
      </Button>

      {/* Header with amber styling */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-amber-500" />
          TTT-OSCE Bedömning
        </h1>
        <p className="text-muted-foreground mt-1">
          Bedöm instruktörskandidater - {tttCohort.name}
        </p>
        <Badge className="mt-2 bg-amber-500 text-white">
          Endast för instruktörsutbildning
        </Badge>
      </div>

      {/* Participant Selector */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-500" />
            Välj instruktörskandidat
          </CardTitle>
          <CardDescription>
            Välj en kandidat att bedöma på TTT-stationerna
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participantsLoading ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : participants?.length === 0 ? (
            <p className="text-muted-foreground">
              Inga deltagare är registrerade i TTT-kohorten ännu.
            </p>
          ) : (
            <Select
              value={currentEnrollmentId}
              onValueChange={handleParticipantChange}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Välj instruktörskandidat..." />
              </SelectTrigger>
              <SelectContent>
                {participants?.map((participant) => (
                  <SelectItem key={participant.enrollmentId} value={participant.enrollmentId}>
                    <div className="flex items-center gap-2">
                      <span>{participant.user.firstName} {participant.user.lastName}</span>
                      {getParticipantOsceStatus(participant.osce)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Assessment Section */}
      {selectedParticipant ? (
        <div className="space-y-6">
          {/* Participant Info */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedParticipant.user.firstName} {selectedParticipant.user.lastName}
                  </CardTitle>
                  <CardDescription>{selectedParticipant.user.email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {overallStatus === 'passed' && (
                    <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Godkänd TTT-OSCE
                    </Badge>
                  )}
                  {overallStatus === 'failed' && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Underkänd TTT-OSCE
                    </Badge>
                  )}
                  {overallStatus === 'in_progress' && (
                    <Badge className="bg-amber-500 text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pågående ({tttAssessments.length}/{totalStations} stationer)
                    </Badge>
                  )}
                  {overallStatus === 'pending' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ej påbörjad
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">TTT-kurs framsteg:</span>
                  <span className="ml-2 font-medium">{selectedParticipant.progress.percentage}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kapitel klara:</span>
                  <span className="ml-2 font-medium">
                    {selectedParticipant.progress.chaptersCompleted}/{selectedParticipant.progress.totalChapters}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">TTT-stationer bedömda:</span>
                  <span className="ml-2 font-medium">{tttAssessments.length} av {totalStations}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total poäng:</span>
                  <span className="ml-2 font-medium">{totalScore}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Form - only show TTT stations */}
          {assessmentsLoading || stationsLoading ? (
            <Skeleton className="h-[600px]" />
          ) : (
            <OsceAssessmentForm
              enrollmentId={currentEnrollmentId}
              participantName={`${selectedParticipant.user.firstName} ${selectedParticipant.user.lastName}`}
              existingAssessments={assessments || []}
              stations={tttStations}
              onSubmit={handleSaveAssessment}
              isSubmitting={createAssessment.isPending || updateAssessment.isPending}
            />
          )}
        </div>
      ) : (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Välj en instruktörskandidat</h3>
              <p className="text-muted-foreground">
                Välj en kandidat ovan för att påbörja eller fortsätta TTT-OSCE-bedömningen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
