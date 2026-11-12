# GlowByYou

A full-stack beauty and skincare store: a Next.js storefront backed by a Django REST API, with JWT authentication, PostgreSQL, and one-click deployment to Render.

## Overview

GlowByYou is a complete online store for skincare, perfumes, lipsticks and makeup kits. Shoppers can browse and filter the catalog, read and write reviews, save a wishlist, apply promo codes, and check out as a guest or with an account. They can then follow the order through its status timeline, or cancel it.

It covers the parts a real store needs and a front-end demo usually skips:

- **Trustworthy pricing.** The server works out every total (subtotal, coupon, shipping, tax) from database prices, so a tampered request can't change what a customer pays.
- **Inventory.** Stock is checked and decremented inside a database transaction with row locks, so two shoppers can't buy the last item at the same time. Cancelling an order puts the stock back.
- **Accounts.** Email and password sign-in with short-lived JWT access tokens, rotating refresh tokens, and real logout through a token blacklist.
- **Operations.** Staff manage products, stock, orders, coupons, reviews, testimonials and messages in the Django admin.

## Live Demo

Once the Render Blueprint (`render.yaml`) is deployed, the app runs at:

| Service | URL |
| --- | --- |
| Storefront | https://glambyyou-web.onrender.com |
| API | https://glambyyou-api.onrender.com/api/ |
| Swagger docs | https://glambyyou-api.onrender.com/api/docs/ |
| Admin | https://glambyyou-api.onrender.com/admin/ |

> Free Render instances go to sleep when idle, so the first request after a while can take about 30–60 seconds.

**Demo promo codes:** `WELCOME10` (10% off), `GLOW20` (20% off orders over $100), `SAVE15` ($15 off orders over $75).
**Test card:** `4242 4242 4242 4242`, any future expiry date, any CVC.

## Screenshots

Put screenshots in `docs/screenshots/` using these names:

| Page | File |
| --- | --- |
| Home | `docs/screenshots/home.png` |
| Shop with filters | `docs/screenshots/shop.png` |
| Product detail and reviews | `docs/screenshots/product.png` |
| Checkout with promo code | `docs/screenshots/checkout.png` |
| Account and order history | `docs/screenshots/account.png` |
| Swagger API docs | `docs/screenshots/swagger.png` |

## Features

**Shopping**
- Catalog of 60 products in 4 categories, with filters for category, brand, price range, skin type and sale, plus sorting (featured, price, rating, newest)
- Instant search across names, descriptions, brands, categories and ingredients
- Product pages with an image gallery and zoom, ingredients, benefits, usage, live stock ("Only 3 left"), out-of-stock handling and related products
- Customer reviews with star ratings and a "Verified purchase" badge, limited to one review per customer per product
- Cart drawer and cart page, with quantities capped at the available stock
- Wishlist that saves to the account when signed in, and merges any guest wishlist on login

**Checkout and orders**
- Three-step checkout: shipping, then payment, then review
- Promo codes checked on the server (active dates, usage limits, minimum order)
- Free shipping over $50, flat $5.99 below that, plus estimated tax
- Card payment (test mode, with card-number and expiry checks in the browser) or pay on delivery
- Guest checkout, and guest order tracking by order number and email
- Order history, order detail with a status timeline, and cancellation with automatic restocking and refund status

**Accounts**
- Sign-up and sign-in with JWT, silent token refresh, and logout that blacklists the refresh token
- Profile editing, password change, and an address book with a default address that pre-fills checkout

**Marketing and support**
- Newsletter sign-up, published testimonials, and a contact form

**Admin (Django admin)**
- Products with inline images, editable price and stock, and filters
- Orders with status updates, plus coupons, reviews, subscribers and contact messages

## Technology Stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 6, Tailwind CSS 4, Axios
- **Backend:** Python 3.14, Django 6.1, Django REST Framework 3.18, SimpleJWT (with token blacklist), django-filter, django-cors-headers, drf-spectacular (OpenAPI), WhiteNoise, Gunicorn
- **Database:** PostgreSQL in production (via `DATABASE_URL`), SQLite for quick local setup
- **Testing:** Django `APITestCase` (40 API tests), TypeScript type-checking, ESLint (`eslint-config-next`)
- **Deployment:** Render Blueprint: managed PostgreSQL, a Python web service for the API, and a Node web service for the storefront

## Architecture

```
┌──────────────────────┐   HTTPS + JSON (Axios)   ┌───────────────────────────┐   SQL   ┌──────────────┐
│  Next.js storefront  │ ───────────────────────▶ │   Django REST API         │ ──────▶ │  PostgreSQL  │
│  (frontend/)         │  Authorization: Bearer   │   (backend/)              │         │              │
│                      │ ◀─────────────────────── │   accounts · catalog ·    │ ◀────── │              │
│  cart + tokens in    │   JSON / DRF errors      │   orders · marketing      │         └──────────────┘
│  localStorage        │                          │   Django admin, Swagger   │
└──────────────────────┘                          └───────────────────────────┘
```

- The **frontend** is a Next.js app. All API calls go through one Axios instance (`frontend/src/lib/api.ts`). Its request interceptor adds the JWT access token. Its response interceptor catches `401` errors, refreshes the token once (several failing requests share the same refresh), and retries the request. If the refresh fails, it signs the user out.
- Global state (cart, wishlist, session, toasts) lives in a React context (`frontend/src/lib/store.tsx`). The cart is kept in `localStorage`. The server re-prices it at checkout.
- The **backend** is a Django project (`backend/config`) with four apps:
  - `accounts`: custom email-based user, addresses, and the JWT endpoints
  - `catalog`: categories, products, skin types, images, reviews and wishlists
  - `orders`: coupons, orders, order items, and pricing logic in `orders/pricing.py`
  - `marketing`: newsletter, testimonials and contact messages
- CORS only allows the storefront's origin. In production, WhiteNoise serves the admin's static files and Gunicorn serves the app.

## Installation

### Prerequisites
- Python 3.12 or newer (3.14 recommended)
- Node.js 22 or newer
- PostgreSQL 15 or newer (optional for local development, since SQLite is the default)

### Backend Setup
1. Clone the repository.
   ```bash
   git clone https://github.com/hillaryessien18-droid/glambyyou.git
   cd glambyyou/backend
   ```
2. Create a virtual environment.
   ```bash
   python -m venv .venv
   # Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
   ```
3. Install dependencies.
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables.
   ```bash
   cp .env.example .env
   ```
   Edit `.env`. To use PostgreSQL, set `DATABASE_URL=postgres://user:password@localhost:5432/glambyyou`. If you leave it unset, the app uses SQLite.
5. Run database migrations and load the catalog, testimonials and demo coupons.
   ```bash
   python manage.py migrate
   python manage.py seed
   python manage.py createsuperuser   # for /admin
   ```
6. Start the backend server.
   ```bash
   python manage.py runserver
   ```
   The API is now at http://localhost:8000/api/.

### Frontend Setup
1. Install dependencies.
   ```bash
   cd ../frontend
   npm install
   ```
2. Configure the API URL. Create `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
3. Start the development server.
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

### Deploying to Render
1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render reads `render.yaml` and creates the database, the API and the storefront.
3. The API build (`backend/build.sh`) installs dependencies, collects static files, runs migrations and seeds the catalog. `SECRET_KEY` is generated for you.
4. If you rename the services, update `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` and `NEXT_PUBLIC_API_URL` to match.
5. To create an admin user, open a Shell on the API service and run `python manage.py createsuperuser`.

## API Documentation

The API describes itself with OpenAPI 3:

- **Swagger UI:** `/api/docs/` (local: http://localhost:8000/api/docs/)
- **ReDoc:** `/api/redoc/`
- **Raw schema:** `/api/schema/`

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/token/refresh/`, `POST /api/auth/logout/`, `GET/PATCH /api/auth/me/`, `POST /api/auth/change-password/`, CRUD `/api/auth/addresses/` |
| Catalog | `GET /api/products/` (filters: `category`, `brand`, `minPrice`, `maxPrice`, `skinType`, `sale`, `bestSeller`, `new`, `inStock`, `search`, `sort`, `page`, `limit`), `GET /api/products/{slug}/`, `GET /api/products/{slug}/related/`, `GET/POST /api/products/{slug}/reviews/`, `DELETE /api/reviews/{id}/`, `GET /api/categories/`, `GET /api/brands/` |
| Wishlist | `GET/POST /api/wishlist/`, `DELETE /api/wishlist/{productId}/` |
| Orders | `POST /api/orders/quote/`, `POST /api/orders/`, `GET /api/orders/`, `GET /api/orders/{orderNumber}/`, `POST /api/orders/{orderNumber}/cancel/`, `GET /api/orders/track/?orderNumber=&email=` |
| Marketing | `POST /api/newsletter/`, `GET /api/testimonials/`, `POST /api/contact/` |
| Health | `GET /api/health/` |

## Database Design

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `accounts_user` | Customer and staff accounts; the email is the login | — |
| `accounts_address` | Saved shipping addresses, one default per user | many → 1 `user` |
| `catalog_category` | Skincare, Perfumes, Lipsticks, Makeup Kits | — |
| `catalog_product` | Name, slug, price, original price, stock, brand, flags, rating summary | many → 1 `category`; many ↔ many `skintype` |
| `catalog_skintype` | Oily, Dry, Sensitive, … | many ↔ many `product` |
| `catalog_productimage` | Ordered gallery images | many → 1 `product` |
| `catalog_review` | 1–5 star review with verified-purchase flag | many → 1 `product`, many → 1 `user`; unique (product, user) |
| `catalog_wishlistitem` | Saved products | many → 1 `user`, many → 1 `product`; unique (user, product) |
| `orders_coupon` | Percent or fixed discount, minimum order, validity window, usage limit | — |
| `orders_order` | Order number, status, payment status, snapshot of the shipping address, totals | many → 1 `user` (nullable for guests), many → 1 `coupon` |
| `orders_orderitem` | Line item with a snapshot of the product name, image and price | many → 1 `order`, many → 1 `product` (set to null if the product is deleted) |
| `marketing_newslettersubscriber` / `marketing_testimonial` / `marketing_contactmessage` | Marketing and support data | — |
| `token_blacklist_*` | Outstanding and blacklisted JWT refresh tokens (SimpleJWT) | many → 1 `user` |

Orders store a copy of the address and product details. Later edits to an address or a product therefore never change past orders. A product's rating blends the imported ratings with reviews written on the site, and is recalculated whenever a review is added or deleted.

## Testing

**Backend.** 40 API tests cover authentication, token rotation and blacklisting, addresses, catalog filters and sorting, reviews and ratings, the wishlist, pricing, coupons, stock locking, guest checkout, cancellation and marketing endpoints:
```bash
cd backend
python manage.py test
# to also fail on any deprecated API:
python -W error::DeprecationWarning manage.py test
```

**Frontend.** Type-checking, lint and production build:
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

## Security

- **Authentication:** JWT through SimpleJWT. Access tokens last 30 minutes and refresh tokens 7 days (both configurable). Refresh tokens rotate, and the old one is blacklisted on rotation and on logout. Passwords are hashed with Django's PBKDF2 and checked by Django's password validators (minimum length, common-password and numeric-only checks, similarity to the user's details).
- **Authorization:** The API defaults to `IsAuthenticatedOrReadOnly`. Orders, addresses, the wishlist and review deletion are scoped to `request.user`, so users can't read or change each other's data. Guest order lookup needs both the order number and the matching email. Catalog writes are only possible through the staff-only Django admin.
- **Validation:** DRF serializers validate every input: email format, rating range, quantities from 1 to 20, a fixed list of countries, coupon rules, and stock levels. Prices from the client are ignored. Card numbers are checked in the browser and never sent to the server.
- **Abuse protection:** Rate limits apply to anonymous users, signed-in users, and auth-sensitive endpoints (login, register, order tracking, newsletter, contact).
- **Transport and headers:** In production, Django forces HTTPS with HSTS, secure cookies and `nosniff`. CORS and CSRF only trust the storefront origin. The storefront sends `X-Frame-Options: DENY`, `nosniff` and a strict referrer policy.
- **Secrets:** All secrets come from environment variables. `.env` files are git-ignored, and Render generates `SECRET_KEY`.

## Future Improvements

- Real payments with Stripe (Payment Intents and webhooks) in place of test mode
- Transactional email for order confirmation, shipping updates and password reset
- Product images uploaded to cloud storage (S3 or Cloudinary) from the admin
- Server-side rendering of product pages for SEO and faster first load
- Admin sales dashboard: revenue, top products, low-stock alerts
- End-to-end tests with Playwright, and CI with GitHub Actions
- Product variants (shade, size) and per-variant stock

## Author

**Hillary Essien** — [github.com/hillaryessien18-droid](https://github.com/hillaryessien18-droid)
