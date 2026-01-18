import { useState } from 'react';
import { MessageCircle, Send, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRecordComments } from '@/hooks/useRecordComments';
import { useAuth } from '@/hooks/useAuth';

interface RecordCommentsDialogProps {
  recordId: string;
  recordTitle: string;
}

export function RecordCommentsDialog({ recordId, recordTitle }: RecordCommentsDialogProps) {
  const { user, role } = useAuth();
  const { comments, isLoading, addComment, deleteComment } = useRecordComments(recordId);
  const [comment, setComment] = useState('');
  const [isIssue, setIsIssue] = useState(false);
  const [open, setOpen] = useState(false);

  const isAdmin = role === 'admin' || role === 'super_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    await addComment.mutateAsync({
      recordId,
      comment: comment.trim(),
      isIssue,
    });
    setComment('');
    setIsIssue(false);
  };

  const canDelete = (commentUserId: string) => {
    return user?.id === commentUserId || isAdmin;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <MessageCircle className="h-4 w-4" />
          Comments
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              {comments.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments - {recordTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comments List */}
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg ${
                      c.is_issue 
                        ? 'bg-destructive/10 border border-destructive/30' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {c.profile?.full_name || c.profile?.email || 'Unknown'}
                          </span>
                          {c.is_issue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Issue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{c.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(c.created_at), 'PPp')}
                        </p>
                      </div>
                      {canDelete(c.user_id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteComment.mutate(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-issue"
                  checked={isIssue}
                  onCheckedChange={(checked) => setIsIssue(checked === true)}
                />
                <Label htmlFor="is-issue" className="text-sm cursor-pointer flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Mark as Issue (visible to everyone)
                </Label>
              </div>
              <Button type="submit" size="sm" disabled={!comment.trim() || addComment.isPending}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
