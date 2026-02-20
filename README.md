# A Next.js 16 fullstack starter template for busy devs

This repository includes a Next.js app, TailwindCSS + shadcn/ui for styling and UI components, Prisma for the database layer, oRPC + Tanstack Query for API implementation, Better-Auth for authentication, Arcjet for security, and more.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

### ❕Prerequisites

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/chef0111/dev4room.git
cd dev4room
```

**Installation**

Install the project dependencies using bun:

```bash
# Install bun if not installed
curl -fsSL https://bun.sh/install | bash        # Linux & macOS
powershell -c "irm bun.sh/install.ps1 | iex"    # Windows

# Install dependencies
bun install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
NEXT_PUBLIC_APP_URL=

# Better-Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Resend
RESEND_API_KEY=

# Database
DATABASE_URL=

# Arcjet
ARCJET_KEY=

```

Replace the placeholder values with your actual credentials. You can obtain these credentials by signing up on the respective websites.

## 🗄️ <a name="database-setup">Database Setup</a>

This project uses PostgreSQL hosted on Neon for the database, with Prisma ORM for schema management.

**Generate Prisma Client**

- Run the following command to generate the Prisma client:

```bash
bunx prisma generate
```

**Run Database Migrations**

- To apply the database schema defined in `prisma/schema.prisma`, run the following command (only run when there're new changes made to the schema):

```bash
bunx prisma db push
```

This will create the necessary tables and indexes in your Neon database.

## <a name="run-project">👨‍💻 Run the Project</a>

Run the development server with the following command:

```bash
bun run dev
```

Or run the production build with:

```bash
bun run next
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

---

🚀 Happy coding!
