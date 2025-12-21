import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminCourses, useAdminQuestions, useAdminAlgorithms } from '@/hooks/useAdmin';
import { useContentStore } from '@/stores/contentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HelpCircle,
  GitBranch,
  Plus,
  Search,
  Clock,
  Edit3,
  Trash2,
  FolderOpen,
  LayoutTemplate,
  Image,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';

export default function ContentManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const { data: questionsData, isLoading: questionsLoading } = useAdminQuestions({ take: 5 });
  const { data: algorithms, isLoading: algorithmsLoading } = useAdminAlgorithms();

  const { drafts, getRecentDrafts, deleteDraft, createDraft } = useContentStore();
  const recentDrafts = getRecentDrafts(5);

  const isLoading = coursesLoading || questionsLoading || algorithmsLoading;

  // Stats
  const totalChapters = courses?.reduce((acc, course) =>
    acc + course.parts.reduce((partAcc, part) => partAcc + part._count.chapters, 0), 0
  ) || 0;
  const totalQuestions = questionsData?.total || 0;
  const totalAlgorithms = algorithms?.length || 0;
  const totalDrafts = drafts.length;

  const handleNewContent = (type: 'chapter' | 'question' | 'algorithm') => {
    const titles = {
      chapter: 'Nytt kapitel',
      question: 'Ny fråga',
      algorithm: 'Ny algoritm',
    };
    const draft = createDraft(type, titles[type]);

    const routes = {
      chapter: `/instructor/content/chapter/${draft.id}`,
      question: `/instructor/content/question/${draft.id}`,
      algorithm: `/instructor/content/algorithm/${draft.id}`,
    };
    navigate(routes[type]);
  };

  const handleEditDraft = (draft: typeof drafts[0]) => {
    const routes = {
      chapter: `/instructor/content/chapter/${draft.id}`,
      question: `/instructor/content/question/${draft.id}`,
      algorithm: `/instructor/content/algorithm/${draft.id}`,
    };
    navigate(routes[draft.type]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/instructor"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till utbildarportal
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Innehållshantering
          </h1>
          <p className="text-muted-foreground mt-1">
            Skapa och hantera kursinnehåll, frågor och algoritmer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/instructor/content/templates')}>
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Mallar
          </Button>
          <Button onClick={() => handleNewContent('chapter')}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt innehåll
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/instructor/content/courses')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kapitel
              </CardTitle>
              <BookOpen className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalChapters}</div>
              <p className="text-xs text-muted-foreground mt-1">
                i {courses?.length || 0} kurser
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/instructor/content/questions')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Frågor
              </CardTitle>
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalQuestions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                i frågebanken
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/instructor/content/algorithms')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Algoritmer
              </CardTitle>
              <GitBranch className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAlgorithms}</div>
              <p className="text-xs text-muted-foreground mt-1">
                beslutsträd
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('drafts')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utkast
              </CardTitle>
              <Edit3 className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDrafts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                sparade utkast
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök i allt innehåll..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="drafts">Utkast</TabsTrigger>
          <TabsTrigger value="recent">Senaste ändringar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewContent('chapter')}>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Skapa kapitel</h3>
                  <p className="text-sm text-muted-foreground">
                    Lägg till nytt kursinnehåll
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewContent('question')}>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <HelpCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Skapa fråga</h3>
                  <p className="text-sm text-muted-foreground">
                    Lägg till fråga i frågebanken
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNewContent('algorithm')}>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <GitBranch className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Skapa algoritm</h3>
                  <p className="text-sm text-muted-foreground">
                    Lägg till beslutsträd
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* Content Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Kurser & Kapitel</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/instructor/content/courses')}>
                    Visa alla
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {courses?.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/instructor/content/course/${course.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.parts.reduce((acc, p) => acc + p._count.chapters, 0)} kapitel
                        </p>
                      </div>
                    </div>
                    <Badge variant={course.isActive ? 'default' : 'secondary'}>
                      {course.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                ))}
                {(!courses || courses.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    Inga kurser ännu
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Senaste frågor</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/instructor/content/questions')}>
                    Visa alla
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {questionsData?.questions.slice(0, 3).map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/instructor/content/question/${question.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-mono text-sm">{question.questionCode}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {question.questionText}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      {question.bloomLevel}
                    </Badge>
                  </div>
                ))}
                {(!questionsData?.questions || questionsData.questions.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    Inga frågor ännu
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verktyg</CardTitle>
              <CardDescription>
                Verktyg för att hantera och förbättra innehåll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/instructor/content/media')}>
                  <Image className="h-6 w-6" />
                  <span>Mediabibliotek</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/instructor/content/templates')}>
                  <LayoutTemplate className="h-6 w-6" />
                  <span>Mallar</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/instructor/content/analytics')}>
                  <BarChart3 className="h-6 w-6" />
                  <span>Statistik</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/instructor/content/settings')}>
                  <Settings className="h-6 w-6" />
                  <span>Inställningar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sparade utkast</CardTitle>
                  <CardDescription>
                    Fortsätt arbeta på dina opublicerade utkast
                  </CardDescription>
                </div>
                <Button onClick={() => handleNewContent('chapter')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt utkast
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <div className="text-center py-12">
                  <Edit3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Inga utkast</h3>
                  <p className="text-muted-foreground mb-4">
                    Du har inga sparade utkast. Skapa ett nytt för att börja.
                  </p>
                  <Button onClick={() => handleNewContent('chapter')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Skapa utkast
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {draft.type === 'chapter' && <BookOpen className="h-5 w-5 text-primary" />}
                        {draft.type === 'question' && <HelpCircle className="h-5 w-5 text-blue-500" />}
                        {draft.type === 'algorithm' && <GitBranch className="h-5 w-5 text-green-500" />}
                        <div>
                          <p className="font-medium">{draft.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(draft.lastModified).toLocaleDateString('sv-SE', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {draft.type === 'chapter' && 'Kapitel'}
                              {draft.type === 'question' && 'Fråga'}
                              {draft.type === 'algorithm' && 'Algoritm'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Redigera
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDraft(draft.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Senaste ändringar</CardTitle>
              <CardDescription>
                Översikt över nyligen ändrat innehåll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDrafts.length > 0 ? (
                  recentDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      <div className="flex-shrink-0">
                        {draft.type === 'chapter' && <BookOpen className="h-5 w-5 text-primary" />}
                        {draft.type === 'question' && <HelpCircle className="h-5 w-5 text-blue-500" />}
                        {draft.type === 'algorithm' && <GitBranch className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{draft.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Uppdaterad {new Date(draft.lastModified).toLocaleDateString('sv-SE', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditDraft(draft)}>
                        Öppna
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Inga senaste ändringar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
