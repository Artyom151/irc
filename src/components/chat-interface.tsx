'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SendHorizonal } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import { addDocumentNonBlocking, initiateAnonymousSignIn, useAuth, useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  username: z.string().min(2, { message: 'Username must be at least 2 characters.' }).max(50),
  text: z.string().min(1, { message: 'Message cannot be empty.' }).max(500),
});

function formatTimestamp(timestamp: Timestamp | Date | string): string {
    if (!timestamp) return '';
    let date: Date;
    if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        date = timestamp;
    }

    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return formatDistanceToNow(date, { addSuffix: true });
}

export default function ChatInterface() {
  const { toast } = useToast();
  const scrollAreaViewport = useRef<HTMLDivElement>(null);
  const { firestore } = useFirebase();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [username, setUsername] = useState('');

  const messagesRef = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'messages'), orderBy('timestamp', 'asc')) : null,
    [firestore]
  );
  const { data: messages, isLoading: messagesLoading } = useCollection<Omit<Message, 'id'>>(messagesRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      text: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useEffect(() => {
    // Restore username from localStorage or generate a new one
    const storedUsername = localStorage.getItem('irc-username');
    if (storedUsername) {
      setUsername(storedUsername);
      form.setValue('username', storedUsername);
    } else if (user) {
      const newUsername = `user-${user.uid.substring(0, 5)}`;
      localStorage.setItem('irc-username', newUsername);
      setUsername(newUsername);
      form.setValue('username', newUsername);
    }
  }, [user, form]);


  useEffect(() => {
    if (scrollAreaViewport.current) {
      scrollAreaViewport.current.scrollTo({ top: scrollAreaViewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be signed in to send a message.',
        });
        return;
    }

    if (!firestore) return;

    localStorage.setItem('irc-username', values.username);
    setUsername(values.username);

    const newMessage = {
      author: values.username,
      content: values.text,
      timestamp: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'messages'), newMessage);
    form.resetField('text');
  }

  const isLoading = messagesLoading || isUserLoading;

  return (
    <Card className="w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl shadow-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-center text-2xl tracking-wider text-primary">
          Paladin IRC
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollAreaViewport}>
          <div className="p-4 space-y-4">
            {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <div className="flex items-start space-x-3" key={i}>
                        <Skeleton className="h-6 w-24 rounded-md" />
                        <Skeleton className="h-6 w-full max-w-sm rounded-md" />
                    </div>
                ))
            ) : messages?.map((msg) => (
              <div key={msg.id} className="flex flex-col animate-in fade-in-0 duration-500">
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-primary">{msg.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(msg.timestamp as any)}
                  </span>
                </div>
                <p className="text-foreground/90">{msg.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start space-x-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="w-1/3">
                  <FormControl>
                    <Input placeholder="Username" {...field} autoComplete="username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Type a message..." {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={form.formState.isSubmitting || !user}>
              <SendHorizonal className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
