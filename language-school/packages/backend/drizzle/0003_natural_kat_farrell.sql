CREATE TABLE IF NOT EXISTS "school" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_tm" text,
	"name_ru" text,
	"name_en" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "school_id" integer;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "parent_id" text;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_parent_id_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
