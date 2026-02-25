[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iG82Gnyy)

# Restaurant Reservation System

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Setup environment variables**:
   Create a `.env` file based on `.env.example` and fill in your `DATABASE_URL`.
   ```bash
   cp .env.example .env
   ```
3. **Database Migration and Prisma Client Generation**:
   Run the following commands to migrate the database and generate the Prisma Client.
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
4. **Run the server**:
   Start the development server:
   ```bash
   npm run dev
   ```
