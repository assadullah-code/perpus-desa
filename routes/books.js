var express = require('express');
const { query } = require("../lib/db");
const { nanoid } = require('nanoid')
const multer = require("multer");
const path = require("path");
const pdf2img = require('pdf-img-convert');
const fs = require('fs');
const jwt = require('jsonwebtoken')
var router = express.Router();



const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/files"));
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
  },
});

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
  
router.get('/', async function(req, res, next) {
  try {
    const querySql = "SELECT * FROM books";
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    return res.status(200).json(
      data.map((buku) => {
      return {
        id: buku.id_book,
        title: buku.judul,
        desciption: buku.ringkasan,
        url: buku.file,
        url_image: buku.image
      }
    })
    )
  } catch (error) {
    return (
      res.status(500).json({
        status: false,
        message: error.message
      })
    )
  }
});

router.get('/web', async function(req, res, next) {
  try {
    const querySql = "SELECT * FROM books";
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    return res.status(200).json(
    {
      status: true,
      message: 'List Data Books',
      data: data
      }
    )
  } catch (error) {
    return (
      res.status(500).json({
        status: false,
        message: error.message
      })
    )
  }
});


router.get('/id/:idBook', async function (req, res, next) {
    const idBook = req.params.idBook
  try {
    const querySql = `SELECT * FROM books WHERE books.id_book = '${idBook}'`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    return res.status(200).json({
      status: true,
      message: `Data Buku dengan id ${idBook}`,
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

router.get('/judul/:judul', async function (req, res, next) {
  const judul = req.params.judul
try {
  const querySql = `SELECT * FROM books WHERE books.judul LIKE '%${judul}%'`;
  const valueParams = [];
  const data = await query({ query: querySql, values: valueParams });
  return res.status(200).json({
    status: true,
    message: `Data Buku dengan judul ${judul}`,
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

router.get('/kategori/:kategori', async function (req, res, next) {
    
    const kategori = req.params.kategori
  try {
    const querySql = `SELECT * FROM books WHERE books.kategori = '${kategori}'`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    return res.status(200).json({
      status: true,
      message: `Data Buku dengan kategori ${kategori}`,
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

router.post('/',verifyToken, multer({ storage: diskStorage }).single('file'), async function (req, res, next) {
    
  const body = await req.body
  
  const { judul, penulis, tahun, penerbit, kategori, ringkasan, } = body
  
  jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
    if (!payload.admin) return res.sendStatus(401);
  });

  function mysqlDate(date = new Date()) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }  
  
  const created_at = mysqlDate()
  
  const updated_at = created_at
  
  const BASE_URL = 'http://localhost:5000/'

  const fileName = req.file.filename

  const urlFileName = BASE_URL + 'books/pdf   /' + fileName

  const image = `${fileName}.png`

  const urlImage = BASE_URL + 'books/view/' + image

  var outputImages2 = pdf2img.convert(
    `./public/files/${fileName}`,{  page_numbers: [1] }
  );
  
  outputImages2.then(function(outputImages) {
        fs.writeFile("./public/images/"+`${fileName}`+".png", outputImages[0], function (error) {
          if (error) { console.error("Error: " + error); }
        });
    });
  
    const id = nanoid()
    
    try {
        const querySql = `INSERT INTO books (id_book, judul, penulis, tahun, penerbit, kategori, ringkasan, file, image, created_at, updated_at) VALUES ('${id}', '${judul}', '${penulis}', ${tahun}, '${penerbit}',  '${kategori}', '${ringkasan}', '${urlFileName}', '${urlImage}', '${created_at}', '${updated_at}')`;
        const valueParams = [];
        const data = await query({ query: querySql, values: valueParams });
        if (data.affectedRows) {
          return (
            res.status(201).json({
            status: true,
            message: 'Berhasil membuat buku baru',
            file: `${fileName}`
              }))
    }
    return res.status(400).json({
      status: false,
      message: 'Gagal membuat buku baru'
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
})

router.put('/',verifyToken, async function (req, res, next) {
  
  const body = await req.body
  const { id, judul, penulis, tahun, penerbit, kategori, ringkasan } = body


    jwt.verify(req.token, process.env.KEY_JWT, function (err, payload) {
      if (!payload.admin) return res.sendStatus(401);
      });
  
  try {
    const querySql = `UPDATE books SET judul = '${judul}', penulis = '${penulis}', tahun = '${tahun}', penerbit = '${penerbit}', kategori = '${kategori}', ringkasan = '${ringkasan}' WHERE id_book = '${id}'`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    if (data.affectedRows) {
      return res.status(201).json({
        status: true,
        message: 'Berhasil mengubah data buku'
      })
    }
    return res.status(400).json({   
      status: false,
      message: 'Gagal mengubah data buku'
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
    const querySql = `DELETE FROM books WHERE books.id_book = '${id}'`;
    const valueParams = [];
    const data = await query({ query: querySql, values: valueParams });
    if (data.affectedRows) {
      return res.status(200).json({
        status: true,
        message: 'Berhasil menghapus data buku'
      })
    }
    return res.status(400).json({
      status: false,
      message: 'Gagal menghapus data buku'
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message
    })
  }
});


router.post('/upload' ,async function(req, res, next) {
    const file = req.file.path;
    console.log(file);
    if (!file) {
      res.status(400).send({
        status: false,
        data: "No File is selected.",
      });
    }
    res.send(req.file.filename);
  });

router.get('/download/:name', async function(req, res, next) {
  // cors({
  //   exposedHeaders: ['Content-Disposition'],
  // }),
    async (req, res) => {
      const fileName = req.params.name;
    try {
      const fileURL = './public/files'
      const stream = fs.createReadStream(fileURL);
      res.set({
        'Content-Disposition': `attachment; filename='${fileName}'`,
        'Content-Type': 'application/pdf',
      });
      stream.pipe(res);
    } catch (e) {
      console.error(e)
      res.status(500).end();
    } 
  };
})

router.get('/image/:name', async function(req, res, next) {
        const fileName = req.params.name;
        const directoryPath = "./public/images/";
        try {
          res.download(directoryPath + fileName)
          next()
        } catch (error) {
          res.status(500).send({
            message: "Could not download the file. " + err,
          });
        }
})

router.get('/view/:name', async function(req, res, next) {
        const fileName = req.params.name;
        const directoryPath = "/images/";
        const pic = directoryPath + fileName
        res.render('pages/index', { title: 'Image' , pic: pic } );
})

router.get('/pdf/:name', async function(req, res, next) {
  const fileName = req.params.name;
  const directoryPath = "./public/files";
  const pic = path.join(directoryPath)
  const options = {
    root: pic
    };
  res.sendFile(fileName, options, function (err) {
    if (err) {
        next(err);
    } else {
        console.log('Sent:', fileName);
    }
  });
  // return res.render('pages/pdf', { file: pic } );
})


module.exports = router;
