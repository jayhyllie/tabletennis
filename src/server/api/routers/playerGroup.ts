import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const playerGroupRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.playerGroup.findMany();
  }),
  create: publicProcedure
    .input(z.object({ playerId: z.string(), groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.playerGroup.create({
        data: { playerId: input.playerId, groupId: input.groupId },
      });
    }),
});
