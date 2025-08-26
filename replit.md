# Faculty Feedback System

## Overview

This is a college faculty feedback system built as a full-stack web application. The system enables role-based interaction between administrators, teachers, and students for collecting and analyzing faculty feedback. Students can submit feedback on courses and teachers, while educators can create feedback forms and view analytics. The system incorporates attendance-weighted feedback to ensure more engaged students have greater influence on ratings.

Key features include:
- Role-based authentication and authorization (Admin, Teacher, Student)
- Dynamic feedback form creation with multiple question types
- Attendance-weighted feedback scoring system
- Real-time analytics and reporting dashboards
- Course and enrollment management
- Responsive design with modern UI components

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built using **React 18** with **TypeScript** for type safety. The application uses **Vite** as the build tool and development server, providing fast hot module replacement and optimized builds. Routing is handled by **Wouter**, a lightweight client-side routing library.

The UI follows a component-based architecture using **shadcn/ui** components built on top of **Radix UI** primitives. Styling is implemented with **Tailwind CSS** using a design system with CSS custom properties for consistent theming. The component structure includes:
- Reusable UI components in `/components/ui/`
- Feature-specific components organized by domain
- Layout components for consistent page structure
- Custom hooks for state management and API interactions

State management is handled through **TanStack Query (React Query)** for server state, providing caching, background updates, and optimistic updates. Form handling uses **React Hook Form** with **Zod** schema validation for type-safe form processing.

### Backend Architecture
The server follows an **Express.js** architecture with TypeScript, serving both API routes and the React application in production. The backend implements:
- RESTful API design with Express routes
- Session-based authentication using **Replit Auth** with OpenID Connect
- Middleware for authentication, logging, and error handling
- File-based route organization for maintainability

The application uses a unified build process where both frontend and backend are compiled together, with the backend serving static files in production while providing API endpoints.

### Database Architecture
The system uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The database schema includes:
- **Users table** with role-based access control (Admin, Teacher, Student)
- **Courses table** with teacher assignments and metadata
- **Course enrollments** linking students to courses
- **Attendance records** tracking student participation
- **Feedback forms** with flexible question schemas stored as JSON
- **Feedback responses** linked to forms with attendance-weighted scoring
- **Sessions table** for authentication state management

The schema uses PostgreSQL-specific features like JSONB for flexible form structures and UUIDs for primary keys. Drizzle provides compile-time type safety and generates TypeScript types from the database schema.

### Authentication and Authorization
Authentication is implemented using **Replit Auth** with OpenID Connect, providing secure SSO integration. The system includes:
- Session-based authentication with PostgreSQL session storage
- Role-based access control enforced at both API and UI levels
- Protected routes that redirect unauthenticated users
- User profile management with institutional data

Authorization is enforced through middleware that checks user roles and ownership permissions before allowing access to resources.

### Key Design Patterns
The application follows several architectural patterns:
- **Repository Pattern**: Database operations are abstracted through a storage interface
- **Component Composition**: UI components are built using composition over inheritance
- **Custom Hooks Pattern**: Business logic is encapsulated in reusable React hooks
- **Schema Validation**: All data inputs are validated using Zod schemas
- **Type Safety**: End-to-end TypeScript ensures compile-time error detection

### Attendance-Weighted Feedback System
A core feature is the attendance-weighted feedback mechanism that adjusts the influence of student responses based on their course attendance:
- Students with 90%+ attendance: Full weight (1.0)
- Students with 75-89% attendance: High weight (0.9)
- Students with 60-74% attendance: Moderate weight (0.7)
- Lower attendance levels receive progressively reduced weights

This ensures that more engaged students have greater influence on faculty evaluations.

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and concurrent features
- **Express.js**: Backend web framework for Node.js
- **TypeScript**: Type safety across the entire application stack
- **Vite**: Build tool and development server with HMR support

### Database and ORM
- **PostgreSQL**: Primary database system
- **Drizzle ORM**: Type-safe database client and query builder
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon database

### Authentication Service
- **Replit Auth**: OpenID Connect authentication provider
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Low-level accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library with consistent design

### State Management and Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form library with validation integration
- **Zod**: Schema validation and type generation

### Development and Build Tools
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration
- **Replit Development Tools**: Runtime error overlays and development banners

### Chart and Visualization Libraries
- **Recharts**: Composable charting library for React applications used in analytics dashboards

The application is designed to be deployed on Replit's infrastructure, with database provisioning handled through environment variables and automatic SSL/domain management.