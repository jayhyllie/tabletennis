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
    // Get all groups with their matches
    const groups = await ctx.db.group.findMany({
      include: {
        Match: true,
      },
    });

    // Check if all matches in each group are completed
    for (const group of groups) {
      const hasUncompletedMatches = group.Match.some(
        (match) => !match.completed,
      );
      if (hasUncompletedMatches) {
        throw new Error(
          "Alla gruppmatcher måste vara slutförda innan slutspel kan genereras",
        );
      }
    }

    // Get the top 2 players from each group
    const groupStandings = await Promise.all(
      groups.map(async (group) => {
        const matches = await ctx.db.match.findMany({
          where: { groupId: group.id },
          include: { scores: true },
        });

        const playerStats = new Map<string, { wins: number; points: number }>();

        // Calculate standings
        matches.forEach((match) => {
          const score = match.scores[0];
          if (!score) return;

          const player1Stats = playerStats.get(match.player1Id) ?? {
            wins: 0,
            points: 0,
          };
          const player2Stats = playerStats.get(match.player2Id) ?? {
            wins: 0,
            points: 0,
          };

          if (score.player1Score > score.player2Score) {
            player1Stats.wins++;
            player1Stats.points += 2;
          } else {
            player2Stats.wins++;
            player2Stats.points += 2;
          }

          playerStats.set(match.player1Id, player1Stats);
          playerStats.set(match.player2Id, player2Stats);
        });

        // Sort players by points and get top 2
        const topPlayers = Array.from(playerStats.entries())
          .sort((a, b) => b[1].points - a[1].points)
          .slice(0, 2)
          .map(([playerId]) => playerId);

        return topPlayers;
      }),
    );

    // Generate playoff matches
    const playoffMatches = [];
    const allPlayoffPlayers = groupStandings.flat();

    // Generate first round matches
    for (let i = 0; i < allPlayoffPlayers.length; i += 2) {
      if (i + 1 < allPlayoffPlayers.length) {
        playoffMatches.push({
          player1Id: allPlayoffPlayers[i],
          player2Id: allPlayoffPlayers[i + 1],
          round: 1,
          isPlayoff: true,
        });
      }
    }

    // Create playoff matches in the database
    return ctx.db.match.createMany({
      data: playoffMatches as Prisma.MatchCreateManyInput[],
    });
  }),
});
