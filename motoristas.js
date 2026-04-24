const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./banco.db');

router.get('/', (req, res) => {
  const motoristas = db.prepare('SELECT * FROM motoristas').all();
  res.json(motoristas);
});

router.post('/', (req, res) => {
  const { nome, cpf, contato } = req.body;

  if (!nome || !cpf) {
    return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });
  }

  const inserir = db.prepare('INSERT INTO motoristas (nome, cpf, contato) VALUES (?, ?, ?)');
  const resultado = inserir.run(nome, cpf, contato || '');

  res.json({ id: resultado.lastInsertRowid, nome, cpf, contato, status: 'ativo' });
});

module.exports = router;

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE motoristas SET ativo = 0 WHERE id = ?').run(req.params.id);
  res.json({ sucesso: true });
});

router.put('/:id', (req, res) => {
  const { nome, cpf, contato } = req.body;
  const id = req.params.id;
 
  const motorista = db.prepare('SELECT * FROM motoristas WHERE id = ?').get(id);
  
  if (!motorista) {
    return res.status(404).json({ erro: 'Motorista não encontrado' });
  }
 
  db.prepare('UPDATE motoristas SET nome = ?, cpf = ?, contato = ? WHERE id = ?')
    .run(nome || motorista.nome, cpf || motorista.cpf, contato || motorista.contato, id);
 
  res.json({ sucesso: true, id });
});