CREATE TABLE "user_school" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_school" ADD CONSTRAINT "user_school_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_school" ADD CONSTRAINT "user_school_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_school_unique" ON "user_school" USING btree ("user_id","school_id");