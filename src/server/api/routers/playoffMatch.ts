import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const playoffMatchRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.playoffMatch.findMany();
  }),
  create: publicProcedure
    .input(
      z.object({
        player1Id: z.string(),
        player2Id: z.string(),
        groupId: z.string(),
        round: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.playoffMatch.create({
        data: {
          player1Id: input.player1Id,
          player2Id: input.player2Id,
          groupId: input.groupId,
          round: input.round,
        },
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
      return ctx.db.playoffMatch.update({
        where: { matchId: input.matchId },
        data: {
          score1: input.player1Score ?? null,
          score2: input.player2Score ?? null,
        },
      });
    }),
});
