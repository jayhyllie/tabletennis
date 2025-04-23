"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Match, Player, Score } from "@prisma/client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      onSuccess: async () => {
        await utils.match.getAll.invalidate();
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

  const { mutate: deletePlayoffMatches, isPending: isDeleting } =
    api.match.deletePlayoffMatches.useMutation({
      onSuccess: async () => {
        await utils.match.getAll.invalidate();
      },
    });

  if (isLoadingMatches || isLoadingPlayers || isLoadingScores) {
    return <div className="py-4 text-center">Laddar slutspel...</div>;
  }

  const playoffMatches = matches?.filter((match) => match.isPlayoff) ?? [];

  // Define the structure of the playoff bracket
  const rounds = [
    { round: 1, name: "Åttondelsfinal", matches: 8 },
    { round: 2, name: "Kvartsfinal", matches: 4 },
    { round: 3, name: "Semifinal", matches: 2 },
    { round: 4, name: "Final", matches: 1 },
  ];

  // Group existing matches by round
  const matchesByRound: Record<number, Match[]> = {};
  playoffMatches.forEach((match) => {
    matchesByRound[match.round] ??= [];
    matchesByRound[match.round]!.push(match);
  });

  // If no matches exist yet, show generate button
  if (!playoffMatches.length && matches && matches.length > 0) {
    return (
      <div className="space-y-4">
        <div className="py-4 text-center text-muted-foreground">
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

  return (
    <div className="py-10">
      <div className="relative mx-auto min-w-[1400px] px-8 py-12">
        {/* Title */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center">
          <h2 className="text-[100px] font-bold text-primary">SLUTSPEL</h2>
        </div>

        <div className="mx-auto grid w-fit grid-cols-8 grid-rows-8 justify-between gap-16">
          {/* Left side of bracket */}
          <div className="col-span-3 row-span-8 flex h-full w-fit items-center gap-32">
            <div className="flex-1 space-y-4">
              <div className="space-y-32">
                {Array.from({ length: 4 }).map((_, index) => {
                  const match = matchesByRound[1]?.[index];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      players={players}
                      scores={scores}
                      showConnector={true}
                      connectorType="right"
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-96">
                {Array.from({ length: 2 }).map((_, index) => {
                  const match = matchesByRound[2]?.[index];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      players={players}
                      scores={scores}
                      showConnector={true}
                      connectorType="right"
                      className=""
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="pt-4">
                <MatchPair
                  match={matchesByRound[3]?.[0]}
                  players={players}
                  scores={scores}
                  showConnector={true}
                  connectorType="right"
                />
              </div>
            </div>
          </div>

          {/* Final match at the bottom */}
          <div className="col-span-2 row-span-8 flex items-center gap-32">
            <div className="mx-auto w-full pt-4">
              <MatchPair
                match={matchesByRound[4]?.[0]}
                players={players}
                scores={scores}
                showConnector={false}
                connectorType={undefined}
                className="mx-auto w-[calc(100%-4rem)]"
                isFinal={true}
              />
            </div>
          </div>

          {/* Right side of bracket */}
          <div className="col-span-3 row-span-8 flex items-center gap-32">
            <div className="flex-1 space-y-4">
              <div className="pt-4">
                <MatchPair
                  match={matchesByRound[3]?.[1]}
                  players={players}
                  scores={scores}
                  showConnector={true}
                  connectorType="left"
                />
              </div>
            </div>

            <div className="col-span-1 row-span-8 space-y-4">
              <div className="space-y-96">
                {Array.from({ length: 2 }).map((_, index) => {
                  const match = matchesByRound[2]?.[index + 2];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      players={players}
                      scores={scores}
                      showConnector={true}
                      connectorType="left"
                    />
                  );
                })}
              </div>
            </div>

            <div className="col-span-1 row-span-8 space-y-4">
              <div className="space-y-32">
                {Array.from({ length: 4 }).map((_, index) => {
                  const match = matchesByRound[1]?.[index + 4];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      players={players}
                      scores={scores}
                      showConnector={true}
                      connectorType="left"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-start">
        <Button onClick={() => deletePlayoffMatches()} disabled={isDeleting}>
          {isDeleting ? "Raderar..." : "Radera slutspelsträd"}
        </Button>
      </div>
    </div>
  );
}

// Separate component for a match pair with connector
function MatchPair({
  match,
  players,
  scores,
  showConnector,
  connectorType = "right",
  className,
  isFinal,
}: {
  match: Match | undefined;
  players: Player[] | undefined;
  scores: Score[] | undefined;
  showConnector: boolean;
  connectorType: "right" | "left" | undefined;
  className?: string;
  isFinal?: boolean;
}) {
  return (
    <div className="relative">
      {showConnector && (
        <svg
          className={cn(
            "absolute top-[-30px] h-[210px] w-16",
            connectorType === "right" ? "-right-16" : "-left-16",
          )}
          viewBox="0 0 64 100"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d={
              connectorType === "right"
                ? "M0 25H32V50H62V45H32V75H0"
                : "M64 25H32V50H2V45H32V75H64"
            }
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
        </svg>
      )}
      <div className={cn("flex flex-col gap-10", isFinal && "gap-0")}>
        <Card className={cn("min-h-14 w-[200px] border-primary/20", className)}>
          <CardContent className="flex items-center justify-between p-3 md:p-4">
            <div className="font-medium">
              {match
                ? (players?.find((player) => player.id === match.player1Id)
                    ?.name ?? "")
                : ""}
            </div>
            <div className="font-bold">
              {match
                ? (scores?.find((score) => score.matchId === match.id)
                    ?.player1Score ?? "")
                : ""}
            </div>
          </CardContent>
        </Card>
        {isFinal && (
          <div className="text-center text-[80px] font-semibold">Final</div>
        )}
        <Card className={cn("min-h-14 w-[200px] border-primary/20", className)}>
          <CardContent className="flex items-center justify-between p-3 md:p-4">
            <div className="font-medium">
              {match
                ? (players?.find((player) => player.id === match.player2Id)
                    ?.name ?? "")
                : ""}
            </div>
            <div className="font-bold">
              {match
                ? (scores?.find((score) => score.matchId === match.id)
                    ?.player2Score ?? "")
                : ""}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
