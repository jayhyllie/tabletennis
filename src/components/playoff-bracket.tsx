"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@prisma/client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useMediaQuery from "@/hooks/use-media-query";
import type { UserData } from "./group-client";
const FINAL_BRACKET_ROUND_NUMBER = 4;
export const PLAYOFF_ROUND_NAMES: Record<number, string> = {
  1: "Åttondelsfinal",
  2: "Kvartsfinal",
  3: "Semifinal",
  4: "Final",
};

export function PlayoffBracket({ user }: { user?: UserData | null }) {
  const utils = api.useUtils();
  const { toast } = useToast();

  const isDesktop = useMediaQuery("(min-width: 1200px)");

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

  const { mutate: createNextRoundMatches, isPending: isCreatingNextRound } =
    api.match.createEmptyPlayoffMatchesForRound.useMutation({
      onSuccess: async (data) => {
        await utils.match.getAll.invalidate();
        toast({
          title: data.createdNew ? "Nästa omgång genererad" : "Info",
          description: data.message,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Fel vid generering av nästa omgång",
          description: error.message,
        });
      },
    });

  if (isLoadingMatches || isLoadingPlayers || isLoadingScores) {
    return <div className="py-4 text-center">Laddar slutspel...</div>;
  }

  const playoffMatches = matches?.filter((match) => match.isPlayoff) ?? [];

  const roundsInfo = [
    // This can be kept local or shared from a constants file
    { round: 1, name: "Åttondelsfinal", matches: 8 },
    { round: 2, name: "Kvartsfinal", matches: 4 },
    { round: 3, name: "Semifinal", matches: 2 },
    { round: 4, name: "Final", matches: 1 },
  ];

  const matchesByRound: Record<number, Match[]> = {};
  playoffMatches.forEach((match) => {
    matchesByRound[match.round] ??= [];
    matchesByRound[match.round]!.push(match);
  });

  // Sort matches within each round by their order for display consistency
  for (const roundNum in matchesByRound) {
    matchesByRound[roundNum]?.sort(
      (a, b) =>
        (a.matchOrderInRound ?? Infinity) - (b.matchOrderInRound ?? Infinity),
    );
  }

  let nextRoundToGenerateDetails: { roundNumber: number; name: string } | null =
    null;
  if (playoffMatches && playoffMatches.length > 0) {
    const roundsPresent = [...new Set(playoffMatches.map((m) => m.round))].sort(
      (a, b) => a - b,
    );
    if (roundsPresent.length > 0) {
      const maxRoundPresentWithMatches =
        roundsPresent[roundsPresent.length - 1];

      if (
        maxRoundPresentWithMatches &&
        maxRoundPresentWithMatches < FINAL_BRACKET_ROUND_NUMBER
      ) {
        const matchesInMaxRound = playoffMatches.filter(
          (m) => m.round === maxRoundPresentWithMatches,
        );
        const allMatchesInMaxRoundCompleted =
          matchesInMaxRound.length > 0 &&
          matchesInMaxRound.every((m) => m.completed);

        if (allMatchesInMaxRoundCompleted) {
          const nextRoundNumber = maxRoundPresentWithMatches + 1;
          const matchesInNextRoundExist = playoffMatches.some(
            (m) => m.round === nextRoundNumber,
          );
          if (!matchesInNextRoundExist) {
            nextRoundToGenerateDetails = {
              roundNumber: nextRoundNumber,
              name:
                PLAYOFF_ROUND_NAMES[nextRoundNumber] ??
                `Omgång ${nextRoundNumber}`,
            };
          }
        }
      }
    }
  } else if (matches && matches.length > 0 && playoffMatches.length === 0) {
    // No playoff matches exist yet. Suggest generating Round 1.
    // This assumes generatePlayoffs might not always be the first step, or it failed.
    const round1Info = roundsInfo.find((r) => r.round === 1);
    if (round1Info) {
      nextRoundToGenerateDetails = {
        roundNumber: 1,
        name: PLAYOFF_ROUND_NAMES[1] ?? "Omgång 1",
      };
    }
  }

  if (
    !playoffMatches.length &&
    matches &&
    matches.length > 0 &&
    !nextRoundToGenerateDetails
  ) {
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

  const getPlayerName = (playerId: string | null | undefined) => {
    if (!playerId) return "";
    return players?.find((p) => p.id === playerId)?.name ?? "Okänd";
  };

  const getPlayerScore = (
    matchId: string | undefined,
    playerType: "player1" | "player2",
  ) => {
    if (!matchId) return "";
    const score = scores?.find((s) => s.matchId === matchId);
    if (!score) return "";
    return playerType === "player1" ? score.player1Score : score.player2Score;
  };

  const getWinnerPlayerId = (match: Match | undefined) => {
    if (!match) return null;
    const score = scores?.find((s) => s.matchId === match.id);
    if (!score) return null;
    return score.player1Score > score.player2Score
      ? match.player1Id
      : match.player2Id;
  };

  // Common buttons logic
  const actionButtons = (
    <div className="mt-10 flex flex-wrap justify-center gap-4 px-4 md:justify-start">
      {nextRoundToGenerateDetails &&
      nextRoundToGenerateDetails.roundNumber > 1 &&
      user?.role === "admin" ? (
        <Button
          onClick={() =>
            createNextRoundMatches({
              roundNumber: nextRoundToGenerateDetails.roundNumber,
            })
          }
          disabled={isCreatingNextRound}
          variant="secondary"
          className="text-white"
        >
          {isCreatingNextRound
            ? "Genererar..."
            : `Generera matcher för ${nextRoundToGenerateDetails.name}`}
        </Button>
      ) : (
        !nextRoundToGenerateDetails && // Only show "Generera Slutspel" if no next round is pending
        playoffMatches.length === 0 && ( // And no playoff matches exist yet
          <Button onClick={() => generatePlayoffs()} disabled={isGenerating}>
            {isGenerating ? "Genererar..." : "Generera slutspel"}
          </Button>
        )
      )}
    </div>
  );

  if (!isDesktop) {
    // Mobile/Tablet List View
    return (
      <div className="px-2 py-6">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-primary">SLUTSPEL</h2>
        </div>
        {roundsInfo.map((round) => {
          const currentRoundMatches = matchesByRound[round.round] ?? [];

          return (
            <div key={round.round} className="mb-8">
              <h3 className="mb-4 text-center text-2xl font-semibold">
                {PLAYOFF_ROUND_NAMES[round.round] ?? `Omgång ${round.round}`}
              </h3>
              {currentRoundMatches.length > 0 ? (
                <div className="space-y-3">
                  {currentRoundMatches.map((match) => {
                    const winnerId = getWinnerPlayerId(match);
                    return (
                      <Card
                        key={match.id}
                        className="border-primary/80 shadow-lg"
                      >
                        <CardContent className="p-3">
                          <div
                            className={cn(
                              "flex items-center justify-between",
                              winnerId === match.player1Id &&
                                "font-semibold text-green-600",
                            )}
                          >
                            <span className="font-medium">
                              {getPlayerName(match.player1Id)}
                            </span>
                            <span className="font-bold">
                              {match.completed
                                ? getPlayerScore(match.id, "player1")
                                : "-"}
                            </span>
                          </div>
                          <div className="my-1 text-center text-sm text-muted-foreground">
                            vs
                          </div>
                          <div
                            className={cn(
                              "flex items-center justify-between",
                              winnerId === match.player2Id &&
                                "font-semibold text-green-600",
                            )}
                          >
                            <span className="font-medium">
                              {getPlayerName(match.player2Id)}
                            </span>
                            <span className="font-bold">
                              {match.completed
                                ? getPlayerScore(match.id, "player2")
                                : "-"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  {(nextRoundToGenerateDetails &&
                    nextRoundToGenerateDetails.roundNumber === round.round) ||
                  (playoffMatches.length === 0 && round.round === 1)
                    ? `Väntar på att ${PLAYOFF_ROUND_NAMES[round.round] ?? `Omgång ${round.round}`} ska genereras...`
                    : `Inga matcher för ${PLAYOFF_ROUND_NAMES[round.round] ?? `Omgång ${round.round}`}.`}
                </div>
              )}
            </div>
          );
        })}
        {actionButtons}
      </div>
    );
  }

  // Desktop Bracket View (existing code)
  return (
    <div className="py-10">
      <div className="tv:px-8 relative mx-auto min-w-[1400px] px-2 py-12">
        {/* Title */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center">
          <h2 className="tv:text-[100px] font-bold text-primary sm:text-[50px]">
            SLUTSPEL
          </h2>
        </div>

        <div className="mx-auto grid w-fit grid-cols-8 grid-rows-8 justify-between gap-16">
          {/* Left side of bracket */}
          <div className="tv:gap-32 col-span-3 row-span-8 flex h-full w-fit items-center gap-12">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="text-center text-2xl font-bold">
                  Åttondelsfinal
                </h4>
                <p className="text-center text-sm text-muted-foreground">
                  Best of 3
                </p>
              </div>
              <div className="tv:space-y-32 space-y-16">
                {Array.from({ length: 4 }).map((_, index) => {
                  const match = matchesByRound[1]?.[index];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      showConnector={true}
                      connectorType="right"
                      getPlayerName={getPlayerName}
                      getPlayerScore={getPlayerScore}
                      winnerPlayerId={getWinnerPlayerId(match)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="text-center text-2xl font-bold">Kvartsfinal</h4>
                <p className="text-center text-sm text-muted-foreground">
                  Best of 3
                </p>
              </div>
              <div className="tv:space-y-96 space-y-64">
                {Array.from({ length: 2 }).map((_, index) => {
                  const match = matchesByRound[2]?.[index];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      showConnector={true}
                      connectorType="right"
                      className=""
                      getPlayerName={getPlayerName}
                      getPlayerScore={getPlayerScore}
                      winnerPlayerId={getWinnerPlayerId(match)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="text-center text-2xl font-bold">Semifinal</h4>
                <p className="text-center text-sm text-muted-foreground">
                  Best of 3
                </p>
              </div>
              <div className="pt-4">
                <MatchPair
                  match={matchesByRound[3]?.[0]}
                  showConnector={true}
                  connectorType="right"
                  getPlayerName={getPlayerName}
                  getPlayerScore={getPlayerScore}
                  winnerPlayerId={getWinnerPlayerId(matchesByRound[3]?.[0])}
                />
              </div>
            </div>
          </div>

          {/* Final match at the bottom */}
          <div className="col-span-2 row-span-8 flex items-center gap-32">
            <div className="mx-auto w-full pt-4">
              <MatchPair
                match={matchesByRound[4]?.[0]}
                showConnector={false}
                connectorType={undefined}
                className="mx-auto w-[calc(100%-4rem)]"
                isFinal={true}
                getPlayerName={getPlayerName}
                getPlayerScore={getPlayerScore}
                winnerPlayerId={getWinnerPlayerId(matchesByRound[4]?.[0])}
              />
            </div>
          </div>

          {/* Right side of bracket */}
          <div className="tv:gap-32 col-span-3 row-span-8 flex h-full w-fit items-center gap-12">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="text-center text-2xl font-bold">Semifinal</h4>
                <p className="text-center text-sm text-muted-foreground">
                  Best of 3
                </p>
              </div>
              <div className="pt-4">
                <MatchPair
                  match={matchesByRound[3]?.[1]}
                  showConnector={true}
                  connectorType="left"
                  getPlayerName={getPlayerName}
                  getPlayerScore={getPlayerScore}
                  winnerPlayerId={getWinnerPlayerId(matchesByRound[3]?.[1])}
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="text-center text-2xl font-bold">Kvartsfinal</h4>
                <p className="text-center text-sm text-muted-foreground">
                  Best of 3
                </p>
              </div>
              <div className="tv:space-y-96 space-y-64">
                {Array.from({ length: 2 }).map((_, index) => {
                  const match = matchesByRound[2]?.[index + 2];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      showConnector={true}
                      connectorType="left"
                      getPlayerName={getPlayerName}
                      getPlayerScore={getPlayerScore}
                      winnerPlayerId={getWinnerPlayerId(match)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="text-center text-2xl font-bold">
                  Åttondelsfinal
                </h4>
                <p className="text-center text-sm text-muted-foreground">
                  Best of 3
                </p>
              </div>
              <div className="tv:space-y-32 space-y-16">
                {Array.from({ length: 4 }).map((_, index) => {
                  const match = matchesByRound[1]?.[index + 4];
                  return (
                    <MatchPair
                      key={match?.id ?? index}
                      match={match}
                      showConnector={true}
                      connectorType="left"
                      getPlayerName={getPlayerName}
                      getPlayerScore={getPlayerScore}
                      winnerPlayerId={getWinnerPlayerId(match)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {actionButtons}
    </div>
  );
}

// Separate component for a match pair with connector
function MatchPair({
  match,
  showConnector,
  connectorType = "right",
  className,
  isFinal,
  getPlayerName,
  getPlayerScore,
  winnerPlayerId,
}: {
  match: Match | undefined;
  showConnector: boolean;
  connectorType: "right" | "left" | undefined;
  className?: string;
  isFinal?: boolean;
  getPlayerName: (playerId: string | null | undefined) => string;
  getPlayerScore: (
    matchId: string | undefined,
    playerType: "player1" | "player2",
  ) => string | number;
  winnerPlayerId: string | null | undefined;
}) {
  return (
    <div className="relative">
      {showConnector && (
        <svg
          className={cn(
            "tv:top-[-30px] tv:h-[210px] tv:w-16 absolute md:top-[-10px] md:h-[180px] md:w-8 [@media(max-width:600px)]:hidden",
            connectorType === "right"
              ? "tv:-right-16 md:-right-8"
              : "tv:-left-16 md:-left-8",
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
        <Card
          className={cn(
            "tv:w-[200px] flex min-h-14 w-[150px] items-center justify-center border-primary/20",
            winnerPlayerId === match?.player1Id && "bg-green-100",
            className,
          )}
        >
          <CardContent className="tv:p-4 flex items-center justify-between gap-4 p-1 md:p-2">
            <div className="tv:text-base text-xs font-medium">
              {getPlayerName(match?.player1Id)}
            </div>
            <div className="tv:text-base text-xs font-bold">
              {match?.completed ? getPlayerScore(match?.id, "player1") : ""}
            </div>
          </CardContent>
        </Card>
        {isFinal && (
          <div className="my-8 flex flex-col items-center gap-0">
            <h4 className="text-center text-5xl font-bold">Final</h4>
            <p className="text-center text-sm text-muted-foreground">
              Best of 5
            </p>
          </div>
        )}
        <Card
          className={cn(
            "tv:w-[200px] flex min-h-14 w-[150px] items-center justify-center border-primary/20",
            winnerPlayerId === match?.player2Id && "bg-green-100",
            className,
          )}
        >
          <CardContent className="tv:p-4 flex items-center justify-between gap-4 p-1 md:p-2">
            <div className="tv:text-base text-xs font-medium">
              {getPlayerName(match?.player2Id)}
            </div>
            <div className="tv:text-base text-xs font-bold">
              {match?.completed ? getPlayerScore(match?.id, "player2") : ""}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
