import { useParams, Link } from 'react-router-dom';
import { useOrganizationEmployee } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Calendar,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function OrganizationEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useOrganizationEmployee(id!);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Kunde inte ladda anställdinformation</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Anställd hittades inte</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { certificates, chapterProgress } = data;

  // Build an employee-like object from the flat data structure
  const employee = {
    user: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    },
    department: data.department,
    role: data.memberRole,
    addedAt: data.createdAt,
  };

  const getCertificateStatus = (cert: typeof certificates[0]) => {
    const validUntil = new Date(cert.validUntil);
    const now = new Date();
    const daysUntilExpiry = Math.floor((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Utgånget', variant: 'destructive' as const, icon: XCircle };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `${daysUntilExpiry} dagar kvar`, variant: 'warning' as const, icon: Clock };
    } else {
      return { status: 'valid', label: 'Giltigt', variant: 'default' as const, icon: CheckCircle };
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link to="/organization/employees">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till anställda
        </Link>
      </Button>

      {/* Employee Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {employee.user.firstName} {employee.user.lastName}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                {employee.user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {employee.user.email}
                  </div>
                )}
                {employee.department && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {employee.department}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Anställd sedan {new Date(employee.addedAt).toLocaleDateString('sv-SE')}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {employee.role === 'ADMIN' ? 'Administratör' :
               employee.role === 'MANAGER' ? 'Chef' : 'Anställd'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifikat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inga certifikat ännu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => {
                  const status = getCertificateStatus(cert);
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{cert.courseName || 'Kurs'}</p>
                        <p className="text-sm text-muted-foreground">
                          Utfärdat: {new Date(cert.issuedAt).toLocaleDateString('sv-SE')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Giltigt till: {new Date(cert.validUntil).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Kursframsteg
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chapterProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen kursaktivitet ännu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chapterProgress.map((progress) => (
                  <div key={progress.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{progress.chapter.title}</span>
                      <span className="text-muted-foreground">
                        Kapitel {progress.chapter.chapterNumber}
                      </span>
                    </div>
                    <Progress value={progress.readProgress} />
                    {progress.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Slutfört: {new Date(progress.completedAt).toLocaleDateString('sv-SE')}
                      </p>
                    )}
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
