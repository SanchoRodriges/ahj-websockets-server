const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body').default;
const { v4 } = require('uuid');
const cors = require('@koa/cors');
const WS = require('ws');

const app = new Koa();

app.use(cors());

app.use(koaBody({
  urlencoded: true,
}));

app.use((ctx, next) => {
  if(ctx.request.method !== 'OPTIONS') {
    next();

    return;
  }

  ctx.response.status = 204;

})

const port = 7070;
const server = http.createServer(app.callback());

const wsServer = new WS.Server({
  server
});

const chat = [
  {
    username: 'Админ',
    time: 1681453675000,
    message: 'Ребята, давайте без мата и оскорблений!'
  },

];

const users = [
  {
    id: '6516708c-f313-49ec-ba89-65b9d65142ez',
    username: 'Админ'
  }
];

wsServer.on('connection', (ws) => {

  const id = v4();

  ws.send(JSON.stringify({
    name: 'newClient',
    id,
  }));

  ws.on('close', () => {
    const remove = users.findIndex(item => item.id == id);
    users.splice(remove, 1);
    const data = (JSON.stringify({
      name: 'getUsers',
      users
    }));

    Array.from(wsServer.clients)
    .filter(client => client.readyState === WS.OPEN)
    .forEach(client => client.send(data));
  })

  ws.on('message', (message) => {

    const query = JSON.parse(message);
    
    if (query.name === 'checkName') {
      if (users.findIndex(item => item.username === query.username) !== -1) {
        ws.send(JSON.stringify({
          name: 'errorUsername'
        }));

      } else {

        users.push({
            id: query.id,
            username: query.username
          })

        ws.send(JSON.stringify({
          name: 'successUsername',
          id: query.id,
          username: query.username,
        }));

      }
    }

    if (query.name === 'setUser') {
      users.push(query.username);
      const data = (JSON.stringify({
        name: 'setUser',
        users
      }));

      Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(data));

    }

    if (query.name === 'addMessage') {
      const { username, time, message } = query;

      chat.push({ username, time, message });

      const data = (JSON.stringify({
        name: 'addMessage',
        chat: { username, time, message }
      }));

      Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(data));

    }

    if (query.name === 'getUsers') {
      const data = (JSON.stringify({
        name: 'getUsers',
        users
      }));

      Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(data));

    }

    if (query.name === 'getChat') {
      const data = (JSON.stringify({
        name: 'getChat',
        chat
      }));
      ws.send(data);

    }
    
  })

});

server.listen(port, (err) => {
  if (err) {
    console.log(err);

    return;
  }

  console.log('Server is listening to ' + port);
});
