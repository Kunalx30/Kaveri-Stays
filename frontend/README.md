# Kaveri Stays — Frontend (Phase F1 Foundation)

React frontend for the Kaveri Stays Hotel Booking and Property Management System, built with **React**, **Vite**, **React Router DOM**, **Axios**, and **Tailwind CSS**.

---

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js        # Centralized Axios client (baseURL from VITE_API_BASE_URL)
│   ├── components/
│   │   └── common/
│   │       ├── Navbar.jsx   # Top navigation header
│   │       └── Footer.jsx   # Application footer
│   ├── layouts/
│   │   └── MainLayout.jsx   # Shared layout wrapper
│   ├── pages/
│   │   ├── Home.jsx         # Landing page with live backend health verification
│   │   └── NotFound.jsx     # 404 Fallback page
│   ├── routes/
│   │   └── AppRoutes.jsx    # React Router route definitions
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React Context providers
│   ├── utils/               # Formatting and utility helpers
│   ├── App.jsx              # Application root component
│   ├── index.css            # Tailwind directives and custom styles
│   └── main.jsx             # React DOM entrypoint
├── .env.example             # Environment variable template
├── .env                     # Local environment settings
├── package.json
└── vite.config.js
```

---

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `.env` based on `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The compiled output is located in `dist/`.
