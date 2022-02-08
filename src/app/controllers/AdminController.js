const path = require('../../path');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const {unlink} = require('fs');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Banner = require('../models/Banner');
const User = require('../models/User');
const url = require('url');

const { mutipleMongooseToObject,mongooseToObject } = require('../../util/mongoose');

class AdminController{
    async home(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            const product = await Product.find()
            res.render('admin/product',{ 
                Product: mutipleMongooseToObject(product),
                User: mongooseToObject(user),
                layout:'admin'
            })
        } catch (error) {
            res.render('error', {error: error})
        }
    }
    // [GET] /me/login
    login(req, res){
        res.render('admin/login',{title: 'Đăng nhập'})
    }
    // [GET] /me/register
    register(req, res){
        res.render('admin/register',{title:'Đăng kí'})
    }

    // [POSt] /me/register
    async createUser(req, res){
        const {userName, passWord, fullName, email, address, phoneNum} = req.body
        if(!userName || !passWord || !fullName ||!email || !address || !phoneNum){
            res.render('admin/register',{'error': 'Các trường thông tin phải điền đầy đủ'})
        }
        try {
            const user = await User.findOne({userName: userName})
            if(user){
                res.render('admin/register',{'error': 'Tài khoản đã tồn tại'})
            }else{
                const hashedPassword = await argon2.hash(passWord)
                const newUser = new User({
                    userName,
                    passWord: hashedPassword,
                    fullName,
                    email,
                    phoneNum,
                    address,
                    position: 'STAFF',
                })
                await newUser.save()
                // const accessToken = jwt.sign({userId: newUser._id, position: newUser.position}, process.env.ACCESS_TOKEN_SECRET)
                res.redirect('/admin/login')
            }
        } catch (error) {
            console.log(error)
            res.render('error',{error:'Tạo tài khoản không thành công !', title: 'error'})
        }
    }
    logout(req, res){
        if(!req.cookies.accessToken){
            return res.render('error',{error: 'Không tồn tại phiên!'})
        }
        try {
            res.clearCookie('accessToken')
            res.redirect('/')
        } catch (error) {
            return res.render('error',{error: error})
        }
    }
    // [POST] /me/login
    async auth(req, res){
        const {userName, passWord} = req.body
        if(!userName||!passWord){
            return res.render('admin/login',{error: 'Tên tài khoản và mật khẩu không được bỏ trống !'})
        }
        try {
            const  user = await User.findOne({userName})
            if(!user){
                return res.render('admin/login',{error: 'Tài khoản không tồn tại !'})
            }
            const passwordValid = await argon2.verify(user.passWord, passWord)
            if(!passwordValid){
                return res.render('admin/login',{error: 'Tên tài khoản hoặc mật khẩu không chính xác !'})
            }
            const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET)
            // req.session.accessToken = {value: accessToken}
            res.cookie('accessToken', accessToken)
            res.redirect('/admin')

        } catch (error) {
            res.render('error',{error: 'Đăng nhập không thành công !', error: 'error'})
        }
    }

    async addProduct(req, res, next){
        const category = await Category.find()
        const user = await User.findOne({_id: req.userId})
        res.render('admin/add-product',{
            User: mongooseToObject(user),
            layout: 'admin',
            Category:  mutipleMongooseToObject(category)
        })
    }

    async createProduct(req, res){
        const {name, description, price, priceold, color, quantity, status, category} = req.body
        if(!req.files || Object.keys(req.files).length === 0|| !name || !description || !price || !quantity || !category){
            return res.redirect('/admin/product/add')
        }
        const product = await Product.findOne({name: name})
        if(!product){
            let sampleFile = req.files.image;
            let fileName = Date.now()+ sampleFile.name
            let uploadPath = path() + '\\public\\img\\' +fileName;

            await sampleFile.mv(uploadPath, function(err) {
                if (err)
                return res.render('error',{error: err});
            });
            const product = new Product({
                name,
                description,
                price,
                priceold,
                color,
                quantity,
                status,
                category,
                image:`/img/${fileName}`
            })  
            await product.save()
            return res.redirect('/admin')
        }else{
            const category = await Category.find()
            const user = await User.findOne({_id: req.userId})
            res.render('admin/add-product',{
                User: mongooseToObject(user),
                layout: 'admin',
                Category:  mutipleMongooseToObject(category),
                error: 'Sản phẩm  đã tồn tại !'
            })
        }
    }

    async deleteProduct(req, res){
        const result = await Product.findOneAndDelete({_id: req.params.id })
        const pathImage = await path()+'\\public'+result.image;
        try {
            unlink( pathImage, (err) => {
                if (err) throw err;
                    console.log('image was deleted');
                });
                return res.redirect('/admin')
        } catch (error) {
            return res.render('error',{error: error});
        }
    }

    async editProduct(req, res){
        try {
            const product = await Product.findOne({ _id: req.params.id }). populate('category',['name'])
            const category = await Category.find()
            const user = await User.findOne({_id: req.userId})
            res.render('admin/edit-product',{
                User: mongooseToObject(user),
                layout: 'admin',
                Product: mongooseToObject(product),
                Category: mutipleMongooseToObject(category),
            })
            
        } catch (error) {
            res.render('error', {error: 'error'})
        }
    }
    async update(req, res){
        const {name, description, price, priceold, color, quantity, category} = req.body
            if(!req.files || Object.keys(req.files).length === 0){
                const productOld = await Product.findOne({_id: req.params.id})
                await Product.findOneAndUpdate({_id: req.params.id},{
                    name, 
                    description, 
                    price, 
                    priceold, 
                    color, 
                    quantity, 
                    category,
                    image: productOld.image
                })
                return res.redirect('/admin')
               
            }
            else{
                let sampleFile= req.files.image;
                let fileName= Date.now()+ sampleFile.name;
                let uploadPath= path() + '\\public\\img\\' +fileName;
                if(fileName){
                    await sampleFile.mv(uploadPath, function(err) {
                        if (err)
                        return res.render('error',{error: err});
                    });
                }
                await Product.findOneAndUpdate({_id: req.params.id},{
                    name, 
                    description, 
                    price, 
                    priceold, 
                    color, 
                    quantity, 
                    category,
                    image: `/img/${fileName}`
                })
                return res.redirect('/admin')
            }
       
    }

    async searchProduct(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            const data = await url.parse(req.url, true).query;
            const product = await Product.find({name: { $regex: '.*' + data.search + '.*' } });
            res.render('admin/product', {
                User: mongooseToObject(user),
                layout: 'admin',
                Product: mutipleMongooseToObject(product),
                title:'Sản phẩm'
            })
        } catch (error) {
            res.render('error',{error: error})
        }
    }
    async searchStaff(req, res){
        try {
            const data = await url.parse(req.url, true).query;
            const users = await User.find({userName: { $regex: '.*' + data.search + '.*' } });
            const user = await User.findOne({_id: req.userId})
            res.render('admin/staff', {
                User: mongooseToObject(user),
                layout: 'admin',
                Staff: mutipleMongooseToObject(users),
                title:'Nhân viên'
            })
        } catch (error) {
            res.render('error',{error: error})
        }
    }
    async staff(req, res){
        try {
            const users = await User.findOne({_id: req.userId})
            User.find()
            .then((user) => {
                res.render('admin/staff',{
                    layout: 'admin',
                    User: mongooseToObject(users),
                    Staff: mutipleMongooseToObject(user)
                })
            }).catch((err) => {
                res.render('error',{error: err})    
            });
        } catch (error) {
            res.render('error',{error: error})
        }
    }

    async addStaff(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            res.render('admin/add-staff',{
                layout: 'admin',
                User: mongooseToObject(user)
            })
        } catch (error) {
            res.render('error',{error: error})
        }
    }

    async createStaff(req, res){
        // res.render('admin/add-staff',{layout: 'admin'})
        const {userName, passWord, fullName, email, phoneNum, address, position} = req.body
        if(!req.files || Object.keys(req.files).length === 0||!userName || !passWord || !fullName ||!email || !address || !phoneNum){
            return res.render('admin/add-staff',{layout: 'admin','error': 'Các trường thông tin phải điền đầy đủ!'})
        }
        try {
            const user = await User.findOne({userName: userName})
            if(user){
                return res.render('admin/add-staff',{layout: 'admin','error': 'Tài khoản đã tồn tại!'})
            }else{
                
                let sampleFile = req.files.image;
                let fileName = Date.now()+ sampleFile.name
                let uploadPath = path() + '\\public\\img\\' + fileName;
                const hashedPassword = await argon2.hash(passWord)
                const newUser = new User({
                    userName,
                    passWord: hashedPassword,
                    fullName,
                    email,
                    phoneNum,
                    address,
                    position,
                    image: `/img/${fileName}`
                })
                await newUser.save()
                await sampleFile.mv(uploadPath, function(err) {
                    if (err)
                    return res.render('error',{error: err});
                });
                return res.redirect('/admin/staff')
            }
            
        } catch (error) {
            console.log(error)
            res.render('error',{error: error, title: 'error'})
        }
    }
    
    editStaff(req, res){
        User.findOne({_id: req.params.id})
        .then((user) => {
            res.render('admin/edit-staff',{layout: 'admin', User: mongooseToObject(user)})  
        }).catch((err) => {
            res.render('error',{error: err})
        });
    }

    async updateStaff(req, res){
        const {userName, passWord, fullName, email, phoneNum, address, position} = req.body

        if(!req.files || Object.keys(req.files).length === 0){
            try{
                const userOld = await User.findOne({_id: req.params.id})
                const hashedPassword = await argon2.hash(passWord)
                const result = await User.findOneAndUpdate({_id: req.params.id},{
                    userName,
                    passWord: userOld.passWord == passWord  ?  passWord : hashedPassword, 
                    fullName, 
                    email, 
                    phoneNum, 
                    address, 
                    position,
                    image: userOld.image
                    
                }) 
                if(!result){
                    return render('error',{error: "Sửa nhân viên không thành công"})
                }
                return res.redirect('/admin/staff')
            }catch(err){
                return  res.render('error',{error: err})
            }
        }
        else{
            const userOld = await User.findOne({_id: req.params.id})
            let sampleFile = req.files.image;
            let fileName = Date.now()+ sampleFile.name
            let uploadPath= path() + '\\public\\img\\' +fileName;
            const hashedPassword = await argon2.hash(passWord)
            const result = await User.findOneAndUpdate({_id: req.params.id},{
                userName,
                passWord: userOld.passWord == passWord  ?  passWord : hashedPassword, 
                fullName, 
                email, 
                phoneNum, 
                address, 
                position,
                image: `/img/${fileName}`
            })
            await sampleFile.mv(uploadPath, function(err) {
                if (err)
                return res.render('error',{error: err});
            });
            if(!result){
                return res.render('error', {error:"Sửa không thành công !"})
            }
            else{
                return res.redirect('/admin/staff') 
            }
        }

    }

    async deleteStaff(req, res){
        const result = await User.findOneAndDelete({_id: req.params.id})
        const pathImage = await path()+'\\public'+result.image;
        try {
            unlink(pathImage, () => {
                return res.redirect('/admin/staff')        
            });
        } catch (error) {
            return res.render('error',{error: error});
        }
    }

    // [GET] /me/stored/courses
    async category(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            const category = await Category.find()
            res.render('admin/category',{
                User: mongooseToObject(user),
                layout: 'admin',
                Category: mutipleMongooseToObject(category)
            })
        } catch (error) {
            res.render('error',{error: error})
        }
    }


    async addCategory(req, res){
        const user = await User.findOne({_id: req.userId})
        res.render('admin/add-category',{
            layout: 'admin',
            User: mongooseToObject(user)
        })
    }


    createCategory(req, res){
        const {name, description} = req.body
        try {
            const category = new Category({name, description})
            category.save()
            return res.redirect('/admin/category')

        } catch (error) {
            return res.render('error',{error: error})
        }
    }

    async editCategory(req, res){
        try {
        const user = await User.findOne({_id: req.userId})
            const category = await Category.findOne({_id: req.params.id})
            res.render('admin/edit-category',{
                layout: 'admin', 
                Category: mongooseToObject(category),
                User: mongooseToObject(user)
            })
        } catch (error) {
            return res.render('error',{error: error})
        }
    }

    async updateCategory(req, res){
        try {
            const {name, description} = req.body
            const result = await Category.findOneAndUpdate({_id: req.params.id},{name: name,description: description})  
            if(!result){
                return res.render('error',{error: 'Sửa thất bại'})
            }          
            return res.redirect('/admin/category')
        } catch (error) {
            return res.render('error',{error: error})
        }
    }

    async deleteCategory(req, res){
        try {
            await Category.findOneAndDelete({_id: req.params.id})
            return res.redirect('/admin/category')
        } catch (error) {
            return res.render('error',{error: error})
            
        }
    }
    
    async ordered(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            const order = await Order.find().sort({createdAt:-1})
            return res.render('admin/ordered',{
                layout: 'admin',
                User: mongooseToObject(user),
                Order: mutipleMongooseToObject(order)
            })
        } catch (error) {
            return render('error',{error: error})
        }
    }

    async orderedDetail(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            const order = await Order.findOne({_id: req.params.id})
            const totalPrice = await order.products.reduce((total, item)=>{
                return total + Number.parseInt(item.totalPrice)
            },0)
            return res.render('admin/oder-detail',{
                layout:'admin',
                Product: order.products,
                Order: mongooseToObject(order),
                TotalPrice: totalPrice + 30000,
                User: mongooseToObject(user)
            })
        } catch (error) {
            return res.render('error',{error: error})
        }
    }
    async updateStatusOrder(req, res){
        try {
            const result = await Order.findOneAndUpdate({_id: req.params.id},{status: req.body.status})
            if(!result){
               return  res.render('error',{error: error})
            }
            res.redirect('/admin/ordered')
        } catch (error) {
            return render('error',{error: error})
        }
    }
    async searchCategory(req, res){
        const data = await url.parse(req.url, true).query;
        try {
            const user = await User.findOne({_id: req.userId})
            const category = await Category.find({name: { $regex: '.*' + data.search + '.*' } });
            res.render('admin/category',{
                layout: 'admin',
                User: mongooseToObject(user),
                Category: mutipleMongooseToObject(category)
            })
        } catch (error) {
            return res.render('error',{error: error})
        }
    }

    async searchOrder(req,res){
        const data = await url.parse(req.url, true).query;
        try {
            const order1 = await Order.find({fullName: { $regex: '.*' + data.search + '.*' } });
            const order2 = await Order.find({phoneNum: { $regex: '.*' + data.search + '.*' } });
            const orderAll = [...order1,...order2]
            res.render('admin/ordered',{
                layout: 'admin',
                Order: mutipleMongooseToObject(orderAll)
            })
        } catch (error) {
            return render('error',{error: error})
        }
    }
    async banner(req, res){
        try {
            const user = await User.findOne({_id: req.userId})
            const active = await Banner.find({active: 'Hiển thị'})
            const noActive = await Banner.find({active: 'Ẩn'})
            res.render('admin/banner',{
                layout: 'admin', title: 'Banners', 
                BannerActive: mutipleMongooseToObject(active),
                Banner: mutipleMongooseToObject(noActive),
                User: mongooseToObject(user)
            })
        } catch (error) {
            res.render('error', {error: error})
            
        }
    }
    async addBanner(req, res){
        const user = await User.findOne({_id: req.userId})
        Category.find().then((result) => {
            res.render('admin/add-banner',{
                layout: 'admin',
                title: 'Thêm banner', 
                Category: mutipleMongooseToObject(result),
                User: mongooseToObject(user)
            })
        }).catch((err) => {
            res.render('error', {error: err})
        }); 
    }
    async createBanner(req, res){
        const {name, description, position, category} = req.body
        if(!req.files || Object.keys(req.files).length === 0||!name || !description||!position||!category){
            Category.find().then((result) => {
                return res.render('admin/add-banner',{layout: 'admin', title: 'Thêm banner', Category: mutipleMongooseToObject(result), error: 'Các trường thông tin phải  được nhập đầy đủ !'})
            }).catch((err) => {
                return res.render('error', {error: err})
            });
        }
        else{
            try {
                const banners = await Banner.findOne({name: name})
                if(!banners){
                    let sampleFile = req.files.image;
                    let fileName = Date.now()+ sampleFile.name
                    let uploadPath = path() + '\\public\\img\\' +fileName;
                    const banner = new Banner({
                        name,
                        description,
                        position,
                        category,
                        active: 'Ẩn',
                        image: `/img/${fileName}`
                    })
                    await banner.save()
                    await sampleFile.mv(uploadPath, function(err) {
                        if (err)
                        return res.render('error',{error: err});
                    });
                    return res.redirect('/admin/banner')
                }else{
                    Category.find().then((result) => {
                        return res.render('admin/add-banner',{layout: 'admin', title: 'Thêm banner', Category: mutipleMongooseToObject(result), error: 'Banner đã tồn tại'})
                    }).catch((err) => {
                        return res.render('error', {error: err})
                    });
                }
                
            } catch (error) {
                res.render('error', {error: error})
            }
        }
    }

    async deleteBanner(req, res){
        try {
            const result = await Banner.findOneAndDelete({_id: req.params.id})
            const pathImage = await path()+'\\public'+result.image;
            unlink( pathImage, (err) => {
                if (err){
                    return res.render('error',{error: err});        
                }
                return res.redirect('/admin/banner')
            });
        } catch (error) {
            return res.render('error',{error: error});
        }
    }
    async detailBanner(req, res){
        const bannerId = req.params.id
        const user = await User.findOne({_id: req.userId})
        Banner.findOne({_id: bannerId}).then((result) => {
            res.render('admin/detail-banner',{
                layout: 'admin', title: 'Edit Banner',
                Banner: mongooseToObject(result),
                User: mongooseToObject(user)
            })
        }).catch((err) => {
            res.render('error', {error: err}) 
        });
    }
    async updateBanner(req, res){
        const bannerId = req.params.id
        const {active,position} = req.body
        try {
            if(active==="Hiển thị"){
                await Banner.findOneAndUpdate({position: position,active: 'Hiển thị'},{active: 'Ẩn'})
            }
            if(active==="Ẩn"){
                const bannerActive = await Banner.find({position: position, active: 'Hiển thị'})
                if(bannerActive.length<=1){
                    return res.redirect('/admin/banner')
                }
            }
            const result = await Banner.findOneAndUpdate({_id: bannerId},{active: active})
            if(result){
                res.redirect('/admin/banner')
            }else{
                Banner.findOne({_id: bannerId}).then((result) => {
                    res.render('admin/detail-banner',{
                        layout: 'admin', title: 'Edit Banner',
                        Banner: mongooseToObject(result),
                        error: 'Không cập nhật được Banners !'
                    })
                }).catch((err) => {
                    res.render('error', {error: err}) 
                });
            }
        } catch (error) {
            res.render('error', {error: error}) 
        }
    }
}

module.exports = new AdminController();
