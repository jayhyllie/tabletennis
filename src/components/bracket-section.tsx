import type { Match, Player, Score } from "@prisma/client";
import { MatchPair } from "./match-pair";
import {
  getPlayerName,
  getPlayerScore,
  getWinnerPlayerId,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

type BracketSectionProps = {
  title: string;
  matches: (Match | undefined)[];
  connectorType: "left" | "right";
  players: Player[];
  scores: Score[];
};

export function BracketSection({
  title,
  matches,
  connectorType,
  players,
  scores,
}: BracketSectionProps) {
  const isQuarterFinal = title === "Kvartsfinal";
  return (
    <div className="flex-1 space-y-4">
      <div className="space-y-2">
        <h4 className="text-center text-2xl font-bold">{title}</h4>
        <p className="text-center text-sm text-muted-foreground">Best of 3</p>
      </div>
      <div
        className={cn(
          "tv:space-y-32 space-y-16",
          isQuarterFinal && "space-y-64",
        )}
      >
        {matches.map((match, index) => (
          <MatchPair
            key={match?.id ?? index}
            match={match}
            showConnector={true}
            connectorType={connectorType}
            getPlayerName={(playerId) => getPlayerName(playerId, players)}
            getPlayerScore={(matchId, playerType) =>
              getPlayerScore(matchId, playerType, scores)
            }
            winnerPlayerId={getWinnerPlayerId(match, scores)}
          />
        ))}
      </div>
    </div>
  );
}
