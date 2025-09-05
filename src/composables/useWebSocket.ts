import { ref, computed, type Ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotifications } from '@/composables/useNotifications'

// Types pour les messages WebSocket
interface WebSocketMessage {
  type: 'notification' | 'dataUpdate' | 'profileUpdate' | 'userActivity' | 'authenticated' | 'pong'
  data: any
  timestamp: string
}

interface NotificationMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  title?: string
}

interface DataUpdateMessage {
  entity: string
  action: 'create' | 'update' | 'delete'
  data: any
}

interface UserActivityMessage {
  userId: string
  action: string
  details?: any
}

// État global du WebSocket
const socket = ref<WebSocket | null>(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const lastError = ref<string | null>(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const reconnectDelay = ref(1000)

// État des connexions
interface SocketState {
  isConnected: Ref<boolean>
  isConnecting: Ref<boolean>
  lastError: Ref<string | null>
  reconnectAttempts: Ref<number>
}

interface WebSocketHooks {
  connect: () => void
  disconnect: () => void
  send: (type: string, data?: any) => void
  on: (eventType: string, callback: (data: any) => void) => void
  off: (eventType: string, callback?: (data: any) => void) => void
  ping: () => void
  requestData: (entity: string) => void
  markUserActive: () => void
  reconnect: () => void
}

// Map pour gérer les callbacks d'événements
const eventCallbacks = new Map<string, Set<(data: any) => void>>()

export function useWebSocket(): SocketState & WebSocketHooks {
  const userStore = useUserStore()
  const notifications = useNotifications()

  // État computed
  const state = computed(
    (): SocketState => ({
      isConnected,
      isConnecting,
      lastError,
      reconnectAttempts,
    }),
  )

  /**
   * Créer une nouvelle connexion WebSocket
   */
  const connect = () => {
    console.log('🚀 Tentative de connexion WebSocket...')

    if (!userStore.token) {
      console.warn('⚠️ Token manquant pour la connexion WebSocket')
      return
    }

    if (socket.value) {
      console.log('🔍 État WebSocket actuel:', {
        readyState: socket.value.readyState,
        CONNECTING: WebSocket.CONNECTING,
        OPEN: WebSocket.OPEN,
        CLOSING: WebSocket.CLOSING,
        CLOSED: WebSocket.CLOSED,
      })

      if (socket.value.readyState === WebSocket.OPEN) {
        console.log('✅ WebSocket déjà connecté, annulation')
        return
      }

      if (socket.value.readyState === WebSocket.CONNECTING) {
        console.log('⏳ WebSocket en cours de connexion, annulation')
        return
      }
    }

    try {
      isConnecting.value = true
      lastError.value = null

      // Configuration WebSocket directe
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:'
      const wsHost = apiUrl.replace(/^https?:\/\//, '')
      const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${userStore.token}`

      socket.value = new WebSocket(wsUrl)

      // Gestionnaire de connexion ouverte
      socket.value.onopen = () => {
        console.log('✅ WebSocket connecté')
        isConnected.value = true
        isConnecting.value = false
        reconnectAttempts.value = 0
        reconnectDelay.value = 1000
      }

      // Gestionnaire de messages
      socket.value.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error)
        }
      }

      // Gestionnaire de fermeture
      socket.value.onclose = (event) => {
        console.log('❌ WebSocket fermé:', event.code, event.reason)
        isConnected.value = false
        isConnecting.value = false

        // Tentative de reconnexion automatique
        if (reconnectAttempts.value < maxReconnectAttempts && !event.wasClean) {
          setTimeout(() => {
            reconnectAttempts.value++
            reconnectDelay.value = Math.min(reconnectDelay.value * 2, 30000) // Max 30s
            console.log(
              `🔄 Tentative de reconnexion ${reconnectAttempts.value}/${maxReconnectAttempts}`,
            )
            connect()
          }, reconnectDelay.value)
        }
      }

      // Gestionnaire d'erreurs
      socket.value.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error)
        isConnecting.value = false
        lastError.value = 'Erreur de connexion WebSocket'
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la connexion WebSocket:', error)
      isConnecting.value = false
      lastError.value = 'Impossible de créer la connexion WebSocket'
    }
  }

  /**
   * Fermer la connexion WebSocket
   */
  const disconnect = () => {
    if (socket.value) {
      socket.value.close(1000, 'Disconnected by user')
      socket.value = null
    }
    isConnected.value = false
    isConnecting.value = false
    eventCallbacks.clear()
  }

  /**
   * Envoyer un message via WebSocket
   */
  const send = (type: string, data?: any) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket non connecté, impossible d'envoyer le message")
      return
    }

    const message = {
      type,
      data: data || {},
      timestamp: new Date().toISOString(),
    }

    socket.value.send(JSON.stringify(message))
  }

  /**
   * Gérer les messages reçus
   */
  const handleMessage = (message: WebSocketMessage) => {
    console.log('📨 Message WebSocket reçu:', message.type, message.data)

    // Déclencher les callbacks spécifiques
    const callbacks = eventCallbacks.get(message.type)
    if (callbacks) {
      callbacks.forEach((callback) => callback(message.data))
    }

    // Gestion des messages système
    switch (message.type) {
      case 'notification':
        const notifData = message.data as NotificationMessage
        notifications.showNotification({
          type: notifData.type,
          message: notifData.title ? `${notifData.title}: ${notifData.message}` : notifData.message,
        })
        break

      case 'profileUpdate':
        if (message.data.user) {
          userStore.updateUser(message.data.user)
          notifications.showNotification({
            type: 'success',
            message: 'Profil mis à jour',
          })
        }
        break

      case 'authenticated':
        // Connexion WebSocket établie - silencieuse pour l'utilisateur
        console.log('✅ WebSocket authentifié:', message.data.message)
        break

      case 'dataUpdate':
        const updateData = message.data as DataUpdateMessage
        notifications.showNotification({
          type: 'info',
          message: `${updateData.entity} ${updateData.action === 'create' ? 'créé' : updateData.action === 'update' ? 'modifié' : 'supprimé'}`,
        })
        break

      case 'userActivity':
        // Les activités utilisateur sont gérées par les callbacks spécifiques
        break

      case 'pong':
        console.log('🏓 Pong reçu')
        break

      default:
        console.log('🔍 Message WebSocket non géré:', message)
    }
  }

  /**
   * S'abonner à un type d'événement
   */
  const on = (eventType: string, callback: (data: any) => void) => {
    if (!eventCallbacks.has(eventType)) {
      eventCallbacks.set(eventType, new Set())
    }
    eventCallbacks.get(eventType)!.add(callback)
  }

  /**
   * Se désabonner d'un type d'événement
   */
  const off = (eventType: string, callback?: (data: any) => void) => {
    const callbacks = eventCallbacks.get(eventType)
    if (callbacks) {
      if (callback) {
        callbacks.delete(callback)
      } else {
        callbacks.clear()
      }
    }
  }

  /**
   * Envoyer un ping
   */
  const ping = () => {
    send('ping')
  }

  /**
   * Demander des données spécifiques
   */
  const requestData = (entity: string) => {
    send('requestData', { entity })
  }

  /**
   * Marquer l'utilisateur comme actif
   */
  const markUserActive = () => {
    send('userActive')
  }

  /**
   * Forcer une reconnexion
   */
  const reconnect = () => {
    disconnect()
    setTimeout(() => {
      reconnectAttempts.value = 0
      connect()
    }, 1000)
  }

  return {
    // État réactif - refs directes pour la réactivité Vue
    isConnected,
    isConnecting,
    lastError,
    reconnectAttempts,

    // Méthodes
    connect,
    disconnect,
    send,
    on,
    off,
    ping,
    requestData,
    markUserActive,
    reconnect,
  }
}

// Instance globale lazy-loaded pour éviter les problèmes d'initialisation
let globalWebSocketInstance: ReturnType<typeof useWebSocket> | null = null

function getGlobalInstance() {
  if (!globalWebSocketInstance) {
    globalWebSocketInstance = useWebSocket()
  }
  return globalWebSocketInstance
}

export const globalWebSocket = {
  // Propriétés réactives avec getter explicite
  get isConnected(): Ref<boolean> {
    return getGlobalInstance().isConnected
  },
  get isConnecting(): Ref<boolean> {
    return getGlobalInstance().isConnecting
  },
  get lastError(): Ref<string | null> {
    return getGlobalInstance().lastError
  },
  get reconnectAttempts(): Ref<number> {
    return getGlobalInstance().reconnectAttempts
  },

  // Méthodes avec contexte correct
  connect() {
    return getGlobalInstance().connect()
  },
  disconnect() {
    return getGlobalInstance().disconnect()
  },
  send(type: string, data?: any) {
    return getGlobalInstance().send(type, data)
  },
  on(eventType: string, callback: (data: any) => void) {
    return getGlobalInstance().on(eventType, callback)
  },
  off(eventType: string, callback?: (data: any) => void) {
    return getGlobalInstance().off(eventType, callback)
  },
  ping() {
    return getGlobalInstance().ping()
  },
  requestData(entity: string) {
    return getGlobalInstance().requestData(entity)
  },
  markUserActive() {
    return getGlobalInstance().markUserActive()
  },
  reconnect() {
    return getGlobalInstance().reconnect()
  },
}
