const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth')
const verifyTokenAdmin = require('../middleware/authAdmin')
const adminController = require('../app/controllers/AdminController');

router.get('/',verifyToken,adminController.home);
router.get('/category/search', verifyToken, adminController.searchCategory);
router.get('/login',adminController.login);
router.post('/login',adminController.auth);
router.get('/logout',adminController.logout);
router.get('/register',adminController.register);
router.post('/register',adminController.createUser);
router.delete('/product/:id',verifyToken, adminController.deleteProduct);
router.get('/product/:id/edit', verifyToken,adminController.editProduct);
router.get('/product/add', verifyToken,adminController.addProduct);
router.post('/product/add', verifyToken, adminController.createProduct);
router.put('/product/:id', verifyToken, adminController.update);
router.get('/staff', verifyTokenAdmin, adminController.staff);
router.get('/staff/add', verifyTokenAdmin, adminController.addStaff);
router.post('/staff/add', verifyTokenAdmin, adminController.createStaff);
router.get('/staff/:id/edit', verifyTokenAdmin, adminController.editStaff);
router.put('/staff/:id/edit', verifyTokenAdmin, adminController.updateStaff);
router.delete('/staff/:id', verifyTokenAdmin, adminController.deleteStaff);
router.get('/category', verifyToken, adminController.category);
router.get('/category/add', verifyToken, adminController.addCategory);
router.post('/category/add', verifyToken, adminController.createCategory);
router.get('/category/:id', verifyToken, adminController.editCategory);
router.put('/category/:id', verifyToken, adminController.updateCategory);
router.delete('/category/:id', verifyToken, adminController.deleteCategory);
router.get('/product/search', verifyToken, adminController.searchProduct);
router.get('/staff/search', verifyToken, adminController.searchStaff);
router.get('/ordered', verifyToken, adminController.ordered);
router.get('/order/detail/:id', verifyToken, adminController.orderedDetail);
router.post('/order/:id', verifyToken, adminController.updateStatusOrder);
router.get('/order/search', verifyToken, adminController.searchOrder);
router.get('/banner', verifyToken, adminController.banner);
router.get('/banner/add', verifyToken, adminController.addBanner);
router.post('/banner/add', verifyToken, adminController.createBanner);
router.delete('/banner/:id', verifyToken, adminController.deleteBanner);
router.get('/banner/:id', verifyToken, adminController.detailBanner);
router.put('/banner/:id', verifyToken, adminController.updateBanner);


module.exports = router;