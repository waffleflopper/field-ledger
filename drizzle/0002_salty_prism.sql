CREATE TYPE "public"."subscription_tier" AS ENUM('base', 'pro');--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "subscription_tier" "subscription_tier";