const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express()
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});
app.use(express.static('public'))
const connection = mysql.createConnection({
  host: 'db4free.net',
  user: 'salaofaz',
  database: 'salaofaz',
  password: '123456789'
});

app.get('/funcionarios', (req,res)=>{
  connection.query(
    'SELECT pessoa.cpfPessoa, pessoa.nomePessoa FROM `pessoa`, `funcionario` WHERE pessoa.cpfPessoa=funcionario.pessoacpfPessoa',
    function (err, results) {
      res.json(results)
    }
  )
})
app.get('/servicos', (req,res)=>{
  connection.query(
    'SELECT * FROM salaofaz.servico;',
    function (err, results) {
      res.json(results)
    }
  )
})

app.listen('8080')