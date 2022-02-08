const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const User = new Schema(
    {
        userName: { type: String, required: true },
        passWord: {type: String, require: true},
        fullName:{type: String, required: true},
        email: {type: String},
        phoneNum: {type: String},
        address: {type: String},
        position: {type: String, enum: ['STAFF', 'ADMIN']},
        image:{type:  String,required: true}
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('User', User);
