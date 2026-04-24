// ============================================
// INSTALAR PRIMEIRO:
// npm install ws
// ============================================

const WebSocket = require('ws');

let clientes = [];

function iniciarWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Novo cliente WebSocket conectado');
    clientes.push(ws);

    ws.on('close', () => {
      console.log('Cliente desconectado');
      clientes = clientes.filter(c => c !== ws);
    });

    ws.on('error', (erro) => {
      console.error('Erro WebSocket:', erro);
    });
  });

  return wss;
}

function notificarTodosClientes(evento, dados) {
  console.log('Notificando todos os clientes:', evento);
  clientes.forEach(cliente => {
    if (cliente.readyState === WebSocket.OPEN) {
      cliente.send(JSON.stringify({ evento, dados, timestamp: new Date() }));
    }
  });
}

module.exports = { iniciarWebSocket, notificarTodosClientes };