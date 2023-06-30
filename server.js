const express = require('express')
const mysq = require('mysql2')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config()
const app = express();
app.use(cors(
    {
        origin: ["http://localhost:3000"],
        methods: ["POST", "GET", "PUT", "DELETE"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));



// ======MY SQL=====================================================================
const con = mysq.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_DATA ,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})

// ======IMAGE=======================================================================
const storage  = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'public/images')
    },
    filename: (req, file, cb)=>{
        cb(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({
    storage: storage
})


const storageProducts  = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'public/imagesProducts')
    },
    filename: (req, file, cb)=>{
        cb(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
})
const uploadProducts = multer({
    storage: storageProducts
})



// ======TOKEN JWT======================================================================
const verifyUser = (req, res, next)=>{
    const token = req.cookies.token;
    if(!token){
        return res.json({Error: "You are no Authenticated"})
    }else{
        jwt.verify(token,"jwt-secret-key",(err, decoded)=>{
            if(err) return res.json({Error: "Token wrong"});
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        })
    }
}
app.get('/dashboard',verifyUser, (req, res)=>{
    return res.json({Status: "Success", role: req.role, id: req.id})
})




// ======GET-LIST-USER=====================================================================
app.get('/getUserClient',(req, res)=>{
    const sql = "SELECT * FROM user_client";
    con.query(sql,(err,result)=>{
        if(err) return res.json({Error: "Get user_client error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})


// ======GET-LIST-ADMIN===================================================================
app.get('/getAdmin',(req, res)=>{
    const sql = "SELECT * FROM user_admin";
    con.query(sql,(err,result)=>{
        if(err) return res.json({Error: "Get employees error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})


// ======GET-LIST-PRODUCTS==================================================================
app.get('/getProducts',(req, res)=>{
    const sql = "SELECT * FROM products";
    con.query(sql,(err,result)=>{
        if(err) return res.json({Error: "Get products error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})


// ======ADD USER======================================================================
app.post('/create', upload.single('image'),(req, res)=>{
    const sql  =  "INSERT INTO user_client (`name`,`email`,`password`,`address`,`image`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), 10, (err, hash)=>{
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            req.body.name,
            req.body.email,
            hash,
            req.body.address,
            req.file.filename
        ]
        con.query(sql, [values], (err,result)=>{
            if(err) return res.json({Error: "Inside signup query"});
            return res.json({Status: "Success"});
        })
    })
})



// ======ADD PRODUCTS================================================================
app.post('/createProducts',uploadProducts.single('image'),(req, res)=>{
    console.log(req.body)
    const sql  =  "INSERT INTO products (`name`,`price`,`color`,`category`,`quantity`,`image`) VALUES (?)";
        const values = [
            req.body.name,
            req.body.price,
           
            req.body.color,

            
            req.body.category,
            req.body.quantity,
            req.file.filename
        ]
        con.query(sql, [values], (err,result)=>{
            if(err) return res.json({Error: "Inside signup query"});
            return res.json({Status: "Success"});
        })

})



// ======EDIT AND UPLOAD  USER==================================================
// GET EDIT
app.get('/get/:id',(req,res)=>{
    const id  = req.params.id;
    const sql = "SELECT * FROM user_client where id = ?";
    con.query(sql, [id], (err, result)=>{
        if(err) return res.json({Error: "Get user_client error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})
// UPLOAD  USER
app.put('/update/:id',(req,res)=>{
    const id  = req.params.id;
    const sql = "UPDATE user_client set name = ? , email = ? , address = ?  WHERE id = ?";
    con.query(sql, [req.body.name, req.body.email, req.body.address, id], (err, result)=>{
        if(err) return res.json({Error: "update user_client error in sql"})
        return res.json({Status: "Success"})
    })
})




// ======EDIT VÀ UPLOAD  LẠI PRODUCTS===========================================
// GET EDIT
app.get('/getProducts/:id',(req,res)=>{
    const id  = req.params.id;
    const sql = "SELECT * FROM products where id = ?";
    con.query(sql, [id], (err, result)=>{
        if(err) return res.json({Error: "Get products error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})
// UPLOAD  PRODUCTS
app.put('/updateProducts/:id',(req,res)=>{
    const id  = req.params.id;
    const sql = "UPDATE products set name = ? , price = ?, category = ? , color = ? , quantity = ?  WHERE id = ?";
    con.query(sql, [req.body.name, req.body.price, req.body.category, req.body.color, req.body.quantity, id], (err, result)=>{
        if(err) return res.json({Error: "update products error in sql"})
        return res.json({Status: "Success"})
    })
})




// ======DEL USER===========================================================
app.delete('/delete/:id',(req, res)=>{
    const id  = req.params.id;
    const sql = "Delete FROM user_client  WHERE id = ?";
    con.query(sql, [id], (err, result)=>{
        if(err) return res.json({Error: "delete user_client error in sql"});
        return res.json({Status: "Success"})
    })
})



// ======DEL PRODUCTS======================================================
app.delete('/deleteProducts/:id',(req, res)=>{
    const id  = req.params.id;
    const sql = "Delete FROM products  WHERE id = ?";
    con.query(sql, [id], (err, result)=>{
        if(err) return res.json({Error: "delete products error in sql"});
        return res.json({Status: "Success"})
    })
})


// ======LOGIN WITH USER================================================
app.post('/loginClient', (req, res) => {
    const sql = "SELECT * FROM user_client Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response)=> {
                if(err) return res.json({Error: "password error"});
                if(response) {
                    const token = jwt.sign({role: "user_client", id: result[0].id}, "jwt-secret-key", {expiresIn: '1d'});
                    res.cookie('token', token);
                    return res.json({Status: "Success", id: result[0].id})
                } else {
                    return res.json({Status: "Error", Error: "Wrong Email or Password"});
                }
                
            })
            
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})


// ======LOGIN WITH ADMIN==================================================
app.post('/loginAdmin',(req, res)=>{
    const sql = "SELECT * FROM user_admin Where email = ? AND password = ? ";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if(err) return res.json({Status: "Error", Error:"Error in runnung query"});
        if(result.length > 0){
            const id = result[0].id;
            const token = jwt.sign({role: "admin"}, "jwt-secret-key",{expiresIn: '1d'});
            res.cookie('token', token);
            return res.json({Status: "Success"})
        }else{
            return res.json({Status: "Error", Error:"Wrong Email or Password" });
        }
    })

})


// ======LOGOUT=========================================================
app.get('/logout',(req, res)=>{
    res.clearCookie('token');
    return res.json({Status: "Success"});
})


// =====TOTAL ADMIN=====================================================
app.get('/totalAdmin', (req, res)=>{
    const sql = "Select count(id) as admin from user_admin";
    con.query(sql,(err, result)=>{
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})


// ======TOTAL USER======================================================
app.get('/totalClient', (req, res)=>{
    const sql = "Select count(id) as user_client from user_client";
    con.query(sql,(err, result)=>{
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

// ======TOTAL PRODUCTS===================================================
app.get('/totalProducts', (req, res)=>{
    const sql = "Select count(id) as products  from products";
    con.query(sql,(err, result)=>{
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})


// app.get('/name', (req, res)=>{
//     const sql = "Select sum(name) as sumOfName  from employee";
//     con.query(sql,(err, result)=>{
//         if(err) return res.json({Error: "Error in running query"});
//         return res.json(result);
//     })
// })




//======employee detail==========================================================
// app.get('/employee/:id',(req,res)=>{
//     const id  = req.params.id;
//     const sql = "SELECT * FROM employee where id = ?";
//     con.query(sql, [id], (err, result)=>{
//         if(err) return res.json({Error: "Get employees error in sql"})
//         return res.json({Status: "Success", Result: result})
//     })
// })



// ======RENDER SERVER=============================================================
app.get('/', (req, res)=>{
    res.send('SERVER ON.....')
})
// ======CHECK DATA================================================================
app.get('/dataProducts', function(req, res) {
    let sql = "SELECT * FROM PRODUCTS";
    con.query(sql, function(err, results){
        if (err) throw err;
        res.send(results);
    });
});
// ======RUN SERVER WITH port 7000=================================================
const PORT = process.env.DB_PORT
app.listen(PORT, ()=>{
    console.log('App Listening on port ' + PORT);
    con.connect(function(err){
        if(err) throw err;
        console.log('Database connected!');
    })
})