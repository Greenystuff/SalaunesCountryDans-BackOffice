export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
  permissions?: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreatePayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  permissions: string[];
}

export interface UserUpdatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface PasswordResetPayload {
  newPassword: string;
}
