import { Clock, CheckCircle2, AlertTriangle, Calendar, Edit2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Record } from '@/hooks/useRecords';

interface RecordCardProps {
  record: Record;
  onComplete?: () => void;
  onEdit?: () => void;
  showUser?: boolean;
}

export function RecordCard({ record, onComplete, onEdit, showUser }: RecordCardProps) {
  const isBreached = record.breach_status;
  const isCompleted = record.completed_status;

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    }
    if (isBreached) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Breached
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning text-warning-foreground">
        <Clock className="mr-1 h-3 w-3" />
        In Progress
      </Badge>
    );
  };

  const getTimeInfo = () => {
    if (isCompleted && record.completed_at) {
      const completionTime = new Date(record.completed_at).getTime() - new Date(record.created_at).getTime();
      const hours = Math.round(completionTime / (1000 * 60 * 60) * 10) / 10;
      return `Completed in ${hours}h (Expected: ${record.expected_time_hours}h)`;
    }
    return `Expected: ${record.expected_time_hours}h • Created ${formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}`;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{record.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {record.description || 'No description'}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{getTimeInfo()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(record.created_at), 'PPP')}</span>
          </div>
          {!isCompleted && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button size="sm" onClick={onComplete} className="gradient-primary text-primary-foreground">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Mark Complete
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit2 className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
