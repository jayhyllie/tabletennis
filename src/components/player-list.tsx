"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";

export function PlayerList() {
  const { data: players, isLoading } = api.player.getAll.useQuery();

  if (isLoading) {
    return <div className="py-4 text-center">Loading players...</div>;
  }

  if (players?.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center">
        No players registered yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table className="rounded-md border">
        <TableHeader>
          <TableRow>
            <TableHead>Namn</TableHead>
            <TableHead>Registrerad</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players?.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>
                {new Date(player.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
