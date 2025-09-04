# Khelset Admin Dashboard

> A professional cricket scoring and event management platform built with React, TypeScript, and Firebase.

[![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange.svg)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.0.4-yellow.svg)](https://vitejs.dev/)

## 🏆 Overview

Khelset Admin Dashboard is a comprehensive cricket management platform designed for organizing and scoring cricket matches. Built with modern web technologies, it provides real-time scoring, event management, and team administration capabilities.

**Live Demo**: [https://khelset-new.web.app](https://khelset-new.web.app)

## ✨ Features

### 🏏 Cricket Scoring System
- **Ball-by-ball scoring** with comprehensive cricket rules implementation
- **Real-time commentary generation** for each delivery
- **Enhanced extras handling** (wides, no-balls, byes, leg-byes)
- **Wicket tracking** with detailed dismissal information
- **Over management** with proper six-ball over system
- **Innings break management** with target calculations
- **Match summary** with detailed statistics

### 📱 Authentication & Security
- **Phone-based OTP authentication** using Firebase Auth
- **Secure user sessions** with automatic token refresh
- **Role-based access control** for event management
- **Protected routes** ensuring authenticated access

### 🎯 Event Management
- **Event creation** with custom rules and formats
- **Poster upload** with Firebase Storage integration
- **Event-based cricket rules** with fallback to defaults
- **Match scheduling** and team assignment
- **Event ownership** and permission management

### 👥 Team Management
- **Player roster management** with detailed profiles
- **Team creation** and editing capabilities
- **Player statistics** tracking across matches
- **Team performance analytics**

### 🎨 User Experience
- **Responsive design** optimized for all devices
- **Modern UI** with Tailwind CSS styling
- **Real-time updates** using Firebase Firestore
- **Intuitive navigation** with React Router
- **Performance optimized** with Vite build system

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.0.4** - Fast build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **React Router DOM 7.7.1** - Client-side routing

### Backend & Services
- **Firebase 11.10.0** - Complete backend solution
  - **Firestore** - Real-time NoSQL database
  - **Authentication** - Phone-based OTP system
  - **Storage** - File upload and management
  - **Hosting** - Static site deployment
- **Firebase Admin SDK** - Server-side operations

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Quick Start

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- Firebase project with enabled services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sanjayabhattarai/khelset-react-admin.git
   cd khelset-react-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   ```bash
   # Create .env file with Firebase configuration
   cp .env.example .env
   ```
   
   Add your Firebase configuration to `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed database with sample data |

## 🏗️ Project Structure

```
src/
├── api/                    # Firebase configuration
├── assets/                 # Static assets
├── components/             # Reusable UI components
├── features/              # Feature-based modules
│   ├── auth/              # Authentication components
│   ├── events/            # Event management
│   └── scoring/           # Cricket scoring system
│       └── cricket/       # Cricket-specific logic
│           ├── components/   # Scoring UI components
│           ├── constants/    # Cricket constants
│           ├── hooks/        # Custom React hooks
│           ├── logic/        # Business logic
│           ├── services/     # Firebase services
│           ├── types/        # TypeScript definitions
│           └── utils/        # Utility functions
├── hooks/                 # Global React hooks
├── pages/                 # Page components
└── main.tsx              # Application entry point
```



## 📖 API Documentation

### Cricket Scoring API

The application includes comprehensive cricket scoring logic:

#### Key Functions
- `addDeliveryToInningsArray()` - Process scoring deliveries
- `calculateOverRuns()` - Calculate runs per over
- `generateCommentary()` - Auto-generate ball commentary
- `handleWicket()` - Process wicket scenarios
- `calculateTarget()` - Determine chase targets

#### Data Models
```typescript
interface Match {
  id: string;
  teams: Team[];
  innings: Innings[];
  rules: CricketRules;
  status: MatchStatus;
}

interface Delivery {
  runs: number;
  extras?: Extra;
  wicket?: Wicket;
  commentary: string;
}
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure code passes ESLint

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for backend services
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for build tooling



## 🗺️ Roadmap

- [ ] **Mobile App** - React Native version
- [ ] **Advanced Analytics** - Match statistics and insights
- [ ] **Tournament Management** - Multi-match tournament system
- [ ] **Live Streaming Integration** - Real-time match broadcasting
- [ ] **Multi-sport Support** - Support for other sports

---

**Made with ❤️ for cricket enthusiasts**
- **Intuitive navigation** with React Router
- **Performance optimized** with Vite build system
- 📊 **Real-time Updates** - Live scoring with Firestore
- 📱 **Responsive Design** - Mobile-friendly interface
