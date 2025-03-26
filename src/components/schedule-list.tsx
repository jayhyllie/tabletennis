"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Match, Player, Group } from "@prisma/client";
import { api } from "@/trpc/react";

export function ScheduleList() {
  const { data: matches, isPending: isLoadingMatches } =
    api.match.getAll.useQuery();
  const { data: players, isPending: isLoadingPlayers } =
    api.player.getAll.useQuery();
  const { data: groups, isPending: isLoadingGroups } =
    api.group.getAll.useQuery();

  if (isLoadingMatches || isLoadingPlayers || isLoadingGroups) {
    return <div className="py-4 text-center">Laddar schemat...</div>;
  }

  if (matches?.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Inga matcher schemalagda än
      </div>
    );
  }

  // Group matches by group
  const matchesByGroup: Record<string, Match[]> = {};

  // Add group matches
  matches?.forEach((match) => {
    if (!match.isPlayoff) {
      const groupId = match.groupId || "unknown";
      if (!matchesByGroup[groupId]) {
        matchesByGroup[groupId] = [];
      }
      matchesByGroup[groupId].push(match);
    }
  });

  // Add playoff matches
  const playoffMatches = matches?.filter((match) => match.isPlayoff) ?? [];
  if (playoffMatches.length > 0) {
    matchesByGroup["playoffs"] = playoffMatches;
  }

  const playerMap = new Map(players?.map((player) => [player.id, player.name]));
  const groupMap = new Map(groups?.map((group) => [group.id, group.name]));

  return (
    <div className="space-y-6">
      {Object.entries(matchesByGroup).map(([groupId, groupMatches]) => (
        <div key={groupId} className="space-y-2">
          <h3 className="text-lg font-semibold">
            {groupId === "playoffs"
              ? "Slutspel"
              : (groupMap.get(groupId) ?? "Okänd grupp")}
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spelare 1</TableHead>
                  <TableHead>Spelare 2</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {playerMap.get(match.player1Id) || "Okänd spelare"}
                    </TableCell>
                    <TableCell>
                      {playerMap.get(match.player2Id) || "Okänd spelare"}
                    </TableCell>
                    <TableCell>
                      {match.completed ? (
                        <Badge variant="default">Slutförd</Badge>
                      ) : (
                        <Badge variant="outline">Ej spelad</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
