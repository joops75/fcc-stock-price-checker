/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const mongoose = require('mongoose');
const server = require('../server');
const puppeteer = require('puppeteer');
require('dotenv').config();

chai.use(chaiHttp);

let browser;
let page;

suite('Functional Tests', function() {

  this.timeout(10000);

  suiteSetup(done => {
    mongoose.connection.dropDatabase()
      .then(() => done())
      .catch(err => { throw err; })
  });

    suite('GET /api/stock-prices => stockData object. Get 2 stocks.', function() {

      this.timeout(10000);
      
      suiteSetup(async function() {
        browser = await puppeteer.launch({
          headless: true // default is true
        })
      });

      setup(async function() {
        page = await browser.newPage();
        await page.goto(process.env.HOME_PAGE);
      });

      teardown(async function() {
        await page.close();
      });

      suiteTeardown(async () => {
        await browser.close();
      });

      test('2 stocks', async function() {// use puppeteer as jQuery function in index.html needs to be triggered to handle multiple stocks
        const stock1 = 'GOOG';
        const stock2 = 'MSFT';
        await page.type('#stock1Input', stock1);
        await page.type('#stock2Input', stock2);
        await Promise.all([
          page.waitFor(2000),
          page.click('#testFormSubmit')
        ])
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        const re = new RegExp('^{"stockData":\\[{"stock":"' + stock1 +'","price":"\\d+\\.?\\d+","rel_likes":0},{"stock":"' + stock2 +'","price":"\\d+\\.?\\d+","rel_likes":0}]}$')
        assert.isTrue(re.test(serverResponseText));
      });
      
      test('2 stocks with like', async function() {
        const stock1 = 'A';
        const stock2 = 'AA';
        await page.type('#stock1Input', stock1);
        await page.type('#stock2Input', stock2);
        await Promise.all([
          page.waitFor(2000),
          page.click('#doubleLikeCheckbox'),
          page.click('#testFormSubmit', { delay: 100 })// use delay or else sometimes checkbox click doesn't register first
        ])
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        const re = new RegExp('^{"stockData":\\[{"stock":"' + stock1 +'","price":"\\d+\\.?\\d+","rel_likes":0},{"stock":"' + stock2 +'","price":"\\d+\\.?\\d+","rel_likes":0}]}$')
        assert.isTrue(re.test(serverResponseText));
      });
      
    });
    
    suite('GET /api/stock-prices => stockData object. Get 1 stock.', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog' })
        .end(function(err, { status, body }){
          const { stockData } = body;
          assert.equal(status, 200);
          assert.hasAllKeys(body, ['stockData']);
          assert.hasAllKeys(stockData, ['stock', 'price', 'likes']);
          assert.equal(stockData.stock, 'GOOG');
          assert.isString(stockData.price);
          assert.strictEqual(stockData.likes, 0);
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({
            stock: 'msft',
            like: true
          })
          .end((err, { status, body }) => {
            const { stockData } = body;
            assert.equal(status, 200);
            assert.hasAllKeys(body, ['stockData']);
            assert.hasAllKeys(stockData, ['stock', 'price', 'likes']);
            assert.equal(stockData.stock, 'MSFT');
            assert.isString(stockData.price);
            assert.strictEqual(stockData.likes, 1);
            done();
          });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({
            stock: 'msft',
            like: true
          })
          .end((err, { status, body }) => {
            const { stockData } = body;
            assert.equal(status, 200);
            assert.hasAllKeys(body, ['stockData']);
            assert.hasAllKeys(stockData, ['stock', 'price', 'likes']);
            assert.equal(stockData.stock, 'MSFT');
            assert.isString(stockData.price);
            assert.strictEqual(stockData.likes, 1);
            done();
          });
      });
       
    });

});
