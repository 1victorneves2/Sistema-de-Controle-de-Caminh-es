const Database = require('better-sqlite3');
const db = new Database('./banco.db');

// Criar tabela de usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    ativo INTEGER DEFAULT 1,
    data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Criar tabela de histórico
db.exec(`
  CREATE TABLE IF NOT EXISTS historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    acao TEXT NOT NULL,
    tabela TEXT NOT NULL,
    registro_id INTEGER,
    dados_antigos TEXT,
    dados_novos TEXT,
    data_hora TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )
`);

// Adicionar admin (senha: admin123)
const crypto = require('crypto');
const senhaHash = crypto.createHash('sha256').update('admin123').digest('hex');

try {
  db.prepare(`
    INSERT INTO usuarios (email, senha, nome, role) 
    VALUES (?, ?, ?, ?)
  `).run('admin@sistema.com', senhaHash, 'Administrador', 'admin');
  
  console.log('✅ Tabelas criadas e admin inserido!');
  console.log('📧 Email: admin@sistema.com');
  console.log('🔐 Senha: admin123');
} catch (err) {
  console.log('⚠️ Admin já existe:', err.message);
}