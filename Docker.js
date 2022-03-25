const { io } = window;
import { Log } from './utils.js';

let endpoint;
export const Endpoint = x => endpoint = x;

let socket, interval, test;
export const Test = () => test = true;


function MyURL(Subdomain) {
    const url = new URL(window.location.origin);
    url.host = window.location.host.replace(/.+?\./, Subdomain + '.');
    return url;
}


export function Reset() {
    Log('Docker reset');
    socket && socket.disconnect();
    clearInterval(interval);

    const url = new URL(window.location);
    const searchparams = new URLSearchParams(url.search);
    searchparams.delete('Container');
    url.search = searchparams;
    const path = url.toString();
    window.history.pushState({ path }, '', path);
}


/*const IsYonsei = fetch('https://www.cloudflare.com/cdn-cgi/trace')
    .then(res => res.text())
    .then(data => {
        const text = 'ip=165.132.138.';
        return data.split('\n').find(x => x.startsWith(text));
    });*/

export const Endpoints = fetch(MyURL('proxy') + '/Docker')
    .then(res => res.json());
export let Container = () => undefined;


export const Handler = (data = new URLSearchParams(window.location.search).get('Container')) => Endpoints.then(Endpoints => {
    socket && socket.disconnect();
    Log('Connecting to', endpoint, data);
    if (!data)
        return Reset();

    const container = data.split('-').pop();
    Log(container);
    const { PublicURL } = Endpoints[endpoint];
    Log(PublicURL);

    Container = () => container;

    socket = io((url => {
        const searchparams = new URLSearchParams(url.search);
        searchparams.delete('Container');
        searchparams.append('Container', data);
        url.search = searchparams;
        const path = url.toString();
        //window.history.pushState({ path }, '', path);

        url.pathname = '/Browser';
        url.search = '';

        url = url.toString();
        Log('URL', url);
        return url;
    })(new URL(PublicURL)), {
        transports: ['websocket'],
        query: { Container: container }
    });

    socket.on('disconnect', Reset);
    test && socket.on('connect', () => {
        Log('Connected to', Container);

        clearInterval(interval);
        interval = setInterval(() => {
            const data = ['test', '123123'];
            Log("Emited", data);
            socket.emit('Container', data);
        }, 1000);
    });

    socket.on('Log', data => Log('Log:', data));

    return socket;
});


export default Params => Promise.resolve(Params)
    .then(JSON.stringify)
    .then(body => fetch(MyURL('proxy') + '/robot/ddpg?' + new URLSearchParams({ Subdomain: endpoint }), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body,
    }))
    .then(res => res.text())
    .then(Handler);
