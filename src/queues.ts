import { Message, ChatId } from '@open-wa/wa-automate'
import Bull from 'bull'
import 'dotenv/config'

interface ToSendData {
  from: ChatId
  message: string
}

const redis = {
  host: process.env.REDIS_HOST as string,
  port: Number(process.env.REDIS_PORT as string),
  password: process.env.REDIS_PASSWORD as string
}

export const inboxQueue = new Bull<Message>(
  `whatsapp-inbox-${process.env.USER_NUMBER}`,
  { redis }
)

export const toSendQueue = new Bull<ToSendData>(
  `whatsapp-toSend-${process.env.USER_NUMBER}`,
  { redis }
)
