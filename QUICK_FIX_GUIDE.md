# 🔧 Database Connection Pool - Quick Fix Guide

## ⚠️ The Problem

Your database was rejecting connections with "too many connections" error because:

1. **Multiple Prisma Client Instances** - Creating too many connections
2. **No Connection Pool Limits** - Unlimited connections being opened
3. **API Routes Disconnecting** - Breaking connection pooling in serverless
4. **No Request Throttling** - Multiple simultaneous requests overwhelming database

---

## ✅ What Was Fixed

### 1. **Consolidated Prisma Client** ✨

- Fixed duplicate Prisma instances
- All code now uses single shared instance
- Prevents connection multiplication

### 2. **Added Connection Pool Limits** 🎯

- Added proper datasource configuration
- Limits concurrent connections per instance
- Prevents connection exhaustion

### 3. **Removed Incorrect Disconnects** 🚫

- Removed `$disconnect()` from API routes
- Maintains connection pooling
- Serverless functions now reuse connections

### 4. **Double-Submit Prevention** 🛡️

- Added guard in `AddMealModal.tsx`
- Prevents multiple simultaneous meal creations
- Reduces concurrent database load

---

## 🚀 REQUIRED: Update Your DATABASE_URL

### Step 1: Find Your Current DATABASE_URL

Check your `.env` or `.env.local` file.

### Step 2: Add Connection Pool Parameters

**Before:**

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

**After:**

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?connection_limit=5&pool_timeout=10"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
```

### Step 3: For Supabase Users

Add `pgbouncer=true`:

```env
DATABASE_URL="postgresql://user:password@host.supabase.co:5432/postgres?connection_limit=5&pool_timeout=10&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host.supabase.co:5432/postgres"
```

### Connection Parameter Meanings:

- `connection_limit=5` → Max 5 connections per instance (adjust based on your DB plan)
- `pool_timeout=10` → Wait 10 seconds for connection before timing out
- `pgbouncer=true` → Use PgBouncer pooling (Supabase only)

---

## 🧪 Testing the Fix

### 1. Update Environment Variables

```bash
# Edit your .env file with the new DATABASE_URL
nano .env
```

### 2. Restart Development Server

```bash
# Kill current server (Ctrl+C)
# Then restart
npm run dev
# or
pnpm dev
```

### 3. Test Adding Meals

1. Go to admin dashboard
2. Try adding 2-3 meals quickly
3. Should work without "too many connections" error

### 4. Monitor Database Connections

**PostgreSQL Query:**

```sql
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE datname = 'your_database_name';
```

**Should see:** 5-10 connections max (not 50+)

---

## 📊 Production Deployment

### For Vercel:

1. **Go to your Vercel project settings**
2. **Environment Variables section**
3. **Update DATABASE_URL:**
   ```
   postgresql://...?connection_limit=5&pool_timeout=10
   ```
4. **Add DIRECT_URL:**
   ```
   postgresql://... (without connection params)
   ```
5. **Redeploy**

### Connection Limits by Database Plan:

| Database Provider | Free Tier | Paid Tier |
| ----------------- | --------- | --------- |
| Supabase Free     | 5-10      | 15+       |
| Neon Free         | 5         | 20+       |
| Railway           | 20        | 100+      |
| Heroku Postgres   | 20        | 120+      |

**Set `connection_limit` to 70% of your plan's limit.**

---

## 🐛 If Problems Persist

### 1. Check Your Database Plan

```bash
# Run this query on your database
SELECT name, setting
FROM pg_settings
WHERE name = 'max_connections';
```

### 2. Increase connection_limit (if database allows)

```env
# Try increasing gradually
DATABASE_URL="...?connection_limit=7&pool_timeout=15"
```

### 3. Check for Orphaned Connections

```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'your_db'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
```

### 4. Add Connection Pooling Service

For production, consider external pooling:

- **PgBouncer** (recommended)
- **Supabase Pooler** (if using Supabase)
- **Neon Pooling** (if using Neon)

---

## 📁 Files Modified

- ✅ `src/lib/prisma.ts` - Added connection pool config
- ✅ `src/lib/prisma-wrapper.ts` - Consolidated to single instance
- ✅ `src/app/api/user-dashboard/meals/route.ts` - Removed disconnect
- ✅ `src/app/api/user-dashboard/videos/route.ts` - Removed disconnect
- ✅ `src/app/api/user-dashboard/videos/[assignmentId]/complete/route.ts` - Removed disconnect
- ✅ `src/components/AddMealModal.tsx` - Added double-submit guard
- ✅ `prisma/schema.prisma` - Added directUrl support
- ✅ `.env.example` - Added connection pool examples

---

## 💡 Best Practices Going Forward

### 1. Monitor Connections

Set up alerts when connections exceed 80% of limit

### 2. Batch Operations

When assigning meals to multiple clients, batch the operations

### 3. Use Background Jobs

For heavy operations (bulk imports, exports), use a queue system

### 4. Connection Pool Sizing

```
connection_limit = (Database Max Connections * 0.7) / Number of App Instances
```

Example: 20 max connections, 2 app instances = 7 connections per instance

### 5. Upgrade Database Plan

If you frequently hit limits, consider upgrading your database plan

---

## ❓ Common Questions

**Q: Why remove $disconnect() from API routes?**  
A: In serverless environments, connections should be reused. Disconnecting breaks the pool.

**Q: Will this affect migrations?**  
A: No, migrations use `DIRECT_URL` which bypasses connection pooling.

**Q: How many connections will I use now?**  
A: Maximum of 5 per Prisma instance (adjustable via connection_limit).

**Q: Is this fix safe for production?**  
A: Yes, this follows Prisma best practices for serverless deployments.

---

## 🆘 Need Help?

If you're still seeing connection issues:

1. Check logs: `npm run dev` output
2. Check database dashboard for active connections
3. Verify `DATABASE_URL` has connection parameters
4. Ensure you restarted the dev server after changing .env

**The fix is complete - just update your DATABASE_URL and restart! 🎉**
