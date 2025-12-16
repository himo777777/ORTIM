import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  enrollmentId: string;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    workplace: string | null;
    speciality: string | null;
  };
  progress: {
    chaptersCompleted: number;
    totalChapters: number;
    percentage: number;
  };
  osce: {
    completed: number;
    passed: number;
    total: number;
  };
}

interface ParticipantTableProps {
  participants: Participant[];
  cohortId: string;
}

export function ParticipantTable({ participants, cohortId }: ParticipantTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParticipants = participants.filter((p) => {
    const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    const email = p.user.email?.toLowerCase() || '';
    const workplace = p.user.workplace?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || workplace.includes(query);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Slutförd</Badge>;
      case 'active':
        return <Badge variant="secondary">Aktiv</Badge>;
      case 'withdrawn':
        return <Badge variant="destructive">Avbruten</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOsceStatus = (osce: Participant['osce']) => {
    if (osce.completed === 0) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          Ej påbörjad
        </span>
      );
    }

    if (osce.passed === osce.total) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          Godkänd
        </span>
      );
    }

    const failedCount = osce.completed - osce.passed;
    if (failedCount > 0) {
      return (
        <span className="flex items-center gap-1 text-amber-600">
          <XCircle className="h-4 w-4" />
          {osce.passed}/{osce.total} godkända
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-blue-600">
        <Clock className="h-4 w-4" />
        {osce.completed}/{osce.total} avklarade
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök deltagare..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deltagare</TableHead>
              <TableHead>Arbetsplats</TableHead>
              <TableHead>Kursprogress</TableHead>
              <TableHead>OSCE</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'Inga deltagare matchar sökningen'
                    : 'Inga deltagare i denna kohort'}
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow key={participant.enrollmentId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {participant.user.firstName} {participant.user.lastName}
                      </p>
                      {participant.user.email && (
                        <p className="text-sm text-muted-foreground">
                          {participant.user.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {participant.user.workplace || '-'}
                      {participant.user.speciality && (
                        <p className="text-muted-foreground">
                          {participant.user.speciality}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{participant.progress.chaptersCompleted}/{participant.progress.totalChapters}</span>
                        <span className="text-muted-foreground">{participant.progress.percentage}%</span>
                      </div>
                      <Progress value={participant.progress.percentage} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {getOsceStatus(participant.osce)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(participant.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/instructor/cohorts/${cohortId}/osce/${participant.enrollmentId}`}
                    >
                      <Button variant="outline" size="sm">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        OSCE
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Visar {filteredParticipants.length} av {participants.length} deltagare</span>
      </div>
    </div>
  );
}
