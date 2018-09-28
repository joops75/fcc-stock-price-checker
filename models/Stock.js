const mongoose = require('mongoose');
const { Schema } = mongoose;

const StockSchema = new Schema({
    stock: String,
    price: String,
    likes: { type: [String], default: [] }
})

module.exports = mongoose.model('Stock', StockSchema);