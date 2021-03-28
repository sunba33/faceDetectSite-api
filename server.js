const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const { response } = require('express');

const db = knex({
    client: 'pg',
    connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'dnzpkrcll11',
    database : 'smart-brain'
    }
});

db.select("*").from('users').then(data =>{
    console.log(data);
});

const app = express();
app.use(express.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.json("hello");
})

app.post('/signin',(req,res)=>{
    db.select('email','hash').from("login")
    .where('email','=',req.body.email)
    .then(data=>{
        const isValid= bcrypt.compareSync(req.body.password,data[0].hash);
        if(isValid){
            return db.select("*").from('users').where('email','=',req.body.email)
            .then(user=>{
                res.json(user[0])
            }).catch(err=>res.status(400).json('unable to get user'));
        }else{
            res.status(400).json('unable to get user')
        }
    }).catch(err=>res.status(400).json('wrong!'));
})

app.post('/register',(req,res)=>{
    const {email,name,password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
            return trx('users')
            .returning("*")
            .insert({
                
                email:loginEmail[0],
                name:name,
                joined:new Date()
            })
            .then(response =>{
                res.json(response[0]);
            })
            .catch(err => res.status(400).json("unable to join!"));
            
        }).then(trx.commit)
        })
    })

app.get('/profile/:id',(req,res)=>{
    const {id}= req.params;
    db.select("*").from("users").where({id:id})
    .then(user=>{
        if(user.length){
            res.json(user[0]);
        }else{
            res.status(400).json("no such profile!");
        }

    })
})

app.put('/image',(req,res)=>{
    const {id}= req.body;
    db('users').where("id","=",id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        res.json(entries);
        console.log(entries);
    }).catch(err=>res.status(400).json("Unable to respond that."))
})

// Load hash from your password DB.
/*bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});

bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});*/

app.listen(3000,()=>{
    console.log('app is running');
});