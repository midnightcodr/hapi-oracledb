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

- `decorate`: string or boolean, mixed use of different types of decorate settings are not allowed.

- `poolAttrs`: object, options to initialize a pooling connection, see [https://oracle.github.io/node-oracledb/doc/api.html#connpooling](https://oracle.github.io/node-oracledb/doc/api.html#connpooling)

## Example
For details on `options`, see [example.js](example.js).