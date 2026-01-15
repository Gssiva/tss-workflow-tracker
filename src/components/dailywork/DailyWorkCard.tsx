import { formatDistanceToNow } from 'date-fns';
import { Users, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { DailyWorkUploadWithUser } from '@/hooks/useDailyWorkUploads';

interface DailyWorkCardProps {
  upload: DailyWorkUploadWithUser;
  showUser?: boolean;
}

export function DailyWorkCard({ upload, showUser = true }: DailyWorkCardProps) {
  const initials = upload.user_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative bg-muted">
        <img
          src={upload.image_url}
          alt={upload.description || 'Daily work image'}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4 space-y-3">
        {showUser && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.user_name}</p>
              <p className="text-xs text-muted-foreground truncate">{upload.user_email}</p>
            </div>
          </div>
        )}

        {upload.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {upload.description}
          </p>
        )}

        {upload.mentioned_user_names.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {upload.mentioned_user_names.map((name, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(upload.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}