import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  CheckCircle,
  Search,
  RefreshCw,
  Mail,
  Phone,
  TrendingDown,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Users,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAtRiskLearners,
  getRiskLevelColor,
  getRiskLevelLabel,
  type AtRiskLearner,
} from '@/hooks/usePredictions';

// Risk level icons
function RiskLevelIcon({ level }: { level: AtRiskLearner['riskLevel'] }) {
  const iconProps = { className: 'h-5 w-5' };
  switch (level) {
    case 'critical':
      return <AlertOctagon {...iconProps} style={{ color: getRiskLevelColor(level) }} />;
    case 'high':
      return <AlertTriangle {...iconProps} style={{ color: getRiskLevelColor(level) }} />;
    case 'medium':
      return <AlertCircle {...iconProps} style={{ color: getRiskLevelColor(level) }} />;
    case 'low':
      return <CheckCircle {...iconProps} style={{ color: getRiskLevelColor(level) }} />;
  }
}

// Risk badge component
function RiskBadge({ level, score }: { level: AtRiskLearner['riskLevel']; score: number }) {
  return (
    <Badge
      variant="outline"
      className="gap-1"
      style={{
        borderColor: getRiskLevelColor(level),
        color: getRiskLevelColor(level),
        backgroundColor: `${getRiskLevelColor(level)}10`,
      }}
    >
      <RiskLevelIcon level={level} />
      {getRiskLevelLabel(level)} ({score}%)
    </Badge>
  );
}

// Learner detail dialog
function LearnerDetailDialog({ learner }: { learner: AtRiskLearner }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Visa detaljer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {learner.userName}
            <RiskBadge level={learner.riskLevel} score={learner.riskScore} />
          </DialogTitle>
          <DialogDescription>
            {learner.email && <span>{learner.email}</span>}
            {learner.cohort && <span> | Kohort: {learner.cohort}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Kursframsteg</span>
              <span className="font-medium">{learner.progress}%</span>
            </div>
            <Progress value={learner.progress} className="h-2" />
          </div>

          {/* Risk factors */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Riskfaktorer
            </h4>
            <div className="space-y-2">
              {learner.factors.map((factor, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20"
                >
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{factor.factor}</p>
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended actions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Rekommenderade atgarder
            </h4>
            <ul className="space-y-2">
              {learner.recommendedActions.map((action, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-blue-50 dark:bg-blue-950/20"
                >
                  <Zap className="h-4 w-4 text-blue-500" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {learner.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${learner.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Skicka e-post
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Kontakta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stats card
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AtRiskLearnersPage() {
  const [minRiskScore, setMinRiskScore] = useState(40);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');

  const { learners, stats, isLoading, error, refresh } = useAtRiskLearners(minRiskScore);

  // Filter learners
  const filteredLearners = learners.filter((learner) => {
    const matchesSearch =
      learner.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      learner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      learner.cohort?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRiskLevel =
      riskLevelFilter === 'all' || learner.riskLevel === riskLevelFilter;

    return matchesSearch && matchesRiskLevel;
  });

  // Format last activity
  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Aldrig';
    const d = new Date(date);
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Idag';
    if (days === 1) return 'Igar';
    return `${days} dagar sedan`;
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-medium">Kunde inte ladda data</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
            <Button onClick={refresh} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Forsok igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riskdeltagare</h1>
          <p className="text-muted-foreground">
            Identifiera och stod deltagare som riskerar att avbryta kursen
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Uppdatera
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Totalt i riskzonen"
              value={stats.total}
              icon={Users}
              color="#6366f1"
              description={`Med riskpoang >= ${minRiskScore}`}
            />
            <StatCard
              title="Kritisk risk"
              value={stats.critical}
              icon={AlertOctagon}
              color="#DC2626"
              description="Krav omedelbar atgard"
            />
            <StatCard
              title="Hog risk"
              value={stats.high}
              icon={AlertTriangle}
              color="#F97316"
              description="Behover uppmrksamhet"
            />
            <StatCard
              title="Genomsnittlig riskpoang"
              value={`${stats.averageRiskScore}%`}
              icon={TrendingDown}
              color="#FBBF24"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sok deltagare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Riskniva" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla nivaer</SelectItem>
                <SelectItem value="critical">Kritisk</SelectItem>
                <SelectItem value="high">Hog</SelectItem>
                <SelectItem value="medium">Medel</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={minRiskScore.toString()}
              onValueChange={(v) => setMinRiskScore(parseInt(v))}
            >
              <SelectTrigger className="w-[180px]">
                <Target className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Min riskpoang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">Riskpoäng ≥ 20</SelectItem>
                <SelectItem value="40">Riskpoäng ≥ 40</SelectItem>
                <SelectItem value="60">Riskpoäng ≥ 60</SelectItem>
                <SelectItem value="80">Riskpoäng ≥ 80</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Learners table */}
      <Card>
        <CardHeader>
          <CardTitle>Deltagare i riskzonen</CardTitle>
          <CardDescription>
            {filteredLearners.length} av {learners.length} deltagare visas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLearners.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="font-medium text-lg">Inga riskdeltagare hittades</h3>
              <p className="text-muted-foreground">
                Alla deltagare verkar vara pa ratt spor!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deltagare</TableHead>
                  <TableHead>Kohort</TableHead>
                  <TableHead>Riskniva</TableHead>
                  <TableHead>Framsteg</TableHead>
                  <TableHead>Senast aktiv</TableHead>
                  <TableHead className="text-right">Atgarder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLearners.map((learner) => (
                  <TableRow key={learner.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{learner.userName}</p>
                        <p className="text-sm text-muted-foreground">{learner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{learner.cohort || '-'}</TableCell>
                    <TableCell>
                      <RiskBadge level={learner.riskLevel} score={learner.riskScore} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={learner.progress} className="h-2 w-20" />
                        <span className="text-sm">{learner.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatLastActivity(learner.lastActivity)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <LearnerDetailDialog learner={learner} />
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
