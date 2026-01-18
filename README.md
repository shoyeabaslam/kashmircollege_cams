# CAMS - College Admission & Monitoring System

A comprehensive web-based system for managing college admissions with strict role-based access control, ensuring transparency and accountability.

We have to update the functionality as per the discussion

## Features

### Core Modules Implemented

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Secure password hashing

2. **Admission Counselor Module**
   - Create and manage student profiles
   - Add counseling remarks
   - View student status and progress

3. **Certificate Verification Module**
   - Upload student certificates (PDF, images)
   - Verify/reject certificates
   - Auto-generate application numbers
   - File validation and secure storage

4. **Accounts Module**
   - Manage fee heads (tuition, hostel, transport, etc.)
   - Record fee payments
   - Generate PDF receipts
   - Fee collection summaries

5. **Principal Monitoring Module**
   - View daily admission summaries
   - Monitor fee collection
   - Add daily remarks
   - Read-only access to all data

6. **Director Monitoring Module**
   - Comprehensive admission reports
   - Financial reports and analytics
   - Complete institutional overview
   - Read-only access to all data

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui with Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Custom JWT-based
- **PDF Generation**: pdfkit
- **Form Validation**: Zod + React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Environment variables configured

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="your-neon-postgresql-connection-string"
JWT_SECRET="your-secret-jwt-key-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (creates default users)
npm run db:seed
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users

After running the seed script, you can login with:

- **Admission Counselor**: `counselor@cams.com` / `password123`
- **Certificate Officer**: `certificate@cams.com` / `password123`
- **Accounts Officer**: `accounts@cams.com` / `password123`
- **Principal**: `principal@cams.com` / `password123`
- **Director**: `director@cams.com` / `password123`

**⚠️ IMPORTANT**: Change these passwords in production!

## Role-Based Access

### Admission Counselor
- Can create/edit student profiles
- Can add counseling remarks
- Cannot modify certificates or fees
- Dashboard: `/counselor`

### Certificate Officer
- Can upload certificates
- Can verify/reject certificates
- Generates application numbers
- Cannot edit student profiles or fees
- Dashboard: `/certificate-officer`

### Accounts Officer
- Can manage fee heads
- Can record fee payments
- Can generate receipts
- Cannot edit student or certificate data
- Dashboard: `/accounts`

### Principal
- Read-only access to all data
- Can view daily summaries
- Can add daily remarks
- Cannot modify any operational data
- Dashboard: `/principal`

### Director
- Read-only access to all reports
- Comprehensive analytics
- Cannot modify any data
- Dashboard: `/director`

## Project Structure

```
/Users/shoyeab/Desktop/Nextjs/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Role-specific dashboards
│   ├── api/             # API routes
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # shadcn/ui components
│   └── [module]/        # Module-specific components
├── lib/
│   ├── auth.ts          # JWT utilities
│   ├── db.ts            # Prisma client
│   ├── middleware.ts    # RBAC middleware
│   └── utils.ts         # Utility functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
└── types/               # TypeScript types
```

## Database Schema

Key tables:
- `User` - System users with roles
- `Student` - Student profiles
- `CounselingRemark` - Counselor notes
- `Certificate` - Student certificates
- `FeeHead` - Fee structure definitions
- `FeeTransaction` - Fee payments
- `PrincipalRemark` - Daily principal remarks

## Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Role-based route protection
- API-level RBAC enforcement
- File upload validation
- SQL injection protection (Prisma ORM)

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Students (Counselor only)
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/[id]` - Get student details
- `PATCH /api/students/[id]` - Update student
- `POST /api/students/[id]/remarks` - Add remark

### Certificates (Certificate Officer only)
- `GET /api/certificates` - List certificates
- `POST /api/certificates` - Upload certificate
- `PATCH /api/certificates/[id]` - Update verification status

### Fees (Accounts Officer only)
- `GET /api/fee-heads` - List fee heads
- `POST /api/fee-heads` - Create fee head
- `PATCH /api/fee-heads/[id]` - Update fee head
- `GET /api/fees/transactions` - List transactions
- `POST /api/fees/transactions` - Record payment
- `GET /api/fees/receipt/[id]` - Generate PDF receipt

### Reports (Principal/Director)
- `GET /api/reports/daily-admissions` - Daily admission stats
- `GET /api/reports/fee-summary` - Fee collection summary
- `GET /api/reports/admissions` - Comprehensive admission report
- `GET /api/reports/financial` - Financial report

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Open Prisma Studio
npm run db:studio
```

## Important Notes

1. **Database Connection**: Ensure your Neon PostgreSQL connection string is correct and accessible
2. **File Uploads**: Certificate files are stored in `/public/uploads/certificates/`. Ensure this directory exists and is writable
3. **Environment Variables**: Never commit `.env.local` to version control
4. **JWT Secret**: Use a strong, random JWT secret in production
5. **HTTPS**: Use HTTPS in production for secure cookie transmission

## Future Enhancements (Not Implemented)

- SMS/Email notifications
- Mobile app for monitoring
- AI-based admission analytics
- Audit logging (mentioned in requirements but excluded per user preference)
- Email verification
- Password reset functionality

## Deployment

### Deploy to Vercel

This project is configured for easy deployment on Vercel.

**Quick Deploy:**
1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables (see below)
4. Deploy!

**Detailed Instructions:**
See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment guide.

### Required Environment Variables

```env
DATABASE_URL="postgresql://username:password@host:5432/database"
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="production"
```

### Database Setup on Vercel

**Recommended: Vercel Postgres**
- Automatically configured when added to your project
- Zero configuration required
- Runs migrations automatically

**Alternative: External Database**
- Neon, Supabase, or any PostgreSQL provider
- Add connection string to `DATABASE_URL`
- Run migrations manually after deployment

After deployment, run migrations:
```bash
vercel exec --prod -- npx prisma migrate deploy
```

Seed initial data:
```bash
vercel exec --prod -- npm run db:seed
```

## License

Private project - All rights reserved

## Support

For issues or questions, please contact the development team.

