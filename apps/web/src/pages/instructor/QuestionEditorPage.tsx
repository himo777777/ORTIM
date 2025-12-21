import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '@/stores/contentStore';
import {
  useAdminCourses,
  useAdminQuestion,
  useCreateQuestion,
  useUpdateQuestion,
  useUpdateQuestionOptions,
} from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Eye,
  HelpCircle,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  Loader2,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BLOOM_LEVELS = [
  { value: 'KNOWLEDGE', label: 'Kunskap', description: 'Minnas fakta och begrepp' },
  { value: 'COMPREHENSION', label: 'Förståelse', description: 'Förklara idéer och koncept' },
  { value: 'APPLICATION', label: 'Tillämpning', description: 'Använda information i nya situationer' },
  { value: 'ANALYSIS', label: 'Analys', description: 'Dra kopplingar mellan idéer' },
  { value: 'SYNTHESIS', label: 'Syntes', description: 'Skapa nya strukturer och idéer' },
];

interface QuestionOption {
  id?: string;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

export default function QuestionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewQuestion = !id || id === 'new';

  // Store
  const { currentDraft, loadDraft, updateDraft, saveDraft, createDraft, hasUnsavedChanges, setHasUnsavedChanges } = useContentStore();

  // API hooks
  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const { data: existingQuestion, isLoading: questionLoading } = useAdminQuestion(id || '');
  const createQuestion = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const updateOptions = useUpdateQuestionOptions();

  // Local state
  const [questionCode, setQuestionCode] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [reference, setReference] = useState('');
  const [bloomLevel, setBloomLevel] = useState('KNOWLEDGE');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [isExamQuestion, setIsExamQuestion] = useState(false);
  const [options, setOptions] = useState<QuestionOption[]>([
    { optionLabel: 'A', optionText: '', isCorrect: false },
    { optionLabel: 'B', optionText: '', isCorrect: false },
    { optionLabel: 'C', optionText: '', isCorrect: false },
    { optionLabel: 'D', optionText: '', isCorrect: false },
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get chapters summary from all courses (from parts._count, not full chapters)
  // For full chapter selection, we'd need to fetch each course individually
  const allChapters: Array<{ id: string; title: string; courseCode: string; partNumber: number }> = [];

  // Load existing question data
  useEffect(() => {
    if (existingQuestion && !isNewQuestion) {
      setQuestionCode(existingQuestion.questionCode);
      setQuestionText(existingQuestion.questionText);
      setExplanation(existingQuestion.explanation || '');
      setReference(existingQuestion.reference || '');
      setBloomLevel(existingQuestion.bloomLevel);
      setSelectedChapterId(existingQuestion.chapter?.id || '');
      setIsExamQuestion(existingQuestion.isExamQuestion);
      setOptions(
        existingQuestion.options.map((opt) => ({
          id: opt.id,
          optionLabel: opt.optionLabel,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        }))
      );
    } else if (isNewQuestion && id && id !== 'new') {
      // Load from draft
      const draft = loadDraft(id);
      if (draft) {
        setQuestionCode((draft.metadata.questionCode as string) || '');
        setQuestionText(draft.content);
        setExplanation((draft.metadata.explanation as string) || '');
        setBloomLevel((draft.metadata.bloomLevel as string) || 'KNOWLEDGE');
        if (draft.metadata.options) {
          setOptions(draft.metadata.options as QuestionOption[]);
        }
      }
    } else if (isNewQuestion && !currentDraft) {
      // Generate question code
      const timestamp = Date.now().toString(36).toUpperCase();
      setQuestionCode(`Q-${timestamp}`);
      const newDraft = createDraft('question', 'Ny fråga');
      navigate(`/instructor/content/question/${newDraft.id}`, { replace: true });
    }
  }, [existingQuestion, id, isNewQuestion]);

  // Generate question code if empty
  useEffect(() => {
    if (isNewQuestion && !questionCode) {
      const timestamp = Date.now().toString(36).toUpperCase();
      setQuestionCode(`Q-${timestamp}`);
    }
  }, [isNewQuestion, questionCode]);

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i === index) {
          return { ...opt, [field]: value };
        }
        // If setting isCorrect to true, reset others
        if (field === 'isCorrect' && value === true) {
          return { ...opt, isCorrect: false };
        }
        return opt;
      })
    );
  };

  const handleSetCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleAddOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length); // A, B, C, D, E...
    setOptions((prev) => [...prev, { optionLabel: nextLabel, optionText: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: 'Minst två alternativ krävs',
        variant: 'destructive',
      });
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    if (!currentDraft) return;

    updateDraft(currentDraft.id, {
      title: questionCode || 'Ny fråga',
      content: questionText,
      metadata: {
        questionCode,
        explanation,
        reference,
        bloomLevel,
        chapterId: selectedChapterId,
        isExamQuestion,
        options,
      },
    });
    saveDraft();
    toast({ title: 'Utkast sparat' });
  };

  const handlePublish = async () => {
    // Validate
    if (!questionText.trim()) {
      toast({ title: 'Frågetext krävs', variant: 'destructive' });
      return;
    }

    const hasCorrectAnswer = options.some((opt) => opt.isCorrect);
    if (!hasCorrectAnswer) {
      toast({ title: 'Markera ett korrekt svar', variant: 'destructive' });
      return;
    }

    const emptyOptions = options.filter((opt) => !opt.optionText.trim());
    if (emptyOptions.length > 0) {
      toast({ title: 'Alla svarsalternativ måste ha text', variant: 'destructive' });
      return;
    }

    if (!explanation.trim()) {
      toast({ title: 'Förklaring krävs', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      if (isNewQuestion || !existingQuestion) {
        await createQuestion.mutateAsync({
          questionCode,
          questionText,
          explanation,
          reference: reference || undefined,
          bloomLevel,
          chapterId: selectedChapterId || undefined,
          isExamQuestion,
          options: options.map((opt) => ({
            optionLabel: opt.optionLabel,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        });

        toast({
          title: 'Fråga skapad',
          description: `Fråga ${questionCode} har lagts till i frågebanken.`,
        });
      } else {
        // Update existing question
        await updateQuestionMutation.mutateAsync({
          id: existingQuestion.id,
          data: {
            questionText,
            explanation,
            reference: reference || undefined,
            bloomLevel,
            chapterId: selectedChapterId || undefined,
            isExamQuestion,
          },
        });

        await updateOptions.mutateAsync({
          id: existingQuestion.id,
          options: options.map((opt) => ({
            id: opt.id,
            optionLabel: opt.optionLabel,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        });

        toast({
          title: 'Fråga uppdaterad',
          description: `Fråga ${questionCode} har uppdaterats.`,
        });
      }

      navigate('/instructor/content/questions');
    } catch (error) {
      toast({
        title: 'Kunde inte spara',
        description: error instanceof Error ? error.message : 'Ett fel uppstod',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = coursesLoading || (questionLoading && !isNewQuestion);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/instructor/content/questions"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till frågebank
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-blue-500" />
            {isNewQuestion ? 'Ny fråga' : `Redigera ${questionCode}`}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Spara utkast
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Dölj' : 'Visa'} förhandsgranskning
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isNewQuestion ? 'Publicera' : 'Uppdatera'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="space-y-6">
            {/* Question Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frågeinformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Question Code */}
                  <div className="space-y-2">
                    <Label htmlFor="questionCode">Frågekod</Label>
                    <Input
                      id="questionCode"
                      placeholder="Q-001"
                      value={questionCode}
                      onChange={(e) => setQuestionCode(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  {/* Bloom Level */}
                  <div className="space-y-2">
                    <Label>Bloom-nivå</Label>
                    <Select value={bloomLevel} onValueChange={setBloomLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOM_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div>
                              <span className="font-medium">{level.label}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                - {level.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Chapter */}
                <div className="space-y-2">
                  <Label>Kopplat kapitel (valfritt)</Label>
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kapitel..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Inget kapitel</SelectItem>
                      {allChapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.courseCode} - Del {chapter.partNumber}: {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Question Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isExamQuestion"
                    checked={isExamQuestion}
                    onCheckedChange={(checked) => setIsExamQuestion(checked as boolean)}
                  />
                  <Label htmlFor="isExamQuestion" className="cursor-pointer">
                    Examensfråga
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Question Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frågetext</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Skriv frågan här..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={4}
                  className="text-base"
                />
              </CardContent>
            </Card>

            {/* Answer Options */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Svarsalternativ</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleAddOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Lägg till
                  </Button>
                </div>
                <CardDescription>
                  Klicka på cirkeln för att markera det korrekta svaret
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        option.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSetCorrect(index)}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          option.isCorrect
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-muted-foreground hover:border-green-500'
                        }`}
                      >
                        {option.isCorrect && <Check className="h-4 w-4" />}
                      </button>
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center font-medium">
                        {option.optionLabel}
                      </div>
                      <Input
                        placeholder={`Alternativ ${option.optionLabel}...`}
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Förklaring
                </CardTitle>
                <CardDescription>
                  Förklara varför det korrekta svaret är rätt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Förklara det korrekta svaret..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={4}
                />

                {/* Reference */}
                <div className="space-y-2">
                  <Label htmlFor="reference">Referens (valfritt)</Label>
                  <Input
                    id="reference"
                    placeholder="T.ex. källa, sida, avsnitt..."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Förhandsgranskning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {questionCode || 'Q-XXX'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {BLOOM_LEVELS.find((b) => b.value === bloomLevel)?.label}
                    </Badge>
                    {isExamQuestion && (
                      <Badge className="text-xs">Examen</Badge>
                    )}
                  </div>
                  <p className="font-medium">
                    {questionText || 'Frågetext...'}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {options.map((option) => (
                    <div
                      key={option.optionLabel}
                      className={`p-3 rounded-lg border ${
                        option.isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {option.isCorrect ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{option.optionLabel}.</span>
                        <span>{option.optionText || '...'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">Förklaring</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{explanation}</p>
                  </div>
                )}

                {reference && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <span>{reference}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
