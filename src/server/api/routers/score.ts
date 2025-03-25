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
      const match = await ctx.db.match.findUnique({
        where: { id: input.matchId },
      });
      if (!match) {
        throw new Error("Match not found");
      }

      const winnerId =
        input.player1Score > input.player2Score
          ? match.player1Id
          : match.player2Id;

      return ctx.db.score.create({
        data: {
          matchId: input.matchId,
          player1Score: input.player1Score,
          player2Score: input.player2Score,
          winnerId: winnerId,
        },
      });
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
