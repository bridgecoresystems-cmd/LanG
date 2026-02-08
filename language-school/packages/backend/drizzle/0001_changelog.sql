CREATE TABLE "changelog" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
