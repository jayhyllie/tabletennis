import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const groupRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.group.findMany();
  }),
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.group.create({
        data: { name: input.name },
      });
    }),
  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.group.delete({
        where: { id: input.id },
      });
    }),
});
