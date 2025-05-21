import type { Match, Player, Score } from "@prisma/client";
import { BracketSection } from "./bracket-section";
import { FinalMatch } from "./final-match";

type BracketLayoutProps = {
  leftMatches: Array<{ title: string; matches: (Match | undefined)[] }>;
  rightMatches: Array<{ title: string; matches: (Match | undefined)[] }>;
  finalMatch: Match | undefined;
  players: Player[];
  scores: Score[];
};

export function BracketLayout({
  leftMatches,
  rightMatches,
  finalMatch,
  players,
  scores,
}: BracketLayoutProps) {
  return (
    <div className="mx-auto grid w-fit grid-cols-8 grid-rows-8 justify-between gap-16">
      <div className="tv:gap-32 col-span-3 row-span-8 flex h-full w-fit items-center gap-12">
        {leftMatches.map((section, index) => (
          <BracketSection
            key={index}
            {...section}
            connectorType="right"
            players={players}
            scores={scores}
          />
        ))}
      </div>
      <div className="col-span-2 row-span-8 flex w-full items-center gap-32">
        <FinalMatch match={finalMatch} players={players} scores={scores} />
      </div>
      <div className="tv:gap-32 col-span-3 row-span-8 flex h-full w-fit items-center gap-12">
        {rightMatches.map((section, index) => (
          <BracketSection
            key={index}
            {...section}
            connectorType="left"
            players={players}
            scores={scores}
          />
        ))}
      </div>
    </div>
  );
}
