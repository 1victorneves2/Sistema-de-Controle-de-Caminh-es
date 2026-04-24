const express = require('express');
const router = express.Router();
const db = require('../banco/setup');

// GET - Listar todas
router.get('/', (req, res) => {
  try {
    const viagens = db.prepare(`
      SELECT 
        v.id, v.caminhao_id, v.motorista_id, v.funcionario_id,
        v.rota, v.mercadoria, v.nota_fiscal, v.status, 
        v.data_saida, v.data_retorno,
        v.motivo_retorno, v.observacoes_retorno,
        c.placa, m.nome as motorista, f.nome as funcionario
      FROM viagens v
      LEFT JOIN caminhoes c ON v.caminhao_id = c.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN funcionarios f ON v.funcionario_id = f.id
      ORDER BY v.id DESC
    `).all();
    res.json(viagens);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET - Buscar viagem específica por ID ou Placa
router.get('/buscar/:termo', (req, res) => {
  try {
    const termo = req.params.termo;
    
    // Buscar por ID ou Placa
    const viagens = db.prepare(`
      SELECT 
        v.id, v.caminhao_id, v.motorista_id, v.funcionario_id,
        v.rota, v.mercadoria, v.nota_fiscal, v.status, 
        v.data_saida, v.data_retorno,
        v.motivo_retorno, v.observacoes_retorno,
        c.placa, m.nome as motorista, f.nome as funcionario
      FROM viagens v
      LEFT JOIN caminhoes c ON v.caminhao_id = c.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN funcionarios f ON v.funcionario_id = f.id
      WHERE 
        v.id = ? OR 
        c.placa LIKE ? OR
        v.rota LIKE ? OR
        m.nome LIKE ? OR
        v.nota_fiscal LIKE ?
      ORDER BY v.data_saida DESC
    `).all(termo, '%' + termo + '%', '%' + termo + '%', '%' + termo + '%', '%' + termo + '%');
    
    res.json(viagens);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET - Buscar por data
router.get('/data/:dataInicio/:dataFim', (req, res) => {
  try {
    const { dataInicio, dataFim } = req.params;
    
    const viagens = db.prepare(`
      SELECT 
        v.id, v.caminhao_id, v.motorista_id, v.funcionario_id,
        v.rota, v.mercadoria, v.nota_fiscal, v.status, 
        v.data_saida, v.data_retorno,
        v.motivo_retorno, v.observacoes_retorno,
        c.placa, m.nome as motorista, f.nome as funcionario
      FROM viagens v
      LEFT JOIN caminhoes c ON v.caminhao_id = c.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN funcionarios f ON v.funcionario_id = f.id
      WHERE DATE(v.data_saida) BETWEEN ? AND ?
      ORDER BY v.data_saida DESC
    `).all(dataInicio, dataFim);
    
    res.json(viagens);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// POST - Criar nova viagem (INICIAR)
router.post('/', (req, res) => {
  try {
    const { caminhao_id, motorista_id, funcionario_id, rota, mercadoria, nota_fiscal } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO viagens 
      (caminhao_id, motorista_id, funcionario_id, rota, mercadoria, nota_fiscal, status, data_saida)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      caminhao_id, 
      motorista_id, 
      funcionario_id, 
      rota, 
      mercadoria, 
      nota_fiscal, 
      'carregado'
    );
    
    // Atualizar status do caminhão
    db.prepare('UPDATE caminhoes SET status = ? WHERE id = ?').run('carregado', caminhao_id);
    
    const novaViagem = db.prepare(`
      SELECT v.*, c.placa, m.nome as motorista, f.nome as funcionario
      FROM viagens v
      LEFT JOIN caminhoes c ON v.caminhao_id = c.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN funcionarios f ON v.funcionario_id = f.id
      WHERE v.id = ?
    `).get(result.lastInsertRowid);
    
    // NOTIFICAR TODOS OS CLIENTES
    global.notificarClientes('viagem_criada', novaViagem);
    console.log('Viagem criada e notificada:', result.lastInsertRowid);
    
    res.json({ id: result.lastInsertRowid, sucesso: true, viagem: novaViagem });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// PUT - Atualizar status (INICIAR/FINALIZAR)
router.put('/:id', (req, res) => {
  try {
    const { status, motivo_retorno, observacoes_retorno } = req.body;
    const id = req.params.id;

    console.log('========================================');
    console.log('ATUALIZANDO VIAGEM');
    console.log('ID:', id);
    console.log('Status:', status);
    console.log('========================================');

    // Verificar se viagem existe
    const viagem = db.prepare('SELECT * FROM viagens WHERE id = ?').get(id);
    
    if (!viagem) {
      return res.status(404).json({ erro: 'Viagem não encontrada' });
    }

    // Atualizar status da viagem
    db.prepare('UPDATE viagens SET status = ? WHERE id = ?').run(status, id);

    // Se for problema, adicionar motivo e observações
    if (status === 'retorno_problema') {
      db.prepare('UPDATE viagens SET motivo_retorno = ?, observacoes_retorno = ? WHERE id = ?')
        .run(motivo_retorno || '', observacoes_retorno || '', id);
    }

    // Atualizar caminhão
    if (status === 'entregue') {
      db.prepare('UPDATE caminhoes SET status = ? WHERE id = ?').run('disponivel', viagem.caminhao_id);
    } 
    else if (status === 'saiu_para_entrega') {
      db.prepare('UPDATE caminhoes SET status = ? WHERE id = ?').run('saiu_para_entrega', viagem.caminhao_id);
    } 
    else if (status === 'retorno_problema') {
      db.prepare('UPDATE caminhoes SET status = ? WHERE id = ?').run('disponivel', viagem.caminhao_id);
    }

    // Buscar viagem atualizada
    const viagemAtualizada = db.prepare(`
      SELECT v.*, c.placa, m.nome as motorista, f.nome as funcionario
      FROM viagens v
      LEFT JOIN caminhoes c ON v.caminhao_id = c.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN funcionarios f ON v.funcionario_id = f.id
      WHERE v.id = ?
    `).get(id);

    // NOTIFICAR TODOS OS CLIENTES
    global.notificarClientes('viagem_atualizada', viagemAtualizada);
    console.log('Viagem atualizada e notificada');
    console.log('========================================');

    res.json({ sucesso: true, viagem: viagemAtualizada });

  } catch (erro) {
    console.error('ERRO:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar viagem: ' + erro.message });
  }
});

// DELETE - Deletar
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('UPDATE viagens SET status = ? WHERE id = ?').run('cancelada', id);
    
    const viagem = db.prepare('SELECT * FROM viagens WHERE id = ?').get(id);
    global.notificarClientes('viagem_cancelada', viagem);
    
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

module.exports = router;