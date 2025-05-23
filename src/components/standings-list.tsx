"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  totalScoreFor: number;
  totalScoreAgainst: number;
};

export function StandingsList() {
  const { data: groups, isPending: isLoadingGroups } =
    api.group.getAll.useQuery();

  if (isLoadingGroups) {
    return <div className="py-4 text-center">Laddar resultat...</div>;
  }

  if (!groups?.length) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Inga grupper skapade än
      </div>
    );
  }

  // Add this function to sort players consistently
  const comparePlayerStandings = (a: PlayerStanding, b: PlayerStanding) => {
    // First compare points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // If points are equal, compare score difference
    const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
    const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
    if (bScoreDiff !== aScoreDiff) {
      return bScoreDiff - aScoreDiff;
    }

    // If score difference is equal, compare total scores for
    return b.totalScoreFor - a.totalScoreFor;
  };

  // After calculating standings for all groups, collect all third places
  const thirdPlaceStandings: PlayerStanding[] = [];

  // Calculate standings for each group
  const standings: Record<string, PlayerStanding[]> = {};

  for (const group of groups) {
    const playerStats = new Map<string, PlayerStanding>();

    // Initialize player standings
    group.PlayerGroup.forEach(({ player }) => {
      playerStats.set(player.id, {
        player,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        totalScoreFor: 0,
        totalScoreAgainst: 0,
      });
    });

    // Calculate standings from matches
    group.Match.forEach((match) => {
      const scores = match.scores;
      if (scores.length !== 1) return;
      const score = scores[0];

      const player1Id = match.player1Id;
      const player2Id = match.player2Id;

      const player1Stats = playerStats.get(player1Id ?? "");
      const player2Stats = playerStats.get(player2Id ?? "");

      if (player1Stats && player2Stats && score) {
        player1Stats.played++;
        player2Stats.played++;

        player1Stats.totalScoreFor += score.player1Score;
        player2Stats.totalScoreFor += score.player2Score;

        player1Stats.totalScoreAgainst += score.player2Score;
        player2Stats.totalScoreAgainst += score.player1Score;

        if (score && score.player1Score > score.player2Score) {
          player1Stats.won++;
          player2Stats.lost++;
          player1Stats.points += 2;
        } else {
          player2Stats.won++;
          player1Stats.lost++;
          player2Stats.points += 2;
        }
      }
    });

    // Sort players using the comparison function
    standings[group.id] = Array.from(playerStats.values()).sort(
      comparePlayerStandings,
    );
    // Add third place player to our collection if the group has at least 3 players
    if (standings[group.id]!.length >= 3) {
      const thirdPlace = standings[group.id]![2];
      if (thirdPlace) {
        thirdPlaceStandings.push(thirdPlace);
      }
    }
  }

  // Sort third place players and get top 4 IDs
  const bestThirdPlaceIds = new Set(
    thirdPlaceStandings
      .sort(comparePlayerStandings)
      .slice(0, 4)
      .map((player) => player.player.id),
  );

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
                  <TableHead className="text-center">Vinst</TableHead>
                  <TableHead className="text-center">Förlust</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead className="text-center font-bold text-black">
                    Poäng
                  </TableHead>
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
                          : index === 2 &&
                              bestThirdPlaceIds.has(standing.player.id)
                            ? "bg-yellow-100 dark:bg-yellow-900/20"
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
                    <TableCell className="text-center">
                      {standing.totalScoreFor}-{standing.totalScoreAgainst}
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
                      className="text-center text-muted-foreground"
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
