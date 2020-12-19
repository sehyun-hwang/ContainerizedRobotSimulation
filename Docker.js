const { io } = window;
import { Log } from './utils.js';

const MyURL = Subdomain => window.location.hostname.replace(/.+?\./, Subdomain + '.');

let subdomain = 'kbdlab';
export const Subdomain = x => subdomain = x;

let socket, interval, test;
export const Test = () => test = true;

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


const IsYonsei = fetch('https://www.cloudflare.com/cdn-cgi/trace')
    .then(res => res.text())
    .then(data => {
        const text = 'ip=165.132.138.';
        return data.split('\n').find(x => x.startsWith(text));
    });

export let Container = () => undefined;


export const Handler = (data = new URLSearchParams(window.location.search).get('Container')) => IsYonsei
    .then(isYonsei => {
        if (!data) return Reset();
        socket && socket.disconnect();

        const container = data.split('-').pop();
        Log(container);
        Container = () => container;

        socket = io((url => {
            const searchparams = new URLSearchParams(url.search);
            searchparams.delete('Container');
            searchparams.append('Container', data);
            url.search = searchparams;
            const path = url.toString();
            window.history.pushState({ path }, '', path);

            url.pathname = '/Browser';
            url.search = '';

            if (subdomain === 'yonsei')
                url.hostname = MyURL(isYonsei ? 'yonsei' : 'kbdlab');
            else if (subdomain === 'kbdlab') {
                url.hostname = MyURL('kbdlab');
                url.port = 8443;
            }

            url = url.toString();
            Log('URL', url);
            return url;
        })(new URL(window.location)), {
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


export default (body) => Promise.resolve(body)
    .then(JSON.stringify)
    .then(body => fetch(`https://${MyURL('proxy')}/robot/ddpg?` + new URLSearchParams({ Subdomain: subdomain }), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body
    }))
    .then(res => res.text())
    .then(Handler);
