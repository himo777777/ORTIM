import { Link } from 'react-router-dom';
import { useOrganizationPortal, useExportOrganizationData } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Download,
  ChevronRight,
  Loader2,
  BarChart3,
} from 'lucide-react';

export default function OrganizationPortalPage() {
  const { data, isLoading, error } = useOrganizationPortal();
  const exportMutation = useExportOrganizationData();

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Kunde inte ladda organisationsportalen. Du kanske inte har behörighet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {data?.organization.logoUrl ? (
            <img
              src={data.organization.logoUrl}
              alt={data.organization.name}
              className="h-16 w-16 rounded-lg object-contain bg-white shadow"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-9 w-64" /> : data?.organization.name}
            </h1>
            <p className="text-muted-foreground">
              Organisationsportal - Utbildningsöversikt
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportera CSV
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Anställda</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats.totalEmployees}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certifieringsgrad</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.stats.certificationRate}%</div>
                <Progress value={data?.stats.certificationRate} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.stats.averageProgress}%</div>
                <Progress value={data?.stats.averageProgress} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card className={data?.stats.expiringCertificates ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utgående certifikat</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                data?.stats.expiringCertificates ? 'text-amber-500' : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.stats.expiringCertificates}</div>
                <p className="text-xs text-muted-foreground mt-1">inom 30 dagar</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Certificates */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/organization/employees"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Anställda</p>
                  <p className="text-sm text-muted-foreground">
                    Se alla anställdas utbildningsstatus
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
            <Link
              to="/organization/settings"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Rapportinställningar</p>
                  <p className="text-sm text-muted-foreground">
                    Hantera automatiska rapporter
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>Senaste certifikat</CardTitle>
            <CardDescription>Nyligen utfärdade certifikat</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : data?.recentCertificates.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                Inga certifikat utfärdade ännu
              </p>
            ) : (
              <div className="space-y-4">
                {data?.recentCertificates.map((cert) => (
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
                          {cert.courseName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {new Date(cert.issuedAt).toLocaleDateString('sv-SE')}
                      </p>
                      <Badge
                        variant={
                          new Date(cert.validUntil) > new Date() ? 'default' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {new Date(cert.validUntil) > new Date() ? 'Giltigt' : 'Utgånget'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sammanfattning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {isLoading ? '-' : data?.stats.employeesWithCertificates}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Med giltigt certifikat</p>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">
                {isLoading ? '-' : data?.stats.expiringCertificates}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Behöver recertifiering</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
              <div className="text-3xl font-bold text-slate-600">
                {isLoading
                  ? '-'
                  : (data?.stats.totalEmployees || 0) -
                    (data?.stats.employeesWithCertificates || 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Utan certifikat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
