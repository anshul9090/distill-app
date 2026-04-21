# 🧪 DISTILL — AI Text Summarizer

> **Summarize anything in seconds.** A full-stack AI-powered summarization platform supporting text, PDFs, URLs, and images — with multi-language output, flashcards, Q&A generation, and more.

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-distill--app-orange?style=for-the-badge&logo=vercel)](https://distill-app-anshul9090s-projects.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple?style=for-the-badge&logo=railway)](https://distill-backend-production.up.railway.app)
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL-green?style=for-the-badge&logo=postgresql)](https://neon.tech)

</div>

---

## 🌐 Live Demo

🔗 **[https://distill-app-anshul9090s-projects.vercel.app](https://distill-app-anshul9090s-projects.vercel.app)**

> Register a free account and start summarizing instantly — no credit card required.

---

## ✨ Features

### Core Summarization
- 📝 **Text** — paste any text and summarize instantly
- 🔗 **URL** — summarize any webpage or article by link
- 📄 **PDF** — upload and extract key points from PDF documents
- 🖼️ **Image** — extract and summarize text from images (OCR)

### Output Formats
- ¶ **Paragraph** — clean prose summary
- • **Bullet Points** — scannable key points
- 🃏 **Flashcards** — flippable study cards for learning
- ❓ **Questions** — exam-style Q&A generation

### Platform Features
- 🌍 **12 Languages** — English, Hindi, Spanish, French, German, Arabic, Chinese, Japanese, Korean, Portuguese, Russian, Italian
- 📥 **PDF Download** — export any summary as a formatted PDF
- 📋 **History** — save and revisit all past summaries
- 🎨 **Multiple Themes** — switchable glassmorphism UI themes
- 👑 **Admin Panel** — user management and platform oversight
- ⚡ **Rate Limiting** — built-in protection against API abuse
- 🔐 **JWT Auth** — secure login with refresh token rotation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                       │
│         Angular 18 SPA — Vercel (Static Hosting)        │
└─────────────────────┬───────────────────────────────────┘
                       │  HTTPS API calls
┌─────────────────────▼───────────────────────────────────┐
│              ASP.NET Core 8 Web API                      │
│                Railway (Cloud Hosting)                   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth Layer │  │ Summary Layer│  │  Admin Layer  │  │
│  │  JWT + OTP  │  │  Groq AI API │  │  User Mgmt   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  Clean Architecture: Domain → Application → Infrastructure│
└─────────────────────┬───────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────┐
│           PostgreSQL — Neon (Serverless Cloud DB)        │
│     Users │ Roles │ Summaries │ RefreshTokens │ OTPs    │
└─────────────────────────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────┐
│                  External Services                       │
│   Groq (Llama 3.3 70B) │ Resend (Email) │ Railway CDN  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Angular 18 | SPA framework |
| Angular Material | UI component library |
| TypeScript | Type-safe development |
| SCSS | Styling with glassmorphism theme |
| Vercel | Static hosting & deployment |

### Backend
| Technology | Purpose |
|---|---|
| ASP.NET Core 8 | REST API framework |
| Entity Framework Core | ORM & database migrations |
| Clean Architecture | Domain / Application / Infrastructure layers |
| JWT Bearer Tokens | Authentication & authorization |
| AspNetCoreRateLimit | IP-based rate limiting |
| iTextSharp | PDF generation |
| Railway | Cloud hosting & deployment |

### Database & Services
| Technology | Purpose |
|---|---|
| PostgreSQL (Neon) | Serverless cloud database |
| Groq API (Llama 3.3 70B) | AI summarization engine |
| Resend | Transactional email service |

---

## 📁 Project Structure

```
distill-backend/
├── GlobalTextSummarizer/          # ASP.NET Core API entry point
│   ├── Controllers/               # Auth, Summary, Admin, OTP
│   ├── Program.cs                 # App configuration & middleware
│   └── appsettings.json           # Config placeholders (no secrets)
│
├── Summarizer.Domain/             # Enterprise business rules
│   └── Entities/                  # User, Role, Summary, OTP, RefreshToken
│
├── Summarizer.Application/        # Application business rules
│   ├── DTOs/                      # Request/Response models
│   └── Interfaces/                # IAuthService, ISummaryService
│
├── Summarizer.Infrastructure/     # Frameworks & drivers
│   ├── Data/                      # DbContext & EF migrations
│   ├── Services/                  # AuthService, GeminiService, OtpService
│   ├── Email/                     # EmailService (Resend API)
│   └── Seed/                      # DatabaseSeeder
│
└── GlobalTextSummarizerUI/        # Angular 18 frontend
    └── src/app/
        ├── pages/                 # Landing, Dashboard, History, Admin, 404
        ├── services/              # Auth, Summary, Theme services
        ├── guards/                # authGuard, adminGuard
        └── components/            # ParticleBackground, shared UI
```

---

## 🚀 Running Locally

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org)
- [PostgreSQL](https://www.postgresql.org) (or use Neon free tier)

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/anshul9090/distill-backend.git
cd distill-backend

# Set up user secrets (never commit these)
cd GlobalTextSummarizer
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-postgres-connection-string"
dotnet user-secrets set "JwtSettings:SecretKey" "your-secret-key-min-32-chars"
dotnet user-secrets set "GroqSettings:ApiKey" "your-groq-api-key"
dotnet user-secrets set "RESEND_API_KEY" "your-resend-api-key"

# Run migrations and start
dotnet ef database update
dotnet run
```

Backend runs on `https://localhost:7001`

### Frontend Setup

```bash
cd GlobalTextSummarizerUI
npm install
ng serve
```

Frontend runs on `http://localhost:4200`

---

## 🔑 Environment Variables

All secrets are stored as environment variables — never hardcoded.

| Variable | Description |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `JwtSettings__SecretKey` | JWT signing key (min 32 chars) |
| `JwtSettings__Issuer` | Token issuer name |
| `JwtSettings__Audience` | Token audience name |
| `JwtSettings__ExpiryMinutes` | Token expiry in minutes |
| `GroqSettings__ApiKey` | Groq AI API key |
| `GroqSettings__Model` | AI model (llama-3.3-70b-versatile) |
| `RESEND_API_KEY` | Resend email API key |

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register       Register new user
POST   /api/auth/login          Login and get JWT
POST   /api/auth/refresh-token  Rotate refresh token
POST   /api/auth/logout         Revoke refresh token
```

### Summarization (🔐 JWT Required)
```
POST   /api/summary/summarize         Summarize text
POST   /api/summary/summarize-url     Summarize webpage
POST   /api/summary/summarize-pdf     Summarize PDF file
POST   /api/summary/summarize-image   Summarize image text
POST   /api/summary/generate-pdf      Export summary as PDF
GET    /api/summary/history           Get user's summary history
```

### Admin (🔐 Admin Role Required)
```
GET    /api/admin/users         List all users
PUT    /api/admin/users/{id}    Update user role/status
DELETE /api/admin/users/{id}    Soft delete user
```

---

## 🔒 Security

- **JWT authentication** on all protected endpoints
- **Refresh token rotation** — old tokens invalidated on each refresh
- **Rate limiting** per IP address:
  - Summarize endpoints: 10 requests/minute
  - Login: 5 attempts/minute
  - OTP send: 3 requests/5 minutes
- **CORS** restricted to production frontend URL only
- **Soft deletes** — user data never permanently removed
- **No secrets in codebase** — all credentials via environment variables

---

## 👨‍💻 Author

**Anshul Semwal**
BCA Final Year Student

[![GitHub](https://img.shields.io/badge/GitHub-anshul9090-black?style=flat&logo=github)](https://github.com/anshul9090)

---

## 📄 License

This project was built as a BCA final year capstone project.

---

<div align="center">
  <sub>Built with ❤️ using Angular 18 + ASP.NET Core 8 + Llama 3.3 70B</sub>
</div>
