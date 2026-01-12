import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Loader2 } from 'lucide-react';
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
        <Button className="gradient-primary text-primary-foreground">
          <Users className="mr-2 h-4 w-4" />
          Assign Task to Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Task to Users</DialogTitle>
          <DialogDescription>
            Create a task and assign it to multiple users at once
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title..." {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description..."
                      className="resize-none"
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
                  <FormLabel>Expected Time (hours)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expected time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="5">5 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Selection */}
            <div className="space-y-2">
              <FormLabel>Assign To</FormLabel>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 pb-2 border-b mb-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedUsers.length === regularUsers.length && regularUsers.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All Users ({regularUsers.length})
                  </label>
                </div>
                <ScrollArea className="h-[150px]">
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : regularUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {regularUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-2">
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserToggle(user.id, !!checked)}
                          />
                          <label htmlFor={user.id} className="text-sm cursor-pointer flex-1">
                            <span className="font-medium">{user.full_name || 'Unnamed'}</span>
                            <span className="text-muted-foreground ml-2">({user.email})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedUsers.length} user(s) selected
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || selectedUsers.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign to ${selectedUsers.length} User(s)`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
