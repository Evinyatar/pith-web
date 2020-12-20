const {createProxyMiddleware} = require('http-proxy-middleware');

const target = "http://192.168.1.4:3333"

module.exports = function (app) {
    app.use(
        createProxyMiddleware(["/rest", "/scale"], {
            target: target,
            changeOrigin: true
        })
    );
    app.use(
        createProxyMiddleware(["/events"], {
            target: target.replace(/^http/, 'ws'),
            changeOrigin: true,
            ws: true
        })
    );
};
