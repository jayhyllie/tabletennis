import { z } from "zod";

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
});
