# 🚀 UNOGROUP Sales Management - Next.js

ระบบจัดการการขายและคะแนน UNOGROUP ที่พัฒนาใหม่ด้วย Next.js 14

## ✨ Features

- 📊 Dashboard แสดงคะแนนรายเดือน/ไตรมาส/ปี
- 👥 ระบบ Authentication ด้วย NextAuth.js
- 📈 รายงานการขายแบบ Real-time
- 💰 ระบบคำนวณ Commission
- 📋 Price List
- 📱 Responsive Design
- ⚡ Fast Performance ด้วย Server Components

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Prisma | ORM for MSSQL |
| NextAuth.js | Authentication |
| React Query | Data Fetching |
| Framer Motion | Animations |
| Recharts | Charts |

## 📦 Installation

### 1. Clone และ Install

```bash
# Clone โปรเจกต์
git clone <repository-url>
cd unogroup-nextjs

# Install dependencies
npm install
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# แก้ไข .env ตามการตั้งค่าของคุณ
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Run Development

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Login page
├── components/            # React Components
│   ├── ui/               # UI Components (Button, Card, etc.)
│   ├── layout/           # Layout Components
│   ├── dashboard/        # Dashboard Components
│   └── tables/           # Table Components
├── lib/                   # Utilities
│   ├── db.ts             # Prisma Client
│   ├── auth.ts           # NextAuth Config
│   ├── utils.ts          # Helper Functions
│   └── quarter.ts        # Quarter Calculations
├── hooks/                 # Custom Hooks
└── types/                 # TypeScript Types
```

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## 🔐 Environment Variables

```env
# Database
DATABASE_URL="sqlserver://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

## 📄 License

Private - UNOGROUP

## 👨‍💻 Author

Developed with ❤️ by UNOGROUP Team
