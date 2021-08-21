import { create as createWA, Client, Message } from '@open-wa/wa-automate'
import { inboxQueue, toSendQueue } from './queues'
import 'dotenv/config'

type Callback = (message: Message) => void

function filter(message: Message, callback: Callback) {
  if (process.env.FILTER_TO_DEVELOPMENT) {
    if (message.from === `${process.env.FILTER_TO_DEVELOPMENT}@c.us`) {
      callback(message)
    }
  } else {
    callback(message)
  }
}

async function start() {
  const client = await createWA()

  client.onMessage((message) => {
    filter(message, (message) => {
      inboxQueue.add(message)
    })
  })

  toSendQueue.process((job) => {
    client.sendText(job.data.from, job.data.message)
  })
}

start()
