            const API = 'https://proxy.hwangsehyun.com/robot/paramserver/';
            const decoder = new TextDecoder("utf-8")
            let Form, File, Container, Consoles;


            fetch(API)
                .then(res => res.json())
                .then(data => {
                    Form = document.querySelector('form');
                    File = document.querySelector('#file');
                    Consoles = document.querySelector('#Consoles').children;

                    data.forEach(x => {
                        const element = document.createElement('option');
                        element.textContent = x;
                        File.appendChild(element);
                    });

                    File.firstElementChild.selected = true;
                });


            window.OnClick = () => fetch(API + File.value, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: (() => {
                        const obj = {};
                        for (let [key, value] of new FormData(Form).entries())
                            obj[key] = Number(value);
                        console.log('Body', obj);
                        return JSON.stringify(obj);
                    })()
                }).then(async res => {
                    Container = res.headers.get('X-Container');
                    if (!Container)
                        return Promise.reject('No container name');

                    const reader = res.body.getReader();
                    const Console = Consoles[0];

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done)
                            break;

                        Console.textContent += decoder.decode(value);
                        Console.scrollTop = Console.scrollHeight;
                    }

                    console.log('PUT finished');
                    return fetch(API + Container);
                })


                .then(res => res.json())
                .then(data => {
                    console.log(data);
                    const Console = Consoles[1];
                    let Logs;

                    data.forEach(x => Object.entries(x).forEach(([key, prop]) => {
                        if (key === 'Logs')
                            Logs = prop;
                        else
                            Console.textContent += `${key}: ${JSON.stringify(prop,null, '\t')}
                                `;
                    }));

                    Console.textContent += Logs;
                    Console.style.minWidth = '50%';
                    Console.classList.remove('flex-shrink-0');
                    Console.scrollTop = Console.scrollHeight;
                });
            