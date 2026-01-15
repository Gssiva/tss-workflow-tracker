import { useState, useCallback } from 'react';
import { Upload, X, Users, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDailyWorkUploads } from '@/hooks/useDailyWorkUploads';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function DailyWorkUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadImage, hasUploadedToday } = useDailyWorkUploads();
  const { user } = useAuth();

  // Fetch all users for mention selection
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email');
      return data || [];
    },
  });

  const otherUsers = allUsers.filter(u => u.id !== user?.id);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) return;

    await uploadImage.mutateAsync({
      file,
      description: description || undefined,
      mentionedUsers: selectedUsers,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    setSelectedUsers([]);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2"
          variant={hasUploadedToday ? "outline" : "default"}
        >
          <Upload className="h-4 w-4" />
          {hasUploadedToday ? 'Upload Another Image' : 'Upload Daily Work'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload Daily Work Image
          </DialogTitle>
          <DialogDescription>
            Upload an image of your daily work. You can also mention other users who worked with you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Image Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            } ${preview ? 'p-2' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 10MB, Images only
                </p>
              </label>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Mention Users */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tag Other Users (who also worked on this)
            </Label>
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedUsers.map(userId => {
                  const userInfo = otherUsers.find(u => u.id === userId);
                  return (
                    <Badge key={userId} variant="secondary" className="gap-1">
                      {userInfo?.full_name || userInfo?.email}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleUser(userId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
            <ScrollArea className="h-32 border rounded-md p-2">
              {otherUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other users available
                </p>
              ) : (
                <div className="space-y-2">
                  {otherUsers.map(userItem => (
                    <div key={userItem.id} className="flex items-center gap-2">
                      <Checkbox
                        id={userItem.id}
                        checked={selectedUsers.includes(userItem.id)}
                        onCheckedChange={() => toggleUser(userItem.id)}
                      />
                      <label
                        htmlFor={userItem.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {userItem.full_name || userItem.email}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploadImage.isPending}
          >
            {uploadImage.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}