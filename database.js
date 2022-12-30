
// var mysql = require('mysql');
var mssql = require("mssql");
const express = require('express');
const bodyParser = require("body-parser");
var Connection = require('tedious').Connection;

// console.log("a");
// const { DH_CHECK_P_NOT_SAFE_PRIME } = require('constants');
const app = express();
// const router = express.Router();
let result;
// var config = {  
//   server: '25.32.222.7',  //update me
//   authentication: {
//       type: 'default',
//       options: {
//           userName: 'sa', //update me
//           password: 'GoodMan@Pm.Com'  //update me
//       }
//   },
//   options: {
//       // If you are on Microsoft Azure, you need encryption:
//       encrypt: true,
//       database: 'UNOGROUP'  //update me
//   }
// };
// var dbConfig = {
//   server: '25.32.222.7', // Replace with your host name
//   database:'UNOGROUP',
//   user: 'sa',
//     port:1433,      // Replace with your database username
//   password: 'GoodMan@Pm.Com'  ,
//   // driver: "/Users/incsayoyo/.odbc.ini",
//   options: {
//     trustedConnection: true
//   } 
// }


   var conn1 = {
    // server: '192.168.11.148', // Replace with your host name
    server:'25.32.222.7',
    database:'UNOGROUP',
    user: 'sa',
      port:1433,      // Replace with your database username
    password: 'GoodMan@Pm.Com'  ,
    driver: "msnodesqlv8",
    connectionTimeout: 300000,
    idleTimeoutMillis: 300000,
    requestTimeout: 300000,
    trustServerCertificate: true,
    options: {
      trustedConnection: true,
      enableArithAbort: true,
      encrypt:false,
      cryptoCredentialsDetails: {
        minVersion: 'TLSv1'
      }
    }     // Replace with your database password // // Replace with your database Name
  }; 
  // var dbConnect = new sql.connect(dbConfig, {
  //   // if (err) throw err;
  //   console.log("[mysql error]",err);
  //   console.log('Database is connected successfully !');
  // });
  // conn.query("select * from [UNoGroup].[dbo].[users]", function (err, result, fields) {
  //   if (err) throw err;
    

  // });
  // res.render("index",{result:data});
// });

// var conn = new sql.connect(dbConfig,
//   function(err)
//    {
//      if(err){
//        console.log("Error while connecting database: " + err)
//      }else{
//        console.log("connected to database: " + dbConfig.server)
//      }
//    }
// );
  var conn = mssql.connect(conn1, function (err) {
    
    if (err) console.log(err);
    // conn.query("select * from [UNoGroup].[dbo].[users]", function (err, result, fields) {
    //     if (err) throw err;
    //     // console.log(result);
    
    //   });

    // create Request object
    // var request = new sql.Request();
     
    // // query to the database and get the records
    // request.query('select * from [dbo].[users]', function (err, recordset) {
      
    //   if (err) console.log(err)

    //   // send records as a response
    //   // res.send(recordset);
      
    // });
  });
module.exports = conn;