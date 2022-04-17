import { Document, model, options } from '../../src/database'
import { descriptionToSchema } from '../../src/entity'
import { default as Description } from './index.json'

import { UserDocument } from '../user/user.mdl'
import '../user/user.mdl'

export interface NotificationDocument extends Document {
  user_id: UserDocument | string
  destination: UserDocument | string
  title: string
  content: string
  action: string
  subject: string
}


export const NotificationSchema = descriptionToSchema<NotificationDocument>(Description, options)
export const Notification = model<NotificationDocument>('Notification', NotificationSchema)