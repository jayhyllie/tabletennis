import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Define the final round number. Adjust if your playoff structure has a different number of rounds.
const FINAL_ROUND_NUMBER = 4;

export const matchRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.match.findMany();
  }),
  create: publicProcedure
    .input(
      z.object({
        player1Id: z.string(),
        player2Id: z.string(),
        round: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.match.create({
        data: {
          player1Id: input.player1Id,
          player2Id: input.player2Id,
          round: input.round,
        },
      });
    }),
  generateMatches: publicProcedure.mutation(async ({ ctx }) => {
    // Get all groups with their players
    const groups = await ctx.db.group.findMany({
      include: {
        PlayerGroup: true,
      },
    });

    const matches = [];

    for (const group of groups) {
      const players = group.PlayerGroup.map((pg) => pg.playerId);

      // Generate matches for both rounds (home and away)
      for (let round = 1; round <= 2; round++) {
        // Generate matches between each pair of players
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            const match = {
              player1Id: round === 1 ? players[i] : players[j],
              player2Id: round === 1 ? players[j] : players[i],
              round: round,
              groupId: group.id,
            };
            matches.push(match);
          }
        }
      }
    }

    // Create all matches in the database
    return ctx.db.match.createMany({
      data: matches.filter(
        (match) => match.player1Id && match.player2Id,
      ) as Prisma.MatchCreateManyInput[],
    });
  }),

  resetAllMatches: publicProcedure.mutation(async ({ ctx }) => {
    // First delete all scores
    await ctx.db.score.deleteMany();

    // Then reset all matches to not completed
    await ctx.db.match.updateMany({
      data: { completed: false },
    });
  }),

  generatePlayoffs: publicProcedure.mutation(async ({ ctx }) => {
    // Get all groups with their matches and scores
    const groups = await ctx.db.group.findMany({
      include: {
        Match: {
          include: {
            scores: true,
          },
        },
        PlayerGroup: {
          include: {
            player: true,
          },
        },
      },
    });

    // Calculate standings for each group
    const groupStandings = new Map<
      string,
      Array<{
        playerId: string;
        groupId: string;
        position: number; // 1 for 1st, 2 for 2nd, 3 for 3rd
        points: number;
        totalScoreFor: number;
        totalScoreAgainst: number;
      }>
    >();

    for (const group of groups) {
      const playerStats = new Map<
        string,
        {
          playerId: string;
          groupId: string;
          points: number;
          totalScoreFor: number;
          totalScoreAgainst: number;
        }
      >();

      // Initialize stats for players in this group
      for (const pg of group.PlayerGroup) {
        playerStats.set(pg.player.id, {
          playerId: pg.player.id,
          groupId: group.id,
          points: 0,
          totalScoreFor: 0,
          totalScoreAgainst: 0,
        });
      }

      // Calculate stats from matches in this group
      for (const match of group.Match) {
        const score = match.scores[0];
        if (!score) continue;

        const player1Stats = playerStats.get(match.player1Id ?? "");
        const player2Stats = playerStats.get(match.player2Id ?? "");

        if (player1Stats && player2Stats) {
          player1Stats.totalScoreFor += score.player1Score;
          player1Stats.totalScoreAgainst += score.player2Score;
          player2Stats.totalScoreFor += score.player2Score;
          player2Stats.totalScoreAgainst += score.player1Score;

          if (score.player1Score > score.player2Score) {
            player1Stats.points += 2;
          } else {
            player2Stats.points += 2;
          }
        }
      }

      // Sort players in this group
      const sortedGroupPlayers = Array.from(playerStats.values())
        .sort((a, b) => {
          // 1. Compare points (higher is better)
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          // 2. Compare score difference (higher is better)
          const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
          const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
          if (bScoreDiff !== aScoreDiff) {
            return bScoreDiff - aScoreDiff;
          }
          // 3. Compare total score for (higher is better as a final tie-breaker)
          return b.totalScoreFor - a.totalScoreFor;
        })
        .map((player, index) => ({
          ...player,
          position: index + 1,
        }));

      groupStandings.set(group.id, sortedGroupPlayers);
    }

    // Define the type for a player standing
    type PlayerStanding = {
      playerId: string;
      groupId: string;
      position: number;
      points: number;
      totalScoreFor: number;
      totalScoreAgainst: number;
    };

    const firstPlaces: PlayerStanding[] = [];
    const secondPlaces: PlayerStanding[] = [];
    const thirdPlaces: PlayerStanding[] = [];

    groupStandings.forEach((standings) => {
      if (standings[0]) firstPlaces.push(standings[0]);
      if (standings[1]) secondPlaces.push(standings[1]);
      if (standings[2]) thirdPlaces.push(standings[2]);
    });

    // Helper sort function for overall ranking of players from different groups
    const sortByOverallRank = (a: PlayerStanding, b: PlayerStanding) => {
      // 1. Compare points
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // 2. Compare score difference
      const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
      const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
      if (bScoreDiff !== aScoreDiff) {
        return bScoreDiff - aScoreDiff;
      }
      // 3. Compare total score for
      return b.totalScoreFor - a.totalScoreFor;
    };

    // Sort first places (best to worst)
    const sortedFirstPlaces = [...firstPlaces].sort(sortByOverallRank);

    // Sort second places (best to worst)
    const sortedSecondPlaces = [...secondPlaces].sort(sortByOverallRank);

    // Sort third places (best to worst) and take top 4
    const sortedThirdPlaces = [...thirdPlaces]
      .sort(sortByOverallRank)
      .slice(0, 4);

    // Helper function to check if players are from the same group
    const areFromSameGroup = (
      player1: PlayerStanding,
      player2: PlayerStanding,
    ) => {
      return player1.groupId === player2.groupId;
    };

    // Helper to find the WEAKEST suitable opponent from a list
    // Opponents list is assumed to be sorted BEST to WORST initially
    const findWeakestSuitableOpponent = (
      player1: PlayerStanding,
      potentialOpponents: ReadonlyArray<PlayerStanding>, // Use ReadonlyArray
      currentlyUsedPlayerIds: Set<string>,
    ): PlayerStanding | undefined => {
      for (let i = potentialOpponents.length - 1; i >= 0; i--) {
        // Iterate from worst to best
        const opponent = potentialOpponents[i];
        if (
          opponent &&
          !currentlyUsedPlayerIds.has(opponent.playerId) &&
          !areFromSameGroup(player1, opponent)
        ) {
          return opponent;
        }
      }
      return undefined;
    };

    const usedPlayerIds = new Set<string>();
    const playoffMatchesToCreate: Array<
      Omit<Prisma.MatchCreateManyInput, "player1Id" | "player2Id"> & {
        player1Id: string;
        player2Id: string;
        matchOrderInRound: number;
      }
    > = [];
    let currentMatchOrder = 0;

    // Define pairings for Round 1 (8 matches total)
    // These are placeholders for actual player objects
    const round1Pairings: Array<{
      p1: PlayerStanding | undefined;
      p2: PlayerStanding | undefined;
    }> = [];

    // Block 1: Top 4 First Places vs. Qualified Third Places
    // sortedFirstPlaces are best to worst. qualifiedThirdPlaces are best to worst.
    // Each 1st place team (from best to worst) tries to pair with the weakest available 3rd place team.
    const top4FirstPlaces = sortedFirstPlaces.slice(0, 4);
    const qualifiedThirdPlaces = [...sortedThirdPlaces]; // Use a copy to allow modification/filtering

    for (const p1 of top4FirstPlaces) {
      if (usedPlayerIds.has(p1.playerId)) continue; // Should only happen if p1 list wasn't unique

      const p2 = findWeakestSuitableOpponent(
        p1,
        qualifiedThirdPlaces,
        usedPlayerIds,
      );
      if (p2) {
        // p1 is guaranteed to be defined here
        round1Pairings.push({ p1, p2 });
        usedPlayerIds.add(p1.playerId);
        usedPlayerIds.add(p2.playerId);
      } else {
        console.warn(
          `Playoff Generation: ${p1.playerId} (Top 4 First Place) could not be paired with a 3rd place team.`,
        );
      }
    }

    // Block 2: Remaining First Places vs. Sorted Second Places
    // These are typically 5th, 6th, etc., best 1st place teams.
    // They should also try to play weaker available 2nd place teams.
    const remainingFirstPlaces = sortedFirstPlaces.filter(
      (p) => !usedPlayerIds.has(p.playerId),
    );
    for (const p1 of remainingFirstPlaces) {
      // if (usedPlayerIds.has(p1.playerId)) continue; // Redundant due to filter

      const p2 = findWeakestSuitableOpponent(
        p1,
        sortedSecondPlaces,
        usedPlayerIds,
      );
      if (p2) {
        round1Pairings.push({ p1, p2 });
        usedPlayerIds.add(p1.playerId);
        usedPlayerIds.add(p2.playerId);
      } else {
        console.warn(
          `Playoff Generation: ${p1.playerId} (Remaining First Place) could not be paired with a 2nd place team.`,
        );
      }
    }

    // Block 3: Remaining Second Places vs. Each Other
    // The best of these remaining 2nd places should play the weakest of the OTHER remaining 2nd places.
    let availableFor2v2 = sortedSecondPlaces.filter(
      (p) => !usedPlayerIds.has(p.playerId),
    );

    while (availableFor2v2.length >= 2) {
      const p1 = availableFor2v2.shift(); // Takes the best available P1 from the current pool
      if (!p1) break; // Should not happen if length >= 2

      // Opponent must be from the *remaining* players in availableFor2v2
      // P1 (stronger of this sub-pool) plays weakest of the rest.
      const p2 = findWeakestSuitableOpponent(
        p1,
        availableFor2v2,
        usedPlayerIds,
      );

      if (p2) {
        // p1 is defined
        round1Pairings.push({ p1, p2 });
        usedPlayerIds.add(p1.playerId); // p1 is marked used globally
        usedPlayerIds.add(p2.playerId); // p2 is marked used globally

        // Remove p2 from availableFor2v2 as it's now paired
        availableFor2v2 = availableFor2v2.filter(
          (player) => player.playerId !== p2.playerId,
        );
      } else {
        // p1 could not find a partner from the rest of availableFor2v2.
        // This implies an issue (e.g., all remaining are same group, or only 1 left unexpectedly).
        console.warn(
          `Playoff Generation: ${p1.playerId} (2nd place for 2v2 pairing) could not find an opponent.`,
        );
        // If p1 wasn't paired, it remains in `usedPlayerIds` if it was added, but it wasn't added to a pair.
        // It's already removed from availableFor2v2 by shift().
      }
    }
    if (availableFor2v2.length === 1) {
      console.warn(
        `Playoff Generation: Player ${availableFor2v2[0]?.playerId} (2nd place) is left unpaired.`,
      );
    }

    // Now, create the match objects from the pairings
    for (const pairing of round1Pairings) {
      if (pairing.p1 && pairing.p2) {
        playoffMatchesToCreate.push({
          player1Id: pairing.p1.playerId,
          player2Id: pairing.p2.playerId,
          round: 1,
          isPlayoff: true,
          matchOrderInRound: currentMatchOrder++,
        });
      } else {
        // This would indicate an issue in pairing logic if we expect 8 full matches
        console.error("Playoff generation: A pairing was incomplete.", pairing);
      }
    }

    // Ensure we have 8 matches if that's the expectation for round 1
    if (
      playoffMatchesToCreate.length !== 8 &&
      sortedFirstPlaces.length >= 4 &&
      sortedThirdPlaces.length >= 0
    ) {
      // Added a check to see if we have enough teams
      console.warn(
        `Playoff Generation Warning: Expected 8 playoff matches for Round 1, but generated ${playoffMatchesToCreate.length}. Check seeding logic and number of qualifying teams. Top 1st: ${sortedFirstPlaces.length}, Top 2nd: ${sortedSecondPlaces.length}, Top 3rd: ${sortedThirdPlaces.length}`,
      );
      // Potentially throw an error here if 8 matches are strictly required and team counts are sufficient.
    }

    // Filter out any matches where player IDs might have ended up undefined/null (should not happen with this logic)
    const finalMatchesToCreate = playoffMatchesToCreate
      // The filter step below is technically not needed anymore if round1Pairings ensures p1 and p2 exist.
      // .filter((m) => m.player1Id && m.player2Id)
      .map((m) => ({
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        round: m.round,
        isPlayoff: m.isPlayoff,
        matchOrderInRound: m.matchOrderInRound,
      }));

    // Create playoff matches in the database
    if (finalMatchesToCreate.length > 0) {
      await ctx.db.match.createMany({
        data: finalMatchesToCreate as Prisma.MatchCreateManyInput[], // Type assertion
      });
    }

    return finalMatchesToCreate;
  }),

  deletePlayoffMatches: publicProcedure.mutation(async ({ ctx }) => {
    // Find all playoff matches
    const playoffMatches = await ctx.db.match.findMany({
      where: {
        isPlayoff: true,
      },
      select: {
        id: true, // Select only the IDs
      },
    });

    // Extract the IDs of the playoff matches
    const playoffMatchIds = playoffMatches.map((match) => match.id);

    // If there are playoff matches, delete their scores first
    if (playoffMatchIds.length > 0) {
      await ctx.db.score.deleteMany({
        where: {
          matchId: {
            in: playoffMatchIds,
          },
        },
      });
    }

    // Then, delete the playoff matches
    await ctx.db.match.deleteMany({
      where: {
        isPlayoff: true,
      },
    });
  }),

  deleteDuplicateMatches: publicProcedure.mutation(async ({ ctx }) => {
    // First, get all matches
    const matches = await ctx.db.match.findMany({
      include: {
        scores: true, // Include scores to check if match has been played
      },
    });

    // Keep track of seen matches and matches to delete
    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    // Sort matches so completed ones are processed first (this ensures we keep completed matches)
    const sortedMatches = [...matches].sort((a, b) => {
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      return 0;
    });

    sortedMatches.forEach((match) => {
      // Create a unique key for each match combination
      const matchKey = `${match.player1Id}-${match.player2Id}-${match.round}-${match.groupId}`;

      if (seen.has(matchKey)) {
        // This is a duplicate - only add to delete list if it's not completed
        if (!match.completed && match.scores.length === 0) {
          duplicateIds.push(match.id);
        }
      } else {
        // First time seeing this match combination
        seen.add(matchKey);
      }
    });

    // Delete all duplicates
    if (duplicateIds.length > 0) {
      await ctx.db.match.deleteMany({
        where: {
          id: {
            in: duplicateIds,
          },
        },
      });
    }

    return { deletedCount: duplicateIds.length };
  }),
  advanceWinner: publicProcedure
    .input(
      z.object({
        currentMatchId: z.string(),
        winnerPlayerId: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { currentMatchId, winnerPlayerId } = input;

      // It's crucial that winnerPlayerId is a valid player ID string when advancing.
      // The frontend should ensure this. If it can be null here due to some logic,
      // then advancing a "null" player doesn't make sense.
      if (!winnerPlayerId) {
        // This case should ideally be prevented by client-side logic.
        // If a match completes without a winner that can be advanced (e.g. one slot was empty),
        // this mutation shouldn't be called with a null/undefined winnerPlayerId for advancement.
        console.error(
          `AdvanceWinner called for match ${currentMatchId} with no valid winnerPlayerId.`,
        );
        // Optionally throw an error, or return without action if this is a possible valid state
        // where no advancement occurs. For now, we proceed assuming client sends valid string.
        // throw new Error("Winner player ID must be provided to advance winner.");
      }

      return ctx.db.$transaction(async (prisma) => {
        const currentMatch = await prisma.match.findUnique({
          where: { id: currentMatchId },
          select: {
            id: true,
            round: true,
            player1Id: true,
            player2Id: true,
            isPlayoff: true,
            matchOrderInRound: true,
          },
        });

        if (!currentMatch) {
          throw new Error("Current match not found.");
        }
        if (!currentMatch.isPlayoff) {
          throw new Error("Advancement logic is only for playoff matches.");
        }
        // Ensure winnerPlayerId is actually part of the current match if it's not null
        if (
          winnerPlayerId &&
          currentMatch.player1Id !== winnerPlayerId &&
          currentMatch.player2Id !== winnerPlayerId
        ) {
          throw new Error(
            "Selected winner is not a participant in this match.",
          );
        }
        if (currentMatch.matchOrderInRound === null) {
          throw new Error(
            `Match ${currentMatchId} is missing 'matchOrderInRound'. Cannot determine advancement path. Ensure 'generatePlayoffs' sets this.`,
          );
        }

        // Update winnerId for the current match (winnerPlayerId can be null if match is void or similar)
        // But for advancement, winnerPlayerId must be a string.
        const updatedCurrentMatch = await prisma.match.update({
          where: { id: currentMatchId },
          data: { winnerId: winnerPlayerId, completed: true },
        });

        let updatedNextMatch = null;

        // Only attempt to advance if there is a valid winnerPlayerId and not in final round
        if (winnerPlayerId && currentMatch.round < FINAL_ROUND_NUMBER) {
          const currentIndexInRound = currentMatch.matchOrderInRound;
          const nextRoundNumber = currentMatch.round + 1;
          const targetMatchOrderInNextRound = Math.floor(
            currentIndexInRound / 2,
          );
          const playerSlotPropertyToUpdate =
            currentIndexInRound % 2 === 0 ? "player1Id" : "player2Id";

          const nextMatchToUpdate = await prisma.match.findFirst({
            where: {
              round: nextRoundNumber,
              isPlayoff: true,
              matchOrderInRound: targetMatchOrderInNextRound,
            },
          });

          if (nextMatchToUpdate) {
            updatedNextMatch = await prisma.match.update({
              where: { id: nextMatchToUpdate.id },
              data: { [playerSlotPropertyToUpdate]: winnerPlayerId },
            });
          } else {
            // This is expected if the next round's matches haven't been created yet.
            // The createEmptyPlayoffMatchesForRound will handle populating them later.
            console.log(
              // Changed from warn to log as this is an expected intermediate state
              `AdvanceWinner: Next match for round ${nextRoundNumber} (order ${targetMatchOrderInNextRound}) not found at this time. Winner ${winnerPlayerId} from match ${currentMatchId} will be advanced when round ${nextRoundNumber} is generated.`,
            );
          }
        }
        return { updatedCurrentMatch, updatedNextMatch };
      });
    }),
  createEmptyPlayoffMatchesForRound: publicProcedure
    .input(
      z.object({
        roundNumber: z.number().int().min(1).max(FINAL_ROUND_NUMBER),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { roundNumber } = input;

      return ctx.db.$transaction(async (prisma) => {
        const playoffRoundsInfo = [
          { round: 1, name: "Åttondelsfinal", matches: 8 },
          { round: 2, name: "Kvartsfinal", matches: 4 },
          { round: 3, name: "Semifinal", matches: 2 },
          { round: 4, name: "Final", matches: 1 },
        ];

        const targetRoundInfo = playoffRoundsInfo.find(
          (r) => r.round === roundNumber,
        );

        if (!targetRoundInfo) {
          throw new Error(`Invalid playoff round number: ${roundNumber}`);
        }

        let existingMatchesForTargetRound = await prisma.match.findMany({
          where: { round: roundNumber, isPlayoff: true },
        });
        const existingMatchesCount = existingMatchesForTargetRound.length;

        let createdNewMatches = false;
        if (existingMatchesCount === 0) {
          const matchesToCreateData = [];
          for (let i = 0; i < targetRoundInfo.matches; i++) {
            matchesToCreateData.push({
              player1Id: null,
              player2Id: null,
              round: roundNumber,
              isPlayoff: true,
              matchOrderInRound: i,
            });
          }
          if (matchesToCreateData.length > 0) {
            await prisma.match.createMany({ data: matchesToCreateData });
            createdNewMatches = true;
            // Re-fetch matches for the target round to include newly created ones for population step
            existingMatchesForTargetRound = await prisma.match.findMany({
              where: { round: roundNumber, isPlayoff: true },
              orderBy: { matchOrderInRound: "asc" },
            });
          }
        } else if (existingMatchesCount !== targetRoundInfo.matches) {
          throw new Error(
            `Partially existing matches found for round ${roundNumber}. Expected ${targetRoundInfo.matches}, found ${existingMatchesCount}. Please resolve manually or delete existing playoff matches for this round.`,
          );
        }

        // Populate the newly created (or already existing if re-running) matches
        // This logic runs if roundNumber > 1, regardless of whether matches were *just* created or already existed (for idempotency)
        if (roundNumber > 1) {
          const previousRoundNumber = roundNumber - 1;
          const previousRoundCompletedMatches = await prisma.match.findMany({
            where: {
              round: previousRoundNumber,
              isPlayoff: true,
              completed: true,
              winnerId: { not: null }, // Crucially, winnerId must be non-null
              matchOrderInRound: { not: null },
            },
            select: {
              id: true,
              winnerId: true,
              matchOrderInRound: true,
              round: true,
            },
            orderBy: { matchOrderInRound: "asc" },
          });

          for (const prevMatch of previousRoundCompletedMatches) {
            if (!prevMatch.winnerId || prevMatch.matchOrderInRound === null) {
              // This should be filtered by the where clause, but as a safeguard
              console.warn(
                `Skipping advancement from prev match ${prevMatch.id}: winnerId or matchOrderInRound is null.`,
              );
              continue;
            }

            const currentIndexInPrevRound = prevMatch.matchOrderInRound;
            const targetMatchOrderInCurrentRound = Math.floor(
              currentIndexInPrevRound / 2,
            );
            const playerSlotPropertyToUpdate =
              currentIndexInPrevRound % 2 === 0 ? "player1Id" : "player2Id";

            // Find the target match in the current round (roundNumber) to update
            // This match should exist if we just created them or if they existed before.
            const nextMatchToUpdate = existingMatchesForTargetRound.find(
              (m) => m.matchOrderInRound === targetMatchOrderInCurrentRound,
            );

            if (nextMatchToUpdate) {
              // Check if an update is actually needed to avoid unnecessary writes
              if (
                nextMatchToUpdate[playerSlotPropertyToUpdate] !==
                prevMatch.winnerId
              ) {
                await prisma.match.update({
                  where: { id: nextMatchToUpdate.id },
                  data: { [playerSlotPropertyToUpdate]: prevMatch.winnerId },
                });
              }
            } else {
              console.error(
                `Tx Populator: Failed to find target match in round ${roundNumber} with order ${targetMatchOrderInCurrentRound} to advance winner ${prevMatch.winnerId} from prev match ${prevMatch.id} (round ${prevMatch.round}, order ${prevMatch.matchOrderInRound}). This indicates an issue with bracket structure or matchOrderInRound consistency.`,
              );
              // Potentially throw error here if critical
            }
          }
        }

        const finalMatchesCount = await prisma.match.count({
          where: { round: roundNumber, isPlayoff: true },
        });

        return {
          message: `Successfully processed round ${roundNumber} (${targetRoundInfo.name}). ${createdNewMatches ? `${targetRoundInfo.matches} new matches created. ` : ""}Players advanced from previous round if applicable.`,
          createdNew: createdNewMatches,
          matchesCount: finalMatchesCount,
        };
      });
    }),
});
