export default
import ('ws')
.then(Module => Module.default)
    .catch(error => {
        console.warn('Error on import ws', error)
        return window.WebSocket;
    })
