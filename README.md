## About
An oracledb plugin for [https://hapijs.com/](https://hapijs.com/)

## Usage
```
server.register({
    plugin: 'hapi-oracledb',
    options: ...
})
```

Where `options` is an object that has the following attributes,

- `poolAttrs`: object, options to initialize a pooling connection, see [https://oracle.github.io/node-oracledb/doc/api.html#connpooling](https://oracle.github.io/node-oracledb/doc/api.html#connpooling)

- `decorate`: string or boolean, mixed use of different types of decorate settings are not allowed.

## Dependencies
This package depends on package [oracledb](https://github.com/oracle/node-oracledb), see [https://oracle.github.io/node-oracledb/INSTALL.html#quickstart](https://oracle.github.io/node-oracledb/INSTALL.html#quickstart) for installation guide.

## Example
For details on `options`, see [example.js](example.js).