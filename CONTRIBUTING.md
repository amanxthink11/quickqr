# Contributing to QuickQR

Thank you for your interest in contributing to QuickQR! We welcome bug reports, feature proposals, documentation improvements, and pull requests from developers worldwide.

QuickQR is an open-source QR code infrastructure platform built with Next.js 16, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please maintain a respectful, welcoming, and collaborative environment.

---

## Getting Started

### Prerequisites

- **Node.js**: v22 LTS or higher (`node -v`)
- **npm**: v10 or higher (`npm -v`)
- **PostgreSQL**: v15 or higher (running locally or via Docker/remote host)
- **Git**

### 1. Fork & Clone

Fork the repository on GitHub to your account, then clone it locally:

```bash
git clone https://github.com/<your-username>/quickqr.git
cd quickqr
```

### 2. Install Dependencies

Install project dependencies using clean install:

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure your local database URL and secrets in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/quickqr?schema=public"
APP_SECRET="replace-with-a-secure-random-64-character-hex-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_QR_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Database Setup & Migrations

Run Prisma migrations to create the required database tables:

```bash
npx prisma migrate dev
```

Generate the Prisma client:

```bash
npx prisma generate
```

### 5. Build Widget Bundle

Build the client-side remote website QR widget bundle (`public/widget.js`):

```bash
npm run build:widget
```

### 6. Start the Development Server

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Quality Standards

Before submitting any Pull Request, ensure that all automated checks pass locally:

### Run Unit & Integration Tests

```bash
npm test
```

### Run Static Linting

```bash
npm run lint
```

### Validate Prisma Schema

```bash
npx prisma validate
```

### Verify Production Build

```bash
npm run build
```

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/clarification`
2. **Atomic Commits**: Keep commits focused and provide clear, descriptive commit messages following the Conventional Commits specification (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`).
3. **Tests**: Include unit and integration tests covering new logic or bug fixes in the `tests/` directory.
4. **No Secrets**: Never commit `.env` files, credentials, private keys, or API tokens.
5. **PR Description**: Use the provided pull request template to describe your changes, the rationale, and testing evidence.
