'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const expect      = require('chai').expect;
const cors        = require('cors');
const helmet      = require('helmet');
const mongoose    = require('mongoose');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

require('dotenv').config();
const port = process.env.PORT || 3000;

const app = express();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

// required contentSecurityPolicy can't be used or else page won't function
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     defaultSrc: ["'self'"],
//     styleSrc: ["'self'"]
//   }
// }));

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'https://hyperdev.com', 'http://glitch.com'],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://code.jquery.com'],
    styleSrc: ["'self'", "'unsafe-inline'"]
  }
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(port, function () {
  console.log("Listening on port " + port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        const error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
