"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { createSession, joinSession } from "~/app/actions/session";
import { redirect } from "next/navigation";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  option: z.enum(["create", "join"]),
  sessionId: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val.length === 0 || val.length === 6,
      {
        message: "Session ID must be 6 characters",
      },
    ),
});

export function SessionForm() {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      option: "create",
      sessionId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    "server only";

    setIsPending(true);

    if (values.option === "create") {
      const result = await createSession(values.username);
      if (result.data) {
        sessionStorage.setItem("username", values.username);
        redirect(`/session/${result.data}`);
      } else {
        toast.error(result.error);
      }
    } else {
      if (!values.sessionId) {
        toast.error("Session ID is required");
        return;
      }

      const result = await joinSession(values.username, values.sessionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        sessionStorage.setItem("username", values.username);
        redirect(`/session/${values.sessionId}`);
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Join or Create a Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="option"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Session Option</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="create" id="create" />
                        <Label htmlFor="create">Create a new session</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="join" id="join" />
                        <Label htmlFor="join">Join an existing session</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("option") === "join" && (
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-character session ID"
                        maxLength={6}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? "Processing..."
                : form.watch("option") === "create"
                  ? "Create Session"
                  : "Join Session"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
