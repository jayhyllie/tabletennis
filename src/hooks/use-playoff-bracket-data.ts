import { useMemo } from "react";
import type { Match } from "@prisma/client";
import {
  PLAYOFF_ROUND_NAMES,
  FINAL_BRACKET_ROUND_NUMBER,
  roundsInfo,
} from "@/lib/types";

export function usePlayoffBracketData(matches: Match[] | undefined) {
  return useMemo(() => {
    const playoffMatches = matches?.filter((match) => match.isPlayoff) ?? [];

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

    let nextRoundToGenerateDetails: {
      roundNumber: number;
      name: string;
    } | null = null;
    if (playoffMatches && playoffMatches.length > 0) {
      const roundsPresent = [
        ...new Set(playoffMatches.map((m) => m.round)),
      ].sort((a, b) => a - b);
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

    return {
      matchesByRound,
      nextRoundToGenerateDetails,
      playoffMatches,
    };
  }, [matches]);
}
