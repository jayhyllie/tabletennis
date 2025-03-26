import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const groupRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.group.findMany({
      include: {
        PlayerGroup: {
          include: {
            player: true,
          },
        },
        Match: {
          include: {
            scores: true,
          },
        },
      },
    });
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

  createRandomGroups: publicProcedure
    .input(z.object({ numGroups: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Delete existing records in the correct order to avoid foreign key constraints
      await ctx.db.score.deleteMany();
      await ctx.db.match.deleteMany();
      await ctx.db.playerGroup.deleteMany();
      await ctx.db.group.deleteMany();

      const players = await ctx.db.player.findMany();
      const groups = [];

      // Create the groups first
      for (let i = 0; i < input.numGroups; i++) {
        const group = await ctx.db.group.create({
          data: {
            name: `Grupp ${i + 1}`,
          },
        });
        groups.push(group);
      }

      // Shuffle players randomly
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

      // Calculate players per group (round up to ensure all players are assigned)
      const playersPerGroup = Math.ceil(players.length / input.numGroups);

      // Assign players to groups
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const groupIndex = i % input.numGroups;
        const player = shuffledPlayers[i];

        await ctx.db.player.update({
          where: { id: player?.id ?? "" },
          data: {
            PlayerGroup: {
              create: {
                groupId: groups[groupIndex]?.id ?? "",
              },
            },
          },
        });
      }

      return groups;
    }),
});
