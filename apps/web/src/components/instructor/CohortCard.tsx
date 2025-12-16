import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CohortCardProps {
  id: string;
  name: string;
  courseName: string;
  courseCode: string;
  startDate: string;
  endDate: string | null;
  participantCount: number;
  isActive: boolean;
}

export function CohortCard({
  id,
  name,
  courseName,
  startDate,
  endDate,
  participantCount,
  isActive,
}: CohortCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link to={`/instructor/cohorts/${id}`}>
      <Card className={cn(
        'transition-all hover:shadow-md hover:border-primary/50 cursor-pointer',
        !isActive && 'opacity-60'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{courseName}</p>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Aktiv' : 'Avslutad'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{participantCount} deltagare</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(startDate)}
                  {endDate && ` - ${formatDate(endDate)}`}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
