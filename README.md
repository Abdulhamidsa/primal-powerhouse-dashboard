# Primal Powerhouse Dashboard

A comprehensive fitness coaching dashboard with meal planning, client management, and workout tracking.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Abdulhamidsa/primal-powerhouse-dashboard)

## 📋 Environment Variables for Vercel

Set these in your Vercel dashboard:

```bash
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="your-random-secret-key"
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

## 📱 Features

- **Client Management**: Track client profiles, goals, and progress
- **Meal Planning**: Assign meals with nutrition tracking
- **Workout Library**: Manage exercise routines
- **Dashboard Analytics**: View key performance metrics
- **Responsive Design**: Mobile-friendly interface

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
