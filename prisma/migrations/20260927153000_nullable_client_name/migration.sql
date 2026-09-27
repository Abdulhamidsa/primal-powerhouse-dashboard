-- Allow credential-created clients to begin without a display name.
ALTER TABLE "clients" ALTER COLUMN "name" DROP NOT NULL;
