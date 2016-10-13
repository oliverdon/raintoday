'use strict';

const Hapi = require('hapi');
const Handler = require('./handler');
const server = new Hapi.Server();

server.connection({address: '0.0.0.0', port: 8181});
server.register([require('vision')],
(err) => {

    if (err) {
        console.error(err);
        return;
    }

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates'
    });

    server.route(Handler.routes);
    server.start(() => console.log(`server started at ${server.info.uri}`));
});
