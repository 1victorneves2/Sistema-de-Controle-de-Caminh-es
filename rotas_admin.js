const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('./banco.db');

// Middleware de autenticação
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autenticado' });
  // Em produção, verificar token real
  next();
}

// GET todos os usuários
router.get('/usuarios', verificarToken, (req, res) => {
  const usuarios = db.prepare('SELECT id, email, nome, role, ativo FROM usuarios').all();
  res.json(usuarios);
});

// POST criar novo usuário
router.post('/usuarios', verificarToken, (req, res) => {
  const { email, senha, nome, role } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({ erro: 'Campos obrigatórios' });
  }

  const senhaHash = crypto.createHash('sha256').update(senha).digest('hex');

  try {
    const inserir = db.prepare(`
      INSERT INTO usuarios (email, senha, nome, role) 
      VALUES (?, ?, ?, ?)
    `);
    const resultado = inserir.run(email, senhaHash, nome, role);

    registrarHistorico(req.user?.id || 1, 'CRIAR', 'usuarios', resultado.lastInsertRowid, null, { email, nome, role });

    res.json({ id: resultado.lastInsertRowid, email, nome, role });
  } catch (err) {
    res.status(400).json({ erro: 'Email já existe' });
  }
});

// PUT ativar/desativar usuário
router.put('/usuarios/:id', verificarToken, (req, res) => {
  const { ativo } = req.body;
  
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  
  db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(ativo, req.params.id);

  registrarHistorico(req.user?.id || 1, ativo ? 'ATIVAR' : 'DESATIVAR', 'usuarios', req.params.id, usuario, { ativo });

  res.json({ sucesso: true });
});

// GET histórico
router.get('/historico', verificarToken, (req, res) => {
  const historico = db.prepare(`
    SELECT h.*, u.nome as usuario
    FROM historico h
    LEFT JOIN usuarios u ON h.usuario_id = u.id
    ORDER BY h.data_hora DESC
    LIMIT 100
  `).all();
  
  res.json(historico);
});

// GET histórico com filtros
router.get('/historico/filtrar', verificarToken, (req, res) => {
  const { dataInicio, dataFim, tabela } = req.query;
  
  let sql = `
    SELECT h.*, u.nome as usuario
    FROM historico h
    LEFT JOIN usuarios u ON h.usuario_id = u.id
    WHERE 1=1
  `;

  if (dataInicio) sql += ` AND DATE(h.data_hora) >= '${dataInicio}'`;
  if (dataFim) sql += ` AND DATE(h.data_hora) <= '${dataFim}'`;
  if (tabela) sql += ` AND h.tabela = '${tabela}'`;

  sql += ` ORDER BY h.data_hora DESC LIMIT 100`;

  const historico = db.prepare(sql).all();
  res.json(historico);
});

// Função auxiliar para registrar histórico
function registrarHistorico(usuarioId, acao, tabela, registroId, dadosAntigos, dadosNovos) {
  db.prepare(`
    INSERT INTO historico (usuario_id, acao, tabela, registro_id, dados_antigos, dados_novos)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    usuarioId,
    acao,
    tabela,
    registroId,
    JSON.stringify(dadosAntigos),
    JSON.stringify(dadosNovos)
  );
}

module.exports = { router, registrarHistorico };