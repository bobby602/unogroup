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
        
        let month = monthNames[date.getMonth()];
    return ` ${month}`;
} 

  router.use(express.urlencoded({extended:true}));
  router.use(bodyParser.json());
  router.get('/',async  function(req,res){
    let date1 = new Date();
    let yearThai = date1.getFullYear()+543;
    const monthFil = toThaiMonthString(date1).trim();
    const sqlNameCat = "select NameCat from ItemCalPSub GROUP BY NameCat " ;
    const sqlNoteF = "select Name,SName,NoteF from itemcalpsub  WHERE  NoteF != '' group by ItemCode,Name,SName,NoteF";
    const sqlSName = "select tmp.* from( " +
            "select tmp.*,tmp2.NoteF  "+
    " from( "+
        " select  ROW_NUMBER ( )  "+  
                        " OVER (  PARTITION BY tmp.mainName  Order by  tmp.rowReal) as num  ,tmp.Name,tmp.mainName ,CAST(ISNULL(tmp.Pricelist,0) AS DECIMAL(30,2)) as Pricelist , CAST(ISNULL(tmp.Price10,0) AS DECIMAL(30,2)) as Price10 , CAST(ISNULL(tmp.Price25,0) AS DECIMAL(30,2)) as Price25, CAST(ISNULL(tmp.Price50,0) AS DECIMAL(30,2)) as Price50, CAST(ISNULL(tmp.Price100,0) AS DECIMAL(30,2)) as Price100, CAST(ISNULL(tmp.Price120,0) AS DECIMAL(30,2)) as Price120 , CAST(ISNULL(tmp.Price240,0) AS DECIMAL(30,2)) as Price240, CAST(ISNULL(tmp.Price360,0) AS DECIMAL(30,2)) as Price360,CAST(ISNULL(tmp.Price600,0) AS DECIMAL(30,2)) as Price600 ,tmp.NameCat ,tmp.Note,tmp.Point,tmp.Package "+
    " from( "+
                " select ROW_NUMBER ( )  "+  
                               "  OVER (  PARTITION BY tmp.mainName  Order by  tmp.row) as num1, case when tmp.row is null then tmp2.row else tmp.row end as rowReal ,tmp.Name ,case when tmp.mainName is null then tmp2.mainName else tmp.mainName end as mainName  ,tmp2.row ,tmp2.mainName as mainTmp2,Pricelist,Price10 ,Price25, Price50, Price100,Price120 , Price240,Price360,Price600 ,case when tmp2.NameCat is null then tmp.NameCat else tmp2.NameCat end as NameCat,Note,case when tmp2.Point is null then tmp.Point else tmp2.Point end as Point,Package "+
                           "  from( "+
                                    " select tmp.* " +
                                    " FROM " +
                                        " ( " +
                                            " select 1 as row ,Name as Name ,Name as mainName,NameCat,Point " +
                                            "  from ItemCalPSub " +
                                            " where StGroup = '1' and Sname1 != ''  " +
                                            " GROUP BY Name ,NameCat,Point " +
                                                " union ALL " +
                                            " select 2 as row ,SName1 as Name ,Name as  mainName,NameCat,Point " +
                                            " from ItemCalPSub " +
                                            " where StGroup = '1' and Sname1 != '' " +
                                            " GROUP BY SName1,Name,NameCat,Point "+
                                                " union all  " +
                                            " select 3 as row ,SName2 as Name ,Name as mainName,NameCat,Point " +
                                            " from ItemCalPSub  " +
                                            " where StGroup = '1' and Sname1 != ''  " +
                                            " GROUP BY SName2,Name,NameCat,Point " + 
                                            " union all   " +
                                            " select 4 as row ,SName3 as Name ,Name as mainName,NameCat,Point " + 
                                            " from ItemCalPSub  " +
                                            " where StGroup = '1' and Sname1 != ''  " +
                                            " GROUP BY SName3,Name,NameCat,Point  " +
                                            " )Tmp " +
                                        " where tmp.Name <> '' " + 
                            " )tmp  "+
                            " full join ( "+
                            " select  ROW_NUMBER ( )  " +  
                            " OVER (  PARTITION BY Name Order by  Name) as row ,NoteF as Name ,Name as mainName,sum(ISNULL(Pricelist,'0.00')) as Pricelist ,sum(ISNULL( Price10,'0.00')) as  Price10  , sum(ISNULL( Price25,'0.00')) as  Price25 ,sum(ISNULL( Price50,'0.00')) as  Price50 , sum(ISNULL( Price100,'0.00')) as  Price100 ,  sum(ISNULL( Price120,'0.00')) as  Price120   ,sum(ISNULL( Price240,'0.00')) as  Price240  , sum(ISNULL( Price360,'0.00')) as  Price360 , sum(ISNULL( Price600,'0.00')) as  Price600 ,NameCat,Note,Point,Package,DocNo " +
                                " from ItemCalPSub "+
                                " where StGroup = '1' and Sname1 != '' and DocNo = (select  TOP 1 DocNo from ItemCalPSub order by DocNo DESC ) " +
                                " GROUP BY NoteF,Name, NameCat,Note,Point ,Package,DocNo"+
                            " )tmp2 on tmp2.mainName = tmp.mainName and tmp2.row = tmp.row "+
                        " )tmp	 "+
        " )tmp	 "+
        " full join ( select ROW_NUMBER ( )    "+
        " OVER (  PARTITION BY Name Order by  Name) as num ,Name as mainName , NoteF,Package,NameCat "+
        " from ItemCalPSub "+
        " where StGroup = '1' and Sname1 != '' "+
        " GROUP BY NoteF,Name,Package,NameCat "+
        " )tmp2  on tmp2.mainName = tmp.mainName and tmp2.num = tmp.num " +
        " )tmp order by tmp.mainName ,tmp.num ASC " ;
    const sqlStGroup = "select StGroup from ItemCalPSub  where StGroup <> '7' and StGroup <> '8' GROUP BY StGroup ORDER BY StGroup ASC";
    const MaxQNo = "select MAX(QNo) as QNo from ItemCalP  where YEAR(DocDate) = YEAR(CURRENT_TIMESTAMP)  AND MONTH(DocDate) = MONTH (CURRENT_TIMESTAMP) " ;
    const pool = await db;
    await pool.connect()
    const request = pool.request();
    const resultNameCat = await request
    .query(sqlNameCat);
    const resultSName = await request
    .query(sqlSName);
    const resultNoteF = await request
    .query(sqlNoteF);
    const resultStGroup = await request
    .query(sqlStGroup);
    const resultMaxQNo = await request
    .query(MaxQNo);
    const dataNameCat =  resultNameCat.recordset;
    const dataSName = resultSName.recordset;
    const dataNoteF = resultNoteF.recordset;
    const dataStGroup = resultStGroup.recordset;
    const dataMaxQno = resultMaxQNo.recordset;
    
    console.log(dataNoteF)
    res.render('priceListPage',{monthFil,yearThai,dataNameCat,dataSName,dataNoteF,dataStGroup,dataMaxQno});

  });

  router.post('/',async  function(req,res){
    let date1 = new Date();
    let yearThai = date1.getFullYear()+543;
    const monthFil = toThaiMonthString(date1).trim();
    const stGroup = req.body.stGroup;

    const sqlNameCat = "select NameCat from ItemCalPSub GROUP BY NameCat " ;
    const sqlNoteF = "select Name,SName,NoteF from itemcalpsub  WHERE  NoteF != '' group by ItemCode,Name,SName,NoteF";
    const sqlSName = "select tmp.*,tmp2.NoteF  "+
    " from( "+
        " select  ROW_NUMBER ( )  "+  
                        " OVER (  PARTITION BY tmp.mainName  Order by  tmp.rowReal) as num  ,tmp.Name,tmp.mainName ,CAST(ISNULL(tmp.Pricelist,0) AS DECIMAL(30,2)) as Pricelist , CAST(ISNULL(tmp.Price10,0) AS DECIMAL(30,2)) as Price10 , CAST(ISNULL(tmp.Price25,0) AS DECIMAL(30,2)) as Price25, CAST(ISNULL(tmp.Price50,0) AS DECIMAL(30,2)) as Price50, CAST(ISNULL(tmp.Price100,0) AS DECIMAL(30,2)) as Price100, CAST(ISNULL(tmp.Price120,0) AS DECIMAL(30,2)) as Price120 , CAST(ISNULL(tmp.Price240,0) AS DECIMAL(30,2)) as Price240, CAST(ISNULL(tmp.Price360,0) AS DECIMAL(30,2)) as Price360,CAST(ISNULL(tmp.Price600,0) AS DECIMAL(30,2)) as Price600 ,tmp.NameCat ,tmp.Note,tmp.Point,tmp.Package "+
    " from( "+
                " select ROW_NUMBER ( )  "+  
                               "  OVER (  PARTITION BY tmp.mainName  Order by  tmp.row) as num1, case when tmp.row is null then tmp2.row else tmp.row end as rowReal ,tmp.Name ,case when tmp.mainName is null then tmp2.mainName else tmp.mainName end as mainName  ,tmp2.row ,tmp2.mainName as mainTmp2,Pricelist,Price10 ,Price25, Price50, Price100,Price120 , Price240,Price360,Price600 ,case when tmp2.NameCat is null then tmp.NameCat else tmp2.NameCat end as NameCat,Note,case when tmp2.Point is null then tmp.Point else tmp2.Point end as Point,Package "+
                           "  from( "+
                                    " select tmp.* " +
                                    " FROM " +
                                        " ( " +
                                            " select 1 as row ,Name as Name ,Name as mainName,NameCat,Point " +
                                            "  from ItemCalPSub " +
                                            " where StGroup = @stGroup and Sname1 != ''  " +
                                            " GROUP BY Name ,NameCat,Point " +
                                                " union ALL " +
                                            " select 2 as row ,SName1 as Name ,Name as  mainName,NameCat,Point " +
                                            " from ItemCalPSub " +
                                            " where StGroup = @stGroup and Sname1 != '' " +
                                            " GROUP BY SName1,Name,NameCat,Point "+
                                                " union all  " +
                                            " select 3 as row ,SName2 as Name ,Name as mainName,NameCat,Point " +
                                            " from ItemCalPSub  " +
                                            " where StGroup = @stGroup and Sname1 != ''  " +
                                            " GROUP BY SName2,Name,NameCat,Point " + 
                                            " union all   " +
                                            " select 4 as row ,SName3 as Name ,Name as mainName,NameCat,Point " + 
                                            " from ItemCalPSub  " +
                                            " where StGroup = @stGroup and Sname1 != ''  " +
                                            " GROUP BY SName3,Name,NameCat,Point  " +
                                            " )Tmp " +
                                        " where tmp.Name <> '' " + 
                            " )tmp  "+
                            " full join ( "+
                                    " select  ROW_NUMBER ( )  " +  
                                    " OVER (  PARTITION BY Name Order by  Name) as row ,NoteF as Name ,Name as mainName,sum(ISNULL(Pricelist,'0.00')) as Pricelist ,sum(ISNULL( Price10,'0.00')) as  Price10  , sum(ISNULL( Price25,'0.00')) as  Price25 ,sum(ISNULL( Price50,'0.00')) as  Price50 , sum(ISNULL( Price100,'0.00')) as  Price100 ,  sum(ISNULL( Price120,'0.00')) as  Price120   ,sum(ISNULL( Price240,'0.00')) as  Price240  , sum(ISNULL( Price360,'0.00')) as  Price360 , sum(ISNULL( Price600,'0.00')) as  Price600 ,NameCat,Note,Point,Package,DocNo " +
                                " from ItemCalPSub "+
                                " where StGroup = @stGroup and Sname1 != '' and DocNo = (select  TOP 1 DocNo from ItemCalPSub order by DocNo DESC ) " +
                                " GROUP BY NoteF,Name,NameCat,Note,Point ,Package,DocNo "+
                            " )tmp2 on tmp2.mainName = tmp.mainName and tmp2.row = tmp.row "+
                        " )tmp	 "+
        " )tmp	 "+
        " full join ( select ROW_NUMBER ( )    "+
        " OVER (  PARTITION BY Name Order by  Name) as num ,Name as mainName , NoteF,Package,NameCat "+
        " from ItemCalPSub "+
        " where StGroup = @stGroup and Sname1 != '' "+
        " GROUP BY NoteF,Name,Package,NameCat "+
        " )tmp2  on tmp2.mainName = tmp.mainName and tmp2.num = tmp.num " ;
    
        const sqlStGroup = "select StGroup from ItemCalPSub  where StGroup <> '7' and StGroup <> '8' GROUP BY StGroup ORDER BY StGroup ASC";
        const MaxQNo = "select MAX(QNo) as QNo from ItemCalP  where YEAR(DocDate) = YEAR(CURRENT_TIMESTAMP)  AND MONTH(DocDate) = MONTH (CURRENT_TIMESTAMP) " ;
    const pool = await db;
    await pool.connect()
    const request = pool.request();
    const resultNameCat = await request
    .query(sqlNameCat);
    const resultSName = await request
    .input('stGroup',mssql.VarChar(50),stGroup)
    .query(sqlSName);
    const resultNoteF = await request
    .query(sqlNoteF);
    const resultStGroup = await request
    .query(sqlStGroup);
    const resultMaxQNo = await request
    .query(MaxQNo);
    const dataNameCat =  resultNameCat.recordset;
    const dataSName = resultSName.recordset;
    const dataNoteF = resultNoteF.recordset;
    const dataStGroup = resultStGroup.recordset;
    const dataMaxQno = resultMaxQNo.recordset;
    
    res.render('priceListPage',{monthFil,yearThai,dataNameCat,dataSName,dataNoteF,dataStGroup,dataMaxQno});

  });
   
    module.exports = router;