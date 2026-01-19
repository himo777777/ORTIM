import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  BookOpen,
  Brain,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Analytics hooks
function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.request<{
      activeUsers: { daily: number; weekly: number; monthly: number };
      engagement: { averageSessionMinutes: number; pageViewsPerSession: number };
      completion: { courseCompletionRate: number; quizPassRate: number };
    }>('/analytics/overview'),
    staleTime: 2 * 60 * 1000,
  });
}

function useUserEngagement() {
  return useQuery({
    queryKey: ['analytics', 'users'],
    queryFn: () => api.request<{
      totalUsers: number;
      activeToday: number;
      newThisWeek: number;
      avgSessionDuration: number;
    }>('/analytics/users'),
    staleTime: 2 * 60 * 1000,
  });
}

function useDailyActivity(days: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'activity', days],
    queryFn: () => api.request<Array<{
      date: string;
      logins: number;
      quizAttempts: number;
      chaptersRead: number;
    }>>(`/analytics/activity?days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}

function useQuestionAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'questions'],
    queryFn: () => api.request<{
      hardestQuestions: Array<{
        id: string;
        questionCode: string;
        correctRate: number;
        attempts: number;
      }>;
      easiestQuestions: Array<{
        id: string;
        questionCode: string;
        correctRate: number;
        attempts: number;
      }>;
    }>('/analytics/questions'),
    staleTime: 10 * 60 * 1000,
  });
}

export default function AnalyticsDashboardPage() {
  const [activityDays, setActivityDays] = useState(30);
  const { data: engagement, isLoading: engagementLoading } = useUserEngagement();
  const { data: activity, isLoading: activityLoading } = useDailyActivity(activityDays);
  const { data: questions, isLoading: questionsLoading } = useQuestionAnalytics();

  // Mock engagement funnel data
  const funnelData = [
    { name: 'Registrerade', value: engagement?.totalUsers ?? 0, fill: '#3b82f6' },
    { name: 'Startade kurs', value: Math.round((engagement?.totalUsers ?? 0) * 0.85), fill: '#06b6d4' },
    { name: 'Quiz gjorda', value: Math.round((engagement?.totalUsers ?? 0) * 0.65), fill: '#10b981' },
    { name: 'Certifierade', value: Math.round((engagement?.totalUsers ?? 0) * 0.35), fill: '#f59e0b' },
  ];

  // Mock retention data
  const retentionData = [
    { name: 'Dag 1', retention: 100 },
    { name: 'Dag 7', retention: 68 },
    { name: 'Dag 14', retention: 52 },
    { name: 'Dag 30', retention: 38 },
    { name: 'Dag 60', retention: 28 },
    { name: 'Dag 90', retention: 22 },
  ];

  // Mock time distribution
  const timeDistribution = [
    { hour: '06-09', users: 12 },
    { hour: '09-12', users: 45 },
    { hour: '12-15', users: 38 },
    { hour: '15-18', users: 52 },
    { hour: '18-21', users: 65 },
    { hour: '21-24', users: 28 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Realtidsöversikt av plattformsengagemang och användaraktivitet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/statistics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detaljerad statistik
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RealTimeCard
          title="Aktiva idag"
          value={engagement?.activeToday}
          icon={Zap}
          loading={engagementLoading}
          color="text-green-500"
          trend={{ value: 12, positive: true }}
        />
        <RealTimeCard
          title="Totala användare"
          value={engagement?.totalUsers}
          icon={Users}
          loading={engagementLoading}
          color="text-blue-500"
        />
        <RealTimeCard
          title="Nya denna vecka"
          value={engagement?.newThisWeek}
          icon={TrendingUp}
          loading={engagementLoading}
          color="text-purple-500"
          trend={{ value: 8, positive: true }}
        />
        <RealTimeCard
          title="Snittid (min)"
          value={engagement?.avgSessionDuration}
          icon={Clock}
          loading={engagementLoading}
          color="text-amber-500"
        />
      </div>

      {/* Engagement Funnel & Retention */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Konverteringstratt
            </CardTitle>
            <CardDescription>Användarresa från registrering till certifiering</CardDescription>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-4">
                {funnelData.map((item, index) => {
                  const percentage = index === 0
                    ? 100
                    : Math.round((item.value / funnelData[0].value) * 100);
                  const dropoff = index > 0
                    ? Math.round(((funnelData[index - 1].value - item.value) / funnelData[index - 1].value) * 100)
                    : 0;

                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.value}</span>
                          <span className="text-xs text-muted-foreground">({percentage}%)</span>
                          {dropoff > 0 && (
                            <span className="text-xs text-red-500">-{dropoff}%</span>
                          )}
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retention Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Användarbehållning
            </CardTitle>
            <CardDescription>Procentandel som återkommer över tid</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, 'Behållning']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="retention"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daglig aktivitet
            </CardTitle>
            <CardDescription>Inloggningar, quiz och läsaktivitet över tid</CardDescription>
          </div>
          <Tabs value={String(activityDays)} onValueChange={(v) => setActivityDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="7">7 dagar</TabsTrigger>
              <TabsTrigger value="30">30 dagar</TabsTrigger>
              <TabsTrigger value="90">90 dagar</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : activity && activity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString('sv-SE')}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="logins"
                  name="Inloggningar"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="quizAttempts"
                  name="Quiz"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="chaptersRead"
                  name="Kapitel"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Ingen aktivitetsdata tillgänglig
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Performance & Time Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hardest Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Svåraste frågorna
            </CardTitle>
            <CardDescription>Frågor med lägst korrekthetsgrad</CardDescription>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : questions?.hardestQuestions && questions.hardestQuestions.length > 0 ? (
              <div className="space-y-3">
                {questions.hardestQuestions.slice(0, 5).map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-red-600">#{index + 1}</span>
                      <span className="text-sm font-medium">{q.questionCode}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {Math.round(q.correctRate * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">{q.attempts} försök</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ingen frågedata tillgänglig
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aktivitet per tid på dagen
            </CardTitle>
            <CardDescription>När användare är mest aktiva</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Bar dataKey="users" name="Användare" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/statistics">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Detaljerad statistik
              </Button>
            </Link>
            <Link to="/admin/questions">
              <Button variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Hantera frågor
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Användarhantering
              </Button>
            </Link>
            <Link to="/admin/courses">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Kurshantering
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components
function RealTimeCard({
  title,
  value,
  icon: Icon,
  loading,
  color,
  trend,
}: {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  color: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', color)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{value ?? 0}</div>
            {trend && (
              <div className={cn(
                'flex items-center text-xs',
                trend.positive ? 'text-green-500' : 'text-red-500'
              )}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.value}%
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
