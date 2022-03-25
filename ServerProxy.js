import express from 'express';
import proxy from 'http-proxy-middleware';
import RawBody from "raw-body";

import { PathParser } from "utils";

const { App } = PathParser(import.meta.url);
const Cache = {};
const ContentTypes = {};


export default express.Router()
    .use("/", ({ originalUrl, headers }, res, next) => {
        const cache = Cache[originalUrl];
        if (!cache) return next();

        const SendCache = "etag" in headers && headers.pragma && !headers.pragma.includes("no-cache");
        res.set("Content-Type", ContentTypes[originalUrl])
            .status(SendCache ? 304 : 200)
            .send(SendCache ? '' : cache);
    }, proxy.createProxyMiddleware({
        target: "http://robot.glumb.de",
        changeOrigin: true,
        pathRewrite: {
            [`^/${App}/proxy/`]: '/'
        },
        onProxyRes(proxyRes, { originalUrl }) {
            ContentTypes[originalUrl] = proxyRes.headers["content-type"];
            RawBody(proxyRes)
                .then(buffer => Cache[originalUrl] = buffer)
                .catch(console.log);
        }
    }))
