/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

// var expect = require('chai').expect;
// var MongoClient = require('mongodb');

// const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const StockController = require('../controllers/stockController');

module.exports = function (app) {

  const stockController = new StockController();

  app.route('/api/stock-prices')
    .get(stockController.getStockPrice);
    
};
