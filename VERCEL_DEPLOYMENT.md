# Vercel Deployment Guide

## Prerequisites
1. A Vercel account
2. A PostgreSQL database (recommended: Vercel Postgres, Neon, or Supabase)

## Environment Variables Setup

Add these environment variables in your Vercel project settings:

### Required Environment Variables:

1. **DATABASE_URL**
   - Your PostgreSQL connection string
   - Format: `postgresql://username:password@host:5432/database_name?schema=public`
   - Example with Vercel Postgres: Auto-configured when you add Vercel Postgres
   - Example with Neon: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

2. **JWT_SECRET**
   - A strong random string for JWT token signing
   - Generate using: `openssl rand -base64 32`
   - Example: `cams-super-secret-jwt-key-change-in-production-2024`

3. **NODE_ENV** (Optional - Vercel sets this automatically)
   - Value: `production`

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import Project to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### 3. Add Database (Recommended: Vercel Postgres)

**Option A: Vercel Postgres (Easiest)**
1. In your Vercel project dashboard, go to "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Follow the prompts
5. `DATABASE_URL` will be automatically added to your environment variables

**Option B: External Database (Neon, Supabase, etc.)**
1. Create a database on your preferred provider
2. Copy the connection string
3. In Vercel project settings → Environment Variables
4. Add `DATABASE_URL` with your connection string

### 4. Add Environment Variables
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `DATABASE_URL` (if not using Vercel Postgres)
   - `JWT_SECRET` (use a strong random string)

### 5. Run Database Migrations
After your first deployment, run migrations:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Run migrations
vercel env pull .env.production.local
npx prisma migrate deploy
```

Or use Vercel CLI to run commands:
```bash
vercel exec --prod -- npx prisma migrate deploy
```

### 6. Seed Initial Data (Optional)
If you want to seed initial users:
```bash
vercel exec --prod -- npm run db:seed
```

## Default Users (After Seeding)

- **Counselor**: counselor@cams.com / password123
- **Certificate Officer**: certificate@cams.com / password123
- **Accounts Officer**: accounts@cams.com / password123
- **Principal**: principal@cams.com / password123
- **Director**: director@cams.com / password123

⚠️ **IMPORTANT**: Change these passwords in production!

## Troubleshooting

### Build Fails with "Prisma Client not found"
- Ensure `postinstall` script is in package.json
- Check that `prisma` package is in devDependencies
- Verify DATABASE_URL is set in environment variables

### Database Connection Errors
- Verify DATABASE_URL format is correct
- Check that database allows connections from Vercel's IP ranges
- For Neon: Ensure `?sslmode=require` is in connection string
- For Supabase: Use the connection pooler URL for serverless

### Middleware Errors
- Ensure all environment variables are set
- Check that JWT_SECRET is configured

### API Routes Return 500
- Check Vercel function logs for detailed error messages
- Verify database migrations are up to date

## Post-Deployment Checklist

- [ ] Database is accessible and migrations are applied
- [ ] All environment variables are set
- [ ] Initial users are seeded (or created manually)
- [ ] Test login with different user roles
- [ ] Test file uploads (certificates)
- [ ] Test fee payment recording
- [ ] Verify middleware authentication works
- [ ] Check that role-based access control is working

## Useful Commands

```bash
# View logs
vercel logs

# Run commands in production environment
vercel exec --prod -- <command>

# Pull environment variables locally
vercel env pull

# Deploy specific branch
vercel --prod
```

## Support

For issues:
1. Check Vercel deployment logs
2. Review Prisma documentation: https://pris.ly/d/vercel-build
3. Check Next.js deployment guide: https://nextjs.org/docs/deployment
