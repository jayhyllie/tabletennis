"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Match, Player, Score } from "@prisma/client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

export function PlayoffBracket() {
  const utils = api.useUtils();
  const { toast } = useToast();

  const { data: matches, isPending: isLoadingMatches } =
    api.match.getAll.useQuery();
  const { data: players, isPending: isLoadingPlayers } =
    api.player.getAll.useQuery();
  const { data: scores, isPending: isLoadingScores } =
    api.score.getAll.useQuery();

  const { mutate: generatePlayoffs, isPending: isGenerating } =
    api.match.generatePlayoffs.useMutation({
      onSuccess: () => {
        utils.match.getAll.invalidate();
        toast({
          title: "Slutspel genererat",
          description: "Slutspelsmatcherna har skapats",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Fel",
          description: error.message,
        });
      },
    });

  if (isLoadingMatches || isLoadingPlayers || isLoadingScores) {
    return <div className="py-4 text-center">Laddar slutspel...</div>;
  }

  const playoffMatches = matches?.filter((match) => match.isPlayoff) ?? [];

  if (
    !playoffMatches.length &&
    matches &&
    matches.length > 0 &&
    matches?.every((match) => match.completed)
  ) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground py-4 text-center">
          Inga slutspelmatcher genererade än
        </div>
        <div className="flex justify-center">
          <Button onClick={() => generatePlayoffs()} disabled={isGenerating}>
            {isGenerating ? "Genererar..." : "Generera slutspel"}
          </Button>
        </div>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {};
  playoffMatches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round]!.push(match);
  });

  // Sort rounds
  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[600px] gap-4">
        {rounds.map((round) => (
          <div key={round} className="flex-1 space-y-4">
            <h3 className="text-center font-semibold">
              {round === 1
                ? "First Round"
                : round === 2
                  ? "Semi-Finals"
                  : round === 3
                    ? "Finals"
                    : `Round ${round}`}
            </h3>
            <div className="space-y-4">
              {matchesByRound[round]!.map((match) => (
                <Card key={match.id} className="border-primary/50">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {players?.find(
                          (player) => player.id === match.player1Id,
                        )?.name || "TBD"}
                      </div>
                      <div className="font-bold">
                        {scores?.find((score) => score.matchId === match.id)
                          ?.player1Score ?? "-"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {players?.find(
                          (player) => player.id === match.player2Id,
                        )?.name || "TBD"}
                      </div>
                      <div className="font-bold">
                        {scores?.find((score) => score.matchId === match.id)
                          ?.player2Score ?? "-"}
                      </div>
                    </div>
                    {match.completed &&
                      scores?.find((score) => score.matchId === match.id)
                        ?.winnerId && (
                        <div className="text-muted-foreground border-t pt-2 text-center text-sm">
                          Vinnare:{" "}
                          {scores?.find((score) => score.matchId === match.id)
                            ?.winnerId &&
                            players?.find(
                              (player) =>
                                player.id ===
                                scores?.find(
                                  (score) => score.matchId === match.id,
                                )?.winnerId,
                            )?.name}
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
