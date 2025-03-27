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
  createFromClerk: publicProcedure
    .input(
      z.object({
        clerkId: z.string(),
        name: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if player already exists
      const existingPlayer = await ctx.db.player.findUnique({
        where: { clerkId: input.clerkId },
      });

      if (existingPlayer) {
        return existingPlayer;
      }

      // Create new player
      return ctx.db.player.create({
        data: {
          clerkId: input.clerkId,
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
  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    // First, delete all scores
    await ctx.db.score.deleteMany();

    // Delete all matches
    await ctx.db.match.deleteMany();

    // Delete all playoff matches
    await ctx.db.playoffMatch.deleteMany();

    // Delete all player-group relationships
    await ctx.db.playerGroup.deleteMany();

    // Finally, delete all players
    return ctx.db.player.deleteMany();
  }),
});
