"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

export function PlayerList() {
  const { data: players, isLoading } = api.player.getAll.useQuery();
  const { toast } = useToast();
  const utils = api.useUtils();

  const { mutate: removePlayer, isPending } = api.player.delete.useMutation({
    onSuccess: () => {
      utils.player.invalidate();
      toast({
        title: "Success",
        description: "Player removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive",
      });
    },
  });

  const handleRemovePlayer = async (id: string) => {
    try {
      await removePlayer({ id });
    } catch (error) {
      console.error(error);
    }
  };

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Namn</TableHead>
            {/* <TableHead>Email</TableHead> */}
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
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePlayer(player.id)}
                  aria-label="Remove player"
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
