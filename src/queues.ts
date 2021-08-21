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

const typeInboxQueue = process.env.STORM === 'true' ? 'storm' : 'inbox'

export const inboxQueue = new Bull<Message>(
  `${typeInboxQueue}-${process.env.USER_NUMBER}`,
  { redis }
)

export const toSendQueue = new Bull<ToSendData>(
  `to-send-${process.env.USER_NUMBER}`,
  { redis }
)
