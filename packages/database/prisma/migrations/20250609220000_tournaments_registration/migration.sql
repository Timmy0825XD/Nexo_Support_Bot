-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "submitterIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "discordTag" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "inGameName" TEXT NOT NULL,
    "inGameId" TEXT NOT NULL,
    "currentTitle" TEXT NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournaments_guildId_idx" ON "tournaments"("guildId");

-- CreateIndex
CREATE INDEX "registrations_tournamentId_idx" ON "registrations"("tournamentId");

-- CreateIndex
CREATE INDEX "registrations_tournamentId_submitterIp_idx" ON "registrations"("tournamentId", "submitterIp");

-- CreateIndex
CREATE INDEX "participants_registrationId_idx" ON "participants"("registrationId");

-- CreateIndex
CREATE INDEX "participants_discordId_idx" ON "participants"("discordId");

-- CreateIndex
CREATE INDEX "participants_inGameId_idx" ON "participants"("inGameId");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
