-- CreateTable
CREATE TABLE "TeamSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "slackWebhookUrl" TEXT,
    "notifyOnAlert" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMemberJoin" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMemberLeave" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamSettings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamSettings_teamId_key" ON "TeamSettings"("teamId");
