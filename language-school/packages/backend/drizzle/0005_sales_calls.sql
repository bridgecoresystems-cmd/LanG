CREATE TABLE "sales_call" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_manager_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"datetime" timestamp NOT NULL,
	"outcome" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_call" ADD CONSTRAINT "sales_call_sales_manager_id_user_id_fk" FOREIGN KEY ("sales_manager_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
