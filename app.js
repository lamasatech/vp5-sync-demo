const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const router = express.Router();

router.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
  //__dirname : It will resolve to your project folder.
});


// Allow Cross-Origin requests
app.use(cors());


app.use(express.static('public'))
app.all('/', (request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});
//add the router
app.use('/', router);
app.listen(process.env.port || 9000);

console.log('Running at Port 9000');