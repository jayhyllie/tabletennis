"use server";

import type { Player, Group, Match, Score, PlayoffMatch } from "@prisma/client";
import { db } from "@/server/db";

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
export async function generatePlayoffs(): Promise<void> {
  const groups = await db.group.findMany();
  const players = await db.player.findMany();

  for (const group of groups) {
    const matches = await db.match.createMany({
      data: [],
    });
  }
}
