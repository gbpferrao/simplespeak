export type NotificationTone = 'success' | 'info' | 'warning'

export interface AppNotification {
  id: string
  message: string
  tone: NotificationTone
}
