const Database = require('better-sqlite3');
const db = new Database('./banco.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS caminhoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    status TEXT DEFAULT 'disponivel',
    ativo INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS motoristas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    contato TEXT,
    observacoes TEXT,
    ativo INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    funcao TEXT NOT NULL,
    ativo INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS viagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caminhao_id INTEGER NOT NULL,
    motorista_id INTEGER NOT NULL,
    funcionario_id INTEGER NOT NULL,
    rota TEXT NOT NULL,
    mercadoria TEXT NOT NULL,
    nota_fiscal TEXT NOT NULL,
    status TEXT DEFAULT 'carregado',
    motivo_retorno TEXT,
    observacoes_retorno TEXT,
    conferente_retorno TEXT,
    data_saida TEXT NOT NULL,
    data_retorno TEXT,
    FOREIGN KEY (caminhao_id) REFERENCES caminhoes(id),
    FOREIGN KEY (motorista_id) REFERENCES motoristas(id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
  )
`);

console.log('Banco de dados criado com sucesso!');
