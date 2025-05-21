import type { Match, Player, Score } from "@prisma/client";
import { MatchPair } from "./match-pair";
import {
  getPlayerName,
  getPlayerScore,
  getWinnerPlayerId,
} from "@/lib/actions";

type FinalMatchProps = {
  match: Match | undefined;
  players: Player[];
  scores: Score[];
};

export function FinalMatch({ match, players, scores }: FinalMatchProps) {
  return (
    <div className="col-span-2 row-span-8 flex w-full items-center gap-32">
      <div className="mx-auto w-full pt-4">
        <MatchPair
          match={match}
          showConnector={false}
          connectorType={undefined}
          className="mx-auto w-[calc(100%-4rem)]"
          isFinal={true}
          getPlayerName={(playerId) => getPlayerName(playerId, players)}
          getPlayerScore={(matchId, playerType) =>
            getPlayerScore(matchId, playerType, scores)
          }
          winnerPlayerId={getWinnerPlayerId(match, scores)}
        />
      </div>
    </div>
  );
}
