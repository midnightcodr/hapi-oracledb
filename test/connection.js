'use strict'

const Hapi = require('@hapi/hapi')
const Hoek = require('@hapi/hoek')
const Lab = require('@hapi/lab')

const { describe, it, beforeEach, expect } = (exports.lab = Lab.script())

const poolAttrs = {
  user: 'dummy',
  password: 'dummypass',
  connectString: '127.0.0.1/ORCLCDB.localdomain'
}

describe('Hapi server', () => {
  let server

  beforeEach(() => {
    server = Hapi.Server()
  })

  it('should reject invalid options', async () => {
    try {
      await server.register({
        plugin: require('../'),
        options: {
          url: 'user:pass@ORCLCDB.localdomain'
        }
      })
    } catch (err) {
      expect(err).to.exist()
    }
  })

  it('should reject invalid decorate', async () => {
    try {
      await server.register({
        plugin: require('../'),
        options: {
          decorate: 1
        }
      })
    } catch (err) {
      expect(err).to.exist()
    }
  })

  it('should fail with no oracledb listening', async () => {
    try {
      await server.register({
        plugin: require('../'),
        options: {
          poolAttrs,
          decorate: 'primary'
        }
      })
    } catch (err) {
      expect(err).to.exist()
    }
  })

  it('should log configuration upon successful connection', async () => {
    let logEntry
    server.events.once('log', entry => {
      logEntry = entry
    })

    await server.register({
      plugin: require('../'),
      options: {
        poolAttrs
      }
    })

    expect(logEntry.channel).to.equal('app')
    expect(logEntry.tags).to.equal(['hapi-oracledb', 'info'])
    expect(
      /^oracledb connection pool created for/.test(logEntry.data)
    ).to.be.true()
  })

  it('should be able to find the plugin exposed objects', async () => {
    await server.register({
      plugin: require('../'),
      options: {
        poolAttrs
      }
    })

    server.route({
      method: 'GET',
      path: '/',
      handler (request) {
        const plugin = request.server.plugins['hapi-oracledb']
        expect(plugin.pool).to.exist()
        expect(plugin.lib).to.exist()
        return Promise.resolve(null)
      }
    })

    await server.inject({ method: 'GET', url: '/' })
  })

  it('should be able to find the plugin on decorated objects', async () => {
    await server.register({
      plugin: require('../'),
      options: {
        poolAttrs,
        decorate: true
      }
    })

    expect(server.oracledb).to.exist()
    expect(server.oracledb.pool).to.exist()

    server.route({
      method: 'GET',
      path: '/',
      handler (request) {
        expect(request.oracledb.pool).to.exist()
        return Promise.resolve(null)
      }
    })

    await server.inject({ method: 'GET', url: '/' })
  })

  it('should be able to find the plugin on custom decorated objects', async () => {
    await server.register({
      plugin: require('../'),
      options: {
        poolAttrs,
        decorate: 'primaryOdb'
      }
    })

    expect(server.primaryOdb.pool).to.exist()

    server.route({
      method: 'GET',
      path: '/',
      handler (request) {
        expect(request.primaryOdb.pool).to.exist()
        return Promise.resolve(null)
      }
    })

    await server.inject({ method: 'GET', url: '/' })
  })

  it('should fail to mix different decorations', async () => {
    try {
      await server.register({
        plugin: require('../'),
        options: [
          {
            poolAttrs,
            decorate: true
          },
          {
            poolAttrs,
            decorate: 'foo'
          }
        ]
      })
    } catch (err) {
      expect(err).to.be.an.error(
        'You cannot mix different types of decorate options'
      )
    }
  })

  it('should disconnect if the server stops', async () => {
    await server.register({
      plugin: require('../'),
      options: {
        poolAttrs
      }
    })

    await server.initialize()
    await server.stop()
    await Hoek.wait(100) // Let the connections end.
  })
})
