const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'publico')));

// Importar rotas
const rotasCaminhoes = require('./rotas/caminhoes');
const rotasMotoristas = require('./rotas/motoristas');
const rotasViagens = require('./rotas/viagens');
const rotasFuncionarios = require('./rotas/funcionarios');
const rotasAuth = require('./rotas/rotas_auth');
const { router: rotasAdmin } = require('./rotas/rotas_admin');

// Inicializar WebSocket
const { iniciarWebSocket } = require('./websocket');
const server = http.createServer(app);
const wss = iniciarWebSocket(server);

// Exportar wss para ser usado nas rotas
global.wss = wss;
global.notificarClientes = require('./websocket').notificarTodosClientes;

// Usar rotas
app.use('/api/caminhoes', rotasCaminhoes);
app.use('/api/motoristas', rotasMotoristas);
app.use('/api/viagens', rotasViagens);
app.use('/api/funcionarios', rotasFuncionarios);
app.use('/api/auth', rotasAuth);
app.use('/api/admin', rotasAdmin);

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`WebSocket ativo em ws://localhost:${PORT}`);
});