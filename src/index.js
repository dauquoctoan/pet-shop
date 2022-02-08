require('dotenv').config()
const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const handlebars = require('express-handlebars');
const fileUpload = require('express-fileupload');
var cookieParser = require('cookie-parser')
const db = require('./config/db');
const bodyParser = require('body-parser');
const route = require('./routes')
const redis = require('redis')
const session = require('express-session')
const connectRedis = require('connect-redis');

const app = express();
const port = 3000;

let RedisStore = connectRedis(session)
let redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
})
redisClient.on('error', function (err) {
    console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function () {
    console.log('Connected to redis successfully');
});

db.connect();
app.use(cookieParser());
app.use(fileUpload());
app.set('trust proxy', 1);
app.use(session({
    secret: 'keyboard cat',
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
    cookie:{ 
        secure: false,
        httpOnly: false,
        maxAge: 20*60*1000
    }
}))
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.use(methodOverride('_method'));
app.engine(
    'hbs',
    handlebars({
        extname: '.hbs',
        helpers: {
            sum: (a, b) => a + b,
            times: function() {
                return 'hello' 
            },
            list: (value, option)=>{
                return "<h2>"+ option.fn({test: value})+"</h2>"
            },
            loop: (num, page, category, option)=>{
                var x =''
                for(let i =1; i<= num; ++i){
                    if(i==page){
                        x+=option.fn({index: i,id : true, category:category})
                    }
                    else{
                        x+=option.fn({index: i,id: false, category:category})
                    }
                    // x+=option.fn({index:i})
                }
                return x 
            },
            format: (x)=>{
                var nf = Intl.NumberFormat();
                const num = Number.parseInt(x)
                var result = nf.format(num)
                return result
            },
            orderstatus: (x)=>{
                if(x=='Đã giao'){
                    return 'green'
                }
                if(x=='Đang chờ'){
                    return 'red'
                }if(x=='Đã hủy'){
                    return 'blue'
                }else{
                    return 'white'
                }
            },
            formatdate: (x)=>{
                const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
                const dateObj = new Date(x);
                const month = monthNames[dateObj.getMonth()];
                const day = String(dateObj.getDate()).padStart(2, '0');
                const year = dateObj.getFullYear();
                const hours = dateObj.getHours();
                const output = hours + "h" + '   ngày'+day+'/'+month+'/năm '+year  
                return output
            },
            admin: (admin)=>{
                if(admin == 'STAFF'){
                    return 'none'
                }
                return 'block'
            }
        },
    }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));
route(app);
app.get('/set',(req, res)=>{
    res.cookie('auth', '123')
    res.send('thanh cong')
})
app.get('/get',(req, res)=>{
    res.send(req.cookies)
})
app.listen(port, () =>
    console.log(`App listening at http://localhost:${port}`),
);
