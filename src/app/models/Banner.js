const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Banner = new Schema(
    {
        name: {type: String, required: true},
        description: {type: String, require: true},
        image: {type: String, required: true},
        active: {type: String, enum:['Hiển thị', 'Ẩn'], required: true},
        position: {type: String, enum: ['top', 'centerLeft', 'centerRight', 'bottomLeft', 'bottomRight']},
        category: {
          type: Schema.Types.ObjectId,
          ref: 'Category'
        }
    },
    {
        timestamps:  true
    }
);

module.exports = mongoose.model('Banner', Banner);
