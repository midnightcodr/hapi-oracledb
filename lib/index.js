const Joi = require('@hapi/joi')
const oracledb = require('oracledb')

// see https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpoolpoolattrs
const singleOptionScheme = Joi.object({
  poolAttrs: Joi.object().required(),
  decorate: [true, Joi.string()]
})

const optionScheme = Joi.array()
  .items(singleOptionScheme)
  .min(1)
  .single()

const register = async (server, pluginOptions) => {
  let options = pluginOptions
  let finalOpts
  try {
    finalOpts = await optionScheme.validate(options)
  } catch (err) {
    throw err
  }

  const decorationTypes = new Set(
    finalOpts.map(option => typeof option.decorate)
  )
  if (decorationTypes.size > 1) {
    throw new Error('You cannot mix different types of decorate options')
  }

  const expose = {
    lib: oracledb
  }

  const connect = async connectionOptions => {
    let pool
    let p = connectionOptions.poolAttrs
    try {
      pool = await oracledb.createPool(p)
    } catch (err) {
      // see https://oracle.github.io/node-oracledb/doc/api.html#connpooling
      server.log(['hapi-oracledb', 'error'], err)
      throw err
    }
    const info = []
    if (p.user) {
      info.push(p.user)
    }
    if (p.password) {
      info.push(':***')
    }
    if (p.connectString) {
      info.push(`@${p.connectString}`)
    }
    server.log(
      ['hapi-oracledb', 'info'],
      `oracledb connection pool created for ${info.join('')}`
    )
    if (typeof connectionOptions.decorate === 'string') {
      const decoration = Object.assign({ pool: pool }, expose)
      server.decorate('server', connectionOptions.decorate, decoration)
      server.decorate('request', connectionOptions.decorate, decoration)
    }
    return pool
  }

  let pools = []
  try {
    pools = await Promise.all(finalOpts.map(connect))
  } catch (err) {
    server.log(['hapi-oracledb', 'error'], err)
  }

  expose.pool = finalOpts.length === 1 ? pools[0] : pools

  if (decorationTypes.has('boolean')) {
    server.decorate('server', 'oracledb', expose)
    server.decorate('request', 'oracledb', expose)
  } else if (decorationTypes.has('undefined')) {
    Object.keys(expose).forEach(key => {
      server.expose(key, expose[key])
    })
  }

  // close all pools when server is stopped
  server.events.on('stop', () => {
    pools.forEach(async pool => {
      try {
        console.log(`closing oracle pooling`)
        await pool.close()
        server.log(['hapi-oracledb', 'info'], `closing oracle pooling`)
      } catch (err) {
        server.log(['hapi-oracledb', 'error'], err)
      }
    })
  })
}

exports.plugin = {
  register,
  pkg: require('../package.json')
}
