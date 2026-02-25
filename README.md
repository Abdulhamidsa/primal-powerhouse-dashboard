# Primal Powerhouse Dashboard

Primal Powerhouse Dashboard is a coaching platform for fitness businesses that need to manage clients, deliver training and nutrition plans, and keep engagement high with structured weekly follow-up.

This repository contains both the coach/admin workspace and the client-facing experience.

## Product Summary

### What this app is

A full-stack fitness coaching system where coaches can:

- Manage client profiles and progress data
- Build and assign meal plans
- Curate and assign training videos/exercises
- Track key health metrics (BMI, BMR, TDEE, macros)
- Monitor weekly client check-ins and adherence

Clients can:

- Log in to a dedicated client app
- View assigned meals and recipes
- View assigned training content
- Complete weekly check-ins
- Receive coach messages and motivation

### Core value proposition

- **For coaching businesses:** run operations from one dashboard instead of fragmented tools
- **For clients:** a clean, mobile-friendly portal with clear daily actions
- **For scale:** role-based architecture, API-first backend, and PostgreSQL persistence

## Feature Inventory (What You Have So Far)

### 1) Role-Based Platform

- Separate **admin/coach** and **client** areas
- Route protection and auth middleware by role
- Subdomain-aware login flow support (`admin.*` vs client domain flow)

### 2) Client Management

- Client profiles with key personal and coaching data
- Active/inactive status management
- Session history and scheduling fields
- Motivational messaging from coach to client

### 3) Meal System

- Meal library with macros (calories, protein, carbs, fat, fiber)
- Meal creation and editing
- Meal planner and assignment workflows
- Personalized meal support per client
- Client-side meal view with today/all filters and recipe details

### 4) Training & Video Delivery

- Video library management
- ExerciseDB integration path for importing/assigning exercises
- Video assignment to clients with status/progress fields
- Client training page with tags, difficulty, duration, and completion state

### 5) Health Metrics Engine

- Coach workflow to calculate and save:
  - BMI
  - BMR (Mifflin-St Jeor)
  - TDEE
  - Goal calories
  - Macro targets
- Stored history of health metric snapshots per client
- Safety checks and guided notes for coaching adjustments

### 6) Weekly Check-In System

- Client weekly check-in submission flow
- Structured adherence and recovery signals (training, nutrition, stress, sleep, etc.)
- Admin-side check-in status views (completed/due/overdue)
- Reset/delete operations for check-in management

### 7) Dashboards & Analytics

- Admin dashboard with business and activity summaries:
  - total/active clients
  - meals/workouts/videos counts
  - recent activity and session indicators
- Client dashboard with quick actions, coach message, and motivation surfaces

### 8) Media & Integrations

- Cloudinary integration for media upload/delete flows
- USDA food API integration points for nutrition-related lookups

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling/UI:** Tailwind CSS, Radix primitives, custom component system
- **Backend:** Next.js API routes
- **Data layer:** Prisma ORM + PostgreSQL
- **Validation:** Zod
- **Data fetching patterns:** SWR + feature-based hooks
- **Media:** Cloudinary

## Data Model Highlights

Main entities currently implemented in Prisma:

- `User` (coach/admin)
- `Client`
- `Meal`, `MealPlan`, `MealAssignment`
- `Video`, `VideoAssignment`
- `Workout`, `Session`
- `HealthMetric`
- `WeeklyCheckIn`
- `Feedback`

This gives you a strong foundation for measurable, longitudinal coaching (plans + adherence + outcomes over time).

## Project Structure (High-Level)

- `src/app` — routes, pages, and API endpoints
- `src/features` — feature modules (API wrappers, hooks, schemas, types, components)
- `src/components` — shared UI and screens
- `src/lib` — auth, HTTP client, Prisma, utilities
- `prisma` — schema and database evolution

## Local Development

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment

Copy `.env.example` and set values for your environment.

Minimum required:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="replace-with-strong-secret"
```

Optional (feature-dependent):

- Cloudinary keys for image/media workflows
- `USDA_FDC_API_KEY` for food database endpoints

### 3) Prepare database

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4) Run app

```bash
pnpm dev
```

## Positioning for a Marketing Website

If you want to sell this product, your current strongest messaging pillars are:

1. **All-in-one coaching OS** (clients, meals, training, check-ins)
2. **Outcome-driven coaching** (health metrics + weekly adherence loop)
3. **Great client experience** (simple mobile-first dashboard)
4. **Business-ready foundation** (role-based architecture + scalable backend)

## Current Status

The app already includes substantial production-style functionality across both coach and client experiences. The repository also contains deployment/setup documents for infrastructure and environment migration workflows.

---

If useful, the next step can be a dedicated **MARKETING_README.md** or website copy pack with:

- homepage hero copy
- feature section copy
- pricing table draft
- FAQ and objection handling
