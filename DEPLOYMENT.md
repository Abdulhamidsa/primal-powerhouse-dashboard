# Primal Powerhouse Dashboard - Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. **IMPORTANT: Add PostgreSQL Integration**
   - Go to Vercel Dashboard → Your Project → Settings → Integrations
   - Add "Vercel Postgres" integration
   - Create a new database (DATABASE_URL will be auto-added)
4. Set additional environment variables:
   ```
   NEXTAUTH_SECRET=your-secret-key-make-it-long-and-random
   JWT_SECRET=your-jwt-secret-key
   ```
5. Deploy automatically

**🚨 FIXING "DATABASE_URL not found" ERROR:**
- Run: `.\setup-vercel-db.ps1` (Windows) or `./setup-vercel-db.sh` (Linux/Mac)
- Or manually add PostgreSQL integration in Vercel dashboard

### Option 2: Docker

```bash
# Build and run with Docker
docker build -t primal-powerhouse .
docker run -p 3000:3000 primal-powerhouse

# Or use Docker Compose
docker-compose up -d
```

### Option 3: Traditional VPS

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build for production
npm run build:production

# Start production server
npm start
```

## 📋 Environment Variables

### Required

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Authentication secret key

### Optional

- `NODE_ENV` - Environment (production/development)
- `NEXTAUTH_URL` - Base URL for authentication
- `JWT_SECRET` - JWT signing secret

## 🗄️ Database Options

### PostgreSQL (Production Recommended)

```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**For Vercel:** Automatically provided when you add PostgreSQL integration

### SQLite (Development Only)

```
DATABASE_URL="file:./dev.db"
```

**Note:** SQLite is not supported on Vercel. Use PostgreSQL for production.

### MySQL

```
DATABASE_URL="mysql://user:password@host:3306/database"
```

## 🔧 Production Setup

1. **Clone repository**

   ```bash
   git clone <your-repo-url>
   cd primal-powerhouse-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

4. **Database setup**

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed  # Optional: Add sample data
   ```

5. **Build and start**
   ```bash
   npm run build:production
   npm start
   ```

## 🔒 Security Checklist

- [ ] Change `NEXTAUTH_SECRET` to a strong random value
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS in production
- [ ] Set up proper database backups
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging

## 🚀 Deployment Platforms

### Vercel

- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments

### Railway

- ✅ Easy database setup
- ✅ Automatic deployments
- ✅ Built-in monitoring

### DigitalOcean App Platform

- ✅ Managed infrastructure
- ✅ Auto-scaling
- ✅ Database integration

### Self-hosted VPS

- ✅ Full control
- ✅ Cost-effective
- ⚠️ Requires server management

## 📊 Performance Tips

1. Enable gzip compression (handled by Next.js)
2. Use image optimization (configured in next.config.ts)
3. Implement proper caching strategies
4. Monitor database performance
5. Use CDN for static assets

## 🔍 Monitoring

### Health Check Endpoint

The app includes a health check at `/api/health`

### Recommended Monitoring

- Uptime monitoring (Pingdom, StatusPage)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database monitoring

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npm run db:generate

# Try building again
npm run build
```

### Database Issues

```bash
# Reset database
npm run db:push --force-reset

# Reseed data
npm run db:seed
```

### Environment Issues

- Ensure all required environment variables are set
- Check database connectivity
- Verify file permissions for SQLite

## 📞 Support

For deployment issues, check:

1. Application logs
2. Database connectivity
3. Environment variable configuration
4. Network and firewall settings
