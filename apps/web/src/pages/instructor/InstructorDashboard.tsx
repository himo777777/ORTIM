import { Link } from 'react-router-dom';
import { useInstructorDashboard } from '@/hooks/useInstructor';
import { CohortCard } from '@/components/instructor';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Plus,
  BookOpen,
  TrendingUp,
  FileText,
  BarChart3,
} from 'lucide-react';

export default function InstructorDashboard() {
  const { cohorts, activeCohorts, totalParticipants, totalCohorts, isLoading } =
    useInstructorDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Utbildarportal
          </h1>
          <p className="text-muted-foreground mt-1">
            Hantera kohorter och bedöm deltagare
          </p>
        </div>
        <Link to="/instructor/cohorts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny kohort
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktiva kohorter
            </CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCohorts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              av {totalCohorts} totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt deltagare
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              alla kohorter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OSCE-bedömningar
            </CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              att genomföra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Genomströmning
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              genomsnitt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active cohorts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Aktiva kohorter</h2>
          <Link to="/instructor/cohorts" className="text-sm text-primary hover:underline">
            Visa alla
          </Link>
        </div>

        {activeCohorts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga aktiva kohorter</h3>
              <p className="text-muted-foreground mb-4">
                Skapa en ny kohort för att börja administrera kursen.
              </p>
              <Link to="/instructor/cohorts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa kohort
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeCohorts.slice(0, 4).map((cohort) => (
              <CohortCard
                key={cohort.id}
                id={cohort.id}
                name={cohort.name}
                courseName={cohort.course.name}
                courseCode={cohort.course.code}
                startDate={cohort.startDate}
                endDate={cohort.endDate}
                participantCount={cohort._count.enrollments}
                isActive={cohort.isActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Snabbåtgärder</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Link to="/instructor/cohorts">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Hantera kohorter</h3>
                  <p className="text-sm text-muted-foreground">
                    Se alla kohorter och deltagare
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/instructor/content">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Innehållshantering</h3>
                  <p className="text-sm text-muted-foreground">
                    Skapa kapitel och frågor
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/instructor/osce">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <ClipboardCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">OSCE-bedömningar</h3>
                  <p className="text-sm text-muted-foreground">
                    Bedöm praktiska moment
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <BarChart3 className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold">Statistik & Rapporter</h3>
                <p className="text-sm text-muted-foreground">
                  Kommer snart
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
