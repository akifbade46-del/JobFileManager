# Q'go Cargo - Job File Management System

## Overview

Q'go Cargo is a comprehensive job file management system designed for shipping and logistics operations. The system handles the complete workflow of shipping documents, from creation through approval, with support for KWD currency (3 decimal places) and role-based access control. Originally built as a React/TypeScript/Node.js/PostgreSQL application, it has been converted to support both modern web frameworks and shared hosting environments with HTML/JavaScript/PHP/MySQL stack.

The system serves shipping companies that need to manage job files, track client relationships, monitor financial data, and maintain approval workflows across different user roles (Admin, Checker, User).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application employs a dual-architecture approach:

**Modern Stack (Primary):**
- **Framework**: React with TypeScript for type safety and component-based architecture
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Client-side routing with hash-based navigation

**Legacy/Shared Hosting Stack (Alternative):**
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+) with modular architecture
- **Styling**: Custom CSS with CSS variables for theming, Kuwait-inspired color palette
- **Components**: Modular JavaScript files (auth.js, jobs.js, clients.js, etc.)
- **Router**: Custom hash-based client-side routing system

The design follows Carbon Design System principles for enterprise data management with Material Design elements for enhanced visual feedback, prioritizing data-heavy, productivity-focused interfaces.

### Backend Architecture
**Development Environment:**
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

**Production/Shared Hosting:**
- **Backend**: PHP 8.0+ with procedural architecture for shared hosting compatibility
- **API Structure**: RESTful API endpoints under `/api` directory
- **Authentication**: PHP sessions with bcrypt password hashing

### Data Storage Solutions
**Development:**
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle with migrations support
- **Schema**: Strongly typed schema definitions with enums for status management

**Production:**
- **Database**: MySQL 8.0+ for shared hosting compatibility
- **Connection**: PDO with prepared statements for security

**Database Schema Design:**
- **Users Table**: Role-based access control (admin, checker, user) with status management
- **Clients Table**: Unified shipper/consignee management with contact information
- **Job Files Table**: Core shipping document management with approval workflow
- **Job File Items Table**: Detailed charge breakdown with selling/cost tracking
- **Activity Logs Table**: Comprehensive audit trail for all system actions

### Authentication and Authorization
**Session Management:**
- Secure session configuration with httpOnly cookies
- CSRF protection with sameSite cookie policy
- Session rotation and 24-hour expiration
- Rate limiting for login attempts (5 attempts per 15 minutes)

**Role-Based Access Control:**
- **Admin**: Full system access, user management, data migration tools
- **Checker**: Job file review, approval/rejection capabilities
- **User**: Job file creation and editing (own files only)

**Security Features:**
- Password hashing with bcrypt (10+ rounds)
- SQL injection prevention through prepared statements/ORM
- XSS protection through proper data sanitization
- Input validation with Zod schema validation

### Component Architecture
**Reusable UI Components:**
- Form components with validation states
- Data tables with sorting, filtering, and pagination
- Modal dialogs for actions and confirmations
- Toast notification system
- Loading states and error boundaries

**Page Components:**
- LoginForm with signup capability and approval workflow
- JobFileForm with dynamic charge management
- JobFileManager with status filtering and search
- ClientManager for shipper/consignee management
- Analytics dashboard with financial reporting
- AdminPanel for user and system management

## External Dependencies

### Development Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database hosting
- **@radix-ui/***: Headless UI primitives for accessible components
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe ORM for database operations
- **bcrypt**: Password hashing and verification
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library based on Radix UI
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

### Shared Hosting Dependencies
- **PHP 8.0+**: Server-side processing
- **MySQL 8.0+**: Database management
- **Apache with mod_rewrite**: Web server with URL rewriting
- **Font Awesome**: Icon library for legacy frontend
- **Google Fonts (Inter)**: Typography

### External Services
- **Chart.js**: Data visualization for analytics dashboard
- **QRCode.js**: QR code generation for job file tracking
- **Google Fonts**: Web font delivery
- **CDN Resources**: External JavaScript libraries for shared hosting

### Build and Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler
- **PostCSS**: CSS processing with Autoprefixer
- **Drizzle Kit**: Database migration management

The architecture prioritizes flexibility between modern development environments and shared hosting constraints, ensuring the application can be deployed in various hosting scenarios while maintaining feature parity and security standards.