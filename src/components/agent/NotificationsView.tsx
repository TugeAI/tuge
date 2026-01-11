'use client'

import { Bell, MessageSquare, FileText, Check, X, Clock } from 'lucide-react'

type NotificationType = 'proposal' | 'message' | 'listing' | 'system'
type NotificationStatus = 'unread' | 'read' | 'archived'

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: Date
  status: NotificationStatus
  actionUrl?: string
}

interface NotificationsViewProps {
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
  onNotificationClick?: (notification: Notification) => void
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'proposal':
      return <Bell className="w-4 h-4" />
    case 'message':
      return <MessageSquare className="w-4 h-4" />
    case 'listing':
      return <FileText className="w-4 h-4" />
    default:
      return <Bell className="w-4 h-4" />
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'proposal':
      return {
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
        icon: 'text-pink-400'
      }
    case 'message':
      return {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        icon: 'text-violet-400'
      }
    case 'listing':
      return {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        icon: 'text-cyan-400'
      }
    default:
      return {
        bg: 'bg-white/5',
        border: 'border-white/10',
        icon: 'text-white/60'
      }
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return date.toLocaleDateString('fr-FR')
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
  onClick?: (notification: Notification) => void
}

function NotificationItem({ notification, onMarkAsRead, onArchive, onClick }: NotificationItemProps) {
  const colors = getNotificationColor(notification.type)
  const isUnread = notification.status === 'unread'

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`
        relative p-3 rounded-lg border transition-all duration-200
        ${isUnread 
          ? `${colors.bg} ${colors.border} hover:bg-white/5` 
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
        }
        cursor-pointer group
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${colors.bg} border ${colors.border}
        `}>
          <div className={colors.icon}>
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-medium truncate ${isUnread ? 'text-white' : 'text-white/70'}`}>
              {notification.title}
            </h3>
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
            {notification.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="text-[10px] text-white/30">
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUnread && onMarkAsRead && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-emerald-400 transition-colors"
              title="Marquer comme lu"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive(notification.id)
              }}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
              title="Archiver"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Données de démonstration
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'proposal',
    title: 'Nouvelle proposition reçue',
    description: 'Jean D. vous a fait une offre de 150€ pour votre annonce "iPhone 13 Pro"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    status: 'unread'
  },
  {
    id: '2',
    type: 'message',
    title: 'Nouveau message',
    description: 'Marie L. : "Bonjour, est-ce que l\'article est toujours disponible ?"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'unread'
  },
  {
    id: '3',
    type: 'listing',
    title: 'Annonce publiée',
    description: 'Votre annonce "MacBook Pro M2" a été publiée avec succès',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'read'
  },
  {
    id: '4',
    type: 'proposal',
    title: 'Proposition acceptée',
    description: 'Votre proposition pour "Vélo électrique" a été acceptée !',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'read'
  }
]

/**
 * NotificationsView - Vue des notifications/propositions
 * Affiche la liste des notifications avec filtres et actions
 */
export function NotificationsView({
  notifications = DEMO_NOTIFICATIONS,
  onMarkAsRead,
  onArchive,
  onNotificationClick
}: NotificationsViewProps) {
  const unreadCount = notifications.filter(n => n.status === 'unread').length

  return (
    <div className="h-full overflow-y-auto bg-transparent chat-scrollbar">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Notifications
              </h1>
              <p className="text-sm text-white/50 mt-1">
                {unreadCount > 0 
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Aucune nouvelle notification'
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => notifications.forEach(n => n.status === 'unread' && onMarkAsRead?.(n.id))}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onArchive={onArchive}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">
              Aucune notification
            </h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Vous recevrez ici les propositions, messages et mises à jour de vos annonces
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsView

