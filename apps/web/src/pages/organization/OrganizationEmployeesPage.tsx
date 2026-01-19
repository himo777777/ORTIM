import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizationEmployees } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  ChevronRight,
  AlertTriangle,
  Award,
  Clock,
} from 'lucide-react';

export default function OrganizationEmployeesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useOrganizationEmployees({
    search: search || undefined,
    take: 100,
  });

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Kunde inte ladda anställdlistan</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getCertificateStatus = (employee: NonNullable<typeof data>['employees'][0]) => {
    const cert = employee.user.certificates[0];
    if (!cert) return { status: 'none', label: 'Inget certifikat', variant: 'secondary' as const };

    const validUntil = new Date(cert.validUntil);
    const now = new Date();
    const daysUntilExpiry = Math.floor((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Utgånget', variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `${daysUntilExpiry}d kvar`, variant: 'warning' as const };
    } else {
      return { status: 'valid', label: 'Giltigt', variant: 'default' as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Anställda
          </h1>
          <p className="text-muted-foreground mt-1">
            Översikt över anställdas utbildningsstatus
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök anställd..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.employees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Inga anställda hittades</p>
              <p className="text-sm text-muted-foreground mt-1">
                Kontakta administratören för att lägga till anställda
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Avdelning</TableHead>
                  <TableHead>Certifikat</TableHead>
                  <TableHead>Giltig till</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.employees.map((employee) => {
                  const certStatus = getCertificateStatus(employee);
                  const latestCert = employee.user.certificates[0];

                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {employee.user.firstName} {employee.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.user.email || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={certStatus.variant}>
                          {certStatus.status === 'valid' && (
                            <Award className="h-3 w-3 mr-1" />
                          )}
                          {certStatus.status === 'expiring' && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {certStatus.status === 'expired' && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {certStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {latestCert ? (
                          new Date(latestCert.validUntil).toLocaleDateString('sv-SE')
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress
                            value={
                              employee.user._count.chapterProgress > 0
                                ? Math.min(employee.user._count.chapterProgress * 10, 100)
                                : 0
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/organization/employees/${employee.user.id}`}>
                            Detaljer
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {data && (
        <p className="text-sm text-muted-foreground text-center">
          Visar {data.employees.length} av {data.total} anställda
        </p>
      )}
    </div>
  );
}
