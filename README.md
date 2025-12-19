# 🧠 NeuroMed

NeuroMed is a full‑stack healthcare platform designed to connect patients with medical professionals, manage appointments, ratings, and health interactions in a modern, scalable way.

The project consists of:
- **Web App** – built with **Next.js**
- **Mobile App** – built with **React Native (Expo)**
- **Backend API** – built with **Node.js, Express, and MongoDB**

---

## ✨ Core Idea

NeuroMed aims to simplify access to healthcare services by providing:
- Easy discovery of medical professionals
- Secure appointment booking (physical appointments supported)
- Ratings & reviews based on completed appointments
- A clean, minimal, and professional user experience

The platform is built with scalability, security, and maintainability in mind.

---

## 🧩 Tech Stack

### Frontend (Web)
- **Next.js** (App Router)
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Axios / Fetch API**

### Frontend (Mobile)
- **React Native**
- **Expo**
- **TypeScript**
- **Expo Router**

### Backend
- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB + Mongoose**
- **JWT Authentication**
- **Helmet, CORS, Cookie‑Parser**

---

## 🔐 Authentication & Security

- JWT‑based authentication
- Role‑based access (User / Professional / Admin)
- Secure HTTP headers using **Helmet**
- Centralized error handling middleware

---

## 📅 Appointments

- Book appointments with medical professionals
- Appointment validation (date, availability, duration)
- Currently supports **physical appointments only**
- Future‑ready for virtual appointments

---

## ⭐ Ratings & Reviews

- Users can rate professionals **only after a valid appointment**
- Prevents duplicate or invalid ratings
- Automated cleanup for invalid or orphaned ratings

---

## 📂 Project Structure (Backend)

```text
src/
├── config/        # Database & environment config
├── controllers/   # Request handlers
├── middlewares/   # Auth, error handling, validation
├── models/        # Mongoose schemas
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Helpers & cleanup scripts
└── server.ts      # App entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 18)
- MongoDB
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Web App Setup

```bash
cd web
npm install
npm run dev
```

### Mobile App Setup

```bash
cd mobile
npm install
npx expo start
```

---

## 🌍 Environment Variables

Example `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

---

## 🧪 Code Quality

- TypeScript strict typing
- ESLint for linting
- Modular and reusable architecture
- Clean separation of concerns

---

## 📈 Future Features

- Virtual (video) appointments
- In‑app chat between patient and professional
- Notifications (email / push)
- Admin analytics dashboard
- Payment integration

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**KAMDILICHUKWU**  
Full‑Stack Developer  

---

> NeuroMed – bridging technology and healthcare with simplicity and trust.

