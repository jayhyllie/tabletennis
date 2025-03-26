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
import { api } from "@/trpc/react";

const formSchema = z.object({
  numGroups: z
    .string()
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int()
        .min(1, {
          message: "Antal grupper måste vara minst 1.",
        })
        .max(10, {
          message: "Antal grupper måste vara högst 10.",
        }),
    ),
});

export function GroupForm() {
  const utils = api.useUtils();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numGroups: 2,
    },
  });

  const { mutate: createRandomGroups, isPending: isCreating } =
    api.group.createRandomGroups.useMutation({
      onSuccess: () => {
        utils.group.getAll.invalidate();
        toast({
          title: "Lyckades",
          description: `${form.getValues().numGroups} grupper skapade`,
        });
      },
    });
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const numGroups = Number(form.getValues().numGroups);
          createRandomGroups({ numGroups });
        }}
        className="space-y-4"
      >
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
        <Button type="submit" className="w-full" disabled={isCreating}>
          {isCreating ? "Skapar..." : "Skapa slumpmässiga grupper"}
        </Button>
      </form>
    </Form>
  );
}
