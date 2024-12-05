var mysql = require('mysql');
var mssql = require("mssql");
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const db = require('../database');
const appError = require('../appError');
const res = require('express/lib/response');
let flash = require('connect-flash')
const router = express.Router();
const { resourceLimits } = require('worker_threads');
const { request } = require('http');
const { response } = require('../app');

  var app = express();
  router.use(session({
      secret: 'secret',
      resave:true,
      saveUninitialized:true
  }));
 
  router.use(express.urlencoded({extended:true}));
  router.use(bodyParser.json());
  router.use(flash())
  router.use((req,res,next)=>{
    res.locals.error = req.flash('error')
    next()
  })

  router.get('/', function(req,res){
      res.render('login');
  });

  router.post('/',function(req,res){
    var Login = req.body.Login;
    console.log(Login);
    var Password = req.body.Password;
    console.log(Password);
    if(Login){
        // var parameters = [
        //     {Login: 'Login', value:req.body.Login},
        //     {Password:'Password',value:req.body.Password}
        // ];
        var request = new mssql.Request();
        request.input('Login',mssql.VarChar(50),req.body.Login);
        request.input('Password',mssql.VarChar(50),req.body.Password);
        request.query('select * from [UNoGroup].[dbo].[sale] where CodeG = @Login and Password = @Password',function(err,data,fields){
            let surName ;
            let lastName ;
            let authorize;
            console.log(data);
            if(data){
                if(data.rowsAffected > 0 ){
                    surName = data.recordset[0].Name;
                    lastName = data.recordset[0].Surname;
                    if(Login == 'jeab'){
                    req.session.authorize = true;
                    }
                    req.session.loggedin = true;
                    req.session.Login = Login;
                    req.session.surName =  surName;
                    req.session.lastName = lastName;
                    res.redirect('/users/pageOne');
                }else{
                    req.flash('error','Incorrect Username and Password')
                    // res.send('Incorrect Username and Password');
                    return res.redirect('/');
                }
            }else{
                req.flash('error','Incorrect Username and Password')
                // res.send('Incorrect Username and Password');
                return res.redirect('/');
            }
    
        });
    } else{
        res.redirect('/');
    }
  });
  router.get('/test',function(req,res){
      if(req.session.loggedin){
          res.send('Test Welcome Back');
      }

  });
  router.use((err,req,res,next)=>{
      const {status = 500} =err
      res.status(status).send('ERORR')
  })
  module.exports = router;