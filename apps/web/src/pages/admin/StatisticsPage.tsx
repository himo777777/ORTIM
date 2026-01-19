import { useState } from 'react';
import { useDetailedStats, useExportParticipants, useExportProgress, useExportCertificates, useAdminCourses } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Download,
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  Loader2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function StatisticsPage() {
  const [courseFilter, setCourseFilter] = useState<string | undefined>();
  const { data: courses } = useAdminCourses();
  const { data: stats, isLoading, error } = useDetailedStats({ courseCode: courseFilter });

  const exportParticipants = useExportParticipants();
  const exportProgress = useExportProgress();
  const exportCertificates = useExportCertificates();

  if (error) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Kunde inte ladda statistik. Försök igen senare.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Statistik & Rapportering
          </h1>
          <p className="text-muted-foreground mt-1">
            Detaljerad analys av kursprestationer och deltagarstatistik
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Course Filter */}
          <Select value={courseFilter || ''} onValueChange={(v) => setCourseFilter(v || undefined)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alla kurser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alla kurser</SelectItem>
              {courses?.map((course) => (
                <SelectItem key={course.id} value={course.code}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Certificate Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Totalt utfärdade"
          value={stats?.certificateStats.total}
          icon={Award}
          loading={isLoading}
          color="text-green-500"
        />
        <StatsCard
          title="Denna månad"
          value={stats?.certificateStats.thisMonth}
          icon={Calendar}
          loading={isLoading}
          color="text-blue-500"
        />
        <StatsCard
          title="Går ut inom 30 dagar"
          value={stats?.certificateStats.expiringIn30Days}
          icon={AlertTriangle}
          loading={isLoading}
          color="text-amber-500"
        />
        <StatsCard
          title="Utgångna"
          value={stats?.certificateStats.expired}
          icon={AlertTriangle}
          loading={isLoading}
          color="text-red-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion by Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Kursslutföranden per vecka
            </CardTitle>
            <CardDescription>Antal kapitel slutförda över tid</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.completionByWeek && stats.completionByWeek.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.completionByWeek}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString('sv-SE')}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Slutföranden"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Ingen data tillgänglig
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollment by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inskrivningar per månad
            </CardTitle>
            <CardDescription>Nya deltagare registrerade över tid</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.enrollmentByMonth && stats.enrollmentByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.enrollmentByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('sv-SE', { month: 'short' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="count" name="Inskrivningar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Ingen data tillgänglig
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Poängfördelning
            </CardTitle>
            <CardDescription>Fördelning av quizresultat</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.scoreDistribution && stats.scoreDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="range"
                  >
                    {stats.scoreDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Ingen data tillgänglig
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chapter Pass Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Godkännandegrad per kapitel
            </CardTitle>
            <CardDescription>Procentandel som klarar quizet per kapitel</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : stats?.chapterPassRates && stats.chapterPassRates.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.chapterPassRates} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="chapterNumber"
                    tickFormatter={(v) => `Kap. ${v}`}
                    width={60}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value) => [`${(value as number | undefined)?.toFixed(1) ?? 0}%`, 'Godkännandegrad']}
                    labelFormatter={(v) => {
                      const chapter = stats.chapterPassRates.find((c) => c.chapterNumber === v);
                      return chapter?.title || `Kapitel ${v}`;
                    }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="passRate" name="Godkännandegrad" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Ingen data tillgänglig
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportera data
          </CardTitle>
          <CardDescription>Ladda ner rapporter i CSV-format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => exportParticipants.mutate(undefined)}
              disabled={exportParticipants.isPending}
            >
              {exportParticipants.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Deltagare
            </Button>

            <Button
              variant="outline"
              onClick={() => exportProgress.mutate(courseFilter)}
              disabled={exportProgress.isPending}
            >
              {exportProgress.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Progress
            </Button>

            <Button
              variant="outline"
              onClick={() => exportCertificates.mutate(courseFilter)}
              disabled={exportCertificates.isPending}
            >
              {exportCertificates.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Award className="h-4 w-4 mr-2" />
              )}
              Certifikat
            </Button>

            {courseFilter && (
              <Badge variant="secondary" className="ml-2">
                Filtrerat: {courses?.find((c) => c.code === courseFilter)?.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  loading,
  color,
}: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
