import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "../trpc";

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

        const player1Stats = playerStats.get(match.player1Id);
        const player2Stats = playerStats.get(match.player2Id);

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
          if (b.points !== a.points) return b.points - a.points;
          const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
          const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
          if (bScoreDiff !== aScoreDiff) return bScoreDiff - aScoreDiff;
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

    // Replace the complex type inference with explicit types
    const firstPlaces: PlayerStanding[] = [];
    const secondPlaces: PlayerStanding[] = [];
    const thirdPlaces: PlayerStanding[] = [];

    groupStandings.forEach((standings) => {
      if (standings[0]) firstPlaces.push(standings[0]);
      if (standings[1]) secondPlaces.push(standings[1]);
      if (standings[2]) thirdPlaces.push(standings[2]);
    });

    // Sort first places (best to worst)
    const sortedFirstPlaces = firstPlaces.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
      const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
      if (bScoreDiff !== aScoreDiff) return bScoreDiff - aScoreDiff;
      return b.totalScoreFor - a.totalScoreFor;
    });

    // Sort second places (best to worst)
    const sortedSecondPlaces = secondPlaces.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
      const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
      if (bScoreDiff !== aScoreDiff) return bScoreDiff - aScoreDiff;
      return b.totalScoreFor - a.totalScoreFor;
    });

    // Sort third places (best to worst) and take top 4
    const sortedThirdPlaces = thirdPlaces
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aScoreDiff = a.totalScoreFor - a.totalScoreAgainst;
        const bScoreDiff = b.totalScoreFor - b.totalScoreAgainst;
        if (bScoreDiff !== aScoreDiff) return bScoreDiff - aScoreDiff;
        return b.totalScoreFor - a.totalScoreFor;
      })
      .slice(0, 4);

    // Helper function to check if players are from the same group
    const areFromSameGroup = (
      player1: PlayerStanding,
      player2: PlayerStanding,
    ) => {
      return player1.groupId === player2.groupId;
    };

    // Helper function to find the best available opponent that's not from the same group
    const findBestOpponent = (
      player: PlayerStanding,
      opponents: PlayerStanding[],
      usedPlayers: Set<string>,
    ): PlayerStanding | undefined => {
      return opponents.find(
        (opp) =>
          !areFromSameGroup(player, opp) && !usedPlayers.has(opp.playerId),
      );
    };

    // Track used players to avoid duplicates
    const usedPlayers = new Set<string>();
    const playoffMatches = [];

    // Handle first places vs third places (4 matches)
    const firstVsThird = [
      { first: 0, third: 3 }, // Best 1st vs Worst qualified 3rd
      { first: 1, third: 2 }, // 2nd best 1st vs 3rd best qualified 3rd
      { first: 2, third: 1 }, // 3rd best 1st vs 2nd best qualified 3rd
      { first: 3, third: 0 }, // 4th best 1st vs Best qualified 3rd
    ];

    for (const match of firstVsThird) {
      const firstPlace = sortedFirstPlaces[match.first];
      let thirdPlace = sortedThirdPlaces[match.third];

      if (
        firstPlace &&
        thirdPlace &&
        areFromSameGroup(firstPlace, thirdPlace)
      ) {
        // Find alternative opponent from third places
        const alternativeOpponent = findBestOpponent(
          firstPlace,
          sortedThirdPlaces,
          usedPlayers,
        );
        if (alternativeOpponent) {
          thirdPlace = alternativeOpponent;
        }
      }

      if (firstPlace && thirdPlace) {
        playoffMatches.push({
          player1Id: firstPlace.playerId,
          player2Id: thirdPlace.playerId,
          round: 1,
          isPlayoff: true,
        });
        usedPlayers.add(firstPlace.playerId);
        usedPlayers.add(thirdPlace.playerId);
      }
    }

    // Handle remaining first places vs second places (2 matches)
    const firstVsSecond = [
      { first: 4, second: 5 }, // 5th best 1st vs Worst 2nd
      { first: 5, second: 4 }, // 6th best 1st vs 2nd worst 2nd
    ];

    for (const match of firstVsSecond) {
      const firstPlace = sortedFirstPlaces[match.first];
      let secondPlace = sortedSecondPlaces[match.second];

      if (
        firstPlace &&
        secondPlace &&
        areFromSameGroup(firstPlace, secondPlace)
      ) {
        // Find alternative opponent from second places
        const alternativeOpponent = findBestOpponent(
          firstPlace,
          sortedSecondPlaces,
          usedPlayers,
        );
        if (alternativeOpponent) {
          secondPlace = alternativeOpponent;
        }
      }

      if (firstPlace && secondPlace) {
        playoffMatches.push({
          player1Id: firstPlace.playerId,
          player2Id: secondPlace.playerId,
          round: 1,
          isPlayoff: true,
        });
        usedPlayers.add(firstPlace.playerId);
        usedPlayers.add(secondPlace.playerId);
      }
    }

    // Handle second places vs second places (2 matches)
    const secondVsSecond = [
      { second1: 0, second2: 3 }, // Best 2nd vs 3rd worst 2nd
      { second1: 1, second2: 2 }, // 2nd best 2nd vs 4th worst 2nd
    ];

    for (const match of secondVsSecond) {
      const secondPlace1 = sortedSecondPlaces[match.second1];
      let secondPlace2 = sortedSecondPlaces[match.second2];

      if (
        secondPlace1 &&
        secondPlace2 &&
        areFromSameGroup(secondPlace1, secondPlace2)
      ) {
        // Find alternative opponent from remaining second places
        const alternativeOpponent = findBestOpponent(
          secondPlace1,
          sortedSecondPlaces,
          usedPlayers,
        );
        if (alternativeOpponent) {
          secondPlace2 = alternativeOpponent;
        }
      }

      if (secondPlace1 && secondPlace2) {
        playoffMatches.push({
          player1Id: secondPlace1.playerId,
          player2Id: secondPlace2.playerId,
          round: 1,
          isPlayoff: true,
        });
        usedPlayers.add(secondPlace1.playerId);
        usedPlayers.add(secondPlace2.playerId);
      }
    }

    // Create playoff matches in the database
    await ctx.db.match.createMany({
      data: playoffMatches as Prisma.MatchCreateManyInput[],
    });

    return playoffMatches;
  }),
  deletePlayoffMatches: publicProcedure.mutation(async ({ ctx }) => {
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
});
