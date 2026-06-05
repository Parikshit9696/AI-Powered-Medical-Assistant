# ⚕️ MedAssist AI — MERN Stack AI Medical Assistant

A full-stack AI-powered medical assistant built with **MongoDB, Express, React, Node.js** and integrated with **Claude AI (Anthropic)**.

---

## 🌟 Features

- **AI Medical Chat** — Real-time conversations with Claude AI for health guidance
- **Personalized Advice** — AI uses your medical profile (age, conditions, medications, allergies)
- **Symptom Tracker** — Log symptoms with severity tracking and AI analysis
- **Chat History** — All consultations saved and searchable
- **User Profiles** — Store blood group, allergies, existing conditions, medications
- **JWT Authentication** — Secure login/register system
- **Rate Limiting** — Prevents API abuse
- **Emergency Warnings** — Immediate emergency service redirection

---

## 🏗️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6, Axios    |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose                  |
| AI Engine  | Anthropic Claude (claude-sonnet-4)  |
| Auth       | JWT + bcryptjs                      |
| Styling    | Custom CSS (no UI framework)        |

---

## 📁 Project Structure

```
ai-medical-assistant/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema with medical profile
│   │   ├── ChatSession.js   # Chat session + messages
│   │   └── SymptomLog.js    # Symptom tracking
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Me
│   │   ├── chat.js          # AI chat with Claude
│   │   ├── user.js          # Profile management
│   │   └── symptoms.js      # Symptom logging + AI analysis
│   ├── middleware/
│   │   └── auth.js          # JWT protection middleware
│   ├── server.js            # Express app entry point
│   ├── .env.example         # Environment variables template
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── context/
│       │   └── AuthContext.js    # Global auth state
│       ├── components/
│       │   └── Layout.js         # Sidebar layout
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js      # Overview + quick actions
│       │   ├── Chat.js           # AI chat interface
│       │   ├── SymptomTracker.js # Log & view symptoms
│       │   └── Profile.js        # Medical profile editor
│       ├── App.js                # Routing setup
│       ├── App.css               # All styles
│       └── index.js
└── package.json                  # Root (runs both servers)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+
- **MongoDB** (local or MongoDB Atlas)
- **Anthropic API Key** — Get at https://console.anthropic.com

### 2. Clone & Install

```bash
# Install all dependencies at once
npm run install-all
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-medical-assistant
JWT_SECRET=your_very_secret_key_change_this
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=development
```

### 4. Start Development Servers

```bash
# From root — starts both backend and frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint             | Description        |
|--------|---------------------|--------------------|
| POST   | /api/auth/register  | Create account     |
| POST   | /api/auth/login     | Login              |
| GET    | /api/auth/me        | Get current user   |

### Chat (Protected)
| Method | Endpoint                  | Description              |
|--------|--------------------------|--------------------------|
| POST   | /api/chat/session         | Create new chat session  |
| GET    | /api/chat/sessions        | List all sessions        |
| GET    | /api/chat/session/:id     | Get session + messages   |
| POST   | /api/chat/message         | Send message to AI       |
| DELETE | /api/chat/session/:id     | Archive session          |

### User (Protected)
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/user/profile           | Get user profile      |
| PUT    | /api/user/profile           | Update profile        |
| PUT    | /api/user/change-password   | Change password       |

### Symptoms (Protected)
| Method | Endpoint                  | Description              |
|--------|--------------------------|--------------------------|
| POST   | /api/symptoms/log         | Log symptoms + AI analyze|
| GET    | /api/symptoms/logs        | Get symptom history      |
| DELETE | /api/symptoms/log/:id     | Delete a log entry       |

---

## 🛡️ Security Features

- Password hashing with bcryptjs (salt rounds: 12)
- JWT tokens (7-day expiry)
- Helmet.js for HTTP security headers
- Rate limiting (100 req/15min general, 20 req/min for AI)
- Input validation with express-validator
- CORS configured

---

## ⚠️ Medical Disclaimer

This application provides **general health information only** and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions. In case of emergency, call **112** (India) or your local emergency number immediately.

---

## 🧪 Sample Test Flow

1. Register at http://localhost:3000/register
2. Complete your medical profile (age, conditions, blood group)
3. Start an AI consultation — ask about symptoms
4. Log today's symptoms in the Symptom Tracker
5. Check your Dashboard for an overview

---

## 📦 Deployment

### Backend (Railway / Render / EC2)
```bash
cd backend
npm start
```
Set all `.env` variables in your hosting platform.

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
```
Set `REACT_APP_API_URL` or configure proxy for production.

---

Made with ❤️ using MERN Stack 
