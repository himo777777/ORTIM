import { useState, useEffect } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  Download,
  Save,
  Play,
  Trash2,
  Plus,
  FileSpreadsheet,
  FileJson,
  Clock,
  Users,
  BookOpen,
  HelpCircle,
  BarChart3,
  PieChartIcon,
  Loader2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useReportBuilder,
  useSavedReports,
  REPORT_PRESETS,
  type ReportType,
  type ReportResult,
  type GenerateReportParams,
} from '@/hooks/useReportBuilder';

const COLORS = ['#0D7377', '#E85A4F', '#14A3A8', '#FDCB6E', '#00B894', '#6C5CE7'];

// Report type options
const REPORT_TYPES: { value: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'cohort',
    label: 'Kohortrapport',
    icon: Users,
    description: 'Jamfor prestationer mellan kohorter',
  },
  {
    value: 'question',
    label: 'Frageanalys',
    icon: HelpCircle,
    description: 'Analysera fragesvårighet och prestationer',
  },
  {
    value: 'progress',
    label: 'Framstegsrapport',
    icon: BarChart3,
    description: 'Oversikt over deltagarnas framsteg',
  },
  {
    value: 'learner',
    label: 'Deltagarrapport',
    icon: BookOpen,
    description: 'Detaljerad rapport for enskilda deltagare',
  },
];

// Report result display
function ReportResultView({ result }: { result: ReportResult }) {
  const visibleColumns = result.columns.filter((c) => c.visible);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sammanfattning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(result.summary).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{String(value)}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {result.charts && result.charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  {chart.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        nameKey="label"
                        label={({ name, value }: { name?: string; value?: number }) => `${name || ''}: ${value || 0}`}
                      >
                        {chart.data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0D7377" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data ({result.data.length} rader)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col) => (
                    <TableHead key={col.field}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.slice(0, 20).map((row, i) => (
                  <TableRow key={i}>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.field}>
                        {formatCellValue(row[col.field], col.type)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {result.data.length > 20 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Visar 20 av {result.data.length} rader. Exportera for att se alla.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Format cell value based on type
function formatCellValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return '-';
  if (type === 'percentage') return `${value}%`;
  if (type === 'date') {
    try {
      return new Date(value as string).toLocaleDateString('sv-SE');
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Save report dialog
function SaveReportDialog({
  params,
  onSave,
}: {
  params: GenerateReportParams;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(name, description);
    setOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Spara rapport
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spara rapportkonfiguration</DialogTitle>
          <DialogDescription>
            Spara denna rapport for att kunna kora den igen senare.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Min rapport"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning (valfritt)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskrivning av rapporten"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReportBuilderPage() {
  const [reportType, setReportType] = useState<ReportType>('progress');
  const [title, setTitle] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);

  const {
    result,
    isGenerating,
    error,
    generateReport,
    exportCSV,
    exportJSON,
    clearResult,
  } = useReportBuilder();

  const {
    reports: savedReports,
    isLoading: loadingSaved,
    fetchReports,
    saveReport,
    runReport,
    deleteReport,
  } = useSavedReports();

  // Fetch saved reports on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerate = async () => {
    const params: GenerateReportParams = {
      reportType,
      title: title || undefined,
      includeCharts,
    };
    await generateReport(params);
  };

  const handleSave = async (name: string, description: string) => {
    await saveReport({
      name,
      description,
      reportType,
      configuration: {
        reportType,
        title: title || `${reportType} Rapport`,
        filters: {},
        columns: [],
        includeCharts,
      },
    });
    fetchReports();
  };

  const handleRunSaved = async (id: string) => {
    const result = await runReport(id);
    // Result will be shown automatically
  };

  const handleExportCSV = () => {
    exportCSV({
      reportType,
      title: title || undefined,
      includeCharts: false,
    });
  };

  const handleExportJSON = () => {
    exportJSON({
      reportType,
      title: title || undefined,
      includeCharts,
    });
  };

  const handlePreset = async (preset: typeof REPORT_PRESETS[0]) => {
    setReportType(preset.params.reportType);
    setTitle(preset.params.title || '');
    setIncludeCharts(preset.params.includeCharts ?? true);
    await generateReport(preset.params);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Rapportverktyg</h1>
        <p className="text-muted-foreground">
          Skapa anpassade rapporter och exportera data
        </p>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Skapa rapport</TabsTrigger>
          <TabsTrigger value="saved">
            Sparade rapporter
            {savedReports.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {savedReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="presets">Snabbval</TabsTrigger>
        </TabsList>

        {/* Builder tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Konfiguration</CardTitle>
                <CardDescription>Valj rapporttyp och installningar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rapporttyp</Label>
                  <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {REPORT_TYPES.find((t) => t.value === reportType)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titel (valfritt)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ange rapporttitel"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeCharts"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="includeCharts">Inkludera diagram</Label>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Genererar...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generera rapport
                      </>
                    )}
                  </Button>

                  {result && (
                    <>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={handleExportCSV}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={handleExportJSON}
                        >
                          <FileJson className="h-4 w-4 mr-1" />
                          JSON
                        </Button>
                      </div>
                      <SaveReportDialog
                        params={{ reportType, title, includeCharts }}
                        onSave={handleSave}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result */}
            <div className="lg:col-span-2">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-red-600">{error.message}</p>
                  </CardContent>
                </Card>
              )}

              {isGenerating && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {result && !isGenerating && <ReportResultView result={result} />}

              {!result && !isGenerating && !error && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg">Ingen rapport genererad</h3>
                      <p className="text-muted-foreground">
                        Valj rapporttyp och klicka pa "Generera rapport"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Saved reports tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Sparade rapporter</CardTitle>
              <CardDescription>
                Dina sparade rapportkonfigurationer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSaved ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : savedReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">Inga sparade rapporter</h3>
                  <p className="text-muted-foreground">
                    Generera och spara en rapport for att se den har.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Namn</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Skapad</TableHead>
                      <TableHead>Senast kord</TableHead>
                      <TableHead className="text-right">Atgarder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            {report.description && (
                              <p className="text-sm text-muted-foreground">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.reportType}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.createdAt).toLocaleDateString('sv-SE')}
                        </TableCell>
                        <TableCell>
                          {report.lastRunAt
                            ? new Date(report.lastRunAt).toLocaleDateString('sv-SE')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunSaved(report.id)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets tab */}
        <TabsContent value="presets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_PRESETS.map((preset) => (
              <Card
                key={preset.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handlePreset(preset)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
