const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./banco.db');

router.get('/', (req, res) => {
  const funcionarios = db.prepare('SELECT * FROM funcionarios').all();
  res.json(funcionarios);
});

router.post('/', (req, res) => {
  const { nome, cpf, funcao } = req.body;

  if (!nome || !cpf || !funcao) {
    return res.status(400).json({ erro: 'Nome, CPF e função são obrigatórios' });
  }

  const inserir = db.prepare('INSERT INTO funcionarios (nome, cpf, funcao) VALUES (?, ?, ?)');
  const resultado = inserir.run(nome, cpf, funcao);

  res.json({ id: resultado.lastInsertRowid, nome, cpf, funcao });
});

module.exports = router;

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE funcionarios SET ativo = 0 WHERE id = ?').run(req.params.id);
  res.json({ sucesso: true });
});

router.put('/:id', (req, res) => {
  const { nome, cpf, funcao } = req.body;
  const id = req.params.id;
 
  const funcionario = db.prepare('SELECT * FROM funcionarios WHERE id = ?').get(id);
  
  if (!funcionario) {
    return res.status(404).json({ erro: 'Funcionário não encontrado' });
  }
 
  db.prepare('UPDATE funcionarios SET nome = ?, cpf = ?, funcao = ? WHERE id = ?')
    .run(nome || funcionario.nome, cpf || funcionario.cpf, funcao || funcionario.funcao, id);
 
  res.json({ sucesso: true, id });
});