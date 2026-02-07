
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Trip Nest Backend

Trip Nest BE is a robust backend API for a travel booking platform, built with the [NestJS](https://github.com/nestjs/nest) framework. It provides comprehensive features for managing tours, bookings, users, payments, and real-time communications.

## Features

-   **Authentication & Authorization**: Secure JWT-based authentication with Passport strategies (Local, Google, etc.).
-   **User Management**: User profiles, roles, and permissions.
-   **Tours & Location Management**: Create and manage travel packages and destinations.
-   **Booking System**: Complete booking flow with payment integration.
-   **Reviews & Ratings**: User feedback system for tours.
-   **Payments**: Integrated payment processing (Stripe/PayPal/etc. - check implementation).
-   **Real-time Chat**: Socket.io based chat for support or user interaction.
-   **Notifications**: Real-time notifications system.
-   **Email Service**: Transactional emails using Nodemailer and BullMQ for queuing.
-   **Caching**: Redis-based caching for performance optimization.
-   **Database**: PostgreSQL with TypeORM for data persistence.

## Tech Stack

-   **Framework**: NestJS
-   **Database**: PostgreSQL
-   **ORM**: TypeORM
-   **Caching/Queue**: Redis, BullMQ
-   **Real-time**: Socket.io
-   **Containerization**: Docker & Docker Compose

## Prerequisites

Ensure you have the following installed on your local machine:

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd trip-nest-be
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

Duplicate the `.env.example` file (if available) or create a `.env` file in the root directory based on the following template:

```env
# Server
PORT=3000

# Database (PostgreSQL)
HOST=localhost
PORT_DB=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=travel_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600s

# Other configurations (Mail, Cloudinary, Payment keys etc.)
# ...
```

## Running the Application

1.  **Start Infrastructure (Database & Redis)**
    Use Docker Compose to start PostgreSQL and Redis containers:
    ```bash
    docker-compose up -d
    ```

2.  **Start the Application**
    
    Development mode:
    ```bash
    npm run start:dev
    ```

    Production mode:
    ```bash
    npm run start:prod
    ```

## Database Seeding

To populate the database with initial sample data (tours, locations, users, etc.):

```bash
npm run seed
```

To clear the seeded data:

```bash
npm run seed:clear
```

## Testing

Run the test suite to ensure everything is working correctly:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Documentation

-   Swagger API documentation is available at `/api` (or configured path) when the server is running.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

This project is [MIT licensed](LICENSE).
