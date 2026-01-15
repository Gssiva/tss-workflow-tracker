import { AlertTriangle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useMissingUploads } from '@/hooks/useDailyWorkUploads';

export function MissingUploadsCard() {
  const { data: missingUsers, isLoading } = useMissingUploads();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  const count = missingUsers?.length || 0;

  return (
    <Card className={count > 0 ? 'border-destructive/50' : 'border-green-500/50'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className={`h-5 w-5 ${count > 0 ? 'text-destructive' : 'text-green-500'}`} />
          Users Not Working Today
          <Badge variant={count > 0 ? 'destructive' : 'secondary'}>
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-green-600">
            All users have uploaded their daily work or been mentioned! 🎉
          </p>
        ) : (
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {missingUsers?.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-destructive/5"
                >
                  <User className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">
                    {user.full_name || user.email}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    No upload
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}