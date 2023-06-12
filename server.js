import express from 'express';
import mysq from 'mysql2';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcryt from 'bcrypt';
import jwt from 'jsonwebtoken'
import multer from 'multer';
import path from 'path';


const app = express();
app.use(cors(
    {
        origin: ["http://localhost:3000"],
        methods: ["POST", "GET", "PUT"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));


const con = mysq.createConnection({
    host: 'localhost',
    database: 'project_lv',
    user: 'root',
    password: '123456'
})


//--------hinh2 anh
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



// ============================================================================
app.get('/', (req, res)=>{
    res.send('SERVER ON.....')
})
app.get('/data', function(req, res) {
    let sql = "SELECT * FROM USERS";
    con.query(sql, function(err, results){
        if (err) throw err;
        res.send(results);
    });
});
// ===========================================================================




//------------------------------------------------------------------------------------------
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


// ===============================================================================
app.post('/login',(req, res)=>{
    const sql = "SELECT * FROM project_lv.users Where email = ? AND password = ?";
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




// =====create==========================================================================
app.post('/create', upload.single('image'),(req, res)=>{
    const sql  =  "INSERT INTO employee (`name`,`email`,`password`,`address`,`image`) VALUES (?)";
    bcryt.hash(req.body.password.toString(), 10, (err, hash)=>{
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

// =====get employees==========================================================================

app.get('/getEmployees',(req, res)=>{
    const sql = "SELECT * FROM employee";
    con.query(sql,(err,result)=>{
        if(err) return res.json({Error: "Get employees error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})


//edit va2 upload------------------------------------------------------------

app.get('/get/:id',(req,res)=>{
    const id  = req.params.id;
    const sql = "SELECT * FROM employee where id = ?";
    con.query(sql, [id], (err, result)=>{
        if(err) return res.json({Error: "Get employees error in sql"})
        return res.json({Status: "Success", Result: result})
    })
})
app.put('/update/:id',(req,res)=>{
    const id  = req.params.id;
    const sql = "UPDATE employee set name = ? , email = ? , address = ?  WHERE id = ?";
    con.query(sql, [req.body.name,req.body.email,req.body.address, id], (err, result)=>{
        if(err) return res.json({Error: "update employees error in sql"})
        return res.json({Status: "Success"})
    })
})


//xoa----------------------------------------------------------------------------------------
app.delete('/delete/:id',(req, res)=>{
    const id  = req.params.id;
    const sql = "Delete FROM employee  WHERE id = ?";
    con.query(sql, [id], (err, result)=>{
        if(err) return res.json({Error: "delete employees error in sql"});
        return res.json({Status: "Success"})
    })
})

//----logout------------------------------------------------------------------------------------
app.get('/logout',(req, res)=>{
    res.clearCookie('token');
    return res.json({Status: "Success"});
})
//--Home-------------------------------------------------------------------------------------------
app.get('/adminCount', (req, res)=>{
    const sql = "Select count(id) as admin from users";
    con.query(sql,(err, result)=>{
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})


app.get('/employeeCount', (req, res)=>{
    const sql = "Select count(id) as employee from employee";
    con.query(sql,(err, result)=>{
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})

app.get('/name', (req, res)=>{
    const sql = "Select sum(name) as sumOfName  from employee";
    con.query(sql,(err, result)=>{
        if(err) return res.json({Error: "Error in running query"});
        return res.json(result);
    })
})



//-----login employee-------------------------------------------------------------------------------
app.post('/employeelogin',(req, res)=>{
    const sql = "SELECT * FROM employee Where email = ? ";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if(err) return res.json({Status: "Error", Error:"Error in runnung query"});
        if(result.length > 0){
            bcryt.compare(req.body.password.toString(), result[0].password,(err, response)=>{
                if(err) return res.json({ Error:"password error"});

                const token = jwt.sign({role: "employee", id: result[0].id}, "jwt-secret-key",{expiresIn: '1d'});
                res.cookie('token', token);
                return res.json({Status: "Success",  id: result[0].id})
            })
           
        }else{
            return res.json({Status: "Error", Error:"Wrong Email or Password" });
        }
    })

})



//======employee detail==========================================================



// app.get('/employee/:id',(req,res)=>{
//     const id  = req.params.id;
//     const sql = "SELECT * FROM employee where id = ?";
//     con.query(sql, [id], (err, result)=>{
//         if(err) return res.json({Error: "Get employees error in sql"})
//         return res.json({Status: "Success", Result: result})
//     })
// })

















app.listen(7000, ()=>{
    console.log('App Listening on port 7000');
    con.connect(function(err){
        if(err) throw err;
        console.log('Database connected!');
    })
})