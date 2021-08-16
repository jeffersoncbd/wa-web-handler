import { create, Client, Message, ChatId } from '@open-wa/wa-automate'
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

const inboxQueue = new Bull<Message>(
  process.env.STORM === 'true' ? 'storm' : 'inbox',
  { redis }
)
const toSendQueue = new Bull<ToSendData>('to-send', { redis })

type Callback = (message: Message) => void
function filter(message: Message, callback: Callback) {
  if (message.from === `${process.env.FILTER_TO_DEVELOPMENT}@c.us`) {
    callback(message)
  }
}

function start(client: Client) {
  client.onMessage(async message => {
    if (process.env.FILTER_TO_DEVELOPMENT) {
      filter(message, (message) => {
        inboxQueue.add(message)
      })
    } else {
      inboxQueue.add(message)
    }
  })

  toSendQueue.process((job) => {
    client.sendText(job.data.from, job.data.message)
  })
}

create().then(client => start(client))
