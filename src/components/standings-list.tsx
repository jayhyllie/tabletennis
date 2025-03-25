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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@prisma/client";
import { api } from "@/trpc/react";

type PlayerStanding = {
  player: {
    id: string;
    name: string;
    email: string;
  };
  played: number;
  won: number;
  lost: number;
  points: number;
};

export function StandingsList() {
  const { data: groups, isPending: isLoadingGroups } =
    api.group.getAll.useQuery();
  const [standings, setStandings] = useState<Record<string, PlayerStanding[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  if (isLoadingGroups) {
    return <div className="py-4 text-center">Laddar resultat...</div>;
  }

  if (!groups?.length) {
    return (
      <div className="text-muted-foreground py-4 text-center">
        Inga grupper skapade än
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spelare</TableHead>
                  <TableHead className="text-center">Spelade</TableHead>
                  <TableHead className="text-center">Vunnen</TableHead>
                  <TableHead className="text-center">Förlorad</TableHead>
                  <TableHead className="text-center">Poäng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings[group.id]?.map((standing, index) => (
                  <TableRow
                    key={standing.player.id}
                    className={
                      index === 0
                        ? "bg-green-100 dark:bg-green-900/20"
                        : index === 1
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {standing.player.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {standing.played}
                    </TableCell>
                    <TableCell className="text-center">
                      {standing.won}
                    </TableCell>
                    <TableCell className="text-center">
                      {standing.lost}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {standing.points}
                    </TableCell>
                  </TableRow>
                ))}
                {!standings[group.id] || standings[group.id]?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground text-center"
                    >
                      Inga resultat tillgängliga
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
