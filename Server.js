import express from 'express';
import Format from 'pg-format';

import Client from 'utils/pg';
import { Router, Router2 } from "./ServerRouter.js";
import ProxyRouter from "./ServerProxy.js";

const client = Client();
//client.connect();

export const router = express.Router()
    .use('/', Router)
    .use('/', Router2)
    .use('/proxy', ProxyRouter);

let io, Start, results = [];

export const io_of = _io => {
    io = _io;

    io.on('connect', socket => {
        const { id } = socket;

        socket.on('data', data => {
            const obj = { id, Start, Time: new Date(), ...data };
            console.log(obj);
            results.push([...Object.values(obj)]);
        });
    });

};

let interval;

export function exit() {
    clearInterval(interval);
    io.emit('Reset');
}

function run() {
    console.log('Reset and Reload');
    io.emit('Reset');
    io.emit('Reload');

    setTimeout(() => {
        console.log('Run');
        setTimeout(() => io.emit('Run'), Math.random() * 1000);
        Start = new Date();

        clearInterval(interval);
        interval = setInterval(function() {
            io.allSockets().then(({ size }) => console.log({ size }));
            io.emit('data');

            console.log(results);

            results.length && client.query(Format(`
                INSERT INTO robot_performance
                (socket, start, time, steps, container)
                VALUES %L
            `, results))
                .then(({ rowCount }) => {
                    console.log({ rowCount });
                    results = [];
                });

        }, 1000);

        setTimeout(exit, 60000);
    }, 10000);
}


export const command = x => ({
    test: () => client.connect(),
    run,
    exit,
})[x]();
