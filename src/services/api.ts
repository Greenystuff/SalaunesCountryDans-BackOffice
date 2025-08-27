import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

// Types pour les réponses de l'API
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    lastLogin: string
  }
  token: string
  expiresIn: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  lastLogin: string
  createdAt?: string
  updatedAt?: string
}

class ApiService {
  private api: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Intercepteur pour ajouter le token à chaque requête
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Intercepteur pour gérer les erreurs de réponse
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  // Méthode pour faire des requêtes GET
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Méthode pour faire des requêtes POST
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      // Si c'est un FormData, ne pas définir le Content-Type
      const config =
        data instanceof FormData
          ? {
              headers: {
                'Content-Type': undefined, // Laisser Axios définir automatiquement
              },
            }
          : {}

      const response = await this.api.post<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Méthode pour faire des requêtes PUT
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Méthode pour faire des requêtes DELETE
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Gestion des erreurs
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message)
    }
    if (error.message) {
      return new Error(error.message)
    }
    return new Error("Une erreur inattendue s'est produite")
  }
}

// Instance singleton du service API
export const apiService = new ApiService()

// Méthodes spécifiques pour l'authentification
export const authService = {
  // Connexion
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/admin/login', { email, password })
  },

  // Déconnexion
  async logout(): Promise<ApiResponse> {
    return apiService.post('/admin/logout')
  },

  // Récupérer le profil utilisateur
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return apiService.get<{ user: User }>('/admin/profile')
  },

  // Rafraîchir le token
  async refreshToken(): Promise<ApiResponse<{ token: string; expiresIn: string }>> {
    return apiService.post<{ token: string; expiresIn: string }>('/admin/refresh-token')
  },
}
