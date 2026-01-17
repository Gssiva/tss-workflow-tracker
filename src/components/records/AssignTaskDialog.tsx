import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Loader2, Send, CheckCircle2, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  expected_time_hours: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function AssignTaskDialog() {
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users, isLoadingUsers } = useUsers();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Filter to only show non-admin users (employees)
  const regularUsers = users.filter((u) => u.role !== 'admin');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      expected_time_hours: '2',
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(regularUsers.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const sendNotificationEmail = async (
    userEmail: string, 
    userName: string | null, 
    taskTitle: string, 
    taskDescription: string | undefined,
    expectedTimeHours: number
  ) => {
    try {
      const assignerProfile = users.find(u => u.id === currentUser?.id);
      const assignerName = assignerProfile?.full_name || assignerProfile?.email || 'Admin';
      
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'task_assigned',
          recipientEmail: userEmail,
          recipientName: userName,
          taskTitle,
          taskDescription,
          expectedTimeHours,
          assignedBy: assignerName,
        },
      });
      
      if (error) {
        console.error('Email notification error:', error);
        throw error;
      }
      
      console.log('Email notification sent:', data);
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  };
  
  const sendAdminNotificationEmail = async (
    taskTitle: string,
    taskDescription: string | undefined,
    assignedToNames: string[],
    expectedTimeHours: number
  ) => {
    try {
      // Get admin users to notify
      const adminUsers = users.filter(u => u.role === 'admin');
      
      for (const admin of adminUsers) {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'task_assigned_admin',
            recipientEmail: admin.email,
            recipientName: admin.full_name,
            taskTitle,
            taskDescription,
            expectedTimeHours,
            assignedToNames,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a record for each selected user
      const records = selectedUsers.map((userId) => ({
        title: data.title,
        description: data.description || null,
        expected_time_hours: parseInt(data.expected_time_hours),
        created_by: userId,
      }));

      const { error } = await supabase.from('records').insert(records);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      // Send notification emails to all selected employees
      const assignedNames: string[] = [];
      const emailPromises = selectedUsers.map(async (userId) => {
        const user = regularUsers.find(u => u.id === userId);
        if (user) {
          assignedNames.push(user.full_name || user.email.split('@')[0]);
          await sendNotificationEmail(
            user.email,
            user.full_name,
            data.title,
            data.description,
            parseInt(data.expected_time_hours)
          );
        }
      });

      // Wait for employee emails, then send admin notification
      await Promise.all(emailPromises);
      
      // Also notify admin about the assignment
      await sendAdminNotificationEmail(
        data.title,
        data.description,
        assignedNames,
        parseInt(data.expected_time_hours)
      );

      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success(`Task assigned to ${selectedUsers.length} employee(s) successfully. Email notifications sent!`);
      form.reset();
      setSelectedUsers([]);
      setOpen(false);
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign task: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (name: string | null, email: string) => {
    return name || email.split('@')[0];
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Users className="h-4 w-4" />
          Bulk Assign Task
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 sm:px-6 pt-6 pb-4 border-b bg-muted/30">
          <SheetTitle className="text-lg sm:text-xl flex items-center gap-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            Assign Task to Team
          </SheetTitle>
          <SheetDescription className="text-sm">
            Create and assign a task to multiple team members at once
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="px-4 sm:px-6 py-4 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter task title..." 
                          className="h-10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter task description..."
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expected_time_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Expected Completion Time
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                          <SelectItem value="5">5 hours</SelectItem>
                          <SelectItem value="8">8 hours (1 day)</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                          <SelectItem value="24">24 hours (1 day)</SelectItem>
                          <SelectItem value="48">48 hours (2 days)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Assign To
                    </FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {selectedUsers.length} of {regularUsers.length} selected
                    </span>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    {/* Select All Header */}
                    <div 
                      className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-muted/50 border-b cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSelectAll(selectedUsers.length !== regularUsers.length)}
                    >
                      <Checkbox
                        checked={selectedUsers.length === regularUsers.length && regularUsers.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                      <span className="font-medium text-sm">
                        Select All Employees
                      </span>
                      {selectedUsers.length === regularUsers.length && regularUsers.length > 0 && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                      )}
                    </div>
                    
                    {/* User List */}
                    <div className="max-h-48 overflow-y-auto">
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : regularUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <Users className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">No employees available</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {regularUsers.map((user) => {
                            const isSelected = selectedUsers.includes(user.id);
                            return (
                              <div 
                                key={user.id} 
                                className={`flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-primary/5 hover:bg-primary/10' 
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => handleUserToggle(user.id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleUserToggle(user.id)}
                                />
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className={`text-xs ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted'
                                  }`}>
                                    {getInitials(user.full_name, user.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {getDisplayName(user.full_name, user.email)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <SheetFooter className="flex-row items-center justify-between px-4 sm:px-6 py-4 border-t bg-muted/30 gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="flex-shrink-0"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || selectedUsers.length === 0}
                className="min-w-24 sm:min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Assigning...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Assign to {selectedUsers.length} Employee{selectedUsers.length !== 1 ? 's' : ''}</span>
                    <span className="sm:hidden">Assign ({selectedUsers.length})</span>
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
