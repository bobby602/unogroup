const express = require('express');
const router = express.Router();
var mssql = require("mssql");
const db = require('../database');
const path = require('path');
const flash = require('connect-flash')
var session = require('express-session');
var bodyParser = require('body-parser');
const fs = require('fs');
router.use(session({
    secret: 'secret',
    resave:true,
    saveUninitialized:true
}));
router.use(express.urlencoded({extended:true}));
router.use(bodyParser.json());
let monthFil;
let month1;
let month2;
let month3;
const quater = (month)=>{
    const quater = month+1;
    const quaterNum = Math.floor(quater/3);
    console.log(quaterNum);
    if(quaterNum ==1){
        monthFil = '1';
        month1 = '1';
        month2 = '2';
        month3 = '3';
    } else if(quaterNum ==2){
        monthFil = '2';
        month1 = '4';
        month2 = '5';
        month3 = '6';
    }else if (quaterNum==3){
        monthFil = '3';
        month1 = '7';
        month2 = '8';
        month3 = '9';
    }else{
        monthFil = '4';
        month1 = '10';
        month2 = '11';
        month3 = '12';
    }
}
function toThaiMonthString(date) {
    let monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
        "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม.",
        "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];
        let month = monthNames[date-1];
    return ` ${month}`;
} 
  router.use(express.urlencoded({extended:true}));
  router.use(bodyParser.json());
  router.get('/', function(req,res){
    res.render('login');
});
   
   
    module.exports = router;