CREATE TABLE "ht_course" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"language" text NOT NULL,
	"level" text NOT NULL,
	"description" text,
	"duration_months" integer DEFAULT 3 NOT NULL,
	"school_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_group_student" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"course_id" integer NOT NULL,
	"teacher_id" text,
	"school_id" integer,
	"max_students" integer DEFAULT 15 NOT NULL,
	"time_slot" text,
	"week_days" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"schedule" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_lesson" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"lesson_date" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 90 NOT NULL,
	"homework" text,
	"materials" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailing_message" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"recipient_type" text NOT NULL,
	"created_by_id" text NOT NULL,
	"school_id" integer,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"is_sent" boolean DEFAULT false NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailing_recipient" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"recipient_id" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_game_result" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_game" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"config" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ht_grade" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"grade" text NOT NULL,
	"max_grade" text,
	"weight" integer DEFAULT 1 NOT NULL,
	"comment" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "rfid_uid" text;--> statement-breakpoint
ALTER TABLE "ht_course" ADD CONSTRAINT "ht_course_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_group_student" ADD CONSTRAINT "ht_group_student_group_id_ht_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ht_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_group_student" ADD CONSTRAINT "ht_group_student_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_group" ADD CONSTRAINT "ht_group_course_id_ht_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."ht_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_group" ADD CONSTRAINT "ht_group_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_group" ADD CONSTRAINT "ht_group_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_lesson" ADD CONSTRAINT "ht_lesson_group_id_ht_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ht_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailing_message" ADD CONSTRAINT "mailing_message_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailing_message" ADD CONSTRAINT "mailing_message_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailing_recipient" ADD CONSTRAINT "mailing_recipient_message_id_mailing_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."mailing_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailing_recipient" ADD CONSTRAINT "mailing_recipient_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_attendance" ADD CONSTRAINT "ht_attendance_lesson_id_ht_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."ht_lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_attendance" ADD CONSTRAINT "ht_attendance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_game_result" ADD CONSTRAINT "ht_game_result_game_id_ht_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."ht_game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_game_result" ADD CONSTRAINT "ht_game_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_game" ADD CONSTRAINT "ht_game_group_id_ht_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ht_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_grade" ADD CONSTRAINT "ht_grade_group_id_ht_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ht_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_grade" ADD CONSTRAINT "ht_grade_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ht_group_student_unique" ON "ht_group_student" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ht_attendance_lesson_user_unique" ON "ht_attendance" USING btree ("lesson_id","user_id");