CREATE TABLE "admin_ai_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"admin_name" text,
	"admin_email" text,
	"feature_type" text NOT NULL,
	"action_description" text NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"prompt_tokens" integer,
	"response_tokens" integer,
	"total_tokens" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"price" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"reference_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_ai_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usage_date" text NOT NULL,
	"member_workout_count" integer DEFAULT 0 NOT NULL,
	"member_diet_count" integer DEFAULT 0 NOT NULL,
	"member_credits_used" integer DEFAULT 0 NOT NULL,
	"admin_workout_count" integer DEFAULT 0 NOT NULL,
	"admin_diet_count" integer DEFAULT 0 NOT NULL,
	"admin_credits_used" integer DEFAULT 0 NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_ai_usage_usage_date_unique" UNIQUE("usage_date")
);
--> statement-breakpoint
CREATE TABLE "member_ai_usage_summary" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"member_name" text,
	"member_email" text,
	"total_workout_generations" integer DEFAULT 0 NOT NULL,
	"total_diet_generations" integer DEFAULT 0 NOT NULL,
	"total_credits_used" integer DEFAULT 0 NOT NULL,
	"last_usage_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"balance" integer DEFAULT 5 NOT NULL,
	"total_credits_used" integer DEFAULT 0 NOT NULL,
	"last_reset_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_control" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_name" text NOT NULL,
	"module_label" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "module_control_module_name_unique" UNIQUE("module_name")
);
--> statement-breakpoint
CREATE TABLE "staff_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_type" text NOT NULL,
	"person_id" varchar NOT NULL,
	"person_name" text NOT NULL,
	"date" text NOT NULL,
	"check_in_time" text NOT NULL,
	"check_out_time" text,
	"method" text DEFAULT 'Manual' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_payout_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" varchar NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"attendance_days" integer DEFAULT 0 NOT NULL,
	"attendance_bonus" integer DEFAULT 0 NOT NULL,
	"session_count" integer DEFAULT 0 NOT NULL,
	"session_bonus" integer DEFAULT 0 NOT NULL,
	"review_avg_rating" integer DEFAULT 0 NOT NULL,
	"review_bonus" integer DEFAULT 0 NOT NULL,
	"gross_pay" integer DEFAULT 0 NOT NULL,
	"deductions" integer DEFAULT 0 NOT NULL,
	"net_pay" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"pay_date" text,
	"notes" text,
	"payslip_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_salary_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"per_session_rate" integer DEFAULT 0 NOT NULL,
	"attendance_bonus_per_day" integer DEFAULT 0 NOT NULL,
	"attendance_bonus_threshold" integer DEFAULT 20 NOT NULL,
	"review_bonus_min_rating" integer DEFAULT 4 NOT NULL,
	"review_bonus_amount" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trainer_salary_configs_trainer_id_unique" UNIQUE("trainer_id")
);
--> statement-breakpoint
CREATE TABLE "workout_collection_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" varchar NOT NULL,
	"collection_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_collections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_collections_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "check_out_time" text;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD COLUMN "custom_diet" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "original_amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "discount_percentage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "workout_programs" ADD COLUMN "collection_id" varchar;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_credits" ADD CONSTRAINT "member_credits_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_collection_members" ADD CONSTRAINT "workout_collection_members_workout_id_workout_programs_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workout_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_collection_members" ADD CONSTRAINT "workout_collection_members_collection_id_workout_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."workout_collections"("id") ON DELETE cascade ON UPDATE no action;