import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useCohort,
  useCohortParticipants,
  useEPAList,
  useCohortEPAAssessments,
  useCreateEPAAssessment,
} from '@/hooks/useInstructor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ClipboardList,
  User,
  CheckCircle2,
  Circle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Entrustment level descriptions
const ENTRUSTMENT_LEVELS = [
  { value: 1, label: 'Nivå 1', description: 'Kräver full handledning' },
  { value: 2, label: 'Nivå 2', description: 'Kan utföra med direkt handledning' },
  { value: 3, label: 'Nivå 3', description: 'Kan utföra med indirekt handledning' },
  { value: 4, label: 'Nivå 4', description: 'Kan utföra självständigt' },
  { value: 5, label: 'Nivå 5', description: 'Kan utföra självständigt och handleda andra' },
];

export default function EPAAssessmentPage() {
  const { id: cohortId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedEPA, setSelectedEPA] = useState<string | null>(null);
  const [entrustmentLevel, setEntrustmentLevel] = useState<number>(3);
  const [comments, setComments] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  // Queries
  const { data: cohort, isLoading: cohortLoading } = useCohort(cohortId || '');
  const { data: participants } = useCohortParticipants(cohortId || '');
  const { data: epas, isLoading: epasLoading } = useEPAList();
  const { data: cohortEPAs, isLoading: cohortEPAsLoading } = useCohortEPAAssessments(cohortId || '');
  const createAssessment = useCreateEPAAssessment();

  if (cohortLoading || epasLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Kohorten hittades inte</h1>
        <Button onClick={() => navigate('/instructor/cohorts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till kohorter
        </Button>
      </div>
    );
  }

  const handleOpenAssessment = (participantId: string, epaId: string) => {
    setSelectedParticipant(participantId);
    setSelectedEPA(epaId);
    setEntrustmentLevel(3);
    setComments('');
    setIsDialogOpen(true);
  };

  const handleSubmitAssessment = async () => {
    if (!selectedParticipant || !selectedEPA) return;

    try {
      await createAssessment.mutateAsync({
        participantId: selectedParticipant,
        epaId: selectedEPA,
        entrustmentLevel,
        comments: comments || undefined,
      });

      toast({
        title: 'EPA-bedömning sparad',
        description: 'Bedömningen har registrerats.',
      });

      setIsDialogOpen(false);
    } catch {
      toast({
        title: 'Fel',
        description: 'Kunde inte spara bedömningen. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  const selectedEPAData = epas?.find(e => e.id === selectedEPA);
  const selectedParticipantData = cohortEPAs?.participants.find(p => p.userId === selectedParticipant);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/instructor/cohorts/${cohortId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tillbaka till kohort
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="h-8 w-8" />
          EPA-bedömning
        </h1>
        <p className="text-muted-foreground mt-1">
          {cohort.name} - Entrustable Professional Activities
        </p>
      </div>

      {/* EPA List Overview */}
      <Card>
        <CardHeader>
          <CardTitle>EPAs (Entrustable Professional Activities)</CardTitle>
          <CardDescription>
            12 kliniska aktiviteter som bedöms med entrustment-nivå 1-5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {epas?.map((epa) => (
              <div
                key={epa.id}
                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0">
                    {epa.code}
                  </Badge>
                  <span className="text-sm font-medium">{epa.title}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participants with EPA Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Deltagare och EPA-status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cohortEPAsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : cohortEPAs?.participants && cohortEPAs.participants.length > 0 ? (
            <div className="space-y-4">
              {cohortEPAs.participants.map((participant) => {
                const isExpanded = expandedParticipant === participant.userId;
                const assessedEPAIds = new Set(participant.assessments.map(a => a.epaId));

                return (
                  <div
                    key={participant.userId}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Participant Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedParticipant(isExpanded ? null : participant.userId)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {participant.firstName} {participant.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {participant.completedEPAs} av {participant.totalEPAs} EPAs bedömda
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={participant.completedEPAs === participant.totalEPAs ? 'default' : 'secondary'}
                        >
                          {Math.round((participant.completedEPAs / participant.totalEPAs) * 100)}%
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded EPA Grid */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-4">
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {epas?.map((epa) => {
                            const assessment = participant.assessments.find(
                              a => a.epaId === epa.id
                            );
                            const isAssessed = assessedEPAIds.has(epa.id);

                            return (
                              <div
                                key={epa.id}
                                className={`p-3 rounded-lg border ${
                                  isAssessed
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-white dark:bg-gray-950'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    {isAssessed ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                      <Badge variant="outline" className="text-xs mb-1">
                                        {epa.code}
                                      </Badge>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {epa.title}
                                      </p>
                                      {assessment && (
                                        <p className="text-xs font-medium text-green-700 dark:text-green-400 mt-1">
                                          Nivå {assessment.entrustmentLevel}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={isAssessed ? 'outline' : 'default'}
                                    className="shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAssessment(participant.userId, epa.id);
                                    }}
                                  >
                                    {isAssessed ? 'Uppdatera' : <Plus className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga deltagare</h3>
              <p className="text-muted-foreground">
                Det finns inga deltagare i denna kohort ännu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>EPA-bedömning</DialogTitle>
            <DialogDescription>
              {selectedEPAData && (
                <span className="block mt-2">
                  <Badge variant="outline" className="mr-2">{selectedEPAData.code}</Badge>
                  {selectedEPAData.title}
                </span>
              )}
              {selectedParticipantData && (
                <span className="block mt-1">
                  Deltagare: {selectedParticipantData.firstName} {selectedParticipantData.lastName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entrustment-nivå</Label>
              <Select
                value={entrustmentLevel.toString()}
                onValueChange={(v) => setEntrustmentLevel(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRUSTMENT_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {level.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kommentarer (valfritt)</Label>
              <Textarea
                placeholder="Beskriv deltagarens prestation..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            {selectedEPAData && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p className="text-sm font-medium">Bedömningskriterier:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedEPAData.criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleSubmitAssessment}
              disabled={createAssessment.isPending}
            >
              {createAssessment.isPending ? 'Sparar...' : 'Spara bedömning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
