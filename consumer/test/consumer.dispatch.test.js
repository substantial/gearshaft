const createLog = require('../../test/test-log')
const { exampleMessageClass } = require('../../messaging')
const { exampleCategory, exampleMessageStore, exampleReadMessageData } = require('../../message-store')
const { exampleConsumer, exampleHandler } = require('../examples')

const HandledMessageClass = exampleMessageClass('HandledMessageClass')

const setupConsumerWithHandler = (opts = {}) => {
  const category = exampleCategory()
  const handler = exampleHandler()
  const messageData = exampleReadMessageData(HandledMessageClass)
  const registerHandlers = (register) => {
    register(HandledMessageClass, handler)
  }
  const messageStore = exampleMessageStore()
  const consumer = exampleConsumer({ registerHandlers, messageStore, category, ...opts })
  return { consumer, handler, messageData, messageStore, category }
}

describe('consumer', () => {
  describe('dispatch', () => {
    describe('given a handled message', () => {
      it('invokes the handler', async () => {
        const { consumer, handler, messageData } = setupConsumerWithHandler()

        await consumer.dispatch(messageData)

        expect(handler.calls).toHaveLength(1)
        expect(handler.calls[0]).toBeInstanceOf(HandledMessageClass)
        expect(handler.calls[0]).toMatchObject(messageData.data)
      })
    })

    describe('position', () => {
      describe('given no messages handled', () => {
        it('consumer position is null', async () => {
          const consumer = exampleConsumer()

          const readPosition = await consumer.positionStore.get()

          expect(readPosition).toBeNull()
        })
      })

      describe('when position update interval is reached', () => {
        it('updates the consumer position', async () => {
          const { consumer, messageData } = setupConsumerWithHandler({ positionUpdateInterval: 1 })

          await consumer.dispatch(messageData)

          const readPosition = await consumer.positionStore.get()
          expect(readPosition).toBe(messageData.globalPosition)
        })
      })

      describe('when position update interval has not been reached', () => {
        it('does not update the consumer position', async () => {
          const { consumer, messageData } = setupConsumerWithHandler({ positionUpdateInterval: 2 })

          await consumer.dispatch(messageData)

          const readPosition = await consumer.positionStore.get()
          expect(readPosition).toBeNull()
        })
      })

      describe('when position update interval is hit subsequent times', () => {
        it('updates the consumer position', async () => {
          const { consumer } = setupConsumerWithHandler({ positionUpdateInterval: 1 })

          const messageData1 = exampleReadMessageData(HandledMessageClass)
          await consumer.dispatch(messageData1)

          const messageData2 = exampleReadMessageData(HandledMessageClass)
          messageData2.globalPosition += 1
          await consumer.dispatch(messageData2)

          const readPosition = await consumer.positionStore.get()
          expect(readPosition).toBe(messageData2.globalPosition)
        })
      })

      describe('when dispatching after position update interval was reached', () => {
        it('does not update the consumer position', async () => {
          const { consumer } = setupConsumerWithHandler({ positionUpdateInterval: 2 })

          const messageData1 = exampleReadMessageData(HandledMessageClass)
          await consumer.dispatch(messageData1)

          const messageData2 = exampleReadMessageData(HandledMessageClass)
          messageData2.globalPosition += 1
          await consumer.dispatch(messageData2)

          const messageData3 = exampleReadMessageData(HandledMessageClass)
          messageData3.globalPosition += 2
          await consumer.dispatch(messageData3)

          const readPosition = await consumer.positionStore.get()
          expect(readPosition).toBe(messageData2.globalPosition)
        })
      })

      describe('when updating position fails', () => {
        it('propagates the error', async () => {
          const log = createLog()
          const name = 'MyThing'
          const { consumer, messageData, messageStore } = setupConsumerWithHandler({ log, name, positionUpdateInterval: 1 })
          const error = new Error('bogus put error')
          messageStore.write = () => { throw error }

          const promise = consumer.dispatch(messageData)

          const ERROR = 'MyThing consumer: error updating consumer position'
          await expect(promise).rejects.toThrow('MyThing consumer: error updating consumer position')
          await expect(promise).rejects.toMatchObject({
            inner: error
          })

          expect(log.error).toHaveBeenCalledWith({
            category: expect.any(String),
            globalPosition: messageData.globalPosition,
            err: expect.any(Error)
          }, ERROR)
        })
      })
    })

    describe('strict mode', () => {
      describe('given an unhandled message', () => {
        it('raises an error', async () => {
          const consumer = exampleConsumer({ strict: true })
          const promise = consumer.dispatch(exampleReadMessageData())
          await expect(promise).rejects.toBeDefined()
        })
      })
    })

    describe('un-strict mode', () => {
      describe('given an unhandled message', () => {
        it('no error is raise', async () => {
          const consumer = exampleConsumer()
          await consumer.dispatch(exampleReadMessageData())
        })
      })
    })
  })
})
