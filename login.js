// npm init
// npm install express --save
// npm install mysql2 --save
// npm install body-parser
// npm install multer
// npm install fs

// declaração de constantes para utilização
const mysql = require('mysql2')
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require('fs')
const sslOptions ={ ca: fs.readFileSync('./DigiCertGlobalRootCA.crt.pem')}

// Constante que recebe todas as funções da dependência express
const app = express();

// todos os arquivos estatios devem cosntar na pasta public
app.use(express.static('public'));
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'uploads/')
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname)
    }
})
const uploud = multer({storage:storage});
app.use('/uploads', express.static('uploads'));

// Armazena dados da conexão
const connection = mysql.createConnection({
  host: 'fabianehinkel.mysql.database.azure.com',
  user:'fabiane',
  password: 'Senac@2024',
  database:'controle_estoque',
  port: 3306,
  ssl:sslOptions
})

connection.connect(function(err){
  if(err){
    console.error('Erro ', err)
  }console.log('Conexão estabelecida')
})
// Capturar os dados do formulário html
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

// Cria a função que "ouve" a porta do servidor
app.listen(8081,function(){
  console.log('Servidor rodando na url http://localhost:8081')
});

// Rota default
app.get('/',function(req, res){
  res.sendFile(__dirname+'/index.html')
})

// Rota esqueci senha
app.get('/senha',function(req, res){
  res.sendFile(__dirname+'/public/html/senha.html')
})

// Rota menu
app.get('/menu',function(req, res){
  res.sendFile(__dirname+'/public/html/menu.html')
})

app.get('/cadastrar',function(req, res){
  res.sendFile(__dirname+'/public/html/Crud/cadastrar.html')
})

app.get('/userLogin',function(req, res){
  res.sendFile(__dirname+'/public/html/Crud/userLogin.html')
})

 // Listar
app.get('/listagem',function(req, res){
  const listar ="SELECT * FROM candidato"
  connection.query(listar,function(err,rows){
    if(!err){
      console.log('Dados inseridos com sucesso!')
      res.send(`
      <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="stylesheet" href="./style.css" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Listagem de Candidatos</title>
          </head>
          <body class="tabela">
          <h1 class="tabTitulo">Candidatos</h1>
          <div class="centralizar">
          <a class="voltar" href="/menu">Voltar</a>
        </div>
          <table>
              <tr>
                <th>Nome</th>
                <th>Sobrenome</th>
                <th>Telefone</th>
                <th>Endereco</th>
                <th>Nascimento</th>
                <th>E-mail</th>
                <th>Ações</th>
              </tr>
            ${rows.map(row=>`
            <tr>
                <td>${row.nome}</td>
                <td>${row.sobrenome}</td>
                <td>${row.telefone}</td>
                <td>${row.endereco}</td>
                <td>${row.nascimento}</td>
                <td>${row.email}</td>
                <td> <a class="acao" href="/editar/${row.id}">Editar</a> <a class="acao" href="/excluir/${row.id}">Excluir</a></td>
              </tr>
            `).join('')}
              
            </table>
          </body>
        </html>
      `)
    } else{
      console.log("Erro no relatório de estoque", err);
      res.send("Erro")
    }
  })
})

app.get('/excluir/:id',function(req,res){
  const id = req.params.id;

  const excluir = "DELETE FROM candidato WHERE id = ?"

  connection.query(excluir,[id], function(err,result){
    if(!err){
      console.log("Produto deletado!")
      res.redirect('/listagem')
    }else{
      console.log("Erro ao deletar produto!, ", err)
    }
  })
})

// Rota Cadastrar Usuario do sistema
app.post('/cadastroLogin',function(req, res){
  const nome = req.body.nome
  const sobrenome = req.body.sobrenome
  const email = req.body.email
  const telefone = req.body.telefone
  const endereco = req.body.endereco
  const nascimento = req.body.nascimento
  const senha = req.body.senha

  connection.query('INSERT INTO usuario(nome, sobrenome, telefone, endereco, nascimento, email, senha) VALUES(?,?,?,?,?,?)',[nome, sobrenome, telefone, endereco, nascimento, email,senha]
  , function(error,results,fields){
    if(error){
      console.error('Erro ao executar o cadastro ', error)
      res.status(500).send('Erro interno ao verificar campos inseridos. ')
      return
    }
  })
})

// Rota Cadastrar Candidato
app.post('/cadastro', uploud.single('imagem_produto'), function(req, res){
  const nome = req.body.nome
  const sobrenome = req.body.sobrenome
  const email = req.body.email
  const telefone = req.body.telefone
  const endereco = req.body.endereco
  const nascimento = req.body.nascimento
  const imagemCandidato = req.filename

  connection.query('INSERT INTO candidato(nome, sobrenome, telefone, endereco, nascimento, email, imagemCandidato) VALUES(?,?,?,?,?,?,?)',[nome, sobrenome, telefone, endereco, nascimento, email,imagemCandidato]
  , function(error,results,fields){
    if(error){
      console.error('Erro ao executar o cadastro ', error)
      res.status(500).send('Erro interno ao verificar campos inseridos. ')
      return
    }
  })
})

// Editar
app.get('/editar/:id',function(req,res){
  const id = req.params.id
  connection.query('SELECT * FROM candidato WHERE id = ?',[id],function(err,results){
    if(err){
      console.error('Erro ao buscar produto por ID ',err)
      res.status(500).send('Erro interno ao buscar produto')
      return;
    }
    if(results.length === 0){
      console.log("Candidato não encontrado")
      res.status(404).send("Candidato não encontrado")
      return
    }
    const candidato =  results[0]
    res.send(`
    <!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Editar Candidato</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Editar Candidato</h1>
    <form action="/editar/${id}" method="POST" enctype="multipart/form-data">
      <label for="descricao">Nome: </label>
      <input
        type="text"
        id="novaNome"
        name="novaNome"
        value="${candidado.nome}"
      />

      <label for="sobrenome">Sobrenome</label>
      <input
        type="text"
        id="novoSobrenome"
        name="novoSobrenome"
        value="${candidado.sobrenome}"
      />

      <label for="telefone">Telefone</label>
      <input
        type="text"
        id="novoTelefone"
        name="novoTelefone"
        value="${candidado.telefone}"
      />

      <label for="email">E-mail</label>
      <input
        type="text"
        id="novoEmail"
        name="novoEmail"
        value="${candidado.email}"
      />

      <label for="imagemCandidato">Imagem Candidato</label>
      <img
        src="/uploads/${candidado.imagemCandidato}"
        alt="Imagem do Candidato"
        style="width: 100px"
      /><br />
      <input type="file" name="novaImagem" id="novaImagem" /><br />

      <label for="novaImagem">Nova imagem do Candidato</label>
      <input type="file" name="novaImagem" id="novaImagem" /><br />
      <input type="submit" value="Salvar" />
    </form>
  </body>
</html>

    `)
  })
})

// Editar Imagem
app.post('/editar/:id',uploud.single('novaImagem'), function(req, res)
{
  id = req.params.id
  const novoNome = req.body.novoNome
  const novoSobrenome = req.body.novoSobrenome
  const novoEmail = req.body.novoEmail
  const novoTelefone = req.body.novoTelefone
  const novaImagem = req.file ? req.file.filename:null

  connection.query('UPDATE candidato SET nome = ?, sobrenome = ?, email = ?, telefone = ?, imagem = ? WHERE id = ?', [novoNome,novoSobrenome,novoEmail,novoTelefone,novaImagem])
  if(err){
    console.error('Erro ao atualizar produto ', err)
    res.status(500).send('Erro interno ao atualizar produto')
    return
  }
  if(result.affectedRows === 0){
    console.log('Candidato não encontrado')
    res.status(404).send('Produto não encontrado')
    return
  }
  console.log('Candidato atualizado com sucesso!')
  res.redirect('/listar')
})

// Rota login
app.post('/login',function(req,res){
  const email = req.body.email
  const senha = req.body.senha

  connection.query('SELECT * FROM usuario WHERE email=? AND senha=?', [email,senha], function(error,results,fields){
    if(error){
      console.error('Erro ao executar a consulta ', error)
      res.status(500).send('Erro interno ao verificar credenciais. ')
      return
    }
    if(results.length > 0){
      res.redirect('/menu')
    }
    else{
      res.status(401).send('Credenciais inválidas')
    }
  })
})

