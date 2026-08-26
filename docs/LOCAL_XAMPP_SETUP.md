# XAMPP local development (MySQL + php artisan serve)

## 1. Start XAMPP
- Start **Apache** (optional) and **MySQL** from the XAMPP Control Panel.

## 2. Create database
In phpMyAdmin or MySQL CLI:

```sql
CREATE DATABASE IF NOT EXISTS skuggle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Backend (needs PHP **8.3+**, not XAMPP's bundled 8.2)
```powershell
cd C:\Skuggle\backend
composer install
# Prefer PHP 8.3 CLI if XAMPP is still on 8.2:
#   C:\php83\php.exe artisan migrate:fresh --seed
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

## 4. Frontend
```powershell
cd C:\Skuggle
# copy .env.example to .env if needed (VITE_LIVE_API=true)
npm install
npm run dev
```

Open http://127.0.0.1:3000

## Demo logins (demonstration only)

One seeded school: **Royal Gateway Academy (Demo)** — full walkthrough for every school role. Password for school roles: `SkuggleDemo!2026`.

| Role | Email | What you can showcase |
|------|-------|------------------------|
| School Admin | `admin@royalgateway.edu.ng` | SIS, staff, setup, announcements |
| Principal | `principal@royalgateway.edu.ng` | School pulse, results publish, staff briefing |
| Teacher | `adewale.o@royalgateway.edu.ng` | JSS 2 classes, attendance, scores, library notes |
| Bursar | `bursar@royalgateway.edu.ng` | Fee / payment transactions |
| Examination Officer | `exams@royalgateway.edu.ng` | Assessments created for First Term |
| Parent | `bello.folashade@gmail.com` | Nathan’s attendance, results, teacher message |
| Student | `nathan.bello@student.royalgateway.edu.ng` | Linked student record, results, library |
| Platform Owner | `owner@skuggle.com` | Platform HQ (`SkuggleOwner!2026`) |

Seeded ops data: 9 students, JSS 2 A attendance (10 days), CA/tests/scores, published results, announcements, messages, payments, library resources.
