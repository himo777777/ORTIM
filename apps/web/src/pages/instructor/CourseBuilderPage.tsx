import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminCourse, useAdminCourses, useUpdateCourse } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  GripVertical,
  FileText,
  Settings,
  Trash2,
  Edit3,
  MoreVertical,
  Loader2,
  Clock,
  CheckCircle,
  FolderOpen,
  Save,
  Eye,
  LayoutList,
  GraduationCap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CourseBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const { data: course, isLoading: courseLoading } = useAdminCourse(id || '');
  const updateCourse = useUpdateCourse();

  const [editingCourse, setEditingCourse] = useState(false);

  // Course edit form state
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [passingScore, setPassingScore] = useState(70);
  const [isActive, setIsActive] = useState(true);

  const isLoading = coursesLoading || (courseLoading && !!id);

  // Initialize form when course data loads
  useEffect(() => {
    if (course) {
      setCourseName(course.name);
      setCourseDescription(course.description || '');
      setEstimatedHours(course.estimatedHours || 0);
      setPassingScore(course.passingScore || 70);
      setIsActive(course.isActive);
    }
  }, [course]);

  const handleSelectCourse = (courseId: string) => {
    navigate(`/instructor/content/course/${courseId}`);
  };

  const handleNewChapter = (partId: string) => {
    navigate(`/instructor/content/chapter/new?partId=${partId}`);
  };

  const handleEditChapter = (chapterId: string) => {
    navigate(`/instructor/content/chapter/${chapterId}`);
  };

  const handleSaveCourseSettings = async () => {
    if (!course) return;

    try {
      await updateCourse.mutateAsync({
        id: course.id,
        data: {
          name: courseName,
          description: courseDescription,
          estimatedHours,
          passingScore,
          isActive,
        },
      });

      toast({
        title: 'Inställningar sparade',
        description: 'Kursinställningarna har uppdaterats.',
      });
      setEditingCourse(false);
    } catch (error) {
      toast({
        title: 'Kunde inte spara',
        description: error instanceof Error ? error.message : 'Ett fel uppstod',
        variant: 'destructive',
      });
    }
  };

  // For course list, get chapter count from _count
  const getChapterCountFromList = (courseParts: Array<{ _count: { chapters: number } }>) => {
    return courseParts.reduce((acc, part) => acc + part._count.chapters, 0);
  };

  // For course detail, get actual chapter count
  const getChapterCount = (courseParts: Array<{ chapters: Array<unknown> }>) => {
    return courseParts.reduce((acc, part) => acc + part.chapters.length, 0);
  };

  // For course detail, get total minutes
  const getTotalMinutes = (courseParts: Array<{ chapters: Array<{ estimatedMinutes: number }> }>) => {
    return courseParts.reduce(
      (acc, part) =>
        acc + part.chapters.reduce((chAcc, ch) => chAcc + ch.estimatedMinutes, 0),
      0
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-4">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  // Course list view (when no course selected)
  if (!id) {
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
              <FolderOpen className="h-6 w-6 text-primary" />
              Kurser & Kapitel
            </h1>
            <p className="text-muted-foreground mt-1">
              Välj en kurs för att hantera dess struktur
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((courseItem) => (
            <motion.div
              key={courseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleSelectCourse(courseItem.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {courseItem.code}
                      </Badge>
                      <CardTitle className="text-lg">{courseItem.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {courseItem.fullName}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={courseItem.isActive ? 'default' : 'secondary'}>
                        {courseItem.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      {(courseItem as any).instructorOnly && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Instruktörskurs
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <LayoutList className="h-4 w-4" />
                      <span>{courseItem.parts.length} delar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{getChapterCountFromList(courseItem.parts)} kapitel</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{courseItem.estimatedHours}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {(!courses || courses.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga kurser</h3>
              <p className="text-muted-foreground mb-4">
                Det finns inga kurser i systemet ännu.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Course detail view - requires full course data
  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Kursen kunde inte hittas.</p>
        <Button variant="outline" onClick={() => navigate('/instructor/content/courses')} className="mt-4">
          Tillbaka
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/instructor/content/courses"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till kurser
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {course.code}
            </Badge>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <Badge variant={course.isActive ? 'default' : 'secondary'}>
              {course.isActive ? 'Aktiv' : 'Inaktiv'}
            </Badge>
            {(course as any).instructorOnly && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                <GraduationCap className="h-3 w-3 mr-1" />
                Instruktörskurs
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditingCourse(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Inställningar
          </Button>
          <Button onClick={() => navigate(`/instructor/content/chapter/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt kapitel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{course.parts.length}</p>
                <p className="text-sm text-muted-foreground">Kursdelar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getChapterCount(course.parts)}</p>
                <p className="text-sm text-muted-foreground">Kapitel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(getTotalMinutes(course.parts) / 60)}h
                </p>
                <p className="text-sm text-muted-foreground">Total lästid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CheckCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{course.passingScore || 70}%</p>
                <p className="text-sm text-muted-foreground">Godkäntgräns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kursstruktur
          </CardTitle>
          <CardDescription>
            Organisera kapitel i kursdelar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={course.parts.map((p) => p.id)}>
            {course.parts.map((part) => (
              <AccordionItem key={part.id} value={part.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="flex-shrink-0">
                      Del {part.partNumber}
                    </Badge>
                    <span className="font-semibold">{part.title}</span>
                    <span className="text-muted-foreground text-sm">
                      ({part.chapters.length} kapitel)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-4 pt-2">
                    {part.chapters.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Inga kapitel i denna del
                      </p>
                    ) : (
                      part.chapters.map((chapter, chapterIndex) => (
                        <motion.div
                          key={chapter.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: chapterIndex * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-sm font-mono">
                                {part.partNumber}.{chapter.chapterNumber}
                              </span>
                              <span className="font-medium">{chapter.title}</span>
                            </div>
                            {!chapter.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inaktiv
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {chapter.estimatedMinutes} min
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditChapter(chapter.id)}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Redigera
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/chapter/${chapter.slug}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Förhandsgranska
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Ta bort
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      ))
                    )}

                    {/* Add Chapter Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                      onClick={() => handleNewChapter(part.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till kapitel i Del {part.partNumber}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {course.parts.length === 0 && (
            <div className="text-center py-8">
              <LayoutList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga kursdelar</h3>
              <p className="text-muted-foreground mb-4">
                Denna kurs har inga delar ännu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Settings Dialog */}
      <Dialog open={editingCourse} onOpenChange={setEditingCourse}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kursinställningar</DialogTitle>
            <DialogDescription>
              Redigera grundläggande information om kursen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Kursnamn</Label>
              <Input
                id="courseName"
                value={courseName || course.name}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseDescription">Beskrivning</Label>
              <Textarea
                id="courseDescription"
                value={courseDescription || course.description || ''}
                onChange={(e) => setCourseDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Uppskattad tid (timmar)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min={0}
                  value={estimatedHours || course.estimatedHours || 0}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">Godkäntgräns (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore || course.passingScore || 70}
                  onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Aktiv kurs</Label>
                <p className="text-sm text-muted-foreground">
                  Deltagare kan se och ta kursen
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive !== undefined ? isActive : course.isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveCourseSettings} disabled={updateCourse.isPending}>
              {updateCourse.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
