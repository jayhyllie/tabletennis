export type PlayoffRound = {
  round: number;
  name: string;
  matches: number;
};

export const PLAYOFF_ROUND_NAMES: Record<number, string> = {
  1: "Åttondelsfinal",
  2: "Kvartsfinal",
  3: "Semifinal",
  4: "Final",
};

export const FINAL_BRACKET_ROUND_NUMBER = 4;

export const roundsInfo: PlayoffRound[] = [
  // This can be kept local or shared from a constants file
  { round: 1, name: "Åttondelsfinal", matches: 8 },
  { round: 2, name: "Kvartsfinal", matches: 4 },
  { round: 3, name: "Semifinal", matches: 2 },
  { round: 4, name: "Final", matches: 1 },
];
