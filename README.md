# Agriculture Marketplace

A final year project, a full-stack marketplace connecting Farmers, Buyers, and Drivers. 

## Tech Stack
- **Frontend**: Next.js 16+, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Neon Serverless Postgres)

## Features
- **Farmers**: Manage profiles, list products, track reviews.
- **Buyers**: Browse products, place orders, make reviews.
- **Drivers**: Assigned deliveries, status tracking (Delivery Logs), COD handling.
- **Admins**: System oversight, dispute resolution, reporting.
- **Authentication**: OTP-based email verification.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn / pnpm
- A PostgreSQL database URL

### Installation

1. **Clone the repository and install dependencies**
    ```bash
    # Install backend dependencies
    cd backend
    npm install
    
    # Install frontend dependencies
    cd ../frontend
    npm install
    ```

2. **Environment Variables**
    Configure the `.env` files in both the frontend and backend directories.
    
    *Backend (`backend/.env`):*
    ```env
    DATABASE_URL="your-postgresql-url"
    PORT=3001
    ```

3. **Database Migration**
    From the `backend` directory, apply the Prisma schema to your database:
    ```bash
    npx prisma migrate dev --name init
    ```

4. **Run Development Servers**
    Start both servers simultaneously or separately:
    
    *Backend:*
    ```bash
    cd backend
    npm run dev
    ```
    
    *Frontend:*
    ```bash
    cd frontend
    npm run dev
    ```

## API Documentation
The API documentation is maintained locally. See `backend/API_DOCUMENTATION.md` (if available) for detailed endpoints regarding users, orders, products, and deliveries.
