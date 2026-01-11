import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UploadDocumentDialogProps {
  recordId: string;
  recordTitle: string;
  currentFileUrl?: string | null;
}

export function UploadDocumentDialog({ recordId, recordTitle, currentFileUrl }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recordId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('record-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('record-documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('records')
        .update({ file_url: publicUrl })
        .eq('id', recordId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success('Document uploaded successfully');
      setOpen(false);
      setFile(null);
    } catch (error: any) {
      toast.error('Failed to upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          {currentFileUrl ? 'Replace' : 'Upload'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document for "{recordTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
              ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${file ? 'bg-success/5 border-success' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-success" />
                <div className="text-left">
                  <p className="font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, XLS, PPT, TXT, ZIP, Images (max 10MB)
                </p>
              </div>
            )}
          </div>

          {currentFileUrl && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">Current document attached</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">View</a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
