import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Station type from API
export interface OSCEStation {
  id: string;
  code: string;
  title: string;
  scenario: string;
  checklist: string[];
  criticalErrors: string[];
  timeLimit: number;
  sortOrder: number;
}

// Type matching the API response
interface OsceAssessment {
  id: string;
  stationNumber: number;
  stationName: string;
  passed: boolean;
  score: number | null;
  comments: string | null;
  assessedAt: string;
}

interface OsceAssessmentFormProps {
  enrollmentId: string;
  participantName: string;
  existingAssessments: OsceAssessment[];
  stations: OSCEStation[];
  onSubmit: (data: {
    stationNumber: number;
    stationName: string;
    passed: boolean;
    score?: number;
    comments?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function OsceAssessmentForm({
  participantName,
  existingAssessments,
  stations,
  onSubmit,
  isSubmitting,
}: OsceAssessmentFormProps) {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [score, setScore] = useState<string>('');
  const [comments, setComments] = useState('');

  const getAssessmentForStation = (stationNumber: number) => {
    return existingAssessments.find((a) => a.stationNumber === stationNumber);
  };

  const handleStationSelect = (stationNumber: number) => {
    setSelectedStation(stationNumber);
    const existing = getAssessmentForStation(stationNumber);
    if (existing) {
      setPassed(existing.passed);
      setScore(existing.score?.toString() || '');
      setComments(existing.comments || '');
    } else {
      setPassed(null);
      setScore('');
      setComments('');
    }
  };

  const handleSubmit = async () => {
    if (selectedStation === null || passed === null) return;

    const station = stations.find((s) => s.sortOrder === selectedStation);
    if (!station) return;

    await onSubmit({
      stationNumber: station.sortOrder,
      stationName: station.title,
      passed,
      score: score ? parseInt(score, 10) : undefined,
      comments: comments || undefined,
    });

    // Reset form
    setSelectedStation(null);
    setPassed(null);
    setScore('');
    setComments('');
  };

  const completedCount = existingAssessments.length;
  const passedCount = existingAssessments.filter((a) => a.passed).length;

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>OSCE-bedömning för {participantName}</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="text-muted-foreground">
                {completedCount}/{stations.length} stationer avklarade
              </span>
              <span className={cn(
                passedCount === completedCount && completedCount > 0
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              )}>
                {passedCount} godkända
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Station grid */}
          <div className="grid gap-3 md:grid-cols-4">
            {stations.map((station) => {
              const assessment = getAssessmentForStation(station.sortOrder);
              const isSelected = selectedStation === station.sortOrder;

              return (
                <button
                  key={station.id}
                  onClick={() => handleStationSelect(station.sortOrder)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    isSelected && 'border-primary ring-2 ring-primary/20',
                    !isSelected && 'border-transparent bg-muted/50 hover:bg-muted',
                    assessment?.passed && 'bg-green-50 dark:bg-green-900/20',
                    assessment && !assessment.passed && 'bg-red-50 dark:bg-red-900/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{station.code}</span>
                    {assessment && (
                      assessment.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {station.title}
                  </p>
                  {assessment && (
                    <p className="text-xs mt-1">
                      {assessment.score !== null && `Poäng: ${assessment.score}`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assessment form for selected station */}
      {selectedStation && (
        <Card>
          <CardHeader>
            <CardTitle>
              {stations.find((s) => s.sortOrder === selectedStation)?.code}: {stations.find((s) => s.sortOrder === selectedStation)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pass/Fail */}
            <div className="space-y-3">
              <Label>Resultat</Label>
              <RadioGroup
                value={passed === true ? 'pass' : passed === false ? 'fail' : ''}
                onValueChange={(value: string) => setPassed(value === 'pass')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pass" id="pass" />
                  <Label htmlFor="pass" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Godkänd
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fail" id="fail" />
                  <Label htmlFor="fail" className="flex items-center gap-2 cursor-pointer">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Ej godkänd
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Score */}
            <div className="space-y-2">
              <Label htmlFor="score">Poäng (valfritt)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={score}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScore(e.target.value)}
                className="max-w-[120px]"
              />
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Kommentarer (valfritt)</Label>
              <Textarea
                id="comments"
                placeholder="Anteckningar om prestationen..."
                value={comments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStation(null);
                  setPassed(null);
                  setScore('');
                  setComments('');
                }}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={passed === null || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara bedömning
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions when no station selected */}
      {!selectedStation && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Välj en station ovan för att registrera bedömning</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
