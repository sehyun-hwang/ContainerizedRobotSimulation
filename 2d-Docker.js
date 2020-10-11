const { io } = window;
import { Log } from './2d-utils.js';

const MyURL = Subdomain => window.location.hostname.replace(/.+?\./, Subdomain + '.');
let socket, interval, test;
export const Test = () => test = true;

export function Reset() {
    Log('Docker reset');
    socket && socket.disconnect();
    clearInterval(interval);

    const url = new URL(window.location);
    url.search = '';
    const path = url.toString();
    window.history.pushState({ path }, '', path);
}

const IsYonsei = fetch('https://www.cloudflare.com/cdn-cgi/trace')
    .then(res => res.text())
    .then(data => {
        const text = 'ip=165.132.138.';
        return data.split('\n').find(x => x.startsWith(text));
    });

export const Handler = (data = new URLSearchParams(window.location.search).get('Container')) => IsYonsei
    .then(isYonsei => {
        if (!data) return Reset();

        const Container = data.split('-').pop();
        console.log(Container);
        socket = io((url => {
            url.search = new URLSearchParams({
                Container: data,
            }).toString();
            const path = url.toString();
            window.history.pushState({ path }, '', path);

            url.pathname = '/Browser';
            url.search = '';
            url.hostname = MyURL(isYonsei ? 'yonsei' : 'kbdlab');
            url = url.toString();
            return url;
        })(new URL(window.location)), {
            transports: ['websocket'],
            query: { Container }
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

export default query => fetch(`https://${MyURL('proxy')}/robot/docker?` + new URLSearchParams(query))
    .then(res => res.text())
    .then(Handler);
