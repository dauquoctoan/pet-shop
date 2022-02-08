const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

router.get('/', siteController.index);
router.get('/products/:_id', siteController.productByCategory);
router.get('/search', siteController.search);
router.get('/cart', siteController.cart);
router.post('/cart/:id', siteController.addToCart);
router.put('/cart/:id', siteController.updateCart);
router.get('/cart/:id/delete', siteController.deleteItemCart);
router.get('/checkout', siteController.checkout);
router.get('/product/:id', siteController.productDetail);
router.post('/order', siteController.order);

module.exports = router;
