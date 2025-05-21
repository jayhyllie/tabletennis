import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { Match } from "@prisma/client";

export function MatchPair({
  match,
  showConnector,
  connectorType = "right",
  className,
  isFinal,
  getPlayerName,
  getPlayerScore,
  winnerPlayerId,
}: {
  match: Match | undefined;
  showConnector: boolean;
  connectorType: "right" | "left" | undefined;
  className?: string;
  isFinal?: boolean;
  getPlayerName: (playerId: string | null | undefined) => string;
  getPlayerScore: (
    matchId: string | undefined,
    playerType: "player1" | "player2",
  ) => string | number;
  winnerPlayerId: string | null | undefined;
}) {
  return (
    <div className="relative rounded-xl border border-primary/20 md:border-none">
      {showConnector && (
        <svg
          className={cn(
            "tv:top-[-30px] tv:h-[210px] tv:w-16 absolute md:top-[-10px] md:h-[180px] md:w-8 [@media(max-width:600px)]:hidden",
            connectorType === "right"
              ? "tv:-right-16 md:-right-8"
              : "tv:-left-16 md:-left-8",
          )}
          viewBox="0 0 64 100"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d={
              connectorType === "right"
                ? "M0 25H32V50H62V45H32V75H0"
                : "M64 25H32V50H2V45H32V75H64"
            }
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
        </svg>
      )}
      <div className={cn("flex flex-col gap-4 md:gap-10", isFinal && "gap-0")}>
        <Card
          className={cn(
            "tv:w-[200px] flex min-h-14 w-auto items-center justify-center border-primary/20 md:w-[150px]",
            winnerPlayerId === match?.player1Id && "bg-green-100",
            isFinal && "md:w-full",
            className,
          )}
        >
          <CardContent className="tv:p-4 flex items-center justify-between gap-4 p-1 md:p-2">
            <div className="tv:text-base text-xs font-medium">
              {getPlayerName(match?.player1Id)}
            </div>
            <div className="tv:text-base text-xs font-bold">
              {match?.completed ? getPlayerScore(match?.id, "player1") : ""}
            </div>
          </CardContent>
        </Card>
        {isFinal && (
          <div className="my-8 flex flex-col items-center gap-0">
            <h4 className="text-center text-5xl font-bold">Final</h4>
            <p className="text-center text-sm text-muted-foreground">
              Best of 5
            </p>
          </div>
        )}
        <Card
          className={cn(
            "tv:w-[200px] flex min-h-14 w-auto items-center justify-center border-primary/20 md:w-[150px]",
            winnerPlayerId === match?.player2Id && "bg-green-100",
            isFinal && "md:w-full",
            className,
          )}
        >
          <CardContent className="tv:p-4 flex items-center justify-between gap-4 p-1 md:p-2">
            <div className="tv:text-base text-xs font-medium">
              {getPlayerName(match?.player2Id)}
            </div>
            <div className="tv:text-base text-xs font-bold">
              {match?.completed ? getPlayerScore(match?.id, "player2") : ""}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
