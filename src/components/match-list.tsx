"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@prisma/client";
import { api } from "@/trpc/react";
import type { UserData } from "./group-client";

export function MatchList({ user }: { user: UserData | null }) {
  const utils = api.useUtils();

  const { data: matches, isPending: isLoadingMatches } =
    api.match.getAll.useQuery();
  const { data: players, isPending: isLoadingPlayers } =
    api.player.getAll.useQuery();
  const { data: groups, isPending: isLoadingGroups } =
    api.group.getAll.useQuery();
  const { data: scores, isPending: isLoadingScores } =
    api.score.getAll.useQuery();

  const { mutate: createScore, isPending: isSubmitting } =
    api.score.create.useMutation({
      onSuccess: async () => {
        await utils.score.getAll.invalidate();
        await utils.match.getAll.invalidate();
        setDialogOpen(false);
      },
      onError: (error) => {
        console.error(error);
      },
    });

  const { mutate: resetMatches, isPending: isResetting } =
    api.match.resetAllMatches.useMutation({
      onSuccess: async () => {
        await utils.score.getAll.invalidate();
        await utils.match.getAll.invalidate();
        toast({
          title: "Återställt",
          description: "Alla matcher har återställts",
        });
      },
      onError: (error) => {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Fel",
          description: "Kunde inte återställa matcherna",
        });
      },
    });

  const { mutate: advanceWinner } = api.match.advanceWinner.useMutation({
    onSuccess: async () => {
      await utils.match.getAll.invalidate();
    },
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Create lookup maps
  const playerMap = new Map(players?.map((player) => [player.id, player.name]));
  const groupMap = new Map(groups?.map((group) => [group.id, group.name]));
  const scoreMap = new Map(scores?.map((score) => [score.matchId, score]));

  const openScoreDialog = (match: Match) => {
    setSelectedMatch(match);

    // Set initial scores if they exist
    const existingScore = scoreMap.get(match.id);
    if (existingScore) {
      setPlayer1Score(existingScore.player1Score);
      setPlayer2Score(existingScore.player2Score);
    } else {
      setPlayer1Score(0);
      setPlayer2Score(0);
    }

    setDialogOpen(true);
  };

  if (
    isLoadingMatches ||
    isLoadingPlayers ||
    isLoadingGroups ||
    isLoadingScores
  ) {
    return <div className="py-4 text-center">Laddar matcher...</div>;
  }

  if (!matches?.length) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Inga matcher schemalagda än
      </div>
    );
  }

  const sortedMatches = matches.sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return 0;
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Spelare 1</TableHead>
              <TableHead>Spelare 2</TableHead>
              <TableHead>Grupp</TableHead>
              <TableHead>Resultat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMatches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>
                  {playerMap.get(match.player1Id ?? "") ?? "Okänd spelare"}
                </TableCell>
                <TableCell>
                  {playerMap.get(match.player2Id ?? "") ?? "Okänd spelare"}
                </TableCell>
                <TableCell>
                  {match.isPlayoff ? (
                    <Badge variant="secondary" className="text-white">
                      Slutspel
                    </Badge>
                  ) : (
                    (groupMap.get(match.groupId ?? "") ?? "Okänd grupp")
                  )}
                </TableCell>
                <TableCell>
                  {scoreMap.get(match.id)
                    ? `${scoreMap.get(match.id)?.player1Score} - ${scoreMap.get(match.id)?.player2Score}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {match.completed ? (
                    <Badge variant="default">Slutförd</Badge>
                  ) : (
                    <Badge variant="outline">Ej spelad</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!match.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openScoreDialog(match)}
                    >
                      Redigera resultat
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {user?.role === "admin" && (
        <div className="mt-4 flex justify-end gap-2">
          {/* <Button
            variant="secondary"
            onClick={() => deleteDuplicates()}
            disabled={isDeletingDuplicates}
            className="text-white"
          >
            {isDeletingDuplicates ? "Raderar..." : "Radera dubbla matcher"}
          </Button> */}
          <Button
            variant="destructive"
            onClick={() => resetMatches()}
            disabled={isResetting}
          >
            {isResetting ? "Återställer..." : "Återställ alla matcher"}
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spara resultat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player1Score">
                  {selectedMatch &&
                    playerMap.get(selectedMatch.player1Id ?? "")}
                </Label>
                <Input
                  id="player1Score"
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) =>
                    setPlayer1Score(Number.parseInt(e.target.value) ?? 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player2Score">
                  {selectedMatch &&
                    playerMap.get(selectedMatch.player2Id ?? "")}
                </Label>
                <Input
                  id="player2Score"
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) =>
                    setPlayer2Score(Number.parseInt(e.target.value) ?? 0)
                  }
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                createScore({
                  matchId: selectedMatch?.id ?? "",
                  player1Score: player1Score ?? 0,
                  player2Score: player2Score ?? 0,
                });
                if (selectedMatch?.isPlayoff) {
                  advanceWinner({
                    currentMatchId: selectedMatch?.id ?? "",
                    winnerPlayerId: selectedMatch
                      ? player1Score > player2Score
                        ? selectedMatch.player1Id
                        : selectedMatch.player2Id
                      : "",
                  });
                }
                setDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sparar..." : "Spara resultat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
