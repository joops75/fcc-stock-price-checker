const axios = require('axios');
const ip = require('ip').address();
const Stock = require('../models/Stock');


function requestStockSymbol(sym) {
    return axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${process.env.ALPHA_VANTAGE_KEY}`)
}

function findStockSymbol(sym, price, like) {
    const update = like ? { $addToSet: { likes: ip } } : {};
    return Stock.findOneAndUpdate({ stock: sym }, { ...update, $set: { price: price } }, { upsert: true, new: true });
}

module.exports = class {
    async getStockPrice(req, res) {
        const { like } = req.query;
        let { stock } = req.query;
        if (!Array.isArray(stock)) stock = [stock];
        const promises = [];
        for (let symbol of stock) {
            promises.push(requestStockSymbol(symbol));
        }
        const priceData = [];
        await axios.all(promises)
            .then(axios.spread((...stocks) => {
                stocks.forEach(stk => {
                    let symbol = stk.data['Global Quote']['01. symbol'];
                    let price = stk.data['Global Quote']['05. price'];
                    if (symbol) priceData.push({ symbol, price });
                });
            }))
            .catch(() => res.send('stock api server not responding'));

        if (priceData.length === 0) {
            return res.send('invalid stock ticker(s)');
        }
        const priceDataPromises = priceData.map(pd => findStockSymbol(pd.symbol, pd.price, like));
        const priceDataFetched = await Promise.all(priceDataPromises)
                                                .then(data => data)
                                                .catch(() => res.send('database error'));

        if (stock.length === 1) {
            return res.send({
                stockData: {
                    stock: priceDataFetched[0].stock,
                    price: priceDataFetched[0].price,
                    likes: priceDataFetched[0].likes.length
                }
            })
        }
        if (priceDataFetched.length === 2) {
            return res.send({
                stockData: [
                    {
                        stock: priceDataFetched[0].stock,
                        price: priceDataFetched[0].price,
                        rel_likes: priceDataFetched[0].likes.length - priceDataFetched[1].likes.length
                    },
                    {
                        stock: priceDataFetched[1].stock,
                        price: priceDataFetched[1].price,
                        rel_likes: priceDataFetched[1].likes.length - priceDataFetched[0].likes.length
                    }
                ]
            })
        }
        res.send({
            stockData: [
                {
                    stock: priceDataFetched[0].stock,
                    price: priceDataFetched[0].price,
                    rel_likes: priceDataFetched[0].likes.length
                },
                {
                    stock: 'undefined',
                    price: 'undefined',
                    rel_likes: -priceDataFetched[0].likes.length
                }
            ]
        });
    }
}