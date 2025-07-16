// src/pages/LoginPage.tsx

import { LoginForm } from '../features/auth/LoginForm'; // We will import the form component

export function LoginPage() {
  // This page component's only job is to provide the layout and display the form.
  return (
    <div className="flex items-center justify-center h-screen bg-gray-800">
      <LoginForm />
    </div>
  );
}
