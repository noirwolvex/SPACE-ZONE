# Space Zone Media — AI Development Master Requirements Document

## Project Title
**Corporate Website and Startup Tools Platform for Space Zone Media**

---

## 1. Project Mission

Build a production-ready, scalable full-stack web platform for Space Zone Media that combines:

1. A modern corporate website
2. A startup digital tools marketplace
3. A full admin management dashboard
4. SEO optimized public content system
5. Secure payment and digital delivery workflow

This document serves as the **master instruction file for an AI software development agent**.  
The AI agent must use this document as the complete source of truth during system architecture, database design, backend implementation, frontend implementation, deployment planning, and version control workflow.

---

## 2. Mandatory Technology Stack (Strict)

The AI agent MUST build the project using the following technologies only unless otherwise approved:

### Core Framework
- Next.js (latest stable version)
- TypeScript
- App Router architecture

### Frontend
- Tailwind CSS
- Responsive mobile-first design
- Reusable component-based architecture

### Backend
- Next.js API Routes / Server Actions
- Server-side rendering where SEO is required

### Database
- PostgreSQL

### ORM
- Prisma ORM (mandatory)

### Authentication
- NextAuth or secure custom JWT session authentication for admin dashboard

### Payment Gateway
- Tap Payments integration (Don't do it now, I will instruct when to di it)

### Deployment Target
- Vercel deployment ready

### Version Control (Mandatory)
- Git must be used from day one
- GitHub repository must be created and maintained
- All development must follow structured commit history
- Branch-based development workflow is required

---

## 3. Mandatory Git + GitHub Development Requirements

The AI agent must structure the development process professionally.

### Git Requirements
- Initialize Git repository before coding starts
- Maintain `.gitignore`
- Use semantic commits

Example commit style:
- feat: build homepage hero section
- feat: implement startup tools database schema
- fix: resolve Tap payment callback issue
- refactor: optimize admin dashboard queries
- docs: update setup instructions

### GitHub Requirements
A GitHub repository must contain:

- source code
- README.md
- environment example file
- deployment notes
- setup instructions
- API documentation
- database migration history

### Branch Workflow
Must use:
- `main` → production stable
- `development` → integration branch
- feature branches:
  - `feature/homepage`
  - `feature/portfolio-module`
  - `feature/payment-system`
  - `feature/admin-dashboard`

No direct unstable commits to main branch.

---

## 4. Core System Architecture

The platform consists of three tightly connected systems:

### A. Public Corporate Website
Public branding website for Space Zone Media.

### B. Startup Tools Ecommerce Marketplace
Digital product selling platform.

### C. Admin Dashboard CMS
Private management backend.

---

## 5. User Roles

### Public Visitor
Can:
- browse all public pages
- view services
- view portfolio
- read blogs
- search startup tools
- submit contact forms
- purchase digital tools

### Buyer / Customer
Can:
- purchase startup tools
- receive digital downloads
- receive invoices
- contact support

### Admin
Can:
- login securely
- manage all website content
- manage products
- manage orders
- manage payments
- manage blogs
- manage SEO metadata
- view analytics

---

## 6. Complete Required Public Website Pages

### Homepage
Must include:
- hero banner
- company intro
- featured services
- featured portfolio
- featured startup tools
- testimonials
- CTA banners
- contact strip
- newsletter section

### About Us
- company history
- mission
- vision
- why choose us

### Services Listing
All company services overview.

### Individual Service Detail Pages
For:
- branding
- website development
- digital marketing
- printing
- packaging
- sign boards

Each service page includes:
- description
- workflow
- examples
- inquiry form

### Portfolio Listing
- grid view
- category filters
- search

### Portfolio Detail Page
- project gallery
- project summary
- project tags

### Blog Listing
- article cards
- category filter
- SEO ready URLs

### Blog Detail
- full article
- related posts
- social metadata

### Contact Page
- inquiry form
- phone/email/WhatsApp details
- Google map embed

---

## 7. Startup Tools Marketplace Requirements

### Startup Tools Listing Page
Each product card must display:
- thumbnail
- name
- category
- short summary
- price
- preview button
- buy button

### Product Filtering
- category
- price sort
- search keyword

### Startup Tool Detail Page
Must include:
- title
- screenshots
- detailed description
- benefits
- included files
- instructions
- FAQs

### Cart System
- add to cart
- remove item
- quantity validation if needed

### Checkout System
- customer info form
- order summary
- Tap payment redirect
- payment callback validation

### Payment Success Workflow
After successful payment:
- create order record
- create payment record
- unlock downloadable file
- send invoice email
- send download email

### Payment Failure Workflow
- notify customer
- preserve cart for retry

---

## 8. Admin Dashboard Full Requirements

### Secure Admin Login

### Dashboard Analytics Overview
- total orders
- total products
- total inquiries
- monthly revenue
- traffic summary

### Services Management CRUD

### Portfolio Management CRUD

### Startup Tools Management CRUD
- upload files
- assign prices
- categories
- thumbnails

### Blog Management CRUD

### Orders Management
- order list
- payment status
- resend download

### Contact Messages Inbox

### SEO Metadata Manager
Admin can assign:
- meta title
- meta description
- og image
- slug

---

## 9. Search Engine Optimization Requirements

Every public page must support:

- server-rendered metadata
- SEO titles
- descriptions
- structured headings
- OpenGraph tags
- Twitter card tags
- sitemap.xml
- robots.txt
- schema markup

The AI agent must treat SEO as a core feature, not an afterthought.

---

## 10. Advanced Functional Features

### Global Search
Search across:
- services
- blogs
- portfolio
- startup tools

### WhatsApp Floating Contact

### Newsletter Subscription

### Analytics Tracking
Google Analytics integration.

### Secure File Delivery
Downloadable files must not be publicly exposed by URL.
Access should be generated only after payment verification.

---

## 11. Database Design Requirements (PostgreSQL)

Mandatory tables:

- admins
- customers
- services
- portfolio_projects
- blog_posts
- startup_tools
- tool_categories
- orders
- order_items
- payments
- downloads
- contact_messages
- seo_metadata
- newsletter_subscribers

All relationships must be normalized properly.

---

## 12. API / Backend Requirements

The AI agent must create scalable backend endpoints for:

- contact form submission
- admin authentication
- CRUD operations
- startup tool listing
- checkout processing
- Tap payment callback
- order creation
- secure download generation
- blog management
- search requests

Use RESTful clean endpoint structure.

---

## 13. UI/UX Requirements

Must be:
- modern
- premium corporate look
- smooth transitions
- fully responsive
- SEO friendly HTML structure
- reusable components
- clean typography

Tailwind CSS utility classes must be used professionally.

---

## 14. Security Requirements

Must implement:

- input validation
- server-side sanitization
- protected admin routes
- secure session handling
- SQL injection prevention
- XSS prevention
- hidden secure environment variables
- HTTPS-ready deployment

---

## 15. File and Folder Architecture Requirements

The AI agent must maintain clean scalable architecture:

- `/app`
- `/components`
- `/lib`
- `/services`
- `/prisma`
- `/types`
- `/hooks`
- `/public`
- `/styles`
- `/docs`

Code must be modular and maintainable.

---

## 16. Development Process Requirements

The AI agent must not build randomly.

Development must proceed in phases:

### Phase 1 — Repository Setup + Base Architecture
### Phase 2 — Database Schema + Prisma
### Phase 3 — Public Website UI
### Phase 4 — Startup Tools Marketplace
### Phase 5 — Payment Integration
### Phase 6 — Admin Dashboard
### Phase 7 — SEO + Optimization
### Phase 8 — Testing + Deployment

---

## 17. Documentation Requirements

GitHub repository must include:

- README
- setup guide
- environment variables guide
- Prisma migration guide
- deployment guide
- API route documentation

---

## 18. Final Instruction to AI Agent

This project must be treated as:

> a production-grade commercial SaaS-style corporate platform, not a student demo website.

Every module should be built with scalability, maintainability, and real business usability in mind.

No shortcuts.
No mock-only implementation.
All major modules must be functional and connected.
