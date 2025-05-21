"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import useMediaQuery from "@/hooks/use-media-query";
import type { UserData } from "./group-client";
import { PLAYOFF_ROUND_NAMES } from "@/lib/types";
import { usePlayoffBracketData } from "@/hooks/use-playoff-bracket-data";
import { BracketLayout } from "./bracket-layout";
import { ActionButtons } from "./action-buttons";
import { BracketSection } from "./bracket-section";
import { usePlayoffMutations } from "@/hooks/use-playoff-mutations";

export function PlayoffBracket({ user }: { user?: UserData | null }) {
  const isDesktop = useMediaQuery("(min-width: 1200px)");

  const { data: matches, isPending: isLoadingMatches } =
    api.match.getAll.useQuery();
  const { data: players, isPending: isLoadingPlayers } =
    api.player.getAll.useQuery();
  const { data: scores, isPending: isLoadingScores } =
    api.score.getAll.useQuery();

  const { matchesByRound, nextRoundToGenerateDetails, playoffMatches } =
    usePlayoffBracketData(matches);

  const {
    generatePlayoffs,
    isGenerating,
    createNextRoundMatches,
    isCreatingNextRound,
  } = usePlayoffMutations();

  if (isLoadingMatches || isLoadingPlayers || isLoadingScores) {
    return <div className="py-4 text-center">Laddar slutspel...</div>;
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

  if (!isDesktop) {
    return (
      <div className="px-2 py-6">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-primary">SLUTSPEL</h2>
        </div>
        {Object.entries(matchesByRound).map(([round, matches]) => (
          <BracketSection
            key={round}
            title={PLAYOFF_ROUND_NAMES[Number(round)] ?? `Omgång ${round}`}
            matches={matches}
            connectorType="right"
            players={players ?? []}
            scores={scores ?? []}
          />
        ))}
        <ActionButtons
          nextRound={nextRoundToGenerateDetails}
          onGenerateNext={createNextRoundMatches}
          isCreatingNext={isCreatingNextRound}
        />
      </div>
    );
  }

  const leftMatches = [
    { title: "Åttondelsfinal", matches: matchesByRound[1]?.slice(0, 4) ?? [] },
    {
      title: "Kvartsfinal",
      matches: Array.from({ length: 2 }).map((_, i) => matchesByRound[2]?.[i]),
    },
    { title: "Semifinal", matches: [matchesByRound[3]?.[0]] },
  ];

  const rightMatches = [
    { title: "Semifinal", matches: [matchesByRound[3]?.[1]] },
    {
      title: "Kvartsfinal",
      matches: Array.from({ length: 2 }).map(
        (_, i) => matchesByRound[2]?.[i + 2],
      ),
    },
    { title: "Åttondelsfinal", matches: matchesByRound[1]?.slice(4) ?? [] },
  ];

  return (
    <div className="py-10">
      <div className="tv:px-8 relative mx-auto min-w-[1400px] px-2 py-12">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 text-center">
          <h2 className="tv:text-[100px] font-bold text-primary sm:text-[50px]">
            SLUTSPEL
          </h2>
        </div>

        <BracketLayout
          leftMatches={leftMatches}
          rightMatches={rightMatches}
          finalMatch={matchesByRound[4]?.[0]}
          players={players ?? []}
          scores={scores ?? []}
        />
      </div>

      <ActionButtons
        nextRound={nextRoundToGenerateDetails}
        onGenerateNext={createNextRoundMatches}
        isCreatingNext={isCreatingNextRound}
      />
    </div>
  );
}
