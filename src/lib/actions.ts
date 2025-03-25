"use server";

import type { Player, Group, Match, Score, PlayoffMatch } from "@prisma/client";
import { db } from "@/server/db";

export async function createRandomGroups(numGroups: number): Promise<Group[]> {
  // Delete existing groups first to avoid duplicates
  await db.group.deleteMany({});

  const players = await db.player.findMany();
  const groups: Group[] = [];

  // Create the groups first
  for (let i = 0; i < numGroups; i++) {
    const group = await db.group.create({
      data: {
        name: `Grupp ${i + 1}`,
      },
    });
    groups.push(group);
  }

  // Shuffle players randomly
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // Calculate players per group (round up to ensure all players are assigned)
  const playersPerGroup = Math.ceil(players.length / numGroups);

  // Assign players to groups
  for (let i = 0; i < shuffledPlayers.length; i++) {
    const groupIndex = i % numGroups;
    const player = shuffledPlayers[i];

    await db.player.update({
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
}

// Match actions
export async function generateGroupMatches() {
  const groups = await db.group.findMany();
  const players = await db.player.findMany();

  for (const group of groups) {
    const matches = await db.match.createMany({
      data: [],
    });
  }
}
// Playoff actions
export async function generatePlayoffs(): Promise<void> {}
