const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./banco.db');
router.get('/', (req, res) => {
    const caminhoes = db.prepare('SELECT * FROM caminhoes').all();
    res.json(caminhoes);
});
router.post('/', (req, res) => {
    const { placa, tipo } = req.body;   

    if (!placa || !tipo) {
        return res.status(400).json({ erro: 'Placa e tipo são obrigatórios' });
    }

    const inserir = db.prepare('INSERT INTO caminhoes (placa, tipo) VALUES (?, ?)'); 
    const resultado = inserir.run(placa, tipo);
    
    res.json({ id: resultado.lastInsertRowid, placa, tipo, status: 'disponivel' });
});

router.put('/:id', (req, res) => {
  const { status, observacoes } = req.body;
  const id = req.params.id;

  const caminhao = db.prepare('SELECT * FROM caminhoes WHERE id = ?').get(id);
  
  if (!caminhao) {
    return res.status(404).json({ erro: 'Caminhão não encontrado' });
  }

  db.prepare('UPDATE caminhoes SET status = ? WHERE id = ?')
    .run(status || caminhao.status, id);

  res.json({ sucesso: true, id });
});


module.exports = router;

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE caminhoes SET ativo = 0 WHERE id = ?').run(req.params.id);
  res.json({ sucesso: true });
});

router.put('/:id', (req, res) => {
  const { placa, tipo } = req.body;
  const id = req.params.id;
 
  const caminhao = db.prepare('SELECT * FROM caminhoes WHERE id = ?').get(id);
  
  if (!caminhao) {
    return res.status(404).json({ erro: 'Caminhão não encontrado' });
  }
 
  db.prepare('UPDATE caminhoes SET placa = ?, tipo = ? WHERE id = ?')
    .run(placa || caminhao.placa, tipo || caminhao.tipo, id);
 
  res.json({ sucesso: true, id });
});