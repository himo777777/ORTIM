import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Trash2,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  useABTestSummary,
  useABTests,
  useABTestResults,
  useABTestManager,
  ABTestStatus,
  TestType,
  MetricType,
  ABTest,
  getStatusColor,
  getStatusLabel,
  getTestTypeLabel,
  getMetricLabel,
  formatUplift,
  formatPValue,
  isSignificant,
} from '@/hooks/useABTest';

// Status badge component
function StatusBadge({ status }: { status: ABTestStatus }) {
  return (
    <Badge
      variant="outline"
      style={{
        borderColor: getStatusColor(status),
        color: getStatusColor(status),
      }}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

// Test results component
function TestResultsView({ testId }: { testId: string }) {
  const { results, isLoading, error } = useABTestResults(testId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !results) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Kunde inte ladda resultat
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Deltagare</p>
              <p className="text-3xl font-bold">{results.totalParticipants}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Konfidensgrad</p>
              <p className="text-3xl font-bold">{results.confidenceLevel.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className={results.winner ? 'border-green-500' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Vinnare</p>
              <p className="text-xl font-bold">
                {results.winner ? results.winner.name : 'Ingen signifikant'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variants table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead className="text-right">Deltagare</TableHead>
            <TableHead className="text-right">Konverteringar</TableHead>
            <TableHead className="text-right">Konverteringsgrad</TableHead>
            <TableHead className="text-right">Förändring</TableHead>
            <TableHead className="text-right">P-värde</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.variants.map((variant) => (
            <TableRow
              key={variant.id}
              className={results.winner?.id === variant.id ? 'bg-green-50' : ''}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {variant.name}
                  {variant.isControl && (
                    <Badge variant="secondary" className="text-xs">
                      Kontroll
                    </Badge>
                  )}
                  {results.winner?.id === variant.id && (
                    <Badge className="bg-green-500 text-xs">Vinnare</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{variant.participants}</TableCell>
              <TableCell className="text-right">{variant.conversions}</TableCell>
              <TableCell className="text-right">
                {(variant.conversionRate * 100).toFixed(2)}%
              </TableCell>
              <TableCell className="text-right">
                {!variant.isControl && (
                  <span
                    className={
                      variant.uplift >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {variant.uplift >= 0 ? (
                      <TrendingUp className="inline h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="inline h-4 w-4 mr-1" />
                    )}
                    {formatUplift(variant.uplift)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!variant.isControl && (
                  <span
                    className={
                      isSignificant(variant.pValue)
                        ? 'text-green-600 font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {formatPValue(variant.pValue)}
                    {isSignificant(variant.pValue) && ' *'}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!results.isSignificant && results.totalParticipants < 100 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg text-yellow-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Fler deltagare behövs för statistiskt signifikanta resultat</span>
        </div>
      )}
    </div>
  );
}

export default function ABTestPage() {
  const { summary, isLoading: isLoadingSummary } = useABTestSummary();
  const [statusFilter, setStatusFilter] = useState<ABTestStatus | 'all'>('all');
  const { tests, isLoading: isLoadingTests, refetch } = useABTests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { createTest, updateStatus, deleteTest, isCreating, isUpdating, isDeleting } =
    useABTestManager();

  // Create test dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    testType: 'content' as TestType,
    targetPage: '',
    primaryMetric: 'completion_rate' as MetricType,
    trafficPercent: 100,
  });

  // Results dialog
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const handleCreateTest = async () => {
    await createTest({
      name: newTest.name,
      testType: newTest.testType,
      targetPage: newTest.targetPage || undefined,
      primaryMetric: newTest.primaryMetric,
      trafficPercent: newTest.trafficPercent,
      variants: [
        { name: 'Kontroll', isControl: true, config: {}, weight: 50 },
        { name: 'Variant A', config: {}, weight: 50 },
      ],
    });
    setShowCreateDialog(false);
    setNewTest({
      name: '',
      testType: 'content',
      targetPage: '',
      primaryMetric: 'completion_rate',
      trafficPercent: 100,
    });
    refetch();
  };

  const handleStatusChange = async (testId: string, newStatus: ABTestStatus) => {
    await updateStatus({ testId, status: newStatus });
    refetch();
  };

  const handleDelete = async (testId: string) => {
    if (confirm('Är du säker på att du vill ta bort detta test?')) {
      await deleteTest(testId);
      refetch();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            A/B-testning
          </h1>
          <p className="text-muted-foreground">
            Optimera innehåll genom kontrollerade experiment
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nytt test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa nytt A/B-test</DialogTitle>
              <DialogDescription>
                Definiera testet och dess varianter
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Testnamn</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="T.ex. Quiz-format optimering"
                />
              </div>

              <div className="space-y-2">
                <Label>Testtyp</Label>
                <Select
                  value={newTest.testType}
                  onValueChange={(v) => setNewTest({ ...newTest, testType: v as TestType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Innehåll</SelectItem>
                    <SelectItem value="ui">Gränssnitt</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="algorithm">Algoritm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Målsida (valfritt)</Label>
                <Input
                  value={newTest.targetPage}
                  onChange={(e) => setNewTest({ ...newTest, targetPage: e.target.value })}
                  placeholder="/quiz, /chapter/:id"
                />
              </div>

              <div className="space-y-2">
                <Label>Primärt mätvärde</Label>
                <Select
                  value={newTest.primaryMetric}
                  onValueChange={(v) =>
                    setNewTest({ ...newTest, primaryMetric: v as MetricType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion_rate">Slutförandegrad</SelectItem>
                    <SelectItem value="quiz_score">Quiz-poäng</SelectItem>
                    <SelectItem value="time_on_page">Tid på sidan</SelectItem>
                    <SelectItem value="click_rate">Klickfrekvens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trafik i testet: {newTest.trafficPercent}%</Label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={newTest.trafficPercent}
                  onChange={(e) =>
                    setNewTest({ ...newTest, trafficPercent: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateTest} disabled={!newTest.name || isCreating}>
                {isCreating ? 'Skapar...' : 'Skapa test'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktiva tester</p>
                    <p className="text-3xl font-bold">{summary?.byStatus.running || 0}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Totalt deltagare</p>
                    <p className="text-3xl font-bold">{summary?.totalParticipants || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Konverteringar</p>
                    <p className="text-3xl font-bold">{summary?.totalConversions || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avslutade</p>
                    <p className="text-3xl font-bold">{summary?.byStatus.completed || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tests list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alla tester</CardTitle>
              <CardDescription>
                Hantera och övervaka dina A/B-tester
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ABTestStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrera status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="DRAFT">Utkast</SelectItem>
                <SelectItem value="RUNNING">Aktiva</SelectItem>
                <SelectItem value="PAUSED">Pausade</SelectItem>
                <SelectItem value="COMPLETED">Avslutade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTests ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">Inga tester</h3>
              <p className="text-muted-foreground">
                Skapa ditt första A/B-test för att börja optimera
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Mätvärde</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Deltagare</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>{getTestTypeLabel(test.testType)}</TableCell>
                    <TableCell>{getMetricLabel(test.primaryMetric)}</TableCell>
                    <TableCell>
                      <StatusBadge status={test.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {test._count?.assignments || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {test.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(test.id, 'RUNNING')}
                            disabled={isUpdating}
                          >
                            <Play className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {test.status === 'RUNNING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(test.id, 'PAUSED')}
                            disabled={isUpdating}
                          >
                            <Pause className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                        {test.status === 'PAUSED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(test.id, 'RUNNING')}
                              disabled={isUpdating}
                            >
                              <Play className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(test.id, 'COMPLETED')}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTestId(test.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>{test.name} - Resultat</DialogTitle>
                            </DialogHeader>
                            <TestResultsView testId={test.id} />
                          </DialogContent>
                        </Dialog>
                        {test.status !== 'RUNNING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(test.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
