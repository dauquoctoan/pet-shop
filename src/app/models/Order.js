const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Order = new Schema(
    {
        fullName: {type: String, required: true},
        address: {type: String, require: true},
        phoneNum: {type: String, required: true},
        products: {type: Array, required: true},
        status: {type: String, enum:['Đã giao', 'Đang chờ', 'Đang giao', 'Đã hủy']},
    },
    {
        timestamps:  true
    }
);

module.exports = mongoose.model('Order', Order);
