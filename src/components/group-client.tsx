"use client";

import { api } from "@/trpc/react";
import { GroupList } from "@/components/group-list";
import { GroupForm } from "@/components/group-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserData = {
  id: string;
  role: string;
};

export function GroupsClient({ user }: { user: UserData | null }) {
  const utils = api.useUtils();
  const { mutate: removeAll, isPending } = api.group.removeAll.useMutation({
    onSuccess: async () => {
      await utils.group.getAll.invalidate();
    },
  });

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Grupplista</CardTitle>
          <CardDescription>Se och hantera grupper</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupList />
        </CardContent>
      </Card>

      {user?.role === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Skapa grupper</CardTitle>
            <CardDescription>Generera grupper för turneringen</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupForm />
            <Button
              onClick={() => removeAll()}
              disabled={isPending}
              className="mt-4 w-full"
              variant="outline"
            >
              Radera alla grupper
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
