-- AlterTable
ALTER TABLE "books" ADD COLUMN     "front_matter" JSONB,
ADD COLUMN     "layout" INTEGER NOT NULL DEFAULT 1;
