-- Manual migration script for Supabase Studio SQL Editor
-- Run this in: https://supabase.com/dashboard/project/jgcgdxundweujlwwwszn/editor/sql

-- Core tables
CREATE TABLE IF NOT EXISTS "attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"member_name" text NOT NULL,
	"date" text NOT NULL,
	"check_in_time" text NOT NULL,
	"check_out_time" text,
	"method" text DEFAULT 'Manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bmi_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"record_date" text NOT NULL,
	"body_weight" real,
	"bmi" real,
	"body_fat_percentage" real,
	"muscle_mass" real,
	"body_water_percentage" real,
	"bone_mass" real,
	"visceral_fat" real,
	"subcutaneous_fat" real,
	"bmr" real,
	"protein_percentage" real,
	"metabolic_age" integer,
	"lean_body_mass" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "branches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"contact_person" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "company_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text DEFAULT 'Lime Fitness' NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"logo" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "diet_plan_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diet_plan_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "diet_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar,
	"meal" text NOT NULL,
	"foods" jsonb NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer NOT NULL,
	"carbs" integer NOT NULL,
	"fat" integer NOT NULL,
	"custom_diet" boolean DEFAULT false NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"purchase_date" text,
	"needs_service" boolean DEFAULT false NOT NULL,
	"next_service_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text NOT NULL,
	"address" text,
	"gender" text DEFAULT 'male' NOT NULL,
	"interest_areas" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"health_background" text,
	"source" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assigned_staff" text,
	"follow_up_date" text,
	"dob" text,
	"height" integer,
	"notes" text,
	"follow_up_completed" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"branch" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "member_measurements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"date" text NOT NULL,
	"chest" real NOT NULL,
	"waist" real NOT NULL,
	"arms" real NOT NULL,
	"thighs" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "member_otps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"otp" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar,
	"training_type" text,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text NOT NULL,
	"address" text,
	"gender" text DEFAULT 'male' NOT NULL,
	"dob" text,
	"height" integer,
	"source" text NOT NULL,
	"interest_areas" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"health_background" text,
	"plan" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"discount" integer DEFAULT 0,
	"total_due" integer DEFAULT 0,
	"amount_paid" integer DEFAULT 0,
	"payment_method" text,
	"assigned_staff" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"avatar" text,
	"avatar_static_url" text,
	"branch" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "membership_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"duration" text NOT NULL,
	"duration_months" integer NOT NULL,
	"price" integer NOT NULL,
	"features" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_deliveries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" varchar,
	"user_id" varchar,
	"member_id" varchar,
	"fcm_token" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"delivered_at" timestamp,
	"clicked_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"member_id" varchar,
	"category_workouts" boolean DEFAULT true NOT NULL,
	"category_diet" boolean DEFAULT true NOT NULL,
	"category_otp" boolean DEFAULT true NOT NULL,
	"category_announcements" boolean DEFAULT true NOT NULL,
	"category_promotions" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" text DEFAULT '21:00',
	"quiet_hours_end" text DEFAULT '07:00',
	"frequency_digest" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"title_template" text NOT NULL,
	"body_template" text NOT NULL,
	"icon" text DEFAULT '/icon-192.svg',
	"badge" text DEFAULT '/icon-192.svg',
	"require_interaction" boolean DEFAULT false NOT NULL,
	"silent" boolean DEFAULT false NOT NULL,
	"url" text,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"date" text NOT NULL,
	"sent_to" text NOT NULL,
	"sent_to_type" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"delivery_status" text DEFAULT 'delivered' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"payment_date" text NOT NULL,
	"payment_method" text,
	"original_amount" integer NOT NULL,
	"discount_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"member_id" varchar,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar,
	"user_id" varchar,
	"member_id" varchar,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"icon" text,
	"badge" text,
	"url" text,
	"data" jsonb,
	"scheduled_for" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_attendance" (
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

CREATE TABLE IF NOT EXISTS "trainer_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"slot_date" text NOT NULL,
	"period" text NOT NULL,
	"slot_capacity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trainer_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"booking_date" text NOT NULL,
	"period" text DEFAULT 'morning' NOT NULL,
	"slot_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trainer_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"booking_id" varchar,
	"rating" integer NOT NULL,
	"comments" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trainer_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"specializations" text[] NOT NULL,
	"interest_areas" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"weekly_slot_capacity" integer DEFAULT 20 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trainer_profiles_trainer_id_unique" UNIQUE("trainer_id")
);

CREATE TABLE IF NOT EXISTS "trainer_payouts" (
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

CREATE TABLE IF NOT EXISTS "trainer_payout_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" varchar NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trainer_salary_configs" (
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

CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"phone" text,
	"role" text DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "workout_program_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workout_programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar,
	"custom_workout_plan" boolean DEFAULT false NOT NULL,
	"day" text NOT NULL,
	"name" text NOT NULL,
	"difficulty" text DEFAULT 'Intermediate' NOT NULL,
	"exercises" jsonb NOT NULL,
	"duration" integer NOT NULL,
	"equipment" jsonb NOT NULL,
	"intensity" integer DEFAULT 5 NOT NULL,
	"goal" text DEFAULT 'Hypertrophy',
	"collection_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workout_collections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_collections_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "workout_collection_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" varchar NOT NULL,
	"collection_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_collection_members_workout_id_workout_programs_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workout_programs"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "workout_collection_members_collection_id_workout_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."workout_collections"("id") ON DELETE cascade ON UPDATE no action
);

-- New tables from 0016_unusual_blur.sql
CREATE TABLE IF NOT EXISTS "admin_ai_usage" (
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

CREATE TABLE IF NOT EXISTS "credit_packages" (
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

CREATE TABLE IF NOT EXISTS "credit_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"reference_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "daily_ai_usage" (
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

CREATE TABLE IF NOT EXISTS "member_ai_usage_summary" (
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

CREATE TABLE IF NOT EXISTS "member_credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"balance" integer DEFAULT 5 NOT NULL,
	"total_credits_used" integer DEFAULT 0 NOT NULL,
	"last_reset_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_credits_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "module_control" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_name" text NOT NULL,
	"module_label" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "module_control_module_name_unique" UNIQUE("module_name")
);

-- Alter existing tables
ALTER TABLE "diet_plans" ADD COLUMN IF NOT EXISTS "custom_diet" boolean DEFAULT false NOT NULL;
ALTER TABLE "diet_plans" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "diet_plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "original_amount" integer NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "discount_percentage" integer DEFAULT 0;
ALTER TABLE "workout_programs" ADD COLUMN IF NOT EXISTS "collection_id" varchar;