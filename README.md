# College Timetable Generator

AI-powered timetable generator for college with four roles: **Super Admin**, **Admin**, **Faculty**, and **Student**.

## Tech stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Prisma** + **SQLite**
- **NextAuth.js** (credentials)
- **jsPDF** for timetable PDF download

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Database**

   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

3. **Environment**

   Create `.env` and add:

   ```env
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

   Generate a secret: `openssl rand -base64 32`

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo accounts (after seed)

| Role        | Email                  | Password  |
|------------|------------------------|-----------|
| Super Admin| superadmin@college.edu | password  |
| Admin (CSE)| admin1@college.edu     | password  |
| Admin (ECE)| admin2@college.edu     | password  |
| Faculty    | faculty1@college.edu   | password  |
| Student Y1 | student1@college.edu   | password  |
| Student Y2 | student2@college.edu   | password  |

## Features by role

### Super Admin

- View total faculties and rooms (available/used)
- View all departments with faculties and rooms
- Receive and approve/reject room requests from departments (use another department’s room)

### Admin (per department)

- Generate timetable for all 4 years (AI-assisted)
- Manually edit generated timetable (subject per slot)
- Publish/unpublish timetable (students see only published)
- Request room from another department (sent to Super Admin)
- View and approve/reject faculty preferred timeslot requests

### Faculty

- Request preferred timeslot to admin
- View assigned timetable and download PDF

### Student

- View department timetable for their year (published only)
- Download timetable PDF

## Project structure

- `src/app/` — App Router pages and API routes
- `src/app/super-admin/` — Super Admin dashboard, departments, room requests
- `src/app/admin/` — Admin dashboard, timetable, room request, faculty requests
- `src/app/faculty/` — Faculty timetable, request slot
- `src/app/student/` — Student timetable
- `src/components/` — UI components and dashboard sidebar
- `src/lib/` — Auth, Prisma client, timetable generator, utils
- `prisma/` — Schema and seed
