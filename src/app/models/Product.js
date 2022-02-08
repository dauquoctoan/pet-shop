const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Product = new Schema(
    {
      name: { type: String, required: true },
      description: { type: String },
      price: { type: Number, required: true},
      priceold: { type: Number },
      color: { type: String },
      image: { type: String , required: true },
      quantity: { type: Number },
      status: { type: String , enum: ['New', 'Limited','']},
      category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
      }
    },
    {
        timestamps: true,
    },
);


module.exports = mongoose.model('Product', Product);
