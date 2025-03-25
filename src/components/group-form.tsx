"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createRandomGroups } from "@/lib/actions";
import { api } from "@/trpc/react";

const formSchema = z.object({
  numGroups: z.coerce
    .number()
    .int()
    .min(1, {
      message: "Antal grupper måste vara minst 1.",
    })
    .max(10, {
      message: "Antal grupper måste vara högst 10.",
    }),
});

export function GroupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numGroups: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createRandomGroups(values.numGroups);
      toast({
        title: "Lyckades",
        description: `${values.numGroups} grupper skapade`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Misslyckades att skapa grupper",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numGroups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Antal grupper</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Skapar..." : "Skapa slumpmässiga grupper"}
        </Button>
      </form>
    </Form>
  );
}
