import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Database,
  Filter,
  Columns,
  Send,
  CheckCircle,
  AlertCircle,
  FileJson,
  FileText,
  Users,
  BarChart3,
  Brain,
  Activity,
  Award,
  TrendingUp,
} from 'lucide-react';
import {
  useBiExport,
  useExportColumns,
  ExportDataType,
  ExportFormat,
  ExportConfig,
  SCHEDULE_PRESETS,
  formatSchedule,
} from '@/hooks/useBiExport';

// Icons for data types
const dataTypeIcons: Record<ExportDataType, React.ReactNode> = {
  users: <Users className="h-4 w-4" />,
  progress: <BarChart3 className="h-4 w-4" />,
  quiz_results: <Brain className="h-4 w-4" />,
  sessions: <Activity className="h-4 w-4" />,
  events: <Activity className="h-4 w-4" />,
  cohorts: <Users className="h-4 w-4" />,
  certificates: <Award className="h-4 w-4" />,
  predictions: <TrendingUp className="h-4 w-4" />,
};

// Format icons
const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="h-4 w-4" />,
  json: <FileJson className="h-4 w-4" />,
  xlsx: <FileSpreadsheet className="h-4 w-4" />,
};

export default function DataExportPage() {
  const {
    dataTypes,
    formats,
    isLoadingOptions,
    generateAndDownload,
    isGenerating,
    generateError,
    clearGenerateError,
    scheduledExports,
    createScheduledExport,
    deleteScheduledExport,
    isLoadingScheduled,
    isCreating,
    isDeleting,
    stats,
    isLoadingStats,
  } = useBiExport();

  // Export form state
  const [selectedDataType, setSelectedDataType] = useState<ExportDataType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [includeHeaders, setIncludeHeaders] = useState(true);

  // Scheduled export dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleValue, setScheduleValue] = useState(SCHEDULE_PRESETS[0].value);
  const [recipients, setRecipients] = useState('');

  // Get columns for selected data type
  const { columns: availableColumns, isLoading: isLoadingColumns } =
    useExportColumns(selectedDataType);

  // Handle export
  const handleExport = async () => {
    if (!selectedDataType) return;

    const config: ExportConfig = {
      dataType: selectedDataType,
      format: selectedFormat,
      filters: {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      columns: selectedColumns.length > 0 ? selectedColumns : undefined,
      includeHeaders,
    };

    await generateAndDownload(config);
  };

  // Handle scheduled export creation
  const handleCreateScheduledExport = async () => {
    if (!selectedDataType || !scheduleName) return;

    const config: ExportConfig = {
      dataType: selectedDataType,
      format: selectedFormat,
      filters: {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      columns: selectedColumns.length > 0 ? selectedColumns : undefined,
      includeHeaders,
    };

    await createScheduledExport({
      name: scheduleName,
      config,
      schedule: scheduleValue,
      recipients: recipients.split(',').map((e) => e.trim()).filter(Boolean),
    });

    setShowScheduleDialog(false);
    setScheduleName('');
    setRecipients('');
  };

  // Toggle column selection
  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  // Select all columns
  const selectAllColumns = () => {
    setSelectedColumns(availableColumns);
  };

  // Clear column selection
  const clearColumnSelection = () => {
    setSelectedColumns([]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dataexport</h1>
          <p className="text-muted-foreground">
            Exportera data för analys i externa BI-verktyg som Excel, Power BI eller Tableau
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingStats ? (
          <>
            {[1, 2, 3].map((i) => (
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
                    <p className="text-sm text-muted-foreground">Schemalagda exporter</p>
                    <p className="text-3xl font-bold">{stats?.scheduledExports || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Datatyper tillgangliga</p>
                    <p className="text-3xl font-bold">{dataTypes.length}</p>
                  </div>
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Senaste export</p>
                    <p className="text-lg font-medium">
                      {stats?.lastExportAt
                        ? new Date(stats.lastExportAt).toLocaleDateString('sv-SE')
                        : 'Ingen'}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Skapa export
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schemalagda ({scheduledExports.length})
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Data Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Valj datatyp
                  </CardTitle>
                  <CardDescription>
                    Valj vilken typ av data du vill exportera
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOptions ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {dataTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => {
                            setSelectedDataType(type.id);
                            setSelectedColumns([]);
                          }}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            selectedDataType === type.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {dataTypeIcons[type.id]}
                            <span className="font-medium text-sm">{type.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {type.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter
                  </CardTitle>
                  <CardDescription>
                    Begränsa exporten med datumintervall
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Startdatum</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Slutdatum</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column Selection */}
              {selectedDataType && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Columns className="h-5 w-5" />
                          Valj kolumner
                        </CardTitle>
                        <CardDescription>
                          Valj vilka kolumner som ska inkluderas (alla om ingen vald)
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectAllColumns}>
                          Valj alla
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearColumnSelection}>
                          Rensa
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingColumns ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableColumns.map((column) => (
                          <label
                            key={column}
                            className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedColumns.includes(column)}
                              onCheckedChange={() => toggleColumn(column)}
                            />
                            <span className="text-sm">{column}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Export Options & Actions */}
            <div className="space-y-6">
              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Exportformat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedFormat === format.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {formatIcons[format.id]}
                        <span className="font-medium">{format.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format.description}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Alternativ</CardTitle>
                </CardHeader>
                <CardContent>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={includeHeaders}
                      onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                    />
                    <span className="text-sm">Inkludera kolumnrubriker</span>
                  </label>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleExport}
                    disabled={!selectedDataType || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Genererar...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner export
                      </>
                    )}
                  </Button>

                  <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!selectedDataType}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schemalag export
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schemalag export</DialogTitle>
                        <DialogDescription>
                          Skapa en automatisk export som kors enligt schema
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="scheduleName">Namn</Label>
                          <Input
                            id="scheduleName"
                            value={scheduleName}
                            onChange={(e) => setScheduleName(e.target.value)}
                            placeholder="T.ex. Veckovis framstegsrapport"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="schedule">Schema</Label>
                          <Select value={scheduleValue} onValueChange={setScheduleValue}>
                            <SelectTrigger>
                              <SelectValue placeholder="Valj schema" />
                            </SelectTrigger>
                            <SelectContent>
                              {SCHEDULE_PRESETS.map((preset) => (
                                <SelectItem key={preset.value} value={preset.value}>
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recipients">Mottagare (e-post)</Label>
                          <Input
                            id="recipients"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                            placeholder="email1@example.com, email2@example.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            Separera flera adresser med komma
                          </p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowScheduleDialog(false)}
                        >
                          Avbryt
                        </Button>
                        <Button
                          onClick={handleCreateScheduledExport}
                          disabled={!scheduleName || isCreating}
                        >
                          {isCreating ? 'Skapar...' : 'Skapa schema'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {generateError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {generateError.message}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearGenerateError}
                        className="ml-auto"
                      >
                        Stang
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Scheduled Exports Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Schemalagda exporter</CardTitle>
              <CardDescription>
                Hantera automatiska exporter som kors enligt schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingScheduled ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : scheduledExports.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Inga schemalagda exporter</h3>
                  <p className="text-muted-foreground">
                    Skapa en schemalagd export for att automatisera din datahantering
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Namn</TableHead>
                      <TableHead>Datatyp</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Schema</TableHead>
                      <TableHead>Senast kord</TableHead>
                      <TableHead className="text-right">Atgarder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledExports.map((export_) => (
                      <TableRow key={export_.id}>
                        <TableCell className="font-medium">{export_.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {dataTypeIcons[export_.config.dataType]}
                            {export_.config.dataType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {formatIcons[export_.config.format]}
                            {export_.config.format.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatSchedule(export_.schedule)}</TableCell>
                        <TableCell>
                          {export_.lastRunAt
                            ? new Date(export_.lastRunAt).toLocaleDateString('sv-SE')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteScheduledExport(export_.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
