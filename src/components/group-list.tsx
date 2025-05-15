"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";

export function GroupList() {
  const { data: groups, isPending } = api.group.getAll.useQuery();
  const { data: players, isPending: isLoadingPlayers } =
    api.player.getAll.useQuery();
  const { data: playerGroups, isPending: isLoadingPlayerGroups } =
    api.playerGroup.getAll.useQuery();

  if (isPending || isLoadingPlayers || isLoadingPlayerGroups) {
    return <div className="py-4 text-center">Laddar grupper...</div>;
  }

  if (groups?.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Inga grupper skapade än
      </div>
    );
  }

  const matchingGroupPlayers = groups?.map((group) => {
    return {
      groupId: group.id,
      players: playerGroups?.filter(
        (playerGroup) => playerGroup.groupId === group.id,
      ),
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {matchingGroupPlayers?.map((group) => (
          <Card key={group.groupId}>
            <CardHeader>
              <CardTitle>
                {groups?.find((g) => g.id === group.groupId)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.players?.map((player) => (
                    <TableRow key={player.playerId}>
                      <TableCell className="font-medium">
                        {players?.find((p) => p.id === player.playerId)?.name}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!group.players || group.players?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        Inga spelare i denna grupp
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
