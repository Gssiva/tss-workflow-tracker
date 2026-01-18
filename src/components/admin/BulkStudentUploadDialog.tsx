import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface BulkStudentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentRow {
  email: string;
  password: string;
  fullName: string;
  studentId: string;
  batch?: string;
  course?: string;
  phone?: string;
}

export function BulkStudentUploadDialog({ open, onOpenChange }: BulkStudentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      setFile(selectedFile);
      setResults({ success: 0, failed: 0, errors: [] });
    }
  };

  const parseCSV = (text: string): StudentRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      return {
        email: row.email || row.e_mail || '',
        password: row.password || '',
        fullName: row.fullname || row.full_name || row.name || '',
        studentId: row.studentid || row.student_id || row.id || '',
        batch: row.batch || '',
        course: row.course || '',
        phone: row.phone || row.mobile || '',
      };
    }).filter(row => row.email && row.password && row.fullName && row.studentId);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResults({ success: 0, failed: 0, errors: [] });

    try {
      const text = await file.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        toast.error('No valid student data found in file. Required columns: email, password, fullName/name, studentId/student_id');
        setUploading(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setProgress(Math.round(((i + 1) / students.length) * 100));

        try {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: student.email,
            password: student.password,
            options: {
              data: {
                full_name: student.fullName,
              },
            },
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Failed to create user');

          // Wait for trigger
          await new Promise(resolve => setTimeout(resolve, 500));

          // Create student record
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: authData.user.id,
              student_id: student.studentId,
              batch: student.batch || null,
              course: student.course || null,
              phone: student.phone || null,
            });

          if (studentError) throw studentError;

          // Assign student role
          await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'student',
            });

          success++;
        } catch (error: any) {
          failed++;
          errors.push(`${student.email}: ${error.message}`);
        }
      }

      setResults({ success, failed, errors });
      queryClient.invalidateQueries({ queryKey: ['students'] });

      if (success > 0) {
        toast.success(`Successfully created ${success} student(s)`);
      }
      if (failed > 0) {
        toast.error(`Failed to create ${failed} student(s)`);
      }
    } catch (error: any) {
      toast.error('Failed to process file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,password,fullName,studentId,batch,course,phone\nstudent1@example.com,password123,John Doe,STU001,2024-A,Web Development,+91 9876543210';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Student Registration
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to register multiple students at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Required columns: email, password, fullName (or name), studentId (or student_id).<br />
              Optional: batch, course, phone
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          <div
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="text-center">
                <FileSpreadsheet className="h-8 w-8 text-primary mx-auto mb-2" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload CSV or Excel file</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processing... {progress}%
              </p>
            </div>
          )}

          {(results.success > 0 || results.failed > 0) && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{results.success} created</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{results.failed} failed</span>
                  </div>
                )}
              </div>
              {results.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {results.errors.map((error, i) => (
                    <p key={i}>{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Processing...' : 'Upload & Register'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
