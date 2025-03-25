import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const playerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.player.findMany({
      include: {
        PlayerGroup: true,
      },
    });
  }),
  create: publicProcedure
    .input(z.object({ name: z.string(), email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.player.create({
        data: {
          name: input.name,
          email: input.email,
        },
      });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.player.delete({
        where: { id: input.id },
      });
    }),
});
