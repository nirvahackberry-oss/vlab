# Vlab Enterprise Dashboard

A premium, modern infrastructure management dashboard built with React 19, Material UI, and Tailwind CSS 4. This project is designed to interface with a cloud virtualization backend.

## 🚀 Tech Stack

- **Frontend Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4 & Material UI (MUI) 6
- **State Management**: Zustand
- **Animations**: Motion (Framer Motion)
- **Icons**: React Icons (Material Design / Lucide)
- **Editor**: Monaco Editor (@monaco-editor/react)

## 📂 Project Structure

- `src/components`: Reusable UI components (Header, Sidebar, etc.)
- `src/pages`: Main application views (Dashboard, Compute, Identity, etc.)
- `src/services`: API abstraction layer (follows a mock-first approach)
- `src/lib`: Core utilities (API client, etc.)
- `src/config`: Application configuration and environment handling
- `src/constants`: Static data and mock payloads

## 🛠️ Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Copy `.env.example` to `.env` and configure your API base URL.
   ```bash
   cp .env.example .env
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## 🔌 Backend Integration

The project uses a centralized `apiRequest` utility in `src/lib/apiClient.js`. 
All services in `src/services/` are equipped with a `useMockApi` toggle (controlled via `VITE_USE_MOCK_API` in `.env`).

To connect your real backend:
1. Set `VITE_USE_MOCK_API=false` in your `.env`.
2. Update `VITE_API_BASE_URL` to point to your API endpoint.
3. Ensure your backend implements the endpoints documented in `BACKEND_INTEGRATION.md`.

## 📝 Notes for Backend Developers

- **Authentication**: The UI currently uses a placeholder `userId`. Integrate your Auth provider (JWT/OAuth) in `src/services/authService.js`.
- **WebSocket**: Terminal and IDE features expect a WebSocket connection. Check `src/services/ideService.js` for the `connectTerminalStream` implementation.
- **CORS**: Ensure your backend has CORS enabled for the frontend origin.

---
Created by Hackberry Softech.
