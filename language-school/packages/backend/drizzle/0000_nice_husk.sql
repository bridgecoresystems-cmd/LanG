CREATE TABLE "contact_message" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_tm" text,
	"name_ru" text,
	"name_en" text,
	"description" text,
	"description_tm" text,
	"description_ru" text,
	"description_en" text,
	"image" text,
	"icon" text DEFAULT 'school' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_subcategory" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_tm" text,
	"name_ru" text,
	"name_en" text,
	"description" text,
	"image" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"subcategory_id" integer NOT NULL,
	"title" text NOT NULL,
	"title_tm" text,
	"title_ru" text,
	"title_en" text,
	"description" text NOT NULL,
	"description_tm" text,
	"description_ru" text,
	"description_en" text,
	"image" text,
	"duration_weeks" integer DEFAULT 0 NOT NULL,
	"hours_per_week" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"discount_price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_tm" text,
	"title_ru" text,
	"title_en" text,
	"content" text NOT NULL,
	"content_tm" text,
	"content_ru" text,
	"content_en" text,
	"preview" text,
	"image" text,
	"views" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"specialization" text,
	"specialization_tm" text,
	"specialization_ru" text,
	"specialization_en" text,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"bio" text,
	"bio_tm" text,
	"bio_ru" text,
	"bio_en" text,
	"avatar" text,
	"video" text,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"hire_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"email" text,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'student' NOT NULL,
	"phone" text,
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "course_subcategory" ADD CONSTRAINT "course_subcategory_category_id_course_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_category_id_course_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_subcategory_id_course_subcategory_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."course_subcategory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;