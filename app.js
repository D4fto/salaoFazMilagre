
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express()
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
var cookies = require("cookie-parser");
var yesss = false
app.use(cookies());
const authenticate = (req, res, next) => {
  const accessToken = req.headers['authorization'];
  const refreshToken = req.cookies['refreshToken'];
  
  if (!accessToken && !refreshToken) {
    yesss=false
    return res.status(401).redirect('/login');
  }
  
  try {
    const decoded = jwt.verify(accessToken, secretKey);
    req.user = decoded.user;
    next();
  } catch (error) {
    if (!refreshToken) {
      yesss=false
      return res.status(401).send('Access Denied. No refresh token provided.');
    }
    
    try {
      const decoded = jwt.verify(refreshToken, secretKey);
      const accessToken = jwt.sign({ user: decoded.user }, secretKey, { expiresIn: '1h' });
      req.user = decoded.user;
      yesss=true
      
      res
      .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
      .header('Authorization', accessToken)
      next()
    } catch (error) {
      yesss=false
      return res.status(400).send('Invalid Token.');
    }
  }
};
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});
app.use(express.static('public'))
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'salaofaz',
  password: '464369'
});

app.post('/funcionarios', (req,res)=>{
  connection.query(
    'SELECT * FROM `pessoa` ORDER BY nomePessoa',
    function (err, results) {
      res.json(results)
    }
  )
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/servicos', (req,res)=>{
  connection.query(
    'SELECT * FROM servico;',
    function (err, results) {
      res.json(results)
    }
  )
})
app.post('/confirmaCpf', (req,res)=>{
  connection.query(
    'SELECT cpfPessoa, nomePessoa FROM pessoa WHERE cpfPessoa = ?;',
    [req.body.cpf],
    function (err, results) {
      console.log(results)
      if(results.length>0){
        res.json([{sign:true, results: results[0]}])
      }
      else{
        res.json([{sign:false}])
        
      }
    }
  )
})
app.post('/refresh', (req, res) => {
  const refreshToken = req.cookies['refreshToken'];
  if (!refreshToken) {
    yesss=false
    return res.status(401).send('Access Denied. No refresh token provided.');
  }
  
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const accessToken = jwt.sign({ user: decoded.user }, secretKey, { expiresIn: '1h' });
    
    res
    .header('Authorization', accessToken)
    .send(decoded.user);
  } catch (error) {
    return res.status(400).send('Invalid refresh token.');
  }
});
app.post('/finalizarLogin',(req,res)=>{
  connection.query(
    'SELECT cpfPessoa, nomePessoa FROM pessoa WHERE cpfPessoa = ? and senhaPessoa=?;',
    [req.body.cpf,req.body.senha],
    function (err, results) {
      
      if(results.length>0){ 
        const user = results[0]
        const accessToken = jwt.sign({ user }, secretKey, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ user }, secretKey, { expiresIn: '1d' });
        
        res
        .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
        .header('Authorization', accessToken)
        .redirect('/reserva/'+results[0].cpfPessoa)
      }
      else{
        res.redirect('/login')
      }
    }
  )
})
app.get('/reserva/:cpf', authenticate, (req,res)=>{
  if(req.user.cpfPessoa===req.params.cpf){
    res.sendFile(__dirname+'/public/pages/reserva.html')
  }
  else{
    res.redirect('/login')
  }
})
app.get('/user/:cpf', authenticate, (req,res)=>{
  console.log(res.locals.user)
  if(req.user.cpfPessoa===req.params.cpf){
    res.sendFile(__dirname+'/public/pages/users.html')
  }
  else{
    res.redirect('/login')
  }
})
app.get('/logout', (req, res) => {
  // Remove o cookie do refreshToken
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  yesss=false
  
  // Opcionalmente, você pode também limpar o header 'Authorization' no cliente (isso depende da implementação do cliente)
  res.setHeader('Authorization', '');
  
  console.log('Deslogado com sucesso');
  res.redirect('/login');
});
app.post('/dados', authenticate, (req, res) => {
  console.log(req.user)
})
app.get('/login', (req,res)=>{
  if(!yesss){
    res.sendFile(__dirname+'/public/pages/login.html')
  }
  res.redirect('/user')
})
app.get('/user', authenticate, (req,res)=>{
  console.log(req.user)
  res.redirect('/user/'+req.user.cpfPessoa)
})

app.listen('8080')