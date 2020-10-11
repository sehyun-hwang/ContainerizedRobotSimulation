const { io } = window;
import { Log, Socket } from './index.js';

const MyURL = Subdomain => window.location.hostname.replace(/.+?\./, Subdomain + '.');
let socket, interval;

function Reset() {
    Log('Reset');
    socket && socket.disconnect();
    clearInterval(interval);

    const url = new URL(window.location);
    url.search = '';
    const path = url.toString();
    window.history.pushState({ path }, '', path);
}

const Handler = data => {
    if(!data) return Reset();

    const Container = /-(.*)/.exec(data)[1];
    socket = io((url => {
        url.search = new URLSearchParams({
            Container: data,
        }).toString();
        const path = url.toString();
        window.history.pushState({ path }, '', path);

        url.pathname = '/Browser';
        url.search = '';
        url.hostname = MyURL('kbdlab');
        url = url.toString();
        return url;
    })(new URL(window.location)), {
        transports: ['websocket'],
        query: { Container }
    });

    socket.on('disconnect', Reset);
    socket.on('connect', () => {
        Log('Connected to', Container);

        clearInterval(interval);
        interval = setInterval(() => {
            const data = ['test', '123123'];
            Log("Emited", data);
            socket.emit('Container', data);
        }, 1000);
    });

    socket.on('Log', data => Log('Log:', data));
    Socket.then(fn => fn(socket));
};

Handler(new URLSearchParams(window.location.search).get('Container'));

window.test = () => fetch(`https://${MyURL('proxy')}/robot/docker`)
    .then(res => res.text())
    .then(Handler);

window.EV3 = function () {
    Reset();

    socket = io((url => {
        url.pathname = '/EV3';
        url.search = '';
        url.hostname = MyURL('kbdlab');
        url = url.toString();
        return url;
    })(new URL(window.location)), {
        transports: ['websocket'],
    });

    Socket.then(fn => fn(socket));
};
