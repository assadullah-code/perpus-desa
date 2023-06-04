var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({
    status: 200,
    Message: "Server Jalan Boss" 
  });
});

module.exports = router;
