import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const scoreRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.score.findMany();
  }),
  create: publicProcedure
    .input(
      z.object({
        matchId: z.string(),
        player1Score: z.number(),
        player2Score: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First verify the match exists
        const match = await ctx.db.match.findUnique({
          where: { id: input.matchId },
        });

        if (!match) {
          throw new Error(`Match with ID ${input.matchId} not found`);
        }

        // Determine winner
        const winnerId =
          input.player1Score > input.player2Score
            ? match.player1Id
            : input.player2Score > input.player1Score
              ? match.player2Id
              : null;

        // Create or update score
        const score = await ctx.db.score.upsert({
          where: {
            matchId: input.matchId,
          },
          update: {
            player1Score: input.player1Score,
            player2Score: input.player2Score,
            winnerId,
          },
          create: {
            matchId: input.matchId,
            player1Score: input.player1Score,
            player2Score: input.player2Score,
            winnerId,
          },
        });

        // Update match status
        await ctx.db.match.update({
          where: { id: input.matchId },
          data: { completed: true },
        });

        return score;
      } catch (error) {
        console.error("Score creation error:", error);
        throw error;
      }
    }),
  getByMatchId: publicProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.score.findMany({
        where: { matchId: input.matchId },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        matchId: z.string(),
        player1Score: z.number(),
        player2Score: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.score.update({
        where: { matchId: input.matchId },
        data: {
          player1Score: input.player1Score,
          player2Score: input.player2Score,
        },
      });
    }),
});
