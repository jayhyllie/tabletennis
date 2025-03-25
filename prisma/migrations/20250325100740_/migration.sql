-- CreateTable
CREATE TABLE "PlayoffMatch" (
    "matchId" TEXT NOT NULL PRIMARY KEY,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "groupId" TEXT,
    "round" INTEGER NOT NULL,
    "scheduledTime" DATETIME,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "isPlayoff" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PlayoffMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayoffMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayoffMatch_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Score" (
    "matchId" TEXT NOT NULL PRIMARY KEY,
    "player1Score" INTEGER NOT NULL,
    "player2Score" INTEGER NOT NULL,
    "winnerId" TEXT,
    CONSTRAINT "Score_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Score_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "PlayoffMatch" ("matchId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Score" ("matchId", "player1Score", "player2Score", "winnerId") SELECT "matchId", "player1Score", "player2Score", "winnerId" FROM "Score";
DROP TABLE "Score";
ALTER TABLE "new_Score" RENAME TO "Score";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
