import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Calendar, Edit2, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Record } from '@/hooks/useRecords';
import { UploadDocumentDialog } from './UploadDocumentDialog';
import { RecordCommentsDialog } from './RecordCommentsDialog';
import { supabase } from '@/integrations/supabase/client';

interface RecordCardProps {
  record: Record & { file_url?: string | null };
  onComplete?: () => void;
  onEdit?: () => void;
  showUser?: boolean;
  showUpload?: boolean;
}

export function RecordCard({ record, onComplete, onEdit, showUser, showUpload = true }: RecordCardProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const isBreached = record.breach_status;
  const isCompleted = record.completed_status;

  // Generate signed URL when file_url exists
  useEffect(() => {
    const getSignedUrl = async () => {
      if (!record.file_url) {
        setSignedUrl(null);
        return;
      }
      
      setLoadingUrl(true);
      try {
        const { data, error } = await supabase.storage
          .from('record-documents')
          .createSignedUrl(record.file_url, 3600); // 1 hour expiry
        
        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (error) {
        console.error('Error getting signed URL:', error);
        setSignedUrl(null);
      } finally {
        setLoadingUrl(false);
      }
    };

    getSignedUrl();
  }, [record.file_url]);
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

          {/* Document Attachment Section */}
          {record.file_url && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground flex-1">Document attached</span>
              {loadingUrl ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : signedUrl ? (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary" asChild>
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              ) : null}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            {!isCompleted && (
              <>
                <Button size="sm" onClick={onComplete} className="gradient-primary text-primary-foreground">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Mark Complete
                </Button>
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit2 className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </>
            )}
            <RecordCommentsDialog recordId={record.id} recordTitle={record.title} />
            {showUpload && (
              <UploadDocumentDialog 
                recordId={record.id} 
                recordTitle={record.title}
                currentFileUrl={record.file_url}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
