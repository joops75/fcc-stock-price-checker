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
// use puppeteer as jQuery function in index.html needs to be triggered and handled to deal with simultaneous stock requests
const puppeteer = require('puppeteer');
require('dotenv').config();

chai.use(chaiHttp);

let browser;
let page;
let stock;
let stock1;
let stock2;
let re;
// standard call-frequency limit of Alpha Vanatge is 5 requests per minute
const waitBetweenTests = 30000;
const numberOfAPICalls = 5;

function oneStockRe(stk, like) {
  return new RegExp('^{"stockData":{"stock":"' + stk +'","price":"\\d+\\.?\\d+","likes":' + like +'}}$');
}

function twoStocksRe(stk1, stk2, like1, like2) {
  return new RegExp('^{"stockData":\\[{"stock":"' + stk1 +'","price":"\\d+\\.?\\d+","rel_likes":' + like1 +'},{"stock":"' + stk2 +'","price":"\\d+\\.?\\d+","rel_likes":' + like2 +'}]}$');
}

suite('Functional Tests', function() {

  this.timeout(numberOfAPICalls * waitBetweenTests);
    
  suiteSetup(async () => {
    await mongoose.connection.dropDatabase()
    browser = await puppeteer.launch({
      headless: true // default is true
    });
    page = await browser.newPage();
    await page.goto(process.env.HOME_PAGE);
  });

  suiteTeardown(async () => {
    await page.close();
    await browser.close();
  });

    suite('GET /api/stock-prices => stockData object', () => {

      test('1 stock', async () => {
        stock = 'GOOG';
        await page.type('input[name=stock]', stock);
        await page.click('button[type=submit]', { delay: 100 });
        await page.waitFor(waitBetweenTests);
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        re = oneStockRe(stock, 0);
        assert.isTrue(re.test(serverResponseText));
      });
      
      test('1 stock with like', async () => {
        await page.click('input[type=checkbox]');
        await page.click('button[type=submit]', { delay: 100 });
        await page.waitFor(waitBetweenTests);
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        re = oneStockRe(stock, 1);
        assert.isTrue(re.test(serverResponseText));
      });
      
      test('1 stock with like again (ensure likes arent double counted)', async () => {
        await page.click('button[type=submit]', { delay: 100 });
        await page.waitFor(waitBetweenTests);
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        re = oneStockRe(stock, 1);
        assert.isTrue(re.test(serverResponseText));
      });
      
      test('2 stocks', async () => {
        stock1 = 'A';
        stock2 = 'AA';
        await page.type('#stock1Input', stock1);
        await page.type('#stock2Input', stock2);
        await page.click('#testFormSubmit', { delay: 100 });
        await page.waitFor(waitBetweenTests);
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        re = twoStocksRe(stock1, stock2, 0, 0);
        assert.isTrue(re.test(serverResponseText));
      });
      
      test('2 stocks with like', async () => {
        await page.focus('#stock1Input');
        for (let i = 0; i < stock1.length; i ++)
          await page.keyboard.press('Backspace');
        await page.focus('#stock2Input');
        for (let i = 0; i < stock2.length; i ++)
          await page.keyboard.press('Backspace');
        stock1 = 'GOOG';
        stock2 = 'MSFT';
        await page.type('#stock1Input', stock1);
        await page.type('#stock2Input', stock2);
        await page.click('#doubleLikeCheckbox');
        await page.click('#testFormSubmit', { delay: 100 });
        await page.waitFor(2000);
        const serverResponseText = await page.$eval('code#jsonResult', el => el.innerHTML);
        re = twoStocksRe(stock1, stock2, 0, 0);
        assert.isTrue(re.test(serverResponseText));
      });
     
  });

});
