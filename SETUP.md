# CAMS Setup Guide - Next Steps

## ✅ Current Status
- ✅ Project is built successfully
- ✅ All dependencies installed
- ✅ TypeScript compilation working
- ✅ File structure in place

## 📋 Step-by-Step Setup

### Step 1: Create Environment Variables

Create a `.env.local` file in the root directory with your database connection:

```bash
# Copy this to .env.local and update with your actual values
DATABASE_URL="postgresql://neondb_owner:npg_UPV14sHCBFxo@ep-jolly-night-ahbgv7it-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="cams-super-secret-jwt-key-change-in-production-2024"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important:** 
- Replace the DATABASE_URL with your actual Neon PostgreSQL connection string
- Use a strong, random JWT_SECRET in production

### Step 2: Generate Prisma Client

```bash
npm run db:generate
```

This creates the Prisma Client based on your schema.

### Step 3: Push Database Schema to Neon

```bash
npm run db:push
```

This will create all tables in your Neon PostgreSQL database.

**Note:** If you encounter connection issues, verify:
- Your Neon database is running
- The connection string is correct
- Network/firewall allows connections

### Step 4: Seed Initial Users

```bash
npm run db:seed
```

This creates default users for all roles:
- `counselor@cams.com` / `password123`
- `certificate@cams.com` / `password123`
- `accounts@cams.com` / `password123`
- `principal@cams.com` / `password123`
- `director@cams.com` / `password123`

**⚠️ CHANGE THESE PASSWORDS IN PRODUCTION!**

### Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Step 6: Test the Application

1. **Visit http://localhost:3000**
   - You'll be redirected to `/login`

2. **Login with any role:**
   - Try: `counselor@cams.com` / `password123`
   - You'll be redirected to the role-specific dashboard

3. **Test Workflow:**
   - **Counselor**: Create a student profile
   - **Certificate Officer**: Upload and verify certificates
   - **Accounts Officer**: Create fee heads and record payments
   - **Principal**: View summaries and add remarks
   - **Director**: View comprehensive reports

## 🔍 Troubleshooting

### Database Connection Issues

If `npm run db:push` fails:

1. **Check your connection string:**
   ```bash
   # Test connection directly
   psql "your-connection-string-here"
   ```

2. **Verify Neon database:**
   - Ensure the database is not paused
   - Check firewall/network settings
   - Try the connection string from Neon dashboard

3. **Alternative: Use Neon's connection pooling:**
   - Some connection strings require `?pgbouncer=true`
   - Check Neon dashboard for correct connection string format

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild
rm -rf .next
npm run build
```

### Type Errors

If TypeScript errors appear:

```bash
# Regenerate Prisma Client
npm run db:generate

# Restart TypeScript server in your IDE
```

## 📝 Important Files to Verify

- ✅ `.env.local` - Environment variables (create this!)
- ✅ `prisma/schema.prisma` - Database schema
- ✅ `public/uploads/certificates/` - Certificate storage directory
- ✅ `middleware.ts` - Route protection
- ✅ All API routes in `app/api/`

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Set strong, random JWT_SECRET
- [ ] Use HTTPS (required for secure cookies)
- [ ] Configure environment variables in hosting platform
- [ ] Set up database backups
- [ ] Configure file upload storage (consider cloud storage for certificates)
- [ ] Review and adjust CORS settings if needed
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure rate limiting for API routes
- [ ] Review security headers

## 🧪 Testing Each Module

### Admission Counselor Flow
1. Login as counselor
2. Create a new student
3. Add counseling remarks
4. Verify student appears in list

### Certificate Officer Flow
1. Login as certificate officer
2. Upload a certificate for a student
3. Verify application number is generated
4. Mark certificate as verified

### Accounts Officer Flow
1. Login as accounts officer
2. Create a fee head (e.g., "Tuition Fee - ₹50,000")
3. Record a payment for a student
4. Download the PDF receipt

### Principal Flow
1. Login as principal
2. View daily admission summary
3. View fee collection summary
4. Add daily remarks

### Director Flow
1. Login as director
2. View comprehensive admission reports
3. View financial reports
4. Filter by date ranges

## 📚 Additional Resources

- **Prisma Studio** (Database GUI): `npm run db:studio`
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **shadcn/ui Docs**: https://ui.shadcn.com

## 🎯 Quick Start Commands

```bash
# Full setup (run these in order)
npm install                    # Already done ✓
# Create .env.local            # You need to do this
npm run db:generate            # Generate Prisma client
npm run db:push                # Push schema to database
npm run db:seed                # Create default users
npm run dev                    # Start development server
```

## ❓ Need Help?

If you encounter issues:
1. Check the terminal output for error messages
2. Verify your `.env.local` file is correct
3. Ensure the database connection string is valid
4. Check that all required directories exist (`public/uploads/certificates/`)

---

**You're almost there!** The hard part (building the application) is done. Now just set up the database and you're ready to go! 🎉

