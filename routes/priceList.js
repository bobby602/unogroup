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
    const sqlNameCat = " select CatName as NameCat from ItemFG GROUP BY CatName ";
    const sqlNoteF = " select a.Name,SName,NoteF from ItemFG a inner join ItemDm b on b.ItemCode  =  a.ItemCode WHERE  NoteF != '' group by a.ItemCode,a.Name,SName,NoteF";
    const sqlSName = " select * " +
      "   from( "+
      "              select  0 as num , Name , Name as mainName, 0 as PriceList , 0 as Price15, 0 as Price25,0 as  Price50, 0 as Price120,CatName ,'' as NoteF ,  Point , '' as Package , '' as NamePack, 1 as StShowPrice,'' as id  "+
      "              from itemFG where G = '1' AND StShowPrice = '1'  GROUP BY Name,CatName,Point "+
      "              union all "+
      "              select tmp.* "+
      "                          from(  "+
      "                                  select  ROW_NUMBER()      "+
      "                                                              OVER(PARTITION BY tmp.mainName  Order by  tmp.rowReal) as num, tmp.Name, tmp.mainName, CAST(ISNULL(tmp.Pricelist, 0) AS DECIMAL(30, 2)) as Pricelist, CAST(ISNULL(tmp.Price15, 0) AS DECIMAL(30, 2)) as Price15, CAST(ISNULL(tmp.Price25, 0) AS DECIMAL(30, 2)) as Price25, CAST(ISNULL(tmp.Price50, 0) AS DECIMAL(30, 2)) as Price50, CAST(ISNULL(tmp.Price120, 0) AS DECIMAL(30, 2)) as Price120, tmp.CatName, tmp.NoteF, tmp.Point, tmp.Package,tmp.NamePack,tmp.StShowPrice ,tmp.id   "+
      "                      from(  "+
      "                                          select ROW_NUMBER()      "+
      "                                                                              OVER(PARTITION BY tmp.mainName  Order by  tmp.row) as num1, case when tmp.row is null then tmp2.row else tmp.row end as rowReal, tmp.Name,case when tmp.mainName is null then tmp2.mainName else tmp.mainName end as mainName, tmp2.row, tmp2.mainName as mainTmp2, Pricelist, Price15, Price25, Price50, Price120,case when tmp2.CatName is null then tmp.CatName else tmp2.CatName end as CatName, NoteF,case when tmp2.Point is null then tmp.Point else tmp2.Point end as Point, Package,NamePack,case when tmp2.StShowPrice is null then tmp.StShowPrice else tmp2.StShowPrice end as StShowPrice ,tmp2.id  "+
      "                                                                      from(  "+
      "                                                  select tmp.*  "+
      "                                          FROM  "+
      "                                                  (  "+
      "                                                          select 1 as row, NameUno as Name, Name as mainName, CatName, Point,StShowPrice  "+
      "                                                         from ItemFG "+
      "                                                         where G = '1' "+
      "                                                         GROUP BY NameUno, Name, CatName, Point,StShowPrice  "+
      "                                                         union all  "+
      "                                                         select 2 as row, NameSIM as Name, Name as mainName, CatName, Point ,StShowPrice "+
      "                                                         from ItemFG  "+
      "                                                         where  G = '1' "+
      "                                                         GROUP BY NameSIM, Name, CatName, Point  ,StShowPrice "+
      "                                                         union all "+
      "                                                         select 3 as row, NameZU as Name, Name as mainName, CatName, Point ,StShowPrice  "+
      "                                                         from ItemFG "+
      "                                                         where G = '1' "+
      "                                                         GROUP BY NameZU, Name, CatName, Point,StShowPrice "+
      "                                                  )Tmp   "+
      "                                                                                              where tmp.Name <> '' and tmp.StShowPrice = '1' "+
      "                                          )tmp    "+
      "                                                                                                                                  full join(  "+
      "                                                  select  ROW_NUMBER()      "+
      "                                                                                      OVER(PARTITION BY Name Order by  Name) as row, NoteF as Name, Name as mainName, sum(ISNULL(Pricelist, '0.00')) as Pricelist, sum(ISNULL(Price15, '0.00')) as Price15, sum(ISNULL(Price25, '0.00')) as Price25, sum(ISNULL(Price50, '0.00')) as Price50, sum(ISNULL(Price120, '0.00')) as Price120, CatName, NoteF, Point, concat(Rpack, ' ', PackR, 'x', RpackSale) as Package,NamePack,StShowPrice,id  "+
      "                                                                              from ItemFG   "+
      "                                                                              where  G = '1'     "+
      "                                                                              GROUP BY NoteF, Name, CatName, Point, Rpack, PackR, RpackSale,NamePack ,StShowPrice,id "+
      "                                          )tmp2 on tmp2.mainName = tmp.mainName and tmp2.row = tmp.row  "+
      "                                  )tmp  "+
      "                          )tmp      "+
      "                              full join(select ROW_NUMBER()      "+
      "                              OVER(PARTITION BY Name Order by  Name) as num, Name as mainName, NoteF, concat(Rpack, ' ', PackR, 'x', RpackSale) as Package, CatName ,id  "+
      "                              from ItemFG   "+
      "                              where  G = '1'    "+
      "                              GROUP BY NoteF, Name, Rpack, PackR, RpackSale, CatName ,id "+
      "                          )tmp2  on tmp2.mainName = tmp.mainName and tmp2.num = tmp.num  "+
      "      )Temp "+
      "      where temp.StShowPrice = '1' order by temp.mainName,CASE WHEN num = 0 THEN 0 ELSE 1 END, id";
    const sqlStGroup = " select G from ItemFG  where G = '1' or G = '5' GROUP BY G ORDER BY G ASC";
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
    
    console.log(dataNameCat)
    console.log(dataSName)
    res.render('priceListPage',{monthFil,yearThai,dataNameCat,dataSName,dataNoteF,dataStGroup,dataMaxQno});

  });

  router.post('/',async  function(req,res){
    let date1 = new Date();
    let yearThai = date1.getFullYear()+543;
    const monthFil = toThaiMonthString(date1).trim();
    const stGroup = req.body.stGroup;
    console.log(stGroup)
    const sqlNameCat = " select CatName as NameCat from ItemFG GROUP BY CatName ";
    const sqlNoteF = " select a.Name,SName,NoteF from ItemFG a inner join ItemDm b on b.ItemCode  =  a.ItemCode WHERE  NoteF != '' group by a.ItemCode,a.Name,SName,NoteF";
    const sqlSName = " select * " +
      "   from( "+
      "              select  0 as num , Name , Name as mainName, 0 as PriceList , 0 as Price15, 0 as Price25,0 as  Price50, 0 as Price120,CatName ,'' as NoteF ,  Point , '' as Package , '' as NamePack, 1 as StShowPrice  ,'' as id "+
      "              from itemFG where G = @G AND StShowPrice = '1'  GROUP BY Name,CatName,Point "+
      "              union all "+
      "              select tmp.* "+
      "                          from(  "+
      "                                  select  ROW_NUMBER()      "+
      "                                                              OVER(PARTITION BY tmp.mainName  Order by  tmp.rowReal) as num, tmp.Name, tmp.mainName, CAST(ISNULL(tmp.Pricelist, 0) AS DECIMAL(30, 2)) as Pricelist, CAST(ISNULL(tmp.Price15, 0) AS DECIMAL(30, 2)) as Price15, CAST(ISNULL(tmp.Price25, 0) AS DECIMAL(30, 2)) as Price25, CAST(ISNULL(tmp.Price50, 0) AS DECIMAL(30, 2)) as Price50, CAST(ISNULL(tmp.Price120, 0) AS DECIMAL(30, 2)) as Price120, tmp.CatName, tmp.NoteF, tmp.Point, tmp.Package,tmp.NamePack,tmp.StShowPrice ,tmp.id   "+
      "                      from(  "+
      "                                          select ROW_NUMBER()      "+
      "                                                                              OVER(PARTITION BY tmp.mainName  Order by  tmp.row) as num1, case when tmp.row is null then tmp2.row else tmp.row end as rowReal, tmp.Name,case when tmp.mainName is null then tmp2.mainName else tmp.mainName end as mainName, tmp2.row, tmp2.mainName as mainTmp2, Pricelist, Price15, Price25, Price50, Price120,case when tmp2.CatName is null then tmp.CatName else tmp2.CatName end as CatName, NoteF,case when tmp2.Point is null then tmp.Point else tmp2.Point end as Point, Package,NamePack,case when tmp2.StShowPrice is null then tmp.StShowPrice else tmp2.StShowPrice end as StShowPrice ,tmp2.id  "+
      "                                                                      from(  "+
      "                                                  select tmp.*  "+
      "                                          FROM  "+
      "                                                  (  "+
      "                                                          select 1 as row, NameUno as Name, Name as mainName, CatName, Point,StShowPrice  "+
      "                                                         from ItemFG "+
      "                                                         where G = @G "+
      "                                                         GROUP BY NameUno, Name, CatName, Point,StShowPrice  " +
      "                                                         union all  "+
      "                                                         select 2 as row, NameSIM as Name, Name as mainName, CatName, Point ,StShowPrice "+
      "                                                         from ItemFG  "+
      "                                                         where  G = @G "+
      "                                                         GROUP BY NameSIM, Name, CatName, Point  ,StShowPrice "+
      "                                                         union all "+
      "                                                         select 3 as row, NameZU as Name, Name as mainName, CatName, Point ,StShowPrice  "+
      "                                                         from ItemFG "+
      "                                                         where G = @G "+
      "                                                         GROUP BY NameZU, Name, CatName, Point,StShowPrice "+
      "                                                  )Tmp   "+
      "                                                                                              where tmp.Name <> '' and tmp.StShowPrice = '1'  "+
      "                                          )tmp    "+
      "                                                                                                                                  full join(  "+
      "                                                  select  ROW_NUMBER()      "+
      "                                                                                      OVER(PARTITION BY Name Order by  Name) as row, NoteF as Name, Name as mainName, sum(ISNULL(Pricelist, '0.00')) as Pricelist, sum(ISNULL(Price15, '0.00')) as Price15, sum(ISNULL(Price25, '0.00')) as Price25, sum(ISNULL(Price50, '0.00')) as Price50, sum(ISNULL(Price120, '0.00')) as Price120, CatName, NoteF, Point, concat(Rpack, ' ', PackR, 'x', RpackSale) as Package,NamePack,StShowPrice ,id "+
      "                                                                              from ItemFG   "+
      "                                                                              where  G = @G     "+
      "                                                                              GROUP BY NoteF, Name, CatName, Point, Rpack, PackR, RpackSale,NamePack ,StShowPrice ,id"+
      "                                          )tmp2 on tmp2.mainName = tmp.mainName and tmp2.row = tmp.row  "+
      "                                  )tmp  "+
      "                          )tmp      "+
      "                              full join(select ROW_NUMBER()      "+
      "                              OVER(PARTITION BY Name Order by  Name) as num, Name as mainName, NoteF, concat(Rpack, ' ', PackR, 'x', RpackSale) as Package, CatName,id   "+
      "                              from ItemFG   "+
      "                              where  G = @G    "+
      "                              GROUP BY NoteF, Name, Rpack, PackR, RpackSale, CatName,id  "+
      "                          )tmp2  on tmp2.mainName = tmp.mainName and tmp2.num = tmp.num  "+
      "      )Temp "+
      "      where temp.StShowPrice = '1' order by temp.mainName,CASE WHEN num = 0 THEN 0 ELSE 1 END, id "; 
        const sqlStGroup = " select G from ItemFG  where G = '1' or G = '5' GROUP BY G ORDER BY G ASC";
        const MaxQNo = "select MAX(QNo) as QNo from ItemCalP  where YEAR(DocDate) = YEAR(CURRENT_TIMESTAMP)  AND MONTH(DocDate) = MONTH (CURRENT_TIMESTAMP) " ;
    const pool = await db;
    await pool.connect()
    const request = pool.request();
    console.log(stGroup)
    const resultNameCat = await request
    .query(sqlNameCat);
    const resultSName = await request
    .input('G',mssql.VarChar(50),stGroup)
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
    console.log(dataSName)
    
    res.render('priceListPage',{monthFil,yearThai,dataNameCat,dataSName,dataNoteF,dataStGroup,dataMaxQno});

  });
   
    module.exports = router;