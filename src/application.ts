import { ContactId, create as createWA, decryptMedia, Message } from '@open-wa/wa-automate'
import express from 'express'
import cors from 'cors'
import { inboxQueue, toSendQueue } from './queues'
import 'dotenv/config'
import { sleepFor } from './sleep'

type Callback = (message: Message) => void

const server = express()
server.use(cors())

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

  server.get('/contacts', async (_, response) => {
    await client.syncContacts()

    await sleepFor(5)

    const contacts = await client.getAllContacts()
    return response.json({
      contacts: contacts
        .filter((contacts) => contacts.id !== 'status@broadcast')
        .map((contact) => ({
          name: contact.name === undefined ? contact.id : contact.name,
          number: contact.id
        }))
    })
  })

  server.get('/messages-from/:contact', async (request, response) => {
    const { contact } = request.params

    const messages = await client.getAllMessagesInChat(contact as ContactId, true, false)

    return response.json(messages.map((message) => {
      const { body, fromMe, mimetype } = message
      return { body, fromMe, mimetype }
    }))
  })

  server.get('/cache', async (_, response) => {
    const amount = await client.getAmountOfLoadedMessages()
    return response.json({ amount })
  })
  server.get('/clear-cache', async (_, response) => {
    const result = await client.cutChatCache()
    return response.json(result)
  })

  server.listen(process.env.SERVER_PORT, () => {
    console.log(`\nServidor iniciado na porta ${process.env.SERVER_PORT}`)
  })
}

start()
