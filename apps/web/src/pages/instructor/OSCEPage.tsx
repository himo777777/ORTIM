import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useCohort,
  useCohortParticipants,
  useOsceAssessments,
  useCreateOsceAssessment,
  useUpdateOsceAssessment,
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
  ClipboardCheck,
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

export default function OSCEPage() {
  const { id: cohortId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedEnrollmentId = searchParams.get('participant');
  const [currentEnrollmentId, setCurrentEnrollmentId] = useState<string>(selectedEnrollmentId || '');

  const { data: cohort, isLoading: cohortLoading } = useCohort(cohortId || '');
  const { data: participants, isLoading: participantsLoading } = useCohortParticipants(cohortId || '');
  const { data: assessments, isLoading: assessmentsLoading } = useOsceAssessments(currentEnrollmentId);
  const createAssessment = useCreateOsceAssessment();
  const updateAssessment = useUpdateOsceAssessment();

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

  if (cohortLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!cohort) {
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

  // Calculate overall OSCE status from assessments
  const getOverallStatus = () => {
    if (!assessments || assessments.length === 0) return 'pending';
    if (assessments.length < 5) return 'in_progress';
    const allPassed = assessments.every((a: ApiOsceAssessment) => a.passed);
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

  // Calculate total score
  const totalScore = assessments?.reduce((sum: number, a: ApiOsceAssessment) => sum + (a.score || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/instructor/cohorts/${cohortId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka till {cohort.name}
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          OSCE-bedömning
        </h1>
        <p className="text-muted-foreground mt-1">
          {cohort.name} - Objective Structured Clinical Examination
        </p>
      </div>

      {/* Participant Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Välj deltagare
          </CardTitle>
          <CardDescription>
            Välj en deltagare att bedöma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participantsLoading ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : (
            <Select
              value={currentEnrollmentId}
              onValueChange={handleParticipantChange}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Välj deltagare..." />
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
          <Card>
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
                      Godkänd OSCE
                    </Badge>
                  )}
                  {overallStatus === 'failed' && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Underkänd OSCE
                    </Badge>
                  )}
                  {overallStatus === 'in_progress' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pågående ({assessments?.length || 0}/5 stationer)
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
                  <span className="text-muted-foreground">Kapitelframsteg:</span>
                  <span className="ml-2 font-medium">{selectedParticipant.progress.percentage}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kapitel klara:</span>
                  <span className="ml-2 font-medium">
                    {selectedParticipant.progress.chaptersCompleted}/{selectedParticipant.progress.totalChapters}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stationer bedömda:</span>
                  <span className="ml-2 font-medium">{assessments?.length || 0} av 5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total poäng:</span>
                  <span className="ml-2 font-medium">{totalScore}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Form */}
          {assessmentsLoading ? (
            <Skeleton className="h-[600px]" />
          ) : (
            <OsceAssessmentForm
              enrollmentId={currentEnrollmentId}
              participantName={`${selectedParticipant.user.firstName} ${selectedParticipant.user.lastName}`}
              existingAssessments={assessments || []}
              onSubmit={handleSaveAssessment}
              isSubmitting={createAssessment.isPending || updateAssessment.isPending}
            />
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Välj en deltagare</h3>
              <p className="text-muted-foreground">
                Välj en deltagare ovan för att påbörja eller fortsätta OSCE-bedömningen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
