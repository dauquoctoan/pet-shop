const jwt = require('jsonwebtoken')
const User = require('../app/models/User')

const verifyTokenAdmin = async (req, res, next)=> {
     const token = req.cookies.accessToken
     if(!token || token == ''){
          return res.redirect('/admin/login')
     }
     try {
          const decoded =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
          if(!decoded){
               return res.redirect('/admin/login')
          }
          const user = await User.findOne({_id: decoded.userId})
          if(user.position=="STAFF"){
               return res.render('error',{error: 'Bạn không có quyền admin!'})
          }
          else{
               req.userId = decoded.userId
               next()
          }  
     }catch(error) {
          console.log(error)
          return res.render('error',{error: 'Invalid Token'})
     }
}

module.exports = verifyTokenAdmin