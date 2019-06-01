const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')

const server = Hapi.Server({
  port: 8000,
  routes: {
    validate: {
      failAction: (request, h, err) => {
        throw Boom.badRequest(err.message)
      }
    }
  }
})

server.route({
  method: 'GET',
  path: '/test',
  handler: async (request, h) => {
    const odbpool = request.primary.odbpool
    // had the decorate option is not set, use the following to get the conneciton pool
    // const odbpool = request.server.plugins['hapi-oracledb'].odbpool
    let conn, res

    try {
      conn = await odbpool.getConnection()
    } catch (err) {
      throw err
    }

    try {
      res = await conn.execute('SELECT SYSDATE, USER FROM dual')
    } catch (err) {
      throw err
    }
    await conn.release()
    return res
  }
})

const init = async () => {
  await server.register({
    // use this if hapi-oracledb is installed
    // plugin: require('hapi-oracledb'),
    plugin: require('./lib'),
    options: [
      {
        poolAttrs: {
          user: 'dummy',
          password: 'dummypass',
          connectString: '127.0.0.1/ORCLCDB.localdomain'
        },
        decorate: 'primary'
      },
      {
        poolAttrs: {
          user: 'dummy',
          password: 'dummypass',
          connectString: '127.0.0.1/ORCLCDB.localdomain'
        },
        decorate: 'secondary'
      }
    ]
  })
  await server.start()
  console.log(`started at ${server.info.uri}`)
}
server.events.on('log', log => console.log(log.data))
process.on('SIGINT', () => {
  server.stop().then(err => {
    console.log('hapi server stopped')
    process.exit(err ? 1 : 0)
  })
})

init()
