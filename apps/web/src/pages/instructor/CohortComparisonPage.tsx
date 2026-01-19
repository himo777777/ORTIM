import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  BarChart3,
  Target,
  Award,
  BookOpen,
  Percent,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCohortComparison,
  useCohortBenchmark,
  useCohortList,
  getBenchmarkStatus,
  getBenchmarkColor,
  formatMetricValue,
  type CohortComparisonData,
  type BenchmarkComparison,
} from '@/hooks/useCohortComparison';

const CHART_COLORS = ['#0D7377', '#E85A4F', '#14A3A8', '#FDCB6E', '#00B894', '#6C5CE7'];

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {trend && (
              <div className={cn(
                'flex items-center',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {trend === 'neutral' && <Minus className="h-4 w-4" />}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Benchmark row component
function BenchmarkRow({ comparison }: { comparison: BenchmarkComparison }) {
  const status = getBenchmarkStatus(comparison.difference, comparison.metric);
  const color = getBenchmarkColor(status);

  return (
    <TableRow>
      <TableCell className="font-medium">{comparison.metric}</TableCell>
      <TableCell className="text-right">
        {formatMetricValue(comparison.cohortValue, comparison.unit)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatMetricValue(comparison.platformValue, comparison.unit)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {status === 'positive' && <TrendingUp className="h-4 w-4" style={{ color }} />}
          {status === 'negative' && <TrendingDown className="h-4 w-4" style={{ color }} />}
          {status === 'neutral' && <Minus className="h-4 w-4" style={{ color }} />}
          <span style={{ color }}>
            {comparison.difference > 0 ? '+' : ''}
            {comparison.difference.toFixed(1)}{comparison.unit === '%' ? ' pp' : ''}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Cohort selector
function CohortSelector({
  cohorts,
  selectedIds,
  onToggle,
  isLoading,
}: {
  cohorts: { id: string; name: string; course: { name: string }; _count: { enrollments: number } }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {cohorts.map((cohort) => (
        <div
          key={cohort.id}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
            selectedIds.includes(cohort.id)
              ? 'border-primary bg-primary/5'
              : 'border-transparent bg-muted/50 hover:bg-muted'
          )}
          onClick={() => onToggle(cohort.id)}
        >
          <Checkbox
            checked={selectedIds.includes(cohort.id)}
            onCheckedChange={() => onToggle(cohort.id)}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{cohort.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {cohort.course.name}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {cohort._count.enrollments} deltagare
          </Badge>
        </div>
      ))}
      {cohorts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Inga kohorter hittades</p>
        </div>
      )}
    </div>
  );
}

export default function CohortComparisonPage() {
  const [benchmarkCohortId, setBenchmarkCohortId] = useState<string>('');
  const { cohorts, isLoading: cohortsLoading } = useCohortList();
  const {
    selectedCohortIds,
    result,
    isLoading: comparisonLoading,
    error: comparisonError,
    compareCohorts,
    clearComparison,
    addCohort,
    removeCohort,
  } = useCohortComparison();
  const {
    result: benchmarkResult,
    isLoading: benchmarkLoading,
    benchmark,
  } = useCohortBenchmark();

  const toggleCohort = (id: string) => {
    if (selectedCohortIds.includes(id)) {
      removeCohort(id);
    } else {
      addCohort(id);
    }
  };

  const handleCompare = () => {
    if (selectedCohortIds.length >= 2) {
      compareCohorts(selectedCohortIds);
    }
  };

  const handleBenchmark = () => {
    if (benchmarkCohortId) {
      benchmark(benchmarkCohortId);
    }
  };

  // Prepare radar chart data
  const radarChartData = result?.radarData?.[0]?.axes.map((axis) => {
    const dataPoint: Record<string, string | number> = { axis: axis.axis };
    result.radarData.forEach((cohort, index) => {
      const matchingAxis = cohort.axes.find((a) => a.axis === axis.axis);
      dataPoint[cohort.cohortName] = matchingAxis?.value || 0;
    });
    return dataPoint;
  }) || [];

  // Prepare bar chart data for metrics
  const barChartData = result?.metrics.map((metric) => {
    const dataPoint: Record<string, string | number> = { name: metric.name };
    metric.values.forEach((v) => {
      dataPoint[v.cohortName] = v.value;
    });
    return dataPoint;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Kohortjämförelse</h1>
        <p className="text-muted-foreground mt-1">
          Jämför prestationer mellan kohorter eller mot plattformsgenomsnittet
        </p>
      </div>

      {/* Selection & Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Multi-cohort comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Jämför kohorter
            </CardTitle>
            <CardDescription>
              Välj minst 2 kohorter för att jämföra prestationer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CohortSelector
              cohorts={cohorts}
              selectedIds={selectedCohortIds}
              onToggle={toggleCohort}
              isLoading={cohortsLoading}
            />

            {selectedCohortIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedCohortIds.map((id) => {
                  const cohort = cohorts.find((c) => c.id === id);
                  return cohort ? (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => removeCohort(id)}
                    >
                      {cohort.name}
                      <X className="h-3 w-3" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCompare}
                disabled={selectedCohortIds.length < 2 || comparisonLoading}
                className="flex-1"
              >
                {comparisonLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Jämför ({selectedCohortIds.length} valda)
              </Button>
              {result && (
                <Button variant="outline" onClick={clearComparison}>
                  Rensa
                </Button>
              )}
            </div>

            {comparisonError && (
              <p className="text-sm text-destructive">{comparisonError.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Benchmark against platform */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Benchmark mot plattformen
            </CardTitle>
            <CardDescription>
              Jämför en kohort mot plattformens genomsnitt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={benchmarkCohortId}
              onValueChange={setBenchmarkCohortId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kohort..." />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleBenchmark}
              disabled={!benchmarkCohortId || benchmarkLoading}
              className="w-full"
            >
              {benchmarkLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              Visa benchmark
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Results */}
      {result && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Kohorter jämförda"
              value={result.cohorts.length}
              icon={Users}
            />
            <StatCard
              title="Totalt deltagare"
              value={result.cohorts.reduce((sum, c) => sum + c.participants, 0)}
              icon={Users}
            />
            <StatCard
              title="Snitt slutförandegrad"
              value={`${Math.round(result.cohorts.reduce((sum, c) => sum + c.completionRate, 0) / result.cohorts.length)}%`}
              icon={Percent}
            />
            <StatCard
              title="Snitt quizpoäng"
              value={`${Math.round(result.cohorts.reduce((sum, c) => sum + c.avgQuizScore, 0) / result.cohorts.length)}%`}
              icon={Award}
            />
          </div>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Prestandaöversikt</CardTitle>
              <CardDescription>
                Jämför kohorter på flera dimensioner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="axis" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    {result.radarData.map((cohort, index) => (
                      <Radar
                        key={cohort.cohortId}
                        name={cohort.cohortName}
                        dataKey={cohort.cohortName}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart Comparisons */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad jämförelse</CardTitle>
              <CardDescription>
                Sidovis jämförelse av nyckeltal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {result.cohorts.map((cohort, index) => (
                      <Bar
                        key={cohort.id}
                        dataKey={cohort.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cohort Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Kohortdetaljer</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kohort</TableHead>
                    <TableHead className="text-right">Deltagare</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead className="text-right">Quizpoäng</TableHead>
                    <TableHead className="text-right">Slutförandegrad</TableHead>
                    <TableHead className="text-right">Examensgrad</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.cohorts.map((cohort, index) => (
                    <TableRow key={cohort.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="font-medium">{cohort.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{cohort.participants}</TableCell>
                      <TableCell className="text-right">{cohort.avgProgress.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{cohort.avgQuizScore.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{cohort.completionRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{cohort.examPassRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{cohort.avgXP.toLocaleString('sv-SE')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benchmark Results */}
      {benchmarkResult && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Benchmark: {benchmarkResult.cohort.name}
            </h2>
          </div>

          {/* Benchmark Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Deltagare"
              value={benchmarkResult.cohort.participants}
              icon={Users}
              description={`Plattformssnitt: ${benchmarkResult.platformAverage.participants}`}
            />
            <StatCard
              title="Slutförandegrad"
              value={`${benchmarkResult.cohort.completionRate.toFixed(1)}%`}
              icon={Percent}
              trend={getBenchmarkStatus(
                benchmarkResult.cohort.completionRate - benchmarkResult.platformAverage.completionRate,
                'completionRate'
              ) as 'up' | 'down' | 'neutral'}
              description={`Plattform: ${benchmarkResult.platformAverage.completionRate.toFixed(1)}%`}
            />
            <StatCard
              title="Quizpoäng"
              value={`${benchmarkResult.cohort.avgQuizScore.toFixed(1)}%`}
              icon={Award}
              trend={getBenchmarkStatus(
                benchmarkResult.cohort.avgQuizScore - benchmarkResult.platformAverage.avgQuizScore,
                'quizScore'
              ) as 'up' | 'down' | 'neutral'}
              description={`Plattform: ${benchmarkResult.platformAverage.avgQuizScore.toFixed(1)}%`}
            />
          </div>

          {/* Benchmark Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad benchmark</CardTitle>
              <CardDescription>
                Jämförelse mot plattformens genomsnitt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metrik</TableHead>
                    <TableHead className="text-right">Kohort</TableHead>
                    <TableHead className="text-right">Plattformssnitt</TableHead>
                    <TableHead className="text-right">Skillnad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmarkResult.comparison.map((comp) => (
                    <BenchmarkRow key={comp.metric} comparison={comp} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!result && !benchmarkResult && !comparisonLoading && !benchmarkLoading && (
        <Card className="py-12">
          <CardContent className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Ingen jämförelse aktiv</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Välj minst två kohorter ovan för att jämföra deras prestationer,
              eller välj en kohort för att se en benchmark mot plattformsgenomsnittet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
