import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Loader2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
  const queryClient = useQueryClient();

  // Filter to only show non-admin users
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

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const onSubmit = async (data: FormData) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
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

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success(`Task assigned to ${selectedUsers.length} user(s) successfully`);
      form.reset();
      setSelectedUsers([]);
      setOpen(false);
    } catch (error: any) {
      toast.error('Failed to assign task: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Bulk Assign</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assign Task to Users
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create and assign a task to multiple users at once
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Task Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter task title..." 
                      className="h-9 text-sm"
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
                  <FormLabel className="text-xs">Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description..."
                      className="resize-none h-16 text-sm"
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
                  <FormLabel className="text-xs">Expected Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="5">5 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compact User Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs">Assign To</FormLabel>
                {selectedUsers.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {selectedUsers.length} selected
                  </Badge>
                )}
              </div>
              <div className="border rounded-md bg-muted/30">
                <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
                  <Checkbox
                    id="select-all"
                    checked={selectedUsers.length === regularUsers.length && regularUsers.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                  <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                    Select All ({regularUsers.length} users)
                  </label>
                </div>
                <ScrollArea className="h-32">
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : regularUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No users available
                    </p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {regularUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => handleUserToggle(user.id, !selectedUsers.includes(user.id))}
                        >
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserToggle(user.id, !!checked)}
                          />
                          <label htmlFor={user.id} className="text-xs cursor-pointer flex-1 truncate">
                            <span className="font-medium">{user.full_name || user.email.split('@')[0]}</span>
                            <span className="text-muted-foreground ml-1 hidden sm:inline">
                              ({user.email})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={isSubmitting || selectedUsers.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-3 w-3" />
                    Assign Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
