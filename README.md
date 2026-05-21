# Buddy Feast - Complete Restaurant Platform

A modern, full-stack food ordering platform built with **Next.js (TypeScript) + Spring Boot (Java)** for a single restaurant with three applications: customer website, admin dashboard, and rider delivery app.

## Project Structure

```
buddy-feast-monorepo/
├── backend/                    # Spring Boot REST API (Java)
│   ├── src/main/java/com/buddyfeast/
│   │   ├── config/            # Security & CORS config
│   │   ├── controller/        # REST endpoints
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Database access (JPA)
│   │   ├── entity/            # Data models
│   │   ├── dto/               # Request/Response DTOs
│   │   ├── security/          # JWT utilities
│   │   └── exception/         # Error handling
│   └── pom.xml                # Maven dependencies
│
├── apps/
│   ├── customer/              # Customer website (Next.js)
│   │   ├── app/              # Pages & layouts
│   │   ├── components/       # React components
│   │   ├── lib/              # API client, stores, hooks
│   │   └── package.json
│   │
│   ├── admin/                 # Admin dashboard (Next.js)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── rider/                 # Rider app (Next.js + PWA)
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── package.json
│
├── packages/
│   └── shared/                # Shared types & constants
│       ├── index.ts
│       └── types.ts
│
├── package.json               # Root workspace
└── turbo.json                 # Turbo monorepo config
```

## Technology Stack

### Backend

- **Framework**: Spring Boot 3.1.5
- **Database**: PostgreSQL
- **Auth**: JWT (JSON Web Tokens)
- **Build Tool**: Maven
- **Java Version**: 17

### Frontend

- **Framework**: Next.js 14 (TypeScript)
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Package Manager**: pnpm/npm
- **Monorepo Tool**: Turbo

## Prerequisites

- **Java**: 17 or higher
- **Node.js**: 18 or higher
- **PostgreSQL**: 12 or higher
- **Maven**: 3.8+
- **pnpm** (recommended) or npm

## Installation

### 1. Clone the repository

```bash
cd /home/waleed-bukhari/Desktop/Buddy-pizza
```

### 2. Install dependencies

#### Backend

```bash
cd backend
mvn clean install
```

#### Frontend (all apps)

```bash
cd ..
pnpm install
# or
npm install
```

### 3. Database Setup

Create PostgreSQL database and user:

```sql
CREATE DATABASE buddy_feast_db;
CREATE USER buddy_user WITH PASSWORD 'buddy_pass_123';
GRANT ALL PRIVILEGES ON DATABASE buddy_feast_db TO buddy_user;
```

Update `backend/src/main/resources/application.properties` if using different credentials:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/buddy_feast_db
spring.datasource.username=buddy_user
spring.datasource.password=buddy_pass_123
```

### 4. JWT Secret Configuration

Update JWT secret in `application.properties` (change before production):

```properties
jwt.secret=buddy-feast-secret-key-min-256-bits-long-change-in-production-immediately
jwt.expiration=86400000
```

## Running the Applications

### Start Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

Backend will be available at: `http://localhost:8080/api`

### Start Frontend Apps (Development)

```bash
# From root directory
pnpm dev
```

Or individually:

```bash
# Customer website
cd apps/customer && pnpm dev  # Port 3000

# Admin dashboard
cd apps/admin && pnpm dev     # Port 3001

# Rider app
cd apps/rider && pnpm dev     # Port 3002
```

## API Endpoints

### Authentication

- `POST /auth/customer/login` - Customer login
- `POST /auth/customer/register` - Customer registration
- `POST /auth/admin/login` - Admin login
- `POST /auth/rider/login` - Rider login

### Products (Public)

- `GET /products` - List all products
- `GET /products/{id}` - Get product details

### Deals (Public)

- `GET /deals` - List active deals

### Orders (Customer)

- `POST /orders` - Create new order
- `GET /orders/{id}` - Get order details
- `GET /orders/user/{userId}` - Get user's orders

### Admin

- `GET /admin/dashboard` - Dashboard metrics
- `POST /admin/products` - Create product
- `PUT /admin/products/{id}` - Update product
- `DELETE /admin/products/{id}` - Delete product
- `GET /admin/orders` - Get all orders
- `PUT /admin/orders/{id}/status` - Update order status

### Rider

- `GET /rider/{id}` - Get rider details
- `GET /rider/{riderId}/orders` - Get assigned orders
- `PUT /rider/orders/{orderId}/status` - Update delivery status

## Design System (Buddy Feast Brand)

### Colors

```
Primary: #E8431F (Ember)
Secondary: #FFB627 (Amber)
Success: #2F8F4E (Leaf)
Background: #FFF7EE (Cream)
Dark: #231F20 (Ink)
```

### Typography

- Font Family: Archivo (Google Fonts)
- Monospace: JetBrains Mono
- Base Size: 16px

### Spacing

- Border Radius: 14px
- Shadows: Soft shadows with inset highlights

## Features Implemented

### Phase 1: Complete ✅

- Spring Boot backend with all entities
- JWT authentication for 3 roles
- REST API endpoints
- PostgreSQL database models
- Security configuration with CORS

### Phase 2: In Progress 🔄

- Next.js apps initialized
- API clients configured
- Auth stores (Zustand)
- Cart management
- Brand design system integrated

### Phase 3: To Do

- Customer pages: menu, checkout, order tracking
- Admin dashboard screens
- Rider delivery workflow
- Real-time updates (WebSocket)
- Notifications (Email/SMS)

## Environment Variables

### Backend (`backend/src/main/resources/application.properties`)

```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/buddy_feast_db
spring.datasource.username=buddy_user
spring.datasource.password=buddy_pass_123
jwt.secret=your-secret-key
jwt.expiration=86400000
```

### Frontend (`.env.local` in each app)

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Project Commands

### Root Workspace

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm test         # Run tests
pnpm clean        # Clean all builds
```

### Individual Apps

```bash
cd apps/customer
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production build
```

## Authentication Flow

### Customer

1. Register with phone/email/password
2. JWT token returned and stored
3. Token sent with every API request (Authorization header)
4. Token expires in 24 hours

### Admin

1. Login with email/password
2. JWT token with "ADMIN" role
3. Access to admin endpoints only

### Rider

1. Login with Rider ID and PIN
2. JWT token with "RIDER" role
3. Can update delivery status

## Testing

### Backend

```bash
cd backend
mvn test
```

### Frontend

```bash
cd apps/customer
pnpm test
```

## Deployment

### Backend (to AWS/Heroku)

```bash
cd backend
mvn clean package
# Deploy JAR to cloud platform
```

### Frontend (to Vercel)

```bash
pnpm build
# Deploy to Vercel via Git integration
```

## Database Diagram

```
Restaurant (1) ─── (Many) Category
                 ├── (Many) Product
                 ├── (Many) Deal
                 ├── (Many) User
                 ├── (Many) Admin
                 └── (Many) Rider

User (1) ─────── (Many) Order
Order (1) ───── (Many) OrderItem
OrderItem (Many) ──── Product
Order (Many) ──── Rider (0..1)
```

## Future Enhancements

1. **Payment Integration**: Stripe/JazzCash
2. **Real-time Updates**: WebSocket for live order tracking
3. **Map Integration**: Google Maps for rider tracking
4. **SMS/Email**: SendGrid notifications
5. **Analytics**: Dashboard with sales insights
6. **Multi-language**: i18n support
7. **Mobile App**: React Native version
8. **Reviews & Ratings**: Customer feedback system

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## License

MIT License - feel free to use for learning and development.

## Support

For issues, feature requests, or questions, contact the development team.

---

**Built with ❤️ for Buddy Feast Restaurant Platform**
