import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecordComments } from '@/hooks/useRecordComments';

export function IssueNotifications() {
  const { issueComments, isLoadingIssues } = useRecordComments();
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleIssues = issueComments.filter(
    (issue: any) => !dismissed.includes(issue.id)
  );

  if (isLoadingIssues || visibleIssues.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Active Issues ({visibleIssues.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {visibleIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="flex items-start justify-between gap-2 p-3 rounded-lg bg-background border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {issue.record?.title || 'Unknown Record'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {issue.profile?.full_name || issue.profile?.email || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{issue.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(issue.created_at), 'PPp')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setDismissed([...dismissed, issue.id])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
