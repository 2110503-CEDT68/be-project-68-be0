[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iG82Gnyy)

# Restaurant Reservation System

## System Overview

![System Architecture](docs/system-overview.png)

<details>
<summary><strong> Click to view detailed sequence diagram</strong></summary>

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'useMaxWidth': false }}}%%
sequenceDiagram
    actor Client as User / Admin
    participant API as Express API (Router & MW)
    participant Ctrl as Controllers
    participant Mod as Models
    participant DB as MongoDB

    Client->>API: HTTP Request
    API->>API: Sanitize Input & Rate Limit Check

    alt Registration [POST /api/auth/register]
        API->>Ctrl: Auth: register(req, res)
        Ctrl->>Mod: Hash Password & Create User
        Mod->>DB: Insert User Document
        DB-->>Mod: Success
        Mod-->>Ctrl: User Data
        Ctrl->>Ctrl: Generate JWT & Set Cookie
        Ctrl-->>API: User + Token
        API-->>Client: 201 Created

    else Login [POST /api/auth/login]
        API->>Ctrl: Auth: login(req, res)
        Ctrl->>Mod: Find User by Email
        Mod->>DB: Query DB
        DB-->>Mod: User Document
        Mod-->>Ctrl: User Data
        Ctrl->>Ctrl: Compare Passwords & Gen JWT
        Ctrl-->>API: User + Token
        API-->>Client: 200 OK

    else Get Restaurants [GET /api/restaurants]
        API->>Ctrl: Rest: getRestaurants(req, res)
        Ctrl->>Mod: findAllWithRelations()
        Mod->>DB: Find Restaurants & Reservations
        DB-->>Mod: Documents
        Mod-->>Ctrl: Restaurants with Relations
        Ctrl-->>API: Return Data
        API-->>Client: 200 OK + Restaurants

    else Create Restaurant (Admin) [POST /api/restaurants]
        API->>API: AuthMW: Verify JWT & Authorize('admin')
        API->>Ctrl: Rest: createRestaurant(req, res)
        Ctrl->>Mod: create(data)
        Mod->>DB: Insert Restaurant Document
        DB-->>Mod: Created Restaurant
        Mod-->>Ctrl: Restaurant Data
        Ctrl-->>API: Return Data
        API-->>Client: 201 Created

    else Create Reservation [POST /api/.../reservations]
        API->>API: AuthMW: Verify JWT
        API->>Ctrl: Resv: addReservation(req, res)
        Ctrl->>Mod: Check if Restaurant Exists
        Mod->>DB: Find Restaurant
        DB-->>Mod: Restaurant Data
        Mod-->>Ctrl: Confirmed
        Ctrl->>Mod: create(reservationData)
        Mod->>DB: Insert Reservation Document
        DB-->>Mod: Created Reservation
        Mod-->>Ctrl: Reservation Data
        Ctrl-->>API: Return Data
        API-->>Client: 201 Created

    else Get User's Reservations [GET /api/reservations]
        API->>API: AuthMW: Verify JWT
        API->>Ctrl: Resv: getReservations(req, res)
        Ctrl->>Mod: findAll({user_id})
        Mod->>DB: Find Reservations by User
        DB-->>Mod: Reservation Documents
        Mod-->>Ctrl: User's Reservations
        Ctrl-->>API: Return Data
        API-->>Client: 200 OK + Reservations

    else Delete Reservation [DELETE /api/reservations/:id]
        API->>API: AuthMW: Verify JWT
        API->>Ctrl: Resv: deleteReservation(req, res)
        Ctrl->>Mod: findById(id)
        Mod->>DB: Find Reservation
        DB-->>Mod: Reservation Document
        Mod-->>Ctrl: Check Ownership
        Ctrl->>Mod: delete(id)
        Mod->>DB: Delete Document
        DB-->>Mod: Deleted
        Mod-->>Ctrl: Success
        Ctrl-->>API: Success Message
        API-->>Client: 200 OK
    end
```

*The diagram shows the complete request flow through the system, including authentication, authorization, and database operations.*

</details>

<details>
<summary><strong>🏗️ Click to view UML class diagram</strong></summary>

```mermaid
%%{init: {'theme': 'default', 'themeVariables': { 'useMaxWidth': false }}}%%
classDiagram
    %% Models
    class User {
        -ObjectId _id
        -String name
        -String telephone_number
        -String email
        -String role
        -String password
        -Date createdAt
        +getSignedJwtToken() String
        +matchPassword(enteredPassword) Boolean
    }

    class Restaurant {
        -ObjectId _id
        -String name
        -String address
        -String telephone_number
        -Date open_time
        -Date close_time
        -Date createdAt
        +reservations virtual
    }

    class Reservation {
        -ObjectId _id
        -ObjectId user
        -ObjectId restaurant_id
        -String restaurant_name
        -Date reservation_date
        -Number quantity
        -Date createdAt
    }

    %% Controllers
    class AuthController {
        +register(req, res) void
        +login(req, res) void
        +logout(req, res) void
        +getMe(req, res) void
        -sendTokenResponse(user, statusCode, res) void
    }

    class RestaurantController {
        +getRestaurants(req, res, next) void
        +getRestaurant(req, res, next) void
        +createRestaurant(req, res, next) void
        +updateRestaurant(req, res, next) void
        +deleteRestaurant(req, res, next) void
    }

    class ReservationController {
        +getReservations(req, res) void
        +getReservation(req, res) void
        +addReservation(req, res) void
        +updateReservation(req, res) void
        +deleteReservation(req, res) void
    }

    %% Middleware
    class AuthMiddleware {
        +protect(req, res, next) void
        +authorize(...roles) Function
    }

    %% Routes
    class AuthRoutes {
        +POST /register
        +POST /login
        +GET /logout
        +GET /me
    }

    class RestaurantRoutes {
        +GET /
        +GET /:id
        +POST /
        +PUT /:id
        +DELETE /:id
        +USE /:restaurantId/reservations
    }

    class ReservationRoutes {
        +GET /
        +GET /:id
        +POST /
        +PUT /:id
        +DELETE /:id
    }

    %% Relationships - Models
    User "1" --> "0..*" Reservation : makes
    Restaurant "1" --> "0..*" Reservation : has

    %% Relationships - Controllers to Models
    AuthController ..> User : uses
    RestaurantController ..> Restaurant : uses
    RestaurantController ..> Reservation : uses
    ReservationController ..> Reservation : uses
    ReservationController ..> Restaurant : uses

    %% Relationships - Routes to Controllers
    AuthRoutes ..> AuthController : calls
    RestaurantRoutes ..> RestaurantController : calls
    ReservationRoutes ..> ReservationController : calls

    %% Relationships - Middleware
    AuthMiddleware ..> User : validates
    RestaurantRoutes ..> AuthMiddleware : protected by
    ReservationRoutes ..> AuthMiddleware : protected by

    %% Enumerations
    class UserRole {
        <<enumeration>>
        user
        admin
    }

    User --> UserRole : has
```

*The UML diagram shows the complete system architecture including models, controllers, routes, middleware, and their relationships.*

</details>

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
