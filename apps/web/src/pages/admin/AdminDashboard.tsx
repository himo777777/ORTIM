import { Link } from 'react-router-dom';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  HelpCircle,
  GitBranch,
  Award,
  UserCog,
  LayoutDashboard,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Kunde inte ladda dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Systemöversikt och snabbåtkomst till administration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Användare"
          value={data?.stats.users}
          icon={Users}
          loading={isLoading}
          href="/admin/users"
          description={`${data?.stats.instructors || 0} instruktörer`}
        />
        <StatsCard
          title="Kurser"
          value={data?.stats.courses}
          icon={BookOpen}
          loading={isLoading}
          href="/admin/courses"
          description={`${data?.stats.activeCohorts || 0} aktiva kohorter`}
        />
        <StatsCard
          title="Frågor"
          value={data?.stats.questions}
          icon={HelpCircle}
          loading={isLoading}
          href="/admin/questions"
          description="I frågebanken"
        />
        <StatsCard
          title="Algoritmer"
          value={data?.stats.algorithms}
          icon={GitBranch}
          loading={isLoading}
          href="/admin/algorithms"
          description="Kliniska beslutsstöd"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certifikat utfärdade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats.certificates || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva inskrivningar</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats.activeEnrollments || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Instruktörer</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats.instructors || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
            <CardDescription>Vanliga administrativa uppgifter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickActionLink
              href="/admin/users"
              icon={Users}
              title="Hantera användare"
              description="Skapa, redigera eller ta bort användare"
            />
            <QuickActionLink
              href="/admin/courses"
              icon={BookOpen}
              title="Hantera kurser"
              description="Redigera kursinnehåll och kapitel"
            />
            <QuickActionLink
              href="/admin/questions"
              icon={HelpCircle}
              title="Frågebank"
              description="Lägg till eller redigera quizfrågor"
            />
            <QuickActionLink
              href="/admin/algorithms"
              icon={GitBranch}
              title="Algoritmer"
              description="Hantera kliniska beslutsträd"
            />
            <QuickActionLink
              href="/admin/statistics"
              icon={BarChart3}
              title="Statistik & Rapporter"
              description="Detaljerad analys och CSV-export"
            />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Senaste aktivitet</CardTitle>
            <CardDescription>Nya användare och certifikat</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Recent Users */}
                {data?.recentUsers.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                  </div>
                ))}

                {/* Recent Certificates */}
                {data?.recentCertificates.slice(0, 2).map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {cert.user.firstName} {cert.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Certifikat: {cert.certificateNumber}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Godkänd
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  loading,
  href,
  description,
}: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  href: string;
  description?: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{value || 0}</div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickActionLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'INSTRUCTOR':
      return 'Instruktör';
    case 'PARTICIPANT':
      return 'Deltagare';
    default:
      return role;
  }
}
