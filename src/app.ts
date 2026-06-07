import Fastify from 'fastify'

const server = Fastify({
  logger: true
})

server.get('/health', async () => {
  return { status: 'ok', service: 'pickup-coord-engine' }
})

const start = async (): Promise<void> => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
