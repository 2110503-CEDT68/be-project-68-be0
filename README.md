[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iG82Gnyy)

# Restaurant Reservation System

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   Create a `.env` file based on `.env.example` and configure your MongoDB connection:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your MongoDB connection string:
   ```
   PORT=3000
   DATABASE_URL="mongodb://johndoe:randompassword@localhost:27017/mydb?authSource=admin"
   ```

3. **Start MongoDB with Docker**:
   ```bash
   docker-compose up -d
   ```

4. **Run the server**:
   Start the development server:
   ```bash
   npm run dev
   ```

5. **Run tests**:
   ```bash
   npm test
   ```
