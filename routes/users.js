var express = require('express');
const { query } = require("../lib/db");
const { nanoid } = require('nanoid');
var bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken')

dotenv.config();

var router = express.Router();

function verifyToken(req,res,next) {
  const bearerHeader = req.headers['authorization']
  if (typeof bearerHeader == 'undefined') {
    res.sendStatus(403)
  } else {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  }
}

router.get('/', verifyToken, async function (req, res, next) {

  jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
      if (!payload.admin) return res.sendStatus(400);
      });
  try {
    const querySql = "SELECT * FROM users";
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    return res.status(200).json({
      status: true,
      message: 'List Data Users',
      data: data
    })
  } catch (error) {
    return (
      res.status(500).json({
        status: false,
        message: error.message
      })
    )
  }
  
});

router.get('/id/:id', verifyToken, async function (req, res, next) {

  const id = req.params.id
  
  jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
      if (!payload.admin) return res.sendStatus(400);
      });
  try {
    const querySql = `SELECT * FROM users WHERE id = ${id}`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    return res.status(200).json({
      status: true,
      message: 'List Data Users',
      data: data
    })
  } catch (error) {
    return (
      res.status(500).json({
        status: false,
        message: error.message
      })
    )
  }
  
});

router.post('/',verifyToken, async function (req, res, next) {
  const body = await req.body
  const { name, password, email } = body

  jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
      if (!payload.admin) return res.sendStatus(401);
      });

  var salt = bcrypt.genSaltSync(10);
  var hashPass = bcrypt.hashSync(password, salt);
  const tokenUser = nanoid();
 
  try {
    const querySql = `INSERT INTO users (id, username, password, email, email_verify, role, token) VALUES (NULL, '${name}', '${hashPass}', '${email}', 'no', 'user', '${tokenUser}')`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    if (data.affectedRows) {
      return res.status(201).json({
        status: true,
        message: 'Berhasil membuat user baru'
      })
    }
    return res.status(400).json({
      status: false,
      message: 'Gagal membuat user baru'
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
})

router.post('/verify', async function (req, res, next) {
  const body = await req.body

  const { password, email } = body

  try {
    const querySql = `SELECT * FROM users WHERE email = '${email}'`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    const user = data[0]

    const verify = bcrypt.compareSync(password, user.password);
    
    if (verify) {
      let admin = user.role == 'admin' ? true : false
      var token = jwt.sign({
        username: user.username,
        admin: admin,
      }, process.env.KEY_JWT)
      // jwt.verify(token, process.env.KEY_JWT, function (err, payload) {
      //   return res.status(200).json({
      //     status: true,
      //     message: 'Berhasil login Sebagai Admin',
      //     payload: payload
      //   })
      // });
        return res.status(200).json({
          status: true,
          message: 'Berhasil login',
          id: user.id,
          username: user.username,
          apiKey: token
        })
      }
      return res.status(400).json({
        status: false,
        message: 'Password salah'
      }) 
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Email tidak dapat ditemukan',
      error: error,
    })
  }
})


router.put('/',verifyToken, async function (req, res, next) {
  
  const body = await req.body
  const { id, username, email, role, email_verify } = body

  jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
    if (!payload.admin) return res.sendStatus(401);
    });

  
  try {
    const querySql = `UPDATE users SET username = '${username}', email = '${email}', email_verify = '${email_verify}', role = '${role}' WHERE users.id = ${id}`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    if (data.affectedRows) {
      return res.status(201).json({
        status: true,
        message: 'Berhasil mengubah data user'
      })
    }
    return res.status(400).json({
      status: false,
      message: 'Gagal mengubah data user'
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
});

router.delete('/',verifyToken, async function(req, res, next) {
  const body = await req.body
  const { id } = body

  jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
    if (!payload.admin) return res.sendStatus(401);
    });
  try {
    const querySql = `DELETE FROM users WHERE users.id = ${id}`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    if (data.affectedRows) {
      return res.status(200).json({
        status: true,
        message: 'Berhasil menghapus data user'
      })
    }
    return res.status(400).json({
      status: false,
      message: 'Gagal menghapus data user'
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
});




module.exports = router;
