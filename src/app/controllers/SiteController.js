const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Banner = require('../models/Banner');
const url = require('url');
const { mutipleMongooseToObject, mongooseToObject } = require('../../util/mongoose');


class SiteController {
    // [GET] /
    async index(req, res, next) {
        try {
            const product = await Product.find().limit(8)
            const category = await Category.find()
            const bannerTop = await Banner.findOne({position: 'top', active:'Hiển thị'})
            const bannerCenterLeft =await Banner.findOne({position: 'centerLeft', active:'Hiển thị'})
            const bannerCenterRight =await Banner.findOne({position: 'centerRight', active:'Hiển thị'})
            const bannerBottomLeft =await Banner.findOne({position: 'bottomLeft', active:'Hiển thị'})
            const bannerBottomRight =await Banner.findOne({position: 'bottomRight', active:'Hiển thị'})
            
            res.render('home',{
                Product: mutipleMongooseToObject(product),
                Category: mutipleMongooseToObject(category),
                BannerTop: mongooseToObject(bannerTop),
                BannerCenterLeft: mongooseToObject(bannerCenterLeft),
                BannerCenterRight: mongooseToObject(bannerCenterRight),
                BannerBottomLeft: mongooseToObject(bannerBottomLeft),
                BannerBottomRight: mongooseToObject(bannerBottomRight),
                title:'Trang chủ'
            })
        } catch (error) {
            res.render('error',{error:'Tải sản phẩm không thành công !'})
        }
    }

    // [GET] /search
    async search(req, res) {
        const data = await url.parse(req.url, true).query;
        const product = await Product.find({name: { $regex: '.*' + data.search + '.*' } });
        const category = await Category.find()
        return res.render('user/product', {
            Product: mutipleMongooseToObject(product),
            Category: mutipleMongooseToObject(category),
            title:'Sản phẩm'
        })
    }

    async productByCategory(req, res, next) {
        try {
            const pageIndex = await url.parse(req.url, true).query;
            let limitPage = 12;
            const products = await Product.find({category: req.params._id})
            const totalPage = Math.ceil(products.length / limitPage);
            const page = (Number.parseInt(pageIndex.page) || 1) <totalPage ? (Number.parseInt(pageIndex.page) || 1): totalPage
            const CategoryId= await Category.findOne({_id: req.params._id})
            const product = await Product.find({category: req.params._id}).skip((page*limitPage)-limitPage).limit(limitPage);
            const category = await Category.find()
            
            
            res.render('user/product', {
                Product: mutipleMongooseToObject(product),
                CategoryId: mongooseToObject(CategoryId),
                Category: mutipleMongooseToObject(category),
                page,
                totalPage,
                title:'Sản phẩm'
            })
            
        } catch (error) {
            res.render('error',{error:'Tải sản phẩm không thành công !',title:'error'})
        }

    }

    async cart(req, res){
        if(!req.session.cart){
            res.render('error',{error: 'Giỏ hàng trống!'})
        }
        else{
            const products = req.session.cart
            const totalPrice = await products.reduce((total, item)=>{
                return total + Number.parseInt(item.totalPrice)
            },0)
            return res.render('user/cart',{
                Product: products,
                Price: totalPrice,
                TotalPrice: totalPrice + 30000
            })
        }
    }

    async addToCart(req, res){
        const {quantity} = req.body
        try {
            const product = await Product.findOne({_id: req.params.id});
            if(!req.session.cart||''){
                req.session.cart = [{_id: product._id, name: product.name, price: product.price, image: product.image, quantity: quantity, totalPrice: product.price * quantity}]
                return res.redirect('/')
            }
            else{
                const cartOld = req.session.cart
                const result = cartOld.find(element => element._id == req.params.id);
                if(!result){
                    req.session.cart = [...cartOld,{_id: product._id, name: product.name, price: product.price, image: product.image, quantity: quantity, totalPrice: product.price * quantity}]
                    return  res.redirect('/')
                }
                else{
                    const newCart = cartOld.map((item)=>{
                        if(item._id == req.params.id){
                            const newQuantity = Number.parseInt(item.quantity)+ Number.parseInt(quantity)
                            return {...item, quantity: newQuantity, totalPrice: newQuantity*product.price}
                        }else{
                            return item
                        }
                    })
                    req.session.cart = newCart
                    return  res.redirect('/')
                }
            }
        } catch (error) {
            return res.render('error',{error: error})
        }
    }
    async updateCart(req, res){
        const {quantity} = req.body
        try {
            const product = await Product.findOne({_id: req.params.id});
            const cartOld = req.session.cart
            const newCart = cartOld.map((item)=>{
                if(item._id == req.params.id){
                    return {...item, quantity: quantity, totalPrice: quantity * product.price}
                }else{
                    return item
                }
            })
            req.session.cart = newCart
            return  res.redirect('/cart')
        } catch (error) {
            return res.render('error',{error: error})
        }
    }

    deleteItemCart(req, res){
        try {
            const cartOld = req.session.cart
            const cart = cartOld.filter(item=>{
                if(item._id === req.params.id){
                    return false
                }
                else{
                    return true
                }
            })
            req.session.cart = cart
            res.redirect('/cart')
        } catch (error) {
            return res.render('error',{error: error})
        }
    }
    
    checkout(req, res){
        res.render('user/checkout')
    }
    
    order(req, res){
        const {fullName, address, phoneNum} = req.body
        const cart = req.session.cart
        if(cart==[] || !cart){
            return res.render('error',{error: 'Không có sản phẩm nào trong giỏ'})
        }
        else{
            try {
                const order = new Order({
                    fullName,
                    address,
                    phoneNum,
                    products: cart,
                    status:'Đang chờ'
                })
                order.save()
                return res.redirect('/')
            } catch (error) {
                return res.render('error',{error: error})
  
            }
        }
    }

    async productDetail(req, res){
        try {
            const product =  await Product.findOne({_id: req.params.id})
            res.render('user/product-detail',{
                Product: mongooseToObject(product)
            })
        } catch (error) {
            return res.render('error',{error: error})
            
        }
    }
    
}

module.exports = new SiteController();
