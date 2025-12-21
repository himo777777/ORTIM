import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContentStore } from '@/stores/contentStore';
import { useAdminCourses, useCreateChapter, useUpdateChapter } from '@/hooks/useAdmin';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Eye,
  BookOpen,
  Clock,
  FileText,
  LayoutTemplate,
  Smartphone,
  Tablet,
  Monitor,
  Loader2,
  Check,
  AlertCircle,
  History,
  Settings2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ChapterEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewChapter = !id || id === 'new';

  // Store
  const {
    currentDraft,
    drafts,
    templates,
    loadDraft,
    updateDraft,
    saveDraft,
    createDraft,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    previewMode,
    setPreviewMode,
    applyTemplate,
  } = useContentStore();

  // API hooks
  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const createChapter = useCreateChapter();
  const updateChapterMutation = useUpdateChapter();

  // Local state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft or create new
  useEffect(() => {
    if (id && id !== 'new') {
      const draft = loadDraft(id);
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setSlug((draft.metadata.slug as string) || '');
        setSelectedCourseId((draft.metadata.courseId as string) || '');
        setSelectedPartId((draft.metadata.partId as string) || '');
        setEstimatedMinutes((draft.metadata.estimatedMinutes as number) || 15);
      }
    } else if (isNewChapter && !currentDraft) {
      const newDraft = createDraft('chapter', 'Nytt kapitel');
      navigate(`/instructor/content/chapter/${newDraft.id}`, { replace: true });
    }
  }, [id, isNewChapter]);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [title]);

  // Track unsaved changes
  useEffect(() => {
    if (currentDraft) {
      const hasChanges =
        title !== currentDraft.title ||
        content !== currentDraft.content;
      setHasUnsavedChanges(hasChanges);
    }
  }, [title, content, currentDraft]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && currentDraft) {
        handleSaveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, currentDraft]);

  // Get parts for selected course
  const selectedCourse = courses?.find((c) => c.id === selectedCourseId);
  const parts = selectedCourse?.parts || [];

  const handleSaveDraft = useCallback(() => {
    if (!currentDraft) return;

    updateDraft(currentDraft.id, {
      title,
      content,
      metadata: {
        slug,
        courseId: selectedCourseId,
        partId: selectedPartId,
        estimatedMinutes,
      },
    });
    saveDraft();
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  }, [currentDraft, title, content, slug, selectedCourseId, selectedPartId, estimatedMinutes]);

  const handlePublish = async () => {
    if (!selectedPartId) {
      toast({
        title: 'Välj kursdel',
        description: 'Du måste välja vilken kursdel kapitlet ska tillhöra.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get chapter number (count existing + 1)
      const selectedPart = parts.find((p) => p.id === selectedPartId);
      const chapterNumber = (selectedPart?._count?.chapters || 0) + 1;

      await createChapter.mutateAsync({
        partId: selectedPartId,
        chapterNumber,
        title,
        slug,
        content,
        estimatedMinutes,
      });

      toast({
        title: 'Kapitel publicerat',
        description: `"${title}" har lagts till i kursen.`,
      });

      navigate('/instructor/content');
    } catch (error) {
      toast({
        title: 'Kunde inte publicera',
        description: error instanceof Error ? error.message : 'Ett fel uppstod',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Simple variable replacement with empty values as placeholders
    const variables: Record<string, string> = {};
    template.variables.forEach((v) => {
      variables[v] = `[${v}]`;
    });

    const templateContent = applyTemplate(templateId, variables);
    setContent(templateContent);
    setShowTemplateDialog(false);
    toast({
      title: 'Mall tillämpad',
      description: `Mallen "${template.name}" har tillämpats. Ersätt platshållarna med ditt innehåll.`,
    });
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'max-w-full';
    }
  };

  if (coursesLoading) {
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
            to="/instructor/content"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till innehållshantering
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            {isNewChapter ? 'Nytt kapitel' : 'Redigera kapitel'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              Sparad {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              Osparade ändringar
            </Badge>
          )}
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Spara utkast
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            Förhandsgranska
          </Button>
          <Button onClick={handlePublish} disabled={isSaving || !title || !content}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Publicera
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Innehåll</TabsTrigger>
              <TabsTrigger value="settings">Inställningar</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Rubrik</Label>
                <Input
                  id="title"
                  placeholder="Kapitelrubrik..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>

              {/* Editor Toolbar */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Använd mall
                </Button>
              </div>

              {/* WYSIWYG Editor */}
              <Card>
                <CardContent className="p-0">
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Börja skriva ditt kapitelinnehåll..."
                    minHeight={500}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Kapitelinställningar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slug */}
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL-slug</Label>
                    <Input
                      id="slug"
                      placeholder="kapitel-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Används i webbadressen: /chapter/{slug || 'slug'}
                    </p>
                  </div>

                  {/* Course Selection */}
                  <div className="space-y-2">
                    <Label>Kurs</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj kurs..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Part Selection */}
                  {selectedCourseId && (
                    <div className="space-y-2">
                      <Label>Kursdel</Label>
                      <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj kursdel..." />
                        </SelectTrigger>
                        <SelectContent>
                          {parts.map((part) => (
                            <SelectItem key={part.id} value={part.id}>
                              Del {part.partNumber}: {part.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Estimated Time */}
                  <div className="space-y-2">
                    <Label htmlFor="estimatedMinutes">Uppskattad lästid (minuter)</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="estimatedMinutes"
                        type="number"
                        min={1}
                        max={120}
                        value={estimatedMinutes}
                        onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 15)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">minuter</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Version History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Versionshistorik
                  </CardTitle>
                  <CardDescription>
                    Tidigare versioner av detta kapitel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen versionshistorik tillgänglig
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Förhandsgranskning</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`${getPreviewWidth()} mx-auto border rounded-lg p-4 overflow-auto max-h-[600px]`}
                >
                  <h2 className="text-xl font-bold mb-4">{title || 'Kapitelrubrik'}</h2>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: content || '<p class="text-muted-foreground">Inget innehåll ännu...</p>' }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Välj mall</DialogTitle>
            <DialogDescription>
              Välj en mall för att snabbt komma igång med strukturen
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {templates
              .filter((t) => t.type === 'chapter')
              .map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.slice(0, 5).map((v) => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {v}
                            </Badge>
                          ))}
                          {template.variables.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
