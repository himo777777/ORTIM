import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmitPilotEvaluation } from '@/hooks/useInstructor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  Star,
  Send,
  CheckCircle,
  MessageSquare,
  ThumbsUp,
  BookOpen,
  Users,
} from 'lucide-react';

// Survey questions for Kirkpatrick Level 1 (Reaction)
const SURVEY_QUESTIONS = [
  {
    id: 'overall_satisfaction',
    question: 'Hur nöjd är du med kursen överlag?',
    icon: Star,
  },
  {
    id: 'content_relevance',
    question: 'Hur relevant var kursinnehållet för din kliniska vardag?',
    icon: BookOpen,
  },
  {
    id: 'instructor_quality',
    question: 'Hur bedömer du instruktörernas kvalitet?',
    icon: Users,
  },
  {
    id: 'would_recommend',
    question: 'Hur sannolikt är det att du skulle rekommendera kursen till en kollega?',
    icon: ThumbsUp,
  },
  {
    id: 'learning_objectives',
    question: 'I vilken utsträckning uppnådde kursen sina lärandemål?',
    icon: CheckCircle,
  },
];

const RATING_LABELS = [
  { value: 1, label: 'Mycket missnöjd' },
  { value: 2, label: 'Missnöjd' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Nöjd' },
  { value: 5, label: 'Mycket nöjd' },
];

export default function CourseEvaluationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const submitEvaluation = useSubmitPilotEvaluation();

  const [responses, setResponses] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [improvements, setImprovements] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingChange = (questionId: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const isFormComplete = SURVEY_QUESTIONS.every((q) => responses[q.id]);

  const handleSubmit = async () => {
    if (!isFormComplete) {
      toast({
        title: 'Ofullständigt formulär',
        description: 'Vänligen besvara alla frågor innan du skickar.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate average score
    const scores = Object.values(responses);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    try {
      await submitEvaluation.mutateAsync({
        kirkpatrickLevel: 'REACTION',
        assessmentType: 'satisfaction',
        score: averageScore,
        maxScore: 5,
        responses: {
          ...responses,
          feedback,
          improvements,
        },
        notes: feedback || undefined,
      });

      setIsSubmitted(true);

      toast({
        title: 'Tack för din utvärdering!',
        description: 'Dina svar har sparats.',
      });
    } catch {
      toast({
        title: 'Fel',
        description: 'Kunde inte spara utvärderingen. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Tack för din feedback!</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Din utvärdering hjälper oss att förbättra ORTAC-kursen för framtida deltagare.
            </p>
            <Button onClick={() => navigate('/')}>
              Tillbaka till Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Kursutvärdering</h1>
        <p className="text-muted-foreground mt-2">
          Din feedback är viktig för att vi ska kunna förbättra kursen.
        </p>
      </div>

      {/* Survey Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Betygsätt kursen
          </CardTitle>
          <CardDescription>
            Besvara följande frågor på en skala 1-5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {SURVEY_QUESTIONS.map((question) => {
            const Icon = question.icon;
            return (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <Label className="text-base font-medium">
                    {question.question}
                  </Label>
                </div>
                <RadioGroup
                  value={responses[question.id]?.toString()}
                  onValueChange={(v) => handleRatingChange(question.id, parseInt(v))}
                  className="flex flex-wrap gap-2"
                >
                  {RATING_LABELS.map((rating) => (
                    <div key={rating.value} className="flex-1 min-w-[100px]">
                      <Label
                        htmlFor={`${question.id}-${rating.value}`}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          responses[question.id] === rating.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem
                          value={rating.value.toString()}
                          id={`${question.id}-${rating.value}`}
                          className="sr-only"
                        />
                        <span className="text-2xl font-bold">{rating.value}</span>
                        <span className="text-xs text-center text-muted-foreground">
                          {rating.label}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Free Text Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Öppen feedback
          </CardTitle>
          <CardDescription>
            Dela dina tankar om kursen (valfritt)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Vad var det bästa med kursen?
            </Label>
            <Textarea
              id="feedback"
              placeholder="Beskriv vad du uppskattade mest..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="improvements">
              Vad kan förbättras?
            </Label>
            <Textarea
              id="improvements"
              placeholder="Ge oss gärna förslag på förbättringar..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pb-8">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!isFormComplete || submitEvaluation.isPending}
          className="min-w-[200px]"
        >
          {submitEvaluation.isPending ? (
            'Skickar...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Skicka utvärdering
            </>
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="text-center text-sm text-muted-foreground pb-4">
        {Object.keys(responses).length} av {SURVEY_QUESTIONS.length} frågor besvarade
      </div>
    </div>
  );
}
