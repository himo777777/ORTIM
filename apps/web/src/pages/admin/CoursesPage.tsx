import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminCourses } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Search,
  Plus,
  ChevronRight,
  ArrowLeft,
  Users,
  FileText,
  HelpCircle,
} from 'lucide-react';

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data: courses, isLoading, error } = useAdminCourses();

  const filteredCourses = courses?.filter(
    (course) =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Kunde inte ladda kurser</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till admin
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Kurshantering
          </h1>
          <p className="text-muted-foreground mt-1">
            {courses?.length || 0} kurser i systemet
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Ny kurs
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök kurser..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : filteredCourses && filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/admin/courses/${course.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{course.name}</CardTitle>
                      <Badge variant={course.isActive ? 'default' : 'secondary'}>
                        {course.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {course.code} - {course.fullName}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{course.parts.reduce((sum, p) => sum + p._count.chapters, 0)} kapitel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course._count.cohorts} kohorter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{course.estimatedHours} timmar</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span> {course.version}
                  </div>
                </div>

                {/* Course Parts */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.parts.map((part) => (
                    <Badge key={part.id} variant="outline">
                      Del {part.partNumber}: {part.title} ({part._count.chapters} kap)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inga kurser hittades</h3>
            <p className="text-muted-foreground">
              {search ? `Inga kurser matchar "${search}"` : 'Det finns inga kurser i systemet ännu.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
