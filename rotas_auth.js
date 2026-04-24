const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('./banco.db');

// Login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  const senhaHash = crypto.createHash('sha256').update(senha).digest('hex');
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ? AND senha = ?').get(email, senhaHash);

  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha incorretos' });
  }

  if (!usuario.ativo) {
    return res.status(403).json({ erro: 'Usuário desativado' });
  }

  // Simular JWT (em produção use jsonwebtoken)
  const token = crypto.randomBytes(32).toString('hex');
  res.json({ 
    sucesso: true, 
    token, 
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role }
  });
});

// Verificar se está logado
router.get('/verificar', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }

  // Em produção, verificar token no banco
  res.json({ autenticado: true });
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ sucesso: true });
});

module.exports = router;