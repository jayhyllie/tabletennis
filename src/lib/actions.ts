import type { Match, Player, Score } from "@prisma/client";

// Match actions
export async function generateGroupMatches() {
  /*const groups = await db.group.findMany();

   for (const group of groups) {
    const matches = await db.match.createMany({
      data: [],
    });
  } */
}

// Playoff actions
export async function generatePlayoffs(): Promise<void> {
  /* const groups = await db.group.findMany();

  for (const group of groups) {
    const matches = await db.match.createMany({
      data: [],
    });
  } */
}

export function getPlayerName(
  playerId: string | null | undefined,
  players: Player[] | undefined,
) {
  if (!playerId) return "";
  return players?.find((p) => p.id === playerId)?.name ?? "Okänd";
}

export function getPlayerScore(
  matchId: string | undefined,
  playerType: "player1" | "player2",
  scores: Score[] | undefined,
) {
  if (!matchId) return "";
  const score = scores?.find((s) => s.matchId === matchId);
  if (!score) return "";
  return playerType === "player1" ? score.player1Score : score.player2Score;
}

export function getWinnerPlayerId(
  match: Match | undefined,
  scores: Score[] | undefined,
) {
  if (!match) return null;
  const score = scores?.find((s) => s.matchId === match.id);
  if (!score) return null;
  return score.player1Score > score.player2Score
    ? match.player1Id
    : match.player2Id;
}
