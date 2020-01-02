const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
const oracledb = require('oracledb')

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
    const pool = request.primary.pool
    // had the decorate option is not set or set to boolean true, use the following to get the conneciton pool
    // const pool = request.server.plugins['hapi-oracledb'].pool
    let conn, res

    try {
      conn = await pool.getConnection()
    } catch (err) {
      console.log(err)
      throw err
    }

    try {
      res = await conn.execute(
        'SELECT SYSDATE, USER FROM dual',
        {},
        { outFormat: oracledb.OBJECT }
      )
    } catch (err) {
      console.log(err)
      throw err
    }
    await conn.release()
    return res.rows
  }
})

const init = async () => {
  const poolAttrs = {
    user: 'dummy',
    password: 'dummypass',
    connectString: '127.0.0.1/ORCLCDB.localdomain'
  }
  await server.register({
    // use this if hapi-oracledb is installed
    // plugin: require('hapi-oracledb'),
    plugin: require('./lib'),
    options: [
      {
        poolAttrs,
        decorate: 'primary'
      },
      {
        poolAttrs,
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
