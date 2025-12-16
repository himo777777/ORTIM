import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Award, Calendar, ExternalLink, CheckCircle } from 'lucide-react';

interface CertificateCardProps {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issueDate: Date;
  expiryDate?: Date;
  isValid: boolean;
  className?: string;
}

export function CertificateCard({
  id,
  certificateNumber,
  courseTitle,
  issueDate,
  expiryDate,
  isValid,
  className,
}: CertificateCardProps) {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const isExpired = expiryDate ? new Date() > expiryDate : false;

  return (
    <Link
      to={`/certificates/${id}`}
      className={cn(
        'group block bg-card border rounded-xl p-5 transition-all',
        'hover:shadow-lg hover:border-primary/50',
        isExpired && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
            isValid && !isExpired
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Award
            className={cn(
              'h-6 w-6',
              isValid && !isExpired
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              {certificateNumber}
            </span>
            {isValid && !isExpired && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                Giltigt
              </span>
            )}
            {isExpired && (
              <span className="text-xs text-red-600 dark:text-red-400">
                Utgånget
              </span>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors truncate">
            {courseTitle}
          </h3>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Utfärdat: {formatDate(issueDate)}
            </span>
            {expiryDate && (
              <span className="flex items-center gap-1">
                Giltigt till: {formatDate(expiryDate)}
              </span>
            )}
          </div>
        </div>

        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
