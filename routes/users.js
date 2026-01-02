const express = require('express');
const router = express.Router();
const mssql = require("mssql");
const db = require('../database');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

// Middleware Configuration
router.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
router.use(express.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(flash());

const requireLogin = (req, res, next) => {
    if (!req.session.Login) {
        return res.redirect('/login');
    }
    next();
};

const executeQuery = async (sql, params = {}) => {
    try {
        const pool = await db;
        const request = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value.type, value.value);
        });
        const result = await request.query(sql);
        return result;
    } catch (error) {
        console.error("Database Query Error:", error);
        throw error;
    }
};

const getQuarterMonths = (month) => {
    const quarter = Math.floor((month - 1) / 3) + 1;
    switch (quarter) {
        case 1: return { start: 1, end: 3 };
        case 2: return { start: 4, end: 6 };
        case 3: return { start: 7, end: 9 };
        case 4: return { start: 10, end: 12 };
        default: return { start: 1, end: 3 };
    }
};

let monthFil = "";
let month1;
let month2;
const d = new Date();
let month = d.getMonth();
console.log(month);
const quater = (month)=>{
    const quater = month+1;
    console.log(quater)
    const quaterNum = Math.floor(month/3+1);
    console.log(quaterNum);
    if(quaterNum ==1){
        monthFil = '1';
        month1 = '1';
        month2 = '3';
    } else if(quaterNum ==2){
        monthFil = '2';
        month1 = '4';
        month2 = '6';
    }else if (quaterNum==3){
        monthFil = '3';
        month1 = '7';
        month2 = '9';
    }else{
        monthFil = '4';
        month1 = '10';
        month2 = '12';
    }
}

router.get('/pageOne',requireLogin,async function(req,res,next){
    try {
        const username = req.session.Login;
        let authorize = req.session.authorize;
        const month = new Date().getMonth() + 1;
        const { start: month1, end: month2 } = getQuarterMonths(month);
        console.log(month1, month2);
        const sql = `select sum(PPoint) as sumPointMonth from [UNoGroup].[dbo].[V802]  where CodeG  = @Login and MONTH(DocDate) = MONTH(GETDATE()) and Year (DocDate) = Year (GETDATE()); 
                    select sum(PPoint) as sumPointQuater from [UNoGroup].[dbo].[V802]  where CodeG  = @Login and MONTH(DocDate) BETWEEN @month1 and @month2 and Year (DocDate) = Year (GETDATE()); 
                    select sum(PPoint) as sumPointYear from [UNoGroup].[dbo].[V802]  where CodeG  =  @Login2 and Year(DocDate) = Year(GETDATE()) ;
                    select sum(PPoint) as sumPointAllMonth from [UNoGroup].[dbo].[V802]  where MONTH (DocDate) = MONTH (GETDATE()) and Year (DocDate) = Year (GETDATE());
                    select sum(PPoint) as sumPoinQuaterUno from [UNoGroup].[dbo].[V802]  where  MONTH (DocDate) BETWEEN @month1 and @month2 and Year (DocDate) = Year (GETDATE()); 
                    select sum(PPoint) as sumPointAllYear from [UNoGroup].[dbo].[V802]  where Year (DocDate) = Year (GETDATE());
                    select CodeG,NameG from [UNoGroup].[dbo].[sale] where codeG <> '' and CodeG <> 'jeab' and ST = '1'    order by CodeG ASC;`;
    
        if(authorize){
            authorize = true;
        }

        const params = {
            Login: { type: mssql.VarChar(50), value: username },
            month1: { type: mssql.Int, value: month1 },
            month2: { type: mssql.Int, value: month2 },
            Login2: { type: mssql.VarChar(50), value: username }
        };
        const data = await executeQuery(sql, params);

        // Debugging: Log the structure of the returned data
        console.log("Recordsets:", data.recordset);

            const testData = data.recordset; 
            const testData2 = data.recordsets[1][0];
            const testData3 = data.recordsets[2][0];
            const testData4 = data.recordsets[3][0];
            const testData5 = data.recordsets[4][0];
            const testData6 = data.recordsets[5][0];
            const testData7 = data.recordsets[6];

            res.render('pageOne',{
                                    sumData:testData,
                                    author:authorize,
                                    surName:req.session.surName,
                                    lastName:req.session.lastName,
                                    testData2,
                                    testData3,
                                    testData4,
                                    testData5,
                                    testData6,
                                    testData7
                                }
            );
    } catch (error) {
        console.error("Error loading pageOne:", error);
        res.status(500).send("Error loading pageOne");
    }
});

router.post('/pageOne',requireLogin,function(req,res,next){
    const selectUser = req.body.selectUser;
    req.session.Login = selectUser;
    res.redirect('/users/pageOne');
}); 

router.get('/pageTwo',requireLogin,function(req,res,next){
    res.render('pageTwo');
}); 

router.get('/pageTwo/pageTable1',requireLogin,function(req,res,next){
    const sql = "select rptSale3.custCode,rptSale3.custName2,Sum(Amt) as NetAmt  ,Sum(Cost) as PB,Sum(AmtDiff) as CUMS ,MaxCr  from rptSale3  "+     
                " where  rptSale3.CodeG  = @Login and docdate between '01/01/22' and '01/01/23' " +
                " Group by rptSale3.custCode,rptSale3.custName2 ,maxcr " +
                " ORDER BY  rptSale3.custCode ";
    const username= req.session.Login;
    console.log(username);
    var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        const testData = data.recordset;
        res.render('pageTable1',  {testData});
    });
});     
router.post('/pageTwo/pageTable1',function(req,res){
    const sql = "select rptSale3.custCode,rptSale3.custName2,Sum(Amt) as NetAmt  ,Sum(Cost) as PB,Sum(AmtDiff) as CUMS ,MaxCr  from rptSale3  "+     
                " where  rptSale3.CodeG  = @Login and docdate between @date1 and @date2 " +
                " Group by rptSale3.custCode,rptSale3.custName2 ,maxcr " +
                " ORDER BY  rptSale3.custCode ";
    const username= req.session.Login;
    const date = req.body.datefilter;
    const test = req.body.test;
    let date1;
    let date2;
    if(date == null | date == ''){
        date1 = '01/01/21';
        date2 = '01/01/22';
    }else{
        date1 = date.split('-')[0];
        date2 = date.split('-')[0];
    }   
    var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.input('date1',mssql.VarChar(50),date1);
        db.input('date2',mssql.VarChar(50),date2);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        const testData = data.recordset;
        console.log(testData +'11111');
        res.render('pageTable1',  {testData});
    });    
});
router.get('/pageTwo/subTable2',requireLogin,function(req,res){
    const sql = "select docno,docdate,itemName,package,price,qtysale,amt,cost as PB,Cums,CustCode "  +
                " from rptsale3 where custcode = @Customer and  codeG = @Login and year(docdate) ='2022' ";
        const customer = req.query.customer;
        const username = req.session.Login;
        console.log(customer)
        var db = new mssql.Request();
        db.input('Customer',mssql.NVarChar(50),customer);
        db.input('Login',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        console.log(data );
        res.render('subTable',  {testData});
    }); 
})
router.get('/pageTable2',requireLogin,function(req,res){
    const sql =  " Select   " +
    " 0 as num, " +
    "  NameG, " +
    " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
    " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
    " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
    " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
    " c.RateCom, "+ 
    " c.incentive, "+      
    " CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI, "+ 
    " CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
    " CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( ISNULL(e.s1,0)-ISNULL(d.s1,0))))*c.rateCom/100)+(case when Cast(c.RateCom as float) ='0' then 0 when Cast(c.RateCom as float) ='0.5'  then 0.5 else 1 end*(ISNULL(e.s1,0)-ISNULL(d.s1,0))/100)+ case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end,0) as DECIMAL(30,2)) as AmtPoint,  " +
    "case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
    " CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
    " CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( e.s1-ISNULL(d.s1,0))))*c.rateCom/100) ,0) as DECIMAL(30,2)))+(1*(e.s1-ISNULL(d.s1,0))/100) +  case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end),0) AS DECIMAL(30,2)) as SumCOMSP, " +
    " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
    " (e.s1-ISNULL(d.s1,0))  as PBH1, "+
    " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
    " (1*(e.s1-ISNULL(d.s1,0))/100) as ComPBH1  " +
" From V802 a  " +
" left join ( " +
                " Select  round(Sum(PB) ,2) as S1,CodeG  " +
                " From V802   " +
                "     inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where  codeG = @Login and Month(DocDate) = Month(GETDATE()) and   year(Docdate) = YEAR(GETDATE())  " +
                "  Group by CodeG " +
" )b on b.CodeG = a.codeG " +
" left join ( " +
" select  case when sum(a.PPoint) < A1  then '0'   " +
"              when sum(a.PPoint) >=A1 and sum(a.PPoint) < A2 then Rate1 " +
"              when sum(a.PPoint) >=A3 and sum(a.PPoint) < A4 then Rate2   " +
"              when sum(a.PPoint) >=A5 then Rate3   " +
"              end as RateCom,sum(a.PPoint) as point , " +
" 					case when sum(a.PPoint) < MPoint then '0' else cast(((sum(a.PPoint)  - c.MPoint)/c.PPoint) as int) * c.Incen end as  incentive, a.CodeG " +
"  from V802 a  " +
" 	inner join ItemTier b on b.CodeG = a.CodeG " +
" 	inner join Tier c on c.Code = b.TierCode " +
"  where a.CodeG = @Login and Month(a.DocDate) =  Month(GETDATE()) and  year(a.Docdate) = YEAR(GETDATE()) and b.YearCal = YEAR(GETDATE())+543 " +
"  GROUP BY  " +
"     c.A1, c.A2, c.A3, c.A4, c.A5, c.Rate1, c.Rate2, c.Rate3,c.MPoint, c.Incen,c.PPoint,a.CodeG " +
" )c on c.CodeG = a.codeG " +
" left join ( "+
    " select sum(tmp.S1) as s1 ,tmp.CodeG " +
    " from( " +
            " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode  " + 
            " from v802  " +
                " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode  " + 
            " Where   MONTH(docDate) = Month(GETDATE()) and year(Docdate) = YEAR(GETDATE()) " +  
            " group by codeG,V802.ItemCode " + 
            " )tmp " +
    " GROUP BY tmp.CodeG " +    
        " )d on d.CodeG = a.CodeG " +   
" left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode " +  
                " from v802  " +
                    " inner join ItemG on v802.itemcode = ItemG.code  " + 
                " Where   MONTH(docDate) = Month(GETDATE()) and year(Docdate) = YEAR(GETDATE())  and ItemG.grItemCode ='H'  "+ 
                " group by codeG,V802.ItemCode " +  
            " )tmp  " +
        " GROUP BY tmp.CodeG " +    
        " )e on e.CodeG = a.CodeG " +
" Where MONTH(docDate) = Month(GETDATE())  and year(Docdate) = YEAR(GETDATE())   and a.CodeG = @Login   "+
" Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,ISNULL(d.s1,0) " ;
        const customer = req.query.customer;
        const username = req.session.Login;
        // quater(month);
        var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        // console.log(testData)
        let date1 = new Date();
        function toThaiMonthString(date) {
                let monthNames = [
                    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
                    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม.",
                    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                ];
            let month = monthNames[date.getMonth()];
            return ` ${month}`;
        }    
        monthFil = toThaiMonthString(date1);

        res.render('pageTable2',  {testData,monthFil});
    }); 
})
router.post('/pageTable2',function(req,res){
    const sql = " Select   " +
" 0 as num, " +
"  NameG, " +
" ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
" CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
" CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
" CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
" c.RateCom, "+ 
" c.incentive, "+      
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI, "+ 
" CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
"CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( ISNULL(e.s1,0)-ISNULL(d.s1,0))))*c.rateCom/100)+(case when Cast(c.RateCom as float) ='0' then 0 when Cast(c.RateCom as float) ='0.5'  then 0.5 else 1 end*(ISNULL(e.s1,0)-ISNULL(d.s1,0))/100)+ case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end,0) as DECIMAL(30,2)) as AmtPoint,  " +
"case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
" CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
" CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( e.s1-ISNULL(d.s1,0))))*c.rateCom/100) ,0) as DECIMAL(30,2)))+(1*(e.s1-ISNULL(d.s1,0))/100) +  case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end),0) AS DECIMAL(30,2)) as SumCOMSP, " +
" CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
" (e.s1-ISNULL(d.s1,0))  as PBH1, "+
" (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
" (1*(e.s1-ISNULL(d.s1,0))/100) as ComPBH1  " +
" From V802 a  " +
" left join ( " +
                " Select  round(Sum(PB) ,2) as S1,CodeG  " +
                " From V802   " +
                "     inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where  codeG = @Login and Month(DocDate) = Month(GETDATE()) and   year(Docdate) = YEAR(GETDATE())  " +
                "  Group by CodeG " +
" )b on b.CodeG = a.codeG " +
" left join ( " +
" select  case when sum(a.PPoint) < A1  then '0'   " +
"              when sum(a.PPoint) >=A1 and sum(a.PPoint) < A2 then Rate1 " +
"              when sum(a.PPoint) >=A3 and sum(a.PPoint) < A4 then Rate2   " +
"              when sum(a.PPoint) >=A5 then Rate3   " +
"              end as RateCom,sum(a.PPoint) as point , " +
" 				case when sum(a.PPoint) < MPoint then '0' else cast(((sum(a.PPoint)  - c.MPoint)/c.PPoint) as int) * c.Incen end as  incentive, a.CodeG " +
"  from V802 a  " +
" 	inner join ItemTier b on b.CodeG = a.CodeG " +
" 	inner join Tier c on c.Code = b.TierCode " +
"  where a.CodeG = @Login and Month(a.DocDate) =  @month1 and year(a.Docdate) = YEAR(GETDATE()) and b.YearCal = YEAR(GETDATE())+543 " +
"  GROUP BY  " +
"     c.A1, c.A2, c.A3, c.A4, c.A5, c.Rate1, c.Rate2, c.Rate3,c.MPoint, c.Incen,c.PPoint,a.CodeG " +
" )c on c.CodeG = a.codeG " +
" left join ( "+
    " select sum(tmp.S1) as s1 ,tmp.CodeG " +
    " from( " +
            " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode  " + 
            " from v802  " +
                " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode  " + 
            " Where    MONTH(docDate) = @month1   and year(Docdate) = YEAR(GETDATE()) " +  
            " group by codeG,V802.ItemCode " + 
            " )tmp " +
    " GROUP BY tmp.CodeG " +    
        " )d on d.CodeG = a.CodeG " +   
" left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode " +  
                " from v802  " +
                    " inner join ItemG on v802.itemcode = ItemG.code  " + 
                " Where   MONTH(docDate) = @month1  and year(Docdate) = YEAR(GETDATE())  and ItemG.grItemCode ='H' "+ 
                " group by codeG,V802.ItemCode " +  
            " )tmp  " +
        " GROUP BY tmp.CodeG " +    
        " )e on e.CodeG = a.CodeG " +
" Where MONTH(docDate) = @month1   and year(Docdate) = YEAR(GETDATE()) and a.CodeG = @Login  "+
" Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,ISNULL(d.s1,0) " ;
    const username= req.session.Login;
    let monthFil = req.body.month;
    console.log(req.body.month);
    let month1;

    if(monthFil == null || monthFil == 'เลือกเดือน'|| monthFil === undefined){
        month1 = 01;

    }else{
      month1 = monthFil;

    }  

    var db = new mssql.Request();
        db.input('month1',mssql.VarChar(50),month1);
        db.input('Login',mssql.VarChar(50),username);
        db.input('quater1',mssql.VarChar(50),monthFil);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;

      console.log(testData)  
        monthFil = monthFil-1 ;
        console.log(monthFil)
        function toThaiMonthString(monthFil) {
            let monthNames = [
                "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
                "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม.",
                "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
            ];
        let month = monthNames[monthFil];
        return ` ${month}`;
    }    
        monthFil = toThaiMonthString(monthFil);
        res.render('pageTable2',  {testData,monthFil});
    });    
});
router.get('/pageTable3',requireLogin,function(req,res){
    const sql = "with Pb as ( " +
                    " select sum(tmp.PB) as PB, sum(tmp.AMTPOINT) as AMTPOINT, sum(tmp.ComSP) as comSP,sum(tmp.cumS) as cums, tmp.CodeG,tmp.NameG,case when   Round(Sum(AmtPoint),2) <350 " +
                        " then 0 " +
                        " when Round(sum(tmp.AMTPOINT),2) >=350 and Round(sum(tmp.AMTPOINT),2) <650 " + 
                        " then Round((0.5*sum(tmp.PB))/100,2) " +
                        " when Round(sum(tmp.AMTPOINT),2) >=650 and Round(sum(tmp.AMTPOINT),2) <950 " +
                        " then Round((sum(tmp.PB))/100,2) " +
                        " when Round(sum(tmp.AMTPOINT),2) >=950 and Round(sum(tmp.AMTPOINT),2) <1250 " +
                        " then Round((1.5*(sum(tmp.PB)))/100,2) " +
                        " when Round(sum(tmp.AMTPOINT),2) >=1250 and Round(sum(tmp.AMTPOINT),2) <1550 " +
                        " then Round((2*(sum(tmp.PB)))/100,2) " +
                        " else Round((2.5*(sum(tmp.PB)))/100,2) " +
                        " end as COMPB " +
                    " from " +
                    "( " +
                        "Select  round(Sum((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) ,2) as PB, Round(Sum(POINT * ((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) /10000),2) as AMTPOINT,Round(Sum(((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) * RateSp/100),2) as COMSP,Round(Sum(CUMS),2) as CUMS ,CodeG  ,NameG " +
                        " From V801 " +  
                        " Where   Month(V801.Docdate) =  MONTH(GETDATE())  and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro <> 0   Group by CodeG,NameG " +
                        " union " + 
                        " Select  round(Sum(Amt-CUMS),2) as PB, Round(Sum(POINT * (Amt-CUMS) /10000),2) as AmtPoint,Round(Sum(ComSp),2) as ComSP,Round(Sum(CUMS),2) as CUMS ,CodeG,NameG " +  
                        " From V801 " +  
                        " Where  Month(V801.Docdate) =  MONTH(GETDATE()) and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro  = 0  Group by CodeG ,NameG " +
                        " )tmp " +
                        "group by tmp.codeG,tmp.NameG " +
                    "), " +  

                "PO as ( " +
                        "select sum(tmp.PB) as PB, sum(tmp.AMTPOINT) as AMTPOINT, sum(tmp.ComSP) as comSP,sum(tmp.cumS) as cums, tmp.CodeG,NameG, " +
                                " case when   Round( sum(tmp.AMTPOINT),2) <350  " +
                                " then 0 " + 
                                " when Round(sum(tmp.AMTPOINT),2) >=350 and Round( sum(tmp.AMTPOINT),2) <650 " +
                                " then Round((0.5*(sum(tmp.PB)))/100,2) " +
                                " when Round( sum(tmp.AMTPOINT),2) >=650 and Round( sum(tmp.AMTPOINT),2) <950 " +
                                " then Round((sum(tmp.PB))/100,2) " +
                                " when Round( sum(tmp.AMTPOINT),2) >=950 and Round( sum(tmp.AMTPOINT),2) <1250 " +
                                " then Round((1.5*(sum(tmp.PB)))/100,2) " +
                                " when Round( sum(tmp.AMTPOINT),2) >=1250 and Round( sum(tmp.AMTPOINT),2) <1550 " +
                                " then Round((2*(sum(tmp.PB)))/100,2) " +
                                " else Round((2.5*(sum(tmp.PB)))/100,2) " +
                                " end as COMPO " +
                        "from " +
                            " ( " +
                                "Select  round(Sum((PB) - ((PB) * Discpro/100)) ,2) as PB, Round(Sum(POINT * ((PB) - ((PB) * Discpro/100)) /10000),2) as AMTPOINT,Round(Sum(((PB) - ((PB) * Discpro/100)) * RateSp/100),2) as COMSP,Round(Sum(DIFFN),2) as CUMS ,CodeG,NameG  From POPOINT  Where   Month(POPOINT.Docdate) =  MONTH(GETDATE())  and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101))  and  DiscPro <> 0   Group by CodeG,NameG " +
                                " union " +
                                " Select  round(Sum(PB),2) as PB, Round(Sum(POINT * (PB) /10000),2) as AmtPoint,Round(Sum(ComSp),2) as ComSP,Round(Sum(DIFFN),2) as CUMS ,CodeG,NameG  From POPOINT  Where  Month(POPOINT.Docdate) =  MONTH(GETDATE())  and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro  = 0  Group by CodeG,NameG "+
                                " )tmp " +
                                " group by tmp.codeG,tmp.NameG " +
                             "), " + 

                "sumPoPb as( " +
                            " select sum(tmp.PBPO) as PBPO,sum(tmp.PBPOPOINT) as PBPOPOINT,sum(tmp.COMPBPO) as COMPBPO, " +
                                     "sum(tmp.COMSPPBPO) as COMSPPBPO,sum(tmp.cumsPoPB) as cumsPoPB ,tmp.CodeG " +
                            " from(  " +
                            "select Pb.PB as PBPO, Pb.AMTPOINT as PBPOPOINT,Pb.COMPB as COMPBPO,Pb.comSP as COMSPPBPO,Pb.cums as cumsPoPB ,Pb.CodeG " +
                            "from Pb " +
                            "UNION ALL " +
                            "select PO.PB as PBPO, PO.AMTPOINT as PBPOPOINT,PO.COMPO as COMPBPO,PO.comSP as COMSPPBPO ,PO.cums as cumsPoPB,PO.CodeG " +
                            "from PO " +
                            ")tmp group by tmp.CodeG " +
                            ") " +            
                            "SELECT Pb.PB,Pb.AMTPOINT,Pb.COMPB,Pb.comSP,Pb.cums,Po.PB as PO,Po.AMTPOINT as POPOINT,sumPoPb.PBPO,sumPoPb.PBPOPOINT,sumPoPb.COMPBPO, " +
                            "sumPoPb.COMSPPBPO,sumPoPb.cumsPoPB,a.NameG " +
                            "from sale a " +
                            "left join Pb on Pb.CodeG = a.CodeG " +
                            "left join PO on PO.CodeG = a.CodeG " +
                            "left join sumPoPb on sumPoPb.CodeG = a.CodeG " +
                            "where a.ST = '1' " +
                            "group by   Pb.PB,Pb.AMTPOINT,Pb.COMPB,Pb.comSP,Pb.cums,Po.PB,Po.AMTPOINT,sumPoPb.PBPO,sumPoPb.PBPOPOINT,sumPoPb.COMPBPO," +
                            "sumPoPb.COMSPPBPO,sumPoPb.cumsPoPB,a.NameG " +
                            "order by Pb.AMTPOINT DESC " ;
        // const customer = req.query.customer;
        const username = req.session.Login;
        let monthFil = "";
        // console.log(customer)
        var db = new mssql.Request();
        // db.input('Customer',mssql.NVarChar(50),customer);
        db.input('Login',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        let date1 = new Date();
        function toThaiMonthString(date) {
                let monthNames = [
                    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
                    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม.",
                    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                ];
            let month = monthNames[date.getMonth()];
            return ` ${month}`;
        }    
        monthFil = toThaiMonthString(date1);
        console.log(testData);
        res.render('pageTable3',  {testData,monthFil});
    }); 
})
router.post('/pageTable3',function(req,res){
    const sql = "with Pb as ( " +
        " select sum(tmp.PB) as PB, sum(tmp.AMTPOINT) as AMTPOINT, sum(tmp.ComSP) as comSP,sum(tmp.cumS) as cums, tmp.CodeG,tmp.NameG,case when   Round(Sum(AmtPoint),2) <350 " +
        " then 0 " +
        " when Round(sum(tmp.AMTPOINT),2) >=350 and Round(sum(tmp.AMTPOINT),2) <650 " + 
        " then Round((0.5*sum(tmp.PB))/100,2) " +
        " when Round(sum(tmp.AMTPOINT),2) >=650 and Round(sum(tmp.AMTPOINT),2) <950 " +
        " then Round((sum(tmp.PB))/100,2) " +
        " when Round(sum(tmp.AMTPOINT),2) >=950 and Round(sum(tmp.AMTPOINT),2) <1250 " +
        " then Round((1.5*(sum(tmp.PB)))/100,2) " +
        " when Round(sum(tmp.AMTPOINT),2) >=1250 and Round(sum(tmp.AMTPOINT),2) <1550 " +
        " then Round((2*(sum(tmp.PB)))/100,2) " +
        " else Round((2.5*(sum(tmp.PB)))/100,2) " +
        " end as COMPB " +
    " from " +
    "( " +
        "Select  round(Sum((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) ,2) as PB, Round(Sum(POINT * ((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) /10000),2) as AMTPOINT,Round(Sum(((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) * RateSp/100),2) as COMSP,Round(Sum(CUMS),2) as CUMS ,CodeG  ,NameG " +
        " From V801 " +  
        " Where   Month(V801.Docdate) =  @month1  and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro <> 0   Group by CodeG,NameG " +
        " union " + 
        " Select  round(Sum(Amt-CUMS),2) as PB, Round(Sum(POINT * (Amt-CUMS) /10000),2) as AmtPoint,Round(Sum(ComSp),2) as ComSP,Round(Sum(CUMS),2) as CUMS ,CodeG,NameG " +  
        " From V801 " +  
        " Where  Month(V801.Docdate) =  @month2 and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro  = 0  Group by CodeG ,NameG " +
        " )tmp " +
        "group by tmp.codeG,tmp.NameG " +
    "), " +  
"PO as ( " +
        "select sum(tmp.PB) as PB, sum(tmp.AMTPOINT) as AMTPOINT, sum(tmp.ComSP) as comSP,sum(tmp.cumS) as cums, tmp.CodeG,NameG, " +
                " case when   Round( sum(tmp.AMTPOINT),2) <350  " +
                " then 0 " + 
                " when Round(sum(tmp.AMTPOINT),2) >=350 and Round( sum(tmp.AMTPOINT),2) <650 " +
                " then Round((0.5*(sum(tmp.PB)))/100,2) " +
                " when Round( sum(tmp.AMTPOINT),2) >=650 and Round( sum(tmp.AMTPOINT),2) <950 " +
                " then Round((sum(tmp.PB))/100,2) " +
                " when Round( sum(tmp.AMTPOINT),2) >=950 and Round( sum(tmp.AMTPOINT),2) <1250 " +
                " then Round((1.5*(sum(tmp.PB)))/100,2) " +
                " when Round( sum(tmp.AMTPOINT),2) >=1250 and Round( sum(tmp.AMTPOINT),2) <1550 " +
                " then Round((2*(sum(tmp.PB)))/100,2) " +
                " else Round((2.5*(sum(tmp.PB)))/100,2) " +
                " end as COMPO " +
        "from " +
            " ( " +
                "Select  round(Sum((PB) - ((PB) * Discpro/100)) ,2) as PB, Round(Sum(POINT * ((PB) - ((PB) * Discpro/100)) /10000),2) as AMTPOINT,Round(Sum(((PB) - ((PB) * Discpro/100)) * RateSp/100),2) as COMSP,Round(Sum(DIFFN),2) as CUMS ,CodeG,NameG  From POPOINT  Where   Month(POPOINT.Docdate) =  @month3  and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101))  and  DiscPro <> 0   Group by CodeG,NameG " +
                " union " +
                " Select  round(Sum(PB),2) as PB, Round(Sum(POINT * (PB) /10000),2) as AmtPoint,Round(Sum(ComSp),2) as ComSP,Round(Sum(DIFFN),2) as CUMS ,CodeG,NameG  From POPOINT  Where  Month(POPOINT.Docdate) =  @month4  and year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro  = 0  Group by CodeG,NameG "+
                " )tmp " +
                " group by tmp.codeG,tmp.NameG " +
             "), " + 
"sumPoPb as( " +
            " select sum(tmp.PBPO) as PBPO,sum(tmp.PBPOPOINT) as PBPOPOINT,sum(tmp.COMPBPO) as COMPBPO, " +
                     "sum(tmp.COMSPPBPO) as COMSPPBPO,sum(tmp.cumsPoPB) as cumsPoPB ,tmp.CodeG " +
            " from(  " +
            "select Pb.PB as PBPO, Pb.AMTPOINT as PBPOPOINT,Pb.COMPB as COMPBPO,Pb.comSP as COMSPPBPO,Pb.cums as cumsPoPB ,Pb.CodeG " +
            "from Pb " +
            "UNION ALL " +
            "select PO.PB as PBPO, PO.AMTPOINT as PBPOPOINT,PO.COMPO as COMPBPO,PO.comSP as COMSPPBPO ,PO.cums as cumsPoPB,PO.CodeG " +
            "from PO " +
            ")tmp group by tmp.CodeG " +
            ") " +            
            "SELECT Pb.PB,Pb.AMTPOINT,Pb.COMPB,Pb.comSP,Pb.cums,Po.PB as PO,Po.AMTPOINT as POPOINT,sumPoPb.PBPO,sumPoPb.PBPOPOINT,sumPoPb.COMPBPO, " +
            "sumPoPb.COMSPPBPO,sumPoPb.cumsPoPB,a.NameG " +
            "from sale a " +
            "left join Pb on Pb.CodeG = a.CodeG " +
            "left join PO on PO.CodeG = a.CodeG " +
            "left join sumPoPb on sumPoPb.CodeG = a.CodeG " +
            "where a.ST = '1' " +
            "group by   Pb.PB,Pb.AMTPOINT,Pb.COMPB,Pb.comSP,Pb.cums,Po.PB,Po.AMTPOINT,sumPoPb.PBPO,sumPoPb.PBPOPOINT,sumPoPb.COMPBPO," +
            "sumPoPb.COMSPPBPO,sumPoPb.cumsPoPB,a.NameG " +
            "order by Pb.AMTPOINT DESC " ;
    const username= req.session.Login;
    let monthFil = req.body.month;
    console.log("qq" );
    console.log(req.body.month);
    let month1;

    let month2;
    let month3;
    if(monthFil == null || monthFil == 'เลือกเดือน'|| monthFil === undefined){
        console.log("b")
        month1 = 01;
        month2 = 01;
        month3 = 01;
    }else{
      month1 = monthFil;
      month2 = monthFil;
      month3 = monthFil;
    }  
    var db = new mssql.Request();
        db.input('month1',mssql.VarChar(50),month1);
        db.input('month2',mssql.VarChar(50),month2);
        db.input('month3',mssql.VarChar(50),month3);
        db.input('month4',mssql.VarChar(50),month3);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        monthFil = monthFil-1 ;
        console.log(monthFil)
        function toThaiMonthString(monthFil) {
            let monthNames = [
                "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
                "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม.",
                "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
            ];
        let month = monthNames[monthFil];
        return ` ${month}`;
    }    
        monthFil = toThaiMonthString(monthFil);
        
        res.render('pageTable3',  {testData,monthFil});
    });    
});
router.get('/pageTable1',requireLogin,function(req,res){
   const sql = "with   Months AS " +
                                " ( " +
                                " SELECT 1 AS MonthNum " +
                                " UNION ALL " +
                                " SELECT MonthNum + 1 as MonthNum FROM Months WHERE MonthNum <12 " +
                                " ), " +
                        "monthTable as( " +
                                       "  SELECT  Right('0'+cast(MonthNum as VARCHAR(2)),2)  as MonthNum FROM Months " +
                                   "  ), " +
                        " tmpAll as( " +
                                    " select CustName ,CustCode,concat(round(Sum(Amt-CUMS),2),' ',Round(Sum(POINT * (Amt-CUMS) /10000),2)) as PB ,Round(Sum(POINT * (Amt-CUMS) /10000),2) as point,MONTH(DocDate) as monDoc from V801  inner join Months on 1=1 and CodeG = @Login and MONTH(DocDate)  = Months.MonthNum and Year(DocDate) = Year(GETDATE()) " +
                                   "  group by CustName,CustCode,MONTH(DocDate) " +
                                " ) " +
                    " select v.CustName,  firstMon.point as one , secondMon.point as  two ,thirdMon.point as three , fourthMon.point as fourth, fifthMon.point as fifth, sixMon.point as six ,sevenMon.point as seven , eightMon.point as eight, " +
                            " nineMon.point as nine,tenMon.point as ten, elevenMon.point as eleven, twelvemon.point as twelve " +
                    " from tmpAll v " +
                    " left join ( " +
                               "  select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " from  tmpAll " +
                                " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " ) firstMon on firstMon.CustName = v.CustName and firstMon.monDoc = '1'" +
                    " left join( " +
                            " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " from  tmpAll  " +
                            " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) secondMon on secondMon.CustName = v.CustName  and secondMon.monDoc = '2'" +
                    " left join( " +
                                " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " from  tmpAll " +
                                " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " ) thirdMon on thirdMon.CustName = v.CustName  and thirdMon.monDoc = '3'" +
                    " left join( " +
                                " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " from  tmpAll " +
                                " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " ) fourthMon on fourthMon.CustName = v.CustName and fourthMon.monDoc = '4'" +
                    " left join( " +
                                " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " from  tmpAll " +
                                " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                              " ) fifthMon on fifthMon.CustName = v.CustName and fifthMon.monDoc = '5'" +
                    " left join( " +
                                " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                                " from  tmpAll " +
                                " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                             " ) sixMon on sixMon.CustName = v.CustName and sixMon.monDoc = '6'" +
                     " left join( " +
                             " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                             " from  tmpAll " +
                             " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) sevenMon on sevenMon.CustName = v.CustName  and sevenMon.monDoc = '7'" +
                    " left join( " +
                            " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " from  tmpAll " +
                            " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) eightMon on eightMon.CustName = v.CustName and eightMon.monDoc = '8'" +
                    " left join( " +
                            " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " from  tmpAll " +
                            " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) nineMon on nineMon.CustName = v.CustName and nineMon.monDoc = '9'" +
                    " left join( " +
                            " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " from  tmpAll  " +
                            " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) tenMon on tenMon.CustName = v.CustName  and tenMon.monDoc = '10'" +
                    " left join( " +
                            " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " from  tmpAll " +
                            " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) elevenMon on elevenMon.CustName = v.CustName   and elevenMon.monDoc = '11'" +
                    " left join( " +
                           " select tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " from  tmpAll " +
                            " group by tmpAll.CustName,tmpAll.monDoc,tmpAll.point " +
                            " ) twelveMon on twelveMon.CustName = v.CustName   and twelveMon.monDoc = '12'  " +
                   "  group by v.CustName,firstMon.point,secondMon.point,thirdMon.point,fourthMon.point,fifthMon.point,sixMon.point, " +
                    " sevenMon.point,eightMon.point,nineMon.point,tenMon.point,elevenMon.point,twelveMon.point ";
        const customer = req.query.customer;
        const username = req.session.Login;
        console.log(customer)
        var db = new mssql.Request();
        db.input('Login',mssql.NVarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        console.log(data );
        res.render('pageTable1',  {testData});
    }); 
})
router.get('/subTable',requireLogin,function(req,res){
    const sql = "SELECT CustCode, CustName2 as Name, format(DocDate,'dd/MM/yyyy') as DateDoc, Package, ItemName, Price, Qty,QtySale, Amt, Cost AS PB, CUMS, CodeG " +
                "FROM  dbo.RptSale3N " +
                "where codeG =@Login and CustName2 = @Customer and year(docdate) >= YEAR(GETDATE())  order by DocDate DESC ";
        const customer = req.query.customer;
        const username = req.session.Login;
        console.log(customer)
        var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.input('Customer',mssql.NVarChar(50),customer);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        // router.set('views', path.join(__dirname, 'views'));
        // const html = fs.readFileSync( __dirname + 'subTable.ejs' );
        // res.json({html: html.toString(), data});
        // res.send(data);
        res.render('subTable',  {testData});
    }); 
})
router.get('/detailPoint/subTableDetail',requireLogin,function(req,res){
    const sql = "SELECT CustCode, CustName2 as Name, format(DocDate,'dd/MM/yyyy') as DateDoc, Package, ItemName, Price,Qty, QtySale, Amt, Cost AS PB, CUMS, CodeG,OrderNo,cu,MS " +
                "FROM  dbo.RptSale3N " +
                "where codeG =@Login and CustCode = @Customer order by convert(datetime, DocDate, 100) DESC ";
        const customer = req.query.customer;
        const username = req.session.Login;
        console.log(customer)
        var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.input('Customer',mssql.NVarChar(50),customer);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        console.log(testData );
        res.render('subTableDetail',  {testData});
    }); 
})
router.get('/detailPoint',requireLogin,function(req,res){
    const sql = "select CustName ,CustCode,CodeG from V801   where CodeG = @Login  and Year(DocDate) >= '2021' group by CustName,CustCode,CodeG ";
        // const customer = req.query.customer;
        const username = req.session.Login;
        // console.log(customer)
        var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        console.log(testData );
        res.render('detailPoint',  {testData});
    }); 
})
router.get('/pageTable4',requireLogin,function(req,res){
    const sql =     "  with     Months AS   "+
                                " (   "+
                                " SELECT 1 AS MonthNum   "+
                                " UNION ALL   "+
                                " SELECT MonthNum + 1 as MonthNum FROM Months WHERE MonthNum <12   "+
                                " ),   "+
                        " monthTable as(   "+
                                    " select  tmp.MonthNum,v.NameG ,v.CodeG,tmp.numPB "+
                                " from(  "+
                                       "  SELECT  MonthNum,1 as numPB FROM Months "+
                                        " union all "+
                                        " SELECT  MonthNum,2 as numPB FROM Months "+
                                        " union all "+
                                        " SELECT  MonthNum,3 as numPB FROM Months "+
                                        " union all "+
                                        " SELECT  MonthNum,4 as numPB FROM Months "+
                                        " )tmp "+
                                " inner join sale v on 1=1 "+
                                " where v.ST = '1' and v.NameG is not null "+
                                    " ) , "+
                        " PB as ( "+
                           "  select sum(tmp.PB) as PB, sum(tmp.AMTPOINT) as AMTPOINT, sum(tmp.ComSP) as comSP,sum(tmp.cumS) as cums, tmp.CodeG,tmp.NameG, "+
                                " case when   Round(Sum(AmtPoint),2) <350  "+
                                " then 0  "+
                                " when Round(sum(tmp.AMTPOINT),2) >=350 and Round(sum(tmp.AMTPOINT),2) <650   "+
                                " then Round((0.5*sum(tmp.PB))/100,2)  "+
                                " when Round(sum(tmp.AMTPOINT),2) >=650 and Round(sum(tmp.AMTPOINT),2) <950  "+
                                " then Round((sum(tmp.PB))/100,2)  "+
                                " when Round(sum(tmp.AMTPOINT),2) >=950 and Round(sum(tmp.AMTPOINT),2) <1250  "+
                                " then Round((1.5*(sum(tmp.PB)))/100,2)  "+
                                " when Round(sum(tmp.AMTPOINT),2) >=1250 and Round(sum(tmp.AMTPOINT),2) <1550  "+
                                " then Round((2*(sum(tmp.PB)))/100,2)  "+
                                " else Round((2.5*(sum(tmp.PB)))/100,2)  "+
                                    " end as COMPB ,tmp.monthDate "+
                                " from  "+
                                    " (  "+
                                    " Select  round(Sum((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) ,2) as PB, Round(Sum(POINT * ((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) /10000),2) as AMTPOINT,Round(Sum(((Amt-CUMS) - ((Amt-CUMS) * Discpro/100)) * RateSp/100),2) as COMSP,Round(Sum(CUMS),2) as CUMS ,CodeG  ,NameG,month(docDate) as monthDate " +
                                    " From V801    "+
                                    " Where    year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro <> 0   Group by CodeG,NameG,month(docDate) " +
                                    " union   "+
                                    " Select  round(Sum(Amt-CUMS),2) as PB, Round(Sum(POINT * (Amt-CUMS) /10000),2) as AmtPoint,Round(Sum(ComSp),2) as ComSP,Round(Sum(CUMS),2) as CUMS ,CodeG,NameG ,month(docDate) as monthDate  " +
                                    " From V801    "+
                                    " Where   year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro  = 0  Group by CodeG ,NameG,month(docDate)  "+
                                    " )tmp  "+
                                " group by tmp.codeG,tmp.NameG,tmp.monthDate "+
                                " ), "+
                " tempSale as ( "+
                                " select  v.NameG ,v.CodeG,tmp.numPB,tmp.PBType "+
                                " from(  "+
                                        " SELECT  1 as numPB ,'Point' as PBType "+
                                        " union all "+
                                        " SELECT 2 as numPB ,'ComPB' as PBType "+
                                        " union all "+
                                        " SELECT  3 as numPB ,'ComSP' as PBType "+
                                        " union all "+
                                        " SELECT 4 as numPB ,'Total' as PBType "+
                                        " )tmp "+
                                " inner join sale v on 1=1 "+
                                " where v.ST = '1' and v.NameG is not null "+
                                " group by v.NameG ,v.CodeG,tmp.numPB,tmp.PBType "+
                            " ), "+
                " sumPB as    (    "+
                                " select sum(tmp.totalPB) as totalPB , tmp.NAMEG,tmp.monthDate,tmp.CodeG "+
                                " from (  "+
                                        " select PB.COMPB as totalPB , PB.NAMEG,PB.monthDate,PB.codeG "+
                                        " from PB "+
                                        " union all "+
                                        " select PB.comSP as totalPB , PB.NAMEG,PB.monthDate,PB.codeG "+
                                        " from PB "+
                                      " )tmp "+
                               "  group by tmp.NAMEG,tmp.monthDate,tmp.CodeG "+
                            " ), "+
                    " tmpAll      as      (    "+
                              " select tmp.numPB,tmp.NameG,tmp.monthDate, tmp.PBType,tmp.PBdata "+
                              " from ( "+
                                       "  select 1 as numPB,PB.AMTPOINT as PBdata,'Point' as PBType, PB.CodeG,PB.nameG ,Pb.monthDate "+
                                       "  from PB   "+
                                       "  inner join sale v on v.CodeG = PB.CodeG "+
                                       "  where v.ST = '1' and v.NameG is not null "+
                                       "  union  "+
                                       "  select 2 as numPB,PB.COMPB as PBdata,'ComPB' as PBType,PB.CodeG,PB.nameG ,Pb.monthDate "+
                                       "  from PB "+
                                       "  inner join sale v on v.CodeG = PB.CodeG "+
                                       "  where v.ST = '1' and v.NameG is not null "+
                                       "  union  "+
                                       "  select 3 as numPB,PB.comSP as PBdata,'ComSP' as PBType,PB.CodeG,PB.nameG ,Pb.monthDate "+
                                       "  from PB "+
                                       "  inner join sale v on v.CodeG = PB.CodeG "+
                                       "  where v.ST = '1' and v.NameG is not null "+
                                       "  union  "+
                                       "  select 4 as numPB,sumPB.totalPB as PBdata,'Total' as PBType,sumPB.CodeG,sumPB.nameG ,sumPB.monthDate "+
                                       "  from sumPB "+
                                       "  inner join sale v on v.CodeG = sumPB.CodeG "+
                                       "  where v.ST = '1' and v.NameG is not null "+
                                    " )tmp "+
                                " )  "+
                    " select v.NameG,v.PBType,firstMon.PBdata as one,secondMon.PBdata as two ,thirdMon.PBdata as third,fourthMon.PBdata as fourth , "+
                            " fifthMon.PBdata as fifth , sixMon.PBdata as six, sevenMon.PBdata as seven, eightMon.PBdata as eight,nineMon.PBdata as nine, "+
                            " tenMon.PBdata as ten,eleventMon.PBdata as elevent,twelveMon.PBdata as twelve "+
                    " from tempSale v   "+
                    " left join (   "+
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate "+
                                " from  tmpAll   "+
                                " where tmpAll.MonthDate = '1'   "+
                                " ) firstMon on firstMon.NameG = v.NameG   and firstMon.numPB = v.numPB "+
                    " left join (   "+
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate "+
                                " from  tmpAll   "+
                                " where tmpAll.MonthDate = '2'   "+
                                " ) secondMon on secondMon.NameG = v.NameG  and secondMon.numPB = v.numPB "+
                    " left join (   "+
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate "+
                                " from  tmpAll   "+
                                " where tmpAll.MonthDate = '3'   "+
                                " ) thirdMon on thirdMon.NameG = v.NameG  and thirdMon.numPB = v.numPB "+
                    " left join (   "+
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate "+
                                " from  tmpAll   "+
                                " where tmpAll.MonthDate = '4'   "+
                                " ) fourthMon on fourthMon.NameG = v.NameG  and fourthMon.numPB = v.numPB "+
                    " left join (   "+
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate "+
                                " from  tmpAll   "+
                                " where tmpAll.MonthDate = '5'   "+
                                " ) fifthMon on fifthMon.NameG = v.NameG  and fifthMon.numPB = v.numPB "+
                    " left join (   "+
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                                " where tmpAll.MonthDate = '6'   " +
                                " ) sixMon on sixMon.NameG = v.NameG  and sixMon.numPB = v.numPB " +
                    " left join (   " +
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                                " where tmpAll.MonthDate = '7'   " +
                                " ) sevenMon on sevenMon.NameG = v.NameG  and sevenMon.numPB = v.numPB " +
                    " left join (   " +
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                                " where tmpAll.MonthDate = '8'   " +
                                " ) eightMon on eightMon.NameG = v.NameG  and eightMon.numPB = v.numPB " +
                    " left join (   " +
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                                " where tmpAll.MonthDate = '9'   " +
                                " ) nineMon on nineMon.NameG = v.NameG  and nineMon.numPB = v.numPB " +
                    " left join (   " +
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                                " where tmpAll.MonthDate = '10'   " +
                                " ) tenMon on tenMon.NameG = v.NameG  and tenMon.numPB = v.numPB " +
                    " left join (   " +
                                " select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                                " where tmpAll.MonthDate = '11'   " +
                                " ) eleventMon on eleventMon.NameG = v.NameG  and eleventMon.numPB = v.numPB " +
                    " left join (   " +
                               "  select tmpAll.PBType,tmpAll.PBdata,tmpAll.NameG,ROW_NUMBER() OVER(PARTITION BY tmpAll.NameG ORDER BY tmpAll.numPb ASC) as orderData,tmpAll.numPB,tmpAll.MonthDate " +
                                " from  tmpAll   " +
                               "  where tmpAll.MonthDate = '12'   " +
                               "  ) twelveMon on twelveMon.NameG = v.NameG  and twelveMon.numPB = v.numPB " +
                   "  order by v.NameG,v.numPB ;" +
                   " select v.NameG  from sale  v " +
                   " inner join ( " +
                                               " select sum(a.AmtPoint) as amtPoint, a.NameG " +
                                               " from( " +
                                                        " Select  Round(Sum(POINT * (Amt-CUMS) /10000),2) as AmtPoint ,NameG " +
                                                       " From V801 " +  
                                                       " Where   year(Docdate) =  year(CONVERT(VARCHAR, GETDATE(), 101)) and DiscPro  = 0  Group by CodeG ,NameG,month(docDate) " +
                                                       " )a " +
                                               " group by a.NameG " +       
                                            " ) a on v.NameG = a.NameG " +
                    " where v.ST ='1'and v.NameG is not null " + 
                    " order by a.amtPoint DESC ";
        var db = new mssql.Request();
        // db.input('Login',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        let testData2 = data.recordsets[1];
        let newPerson = new Array(testData.length);
        let k = 0 ;
        let a = 0;
            console.log(testData)
        for(let i = 0; i<testData2.length;i++){
            for(let j = 0; j <testData.length;j++){
                console.log(testData[j].NameG)
                if(testData2[i].NameG == testData[j].NameG){
                    if(k<=4){
                        newPerson[a] = testData[j];
                        a++;
                        k++;
                    }else{
                        newPerson[a] = testData[j];
                        a++;
                        k=0;
                    }
                }
            }
        }
        console.log(newPerson)
        res.render('pageTable4',  {newPerson,testData2});
    });
})
router.get('/reportSalePage',requireLogin,function(req,res){
    const sql =  "with firstTemp as ( " +
                        "SELECT   rptSale3.custCode,rptSale3.custName,rptSale3.custName2,rptSale3.saleName ,Sum(Amt) as NetAmt  ,Sum(Cost) as PB,Sum(AmtDiff) as CUMS ,Sum(cu) as cu, sum(ms) as ms "+   
                        "from rptSale3 "+  
                        "WHERE    year(rptSale3.DocDate) =year(CONVERT(VARCHAR, GETDATE(), 101)) and    rptSale3.CodeG = @Login "+  
                        "Group by rptSale3.custCode,rptSale3.custName,rptSale3.saleName,SaleCode ,rptSale3.custName2 "+
                    "), "+
 "secondTemp as  ( "+ 
                    "SELECT  Sum(Amt) as NetAmt  ,Sum(Cost) as PB,Sum(AmtDiff) as CUMS,salecode,CustCode "+   
                    "from rptSale3 "+
                    "WHERE     year(rptSale3.DocDate) =year(CONVERT(VARCHAR, GETDATE(), 101)) and    rptSale3.CodeG = @Login2 "+  
                             "and rptSale3.DocSP ='1' "+ 
                    "Group by rptSale3.custCode,rptSale3.SaleCode "+ 
                "), "+
"thirdTemp as  ( "+ 
                    "SELECT  Sum(Amt) as NetAmt  ,Sum(Cost) as PB,Sum(AmtDiff) as CUMS,salecode,CustCode "+   
                    "from rptSale3 "+ 
                    "WHERE     year(rptSale3.DocDate) =year(CONVERT(VARCHAR, GETDATE(), 101)) and    rptSale3.CodeG = @Login3 "+ 
                              "and rptSale3.DocSP ='2' "+ 
                    "Group by rptSale3.custCode,rptSale3.SaleCode "+ 
                ") "+
                "select a.custCode , a.custName2 as custName , a.saleName , a.NetAmt as NetOne, a.PB as PBOne,a.Cums as CumsOne,a.cu as CuOne, a.ms as msOne, b.NetAmt as NetTwo, "+
                "b.PB as PBTwo,b.CUMS as cumsTwo ,c.NetAmt as NetThree,c.PB as PBThree,c.CUMS as CUMSThree "+
                "from firstTemp a "+ 
                "left join secondTemp b on b.CustCode = a.CustCode "+
                "left join thirdTemp c on c.CustCode = a.CustCode" ;
        const username = req.session.Login;
        var db = new mssql.Request();
        db.input('Login',mssql.VarChar(50),username);
        db.input('Login2',mssql.VarChar(50),username);
        db.input('Login3',mssql.VarChar(50),username);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        console.log(testData);
        res.render('reportSalePage',  {testData, 
            surName:req.session.surName,
            lastName:req.session.lastName
        });
    }); 
})

router.get('/salesQuater',requireLogin,function(req,res){
     const sql =  " with  " +
             "   Months AS  (  "+
             "                           SELECT 1 AS MonthNum  "+
             "                           UNION ALL  "+
             "                           SELECT MonthNum + 1 as MonthNum  FROM Months WHERE MonthNum <12  "+
             "                           ), "+
             "   monthTable as(  "+
             "                           SELECT  Right('0'+cast(MonthNum as VARCHAR(2)),2)  as MonthNum , "+
             "                                       CASE WHEN MonthNum IN (1,2,3)  then '1'  "+
             "                                       when MonthNum IN (4,5,6)  then '2'   "+
             "                                       when MonthNum IN (7,8,9) then '3'  "+
             "                                       else '4' end  as quater  ,MonthNum as monthOri "+
             "                           FROM Months  "+
             "                           ), "+
             "    newRate as ("+ 
             `select
             tmp.CodeG, 
SUM(tmp.incentive) AS incentive, 
SUM(tmp.point) AS point,
CASE  
WHEN SUM(tmp.point) < tmp.A1 * 3 THEN '0'   
WHEN SUM(tmp.point) >= tmp.A1 * 3 AND SUM(tmp.point) < tmp.A2 * 3 THEN tmp.Rate1 
WHEN SUM(tmp.point) >= tmp.A3 * 3 AND SUM(tmp.point) < tmp.A4 * 3 THEN tmp.Rate2   
WHEN SUM(tmp.point) >= tmp.A5 * 3 THEN tmp.Rate3  
END AS RateCom
             from(
 SELECT 
a.CodeG,
SUM(a.PPoint) AS point,
CASE 
WHEN SUM(a.PPoint) < c.MPoint THEN '0'
ELSE CAST(((SUM(a.PPoint) - c.MPoint) / c.PPoint) AS INT) * c.Incen
END AS incentive,
MONTH(a.DocDate) AS mon,
c.A1, c.A2, c.A3, c.A4, c.A5, 
c.Rate1, c.Rate2, c.Rate3,
c.MPoint, c.PPoint, c.Incen,
b.TierCode as tier
FROM 
V802 a  
INNER JOIN ItemTier b ON b.CodeG = a.CodeG 
INNER JOIN Tier c ON c.Code = b.TierCode 
WHERE  
Month(a.DocDate) in (select  MonthNum from monthTable where quater =  (select  quater from monthTable where quater = (select quater from monthTable where monthOri = Month(GETDATE()) ) group by quater) )
AND YEAR(a.DocDate) = YEAR(GETDATE()) 
and b.YearCal = YEAR(GETDATE())+543   
GROUP BY 
a.CodeG, c.A1, c.A2, c.A3, c.A4, c.A5, 
c.Rate1, c.Rate2, c.Rate3, c.MPoint, c.PPoint, c.Incen, b.TierCode, MONTH(a.DocDate)
) tmp 
GROUP BY 
tmp.CodeG, tmp.tier, tmp.A1, tmp.A2, tmp.A3, tmp.A4, tmp.A5, tmp.Rate1, tmp.Rate2, tmp.Rate3` + 
                    "                        ), "+ 
             "   mainTable as ( Select 0 as num, NameG, ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, "+
             "                                                CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,   "+
             "                                                CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , f.RateCom , f.incentive, CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  "+
             "                                                CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP,  "+
             "                                                CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( ISNULL(e.s1,0)-ISNULL(d.s1,0))))*f.rateCom/100),0) as DECIMAL(30,2)) as AmtPoint, case when c.RateCom = '0'  then '0'else  "+
             "                                                CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI ,  "+
             "                                                CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP,  "+
             "                                                CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( e.s1-ISNULL(d.s1,0))))*f.rateCom/100) ,0) as DECIMAL(30,2)))+(case when Cast(f.RateCom as float) < 1 then 0.5 else 1 end*(e.s1-ISNULL(d.s1,0))/100) +  case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end),0) AS DECIMAL(30,2)) as SumCOMSP,    "+
             "                                                CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, (ISNULL(e.s1,0)-ISNULL(ISNULL(d.s1,0),0))  as PBH1, (ISNULL(Sum(PB),0)-ISNULL((e.s1),0)) as PBCal,  "+
             "                                                (case when Cast(f.RateCom as float) ='0' then 0 when Cast(f.RateCom as float) ='0.5'  then 0.5 else 1 end*(ISNULL(e.s1,0)-ISNULL(d.s1,0))/100) as ComPBH1  "+
             "                               From V802 a  left join ( Select  round(Sum(PB) ,2) as S1,CodeG  "+
             "                                                                                From V802 inner join itemcomPI on v802.itemcode = itemcomPI.itemcode  "+
             "                                                                                Where   MONTH(docDate) between @month1 and @month2  and year(Docdate) = YEAR(GETDATE())  "+
             "                                                                                Group by CodeG  "+
             "                                                                             )b on b.CodeG = a.codeG  "+
             " left join ( "+
             "                                                  select  case when sum(a.PPoint) < A1  then '0'   " +
                    "              when sum(a.PPoint) >=A1 and sum(a.PPoint) < A2 then Rate1 " +
                     "              when sum(a.PPoint) >=A3 and sum(a.PPoint) < A4 then Rate2   " +
                     "              when sum(a.PPoint) >=A5 then Rate3   " +
                     "              end as RateCom,sum(a.PPoint) as point , " +
                    " 				case when sum(a.PPoint) < MPoint then '0' else cast(((sum(a.PPoint)  - c.MPoint)/c.PPoint) as int) * c.Incen end as  incentive, a.CodeG " +
                    "  from V802 a  " +
                    " 	inner join ItemTier b on b.CodeG = a.CodeG " +
                    " 	inner join Tier c on c.Code = b.TierCode " +
                    "  where  Month(a.DocDate) BETWEEN   @month1 and @month2 and year(a.Docdate) = YEAR(GETDATE()) and b.YearCal = YEAR(GETDATE())+543 " +
                    "  GROUP BY  " +
                    "     c.A1, c.A2, c.A3, c.A4, c.A5, c.Rate1, c.Rate2, c.Rate3,c.MPoint, c.Incen,c.PPoint,a.CodeG " +
             "                                                                            )c on c.CodeG = a.codeG  "+
             "                                                        left join ( select sum(tmp.S1) as s1 ,tmp.CodeG  "+
             "                                                                                from( select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode  "+
             "                                                                                            from v802  "+
             "                                                                                                   inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    "+
             "                                                                                            Where MONTH(docDate) between @month1 and @month2  and year(Docdate) = YEAR(GETDATE())  "+
             "                                                                                            group by codeG,V802.ItemCode  "+
             "                                                                                           )tmp GROUP BY tmp.CodeG  "+
             "                                                                            )d on d.CodeG = a.CodeG  "+
             "                                                     left join ( select sum(tmp.S1) as s1 ,tmp.CodeG  "+
             "                                                                               from( select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode  "+
             "                                                                                           from v802  "+
             "                                                                                               inner join ItemG on v802.itemcode = ItemG.code  "+
             "                                                                                           Where MONTH(docDate) between  @month1 and  @month2  and year(Docdate) = YEAR(GETDATE())  and ItemG.grItemCode ='H'  "+
             "                                                                                           group by codeG,V802.ItemCode  "+
             "                                                                                           )tmp GROUP BY tmp.CodeG  "+
             "                                                                           )e on e.CodeG = a.CodeG  "+
             "                                                     inner join newRate f on f.CodeG = a.CodeG  "+
             "                       Where MONTH(docDate) between @month1 and @month2  and year(Docdate) = YEAR(GETDATE())  "+
             "                       Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,ISNULL(d.s1,0),c.point,f.RateCom,f.incentive "+
             "                   ) "+
             "                   select * from mainTable  "+
             "                   union all  "+
             "                   select 1 as num,'รวมทั้งหมด' as NameG,'' as Row,sum(tmp.sales) as sales , sum(PB) as PB , sum(POINTSALE) as POINTSALE, '' as RateCom,   "+
             "                               sum(incentive) as incentive,sum(PBI) as PBI , 0 as PP , sum(AmtPoint) as  AmtPoint ,sum(ComPBI) as ComPBI, sum(COMSP) as COMSP ,  "+
             "                               sum(SumCOMSP) as sumCOMSP,sum(CUMS) as CUMS, sum(PBH1) as PBH1 , sum(PBCal) as PBCal , sum(ComPBH1) as ComPBH1  "+
                                " from mainTable tmp  ";
        const username = req.session.Login;
        quater(month);
        var db = new mssql.Request();
        db.input('month1',mssql.VarChar(50),month1);
        db.input('month2',mssql.VarChar(50),month2);
        db.input('quater',mssql.VarChar(50),monthFil);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        res.render('salesQuater',  {testData,monthFil});
    }); 
})
router.post('/salesQuater',function(req,res){
    const sql =  " with  " +
             "   Months AS  (  "+
             "                           SELECT 1 AS MonthNum  "+
             "                           UNION ALL  "+
             "                           SELECT MonthNum + 1 as MonthNum  FROM Months WHERE MonthNum <12  "+
             "                           ), "+
             "   monthTable as(  "+
             "                           SELECT  Right('0'+cast(MonthNum as VARCHAR(2)),2)  as MonthNum , "+
             "                                       CASE WHEN MonthNum IN (1,2,3)  then '1'  "+
             "                                       when MonthNum IN (4,5,6)  then '2'   "+
             "                                       when MonthNum IN (7,8,9) then '3'  "+
             "                                       else '4' end  as quater   "+
             "                           FROM Months  "+
             "                           ), "+
            "    newRate as ( "+ 
            ` select
            tmp.CodeG, 
SUM(tmp.incentive) AS incentive, 
SUM(tmp.point) AS point,
CASE  
WHEN SUM(tmp.point) < tmp.A1 * 3 THEN '0'   
WHEN SUM(tmp.point) >= tmp.A1 * 3 AND SUM(tmp.point) < tmp.A2 * 3 THEN tmp.Rate1 
WHEN SUM(tmp.point) >= tmp.A3 * 3 AND SUM(tmp.point) < tmp.A4 * 3 THEN tmp.Rate2   
WHEN SUM(tmp.point) >= tmp.A5 * 3 THEN tmp.Rate3  
END AS RateCom
            from (
SELECT 
a.CodeG,
SUM(a.PPoint) AS point,
CASE 
WHEN SUM(a.PPoint) < c.MPoint THEN '0'
ELSE CAST(((SUM(a.PPoint) - c.MPoint) / c.PPoint) AS INT) * c.Incen
END AS incentive,
MONTH(a.DocDate) AS mon,
c.A1, c.A2, c.A3, c.A4, c.A5, 
c.Rate1, c.Rate2, c.Rate3,
c.MPoint, c.PPoint, c.Incen,
b.TierCode as tier
FROM 
V802 a  
INNER JOIN ItemTier b ON b.CodeG = a.CodeG 
INNER JOIN Tier c ON c.Code = b.TierCode 
WHERE  
Month(a.DocDate) in (select  MonthNum from monthTable where quater = @quater1 ) 
AND YEAR(a.DocDate) = YEAR(GETDATE()) 
and b.YearCal = YEAR(GETDATE())+543   
GROUP BY 
a.CodeG, c.A1, c.A2, c.A3, c.A4, c.A5, 
c.Rate1, c.Rate2, c.Rate3, c.MPoint, c.PPoint, c.Incen, b.TierCode, MONTH(a.DocDate)
) tmp 
GROUP BY 
tmp.CodeG, tmp.tier, tmp.A1, tmp.A2, tmp.A3, tmp.A4, tmp.A5, tmp.Rate1, tmp.Rate2, tmp.Rate3 ` + 
                    "                        ), "+ 
             "   mainTable as ( Select 0 as num, NameG, ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, "+
             "                                                CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,   "+
             "                                                CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , f.RateCom , f.incentive, CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  "+
             "                                                CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP,  "+
             "                                              CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( ISNULL(e.s1,0)-ISNULL(d.s1,0))))*f.rateCom/100),0) as DECIMAL(30,2)) as AmtPoint, case when c.RateCom = '0'  then '0'else   "+
             "                                                CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI ,  "+
             "                                                CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP,  "+
             "                                                CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - (ISNULL(b.s1,0)+ ( e.s1-ISNULL(d.s1,0))))*f.rateCom/100) ,0) as DECIMAL(30,2)))+(case when Cast(f.RateCom as float) < 1 then 0.5 else 1 end*(e.s1-ISNULL(d.s1,0))/100) +  case when c.RateCom = '0'  then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end),0) AS DECIMAL(30,2)) as SumCOMSP,     "+
             "                                                CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, (ISNULL(e.s1,0)-ISNULL(ISNULL(d.s1,0),0))  as PBH1, (ISNULL(Sum(PB),0)-ISNULL((e.s1),0)) as PBCal,  "+
             "                                                (case when Cast(f.RateCom as float) ='0' then 0 when Cast(f.RateCom as float) ='0.5'  then 0.5 else 1 end*(ISNULL(e.s1,0)-ISNULL(d.s1,0))/100)  as ComPBH1  "+
             "                               From V802 a  left join ( Select  round(Sum(PB) ,2) as S1,CodeG  "+
             "                                                                                From V802 inner join itemcomPI on v802.itemcode = itemcomPI.itemcode  "+
             "                                                                                Where   MONTH(docDate) between @month1 and @month2  and year(Docdate) = YEAR(GETDATE())  "+
             "                                                                                Group by CodeG  "+
             "                                                                             )b on b.CodeG = a.codeG  "+
             "                                                        left join ( "+
                "                                                  select  case when sum(a.PPoint) < A1  then '0'   " +
                "              when sum(a.PPoint) >=A1 and sum(a.PPoint) < A2 then Rate1 " +
                 "              when sum(a.PPoint) >=A3 and sum(a.PPoint) < A4 then Rate2   " +
                 "              when sum(a.PPoint) >=A5 then Rate3   " +
                 "              end as RateCom,sum(a.PPoint) as point , " +
                " 				case when sum(a.PPoint) < MPoint then '0' else cast(((sum(a.PPoint)  - c.MPoint)/c.PPoint) as int) * c.Incen end as  incentive, a.CodeG " +
                "  from V802 a  " +
                " 	inner join ItemTier b on b.CodeG = a.CodeG " +
                " 	inner join Tier c on c.Code = b.TierCode " +
                "  where  Month(a.DocDate) BETWEEN   @month1 and @month2 and year(a.Docdate) = YEAR(GETDATE()) and b.YearCal = YEAR(GETDATE())+543 " +
                "  GROUP BY  " +
                "     c.A1, c.A2, c.A3, c.A4, c.A5, c.Rate1, c.Rate2, c.Rate3,c.MPoint, c.Incen,c.PPoint,a.CodeG " +
             "                                                                            )c on c.CodeG = a.codeG  "+
             "                                                        left join ( select sum(tmp.S1) as s1 ,tmp.CodeG  "+
             "                                                                                from( select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode  "+
             "                                                                                            from v802  "+
             "                                                                                                   inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    "+
             "                                                                                            Where MONTH(docDate) between @month1 and @month2  and year(Docdate) = YEAR(GETDATE())  "+
             "                                                                                            group by codeG,V802.ItemCode  "+
             "                                                                                           )tmp GROUP BY tmp.CodeG  "+
             "                                                                            )d on d.CodeG = a.CodeG  "+
             "                                                     left join ( select sum(tmp.S1) as s1 ,tmp.CodeG  "+
             "                                                                               from( select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode  "+
             "                                                                                           from v802  "+
             "                                                                                               inner join ItemG on v802.itemcode = ItemG.code  "+
             "                                                                                           Where MONTH(docDate) between  @month1 and  @month2  and year(Docdate) = YEAR(GETDATE())  and ItemG.grItemCode ='H'  "+
             "                                                                                           group by codeG,V802.ItemCode  "+
             "                                                                                           )tmp GROUP BY tmp.CodeG  "+
             "                                                                           )e on e.CodeG = a.CodeG  "+
             "                                                     inner join newRate f on f.CodeG = a.CodeG  "+
             "                       Where MONTH(docDate) between @month1 and @month2  and year(Docdate) = YEAR(GETDATE())  "+
             "                       Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,ISNULL(d.s1,0),c.point,f.RateCom,f.incentive "+
             "                   ) "+
             "                   select * from mainTable  "+
             "                   union all  "+
             "                   select 1 as num,'รวมทั้งหมด' as NameG,'' as Row,sum(tmp.sales) as sales , sum(PB) as PB , sum(POINTSALE) as POINTSALE, '' as RateCom,   "+
             "                               sum(incentive) as incentive,sum(PBI) as PBI , 0 as PP , sum(AmtPoint) as  AmtPoint ,sum(ComPBI) as ComPBI, sum(COMSP) as COMSP ,  "+
             "                               sum(SumCOMSP) as sumCOMSP,sum(CUMS) as CUMS, sum(PBH1) as PBH1 , sum(PBCal) as PBCal , sum(ComPBH1) as ComPBH1  "+
                                " from mainTable  tmp";
    const username= req.session.Login;
    let monthFil = req.body.month;
    console.log(monthFil);

    if(monthFil == null || monthFil == 'เลือกไตรมาส'|| monthFil === undefined){
        month1 = '1';
        month2 = '3';
        monthFil = '1';
        // qauter(month);
    }else if (monthFil == '1'){
        console.log('a')
      month1 = '1';
      month2 = '3';
    }else if(monthFil == '2'){
        console.log("qq" );
        month1 = '4';
        month2 = '6';
    }else if(monthFil == '3'){
        month1 = '7';
        month2 = '9';
    } else{
        month1 = '10';
        month2 = '12';
    }

    var db = new mssql.Request();
        db.input('month1',mssql.VarChar(50),month1);
        db.input('month2',mssql.VarChar(50),month2);
        db.input('quater1',mssql.VarChar(50),monthFil);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        res.render('salesQuater',  {testData,monthFil});
    });    
});
router.get('/subInfo',requireLogin,function(req,res){
    const sql = "SELECT tmp.* , Dense_rank() over( order by itemName1) as num" +
            " from ( " +
                    " select FORMAT(DocDate,'dd/MM/yyyy') as DocDate ,CustName,SendNo,DocNo,itemName1, Package, CAST(CONVERT(VARCHAR, CAST(qtypackd AS MONEY), 1) AS VARCHAR) as amt,Price " +
                    " ,concat(AmtCT1,'x',AmtCT2,'x',AmtCT3,' ',CAST(CONVERT(VARCHAR, CAST(AMTCTT AS MONEY), 1) AS VARCHAR)) as PB,packd  " +
                    " from QSO2 " +
                    " where  DocNo = @orderNo " +
                    " union " +
                    " select '' as DocDate , '' as CustName,'' as SendNo, '' as DocNo, itemName1, '' as Package, '' as amt, '' as Price " +
                    " ,concat(AmtT1,'x',AmtT2,'x',AmtT3,' ',CAST(CONVERT(VARCHAR, CAST(AMTTT AS MONEY), 1) AS VARCHAR)) as PB,'' as packd  " +
                    " from QSO2 " +
                    " where  DocNo = @orderNo " +
                " ) tmp  " +
            " order by itemName1 , DOCDATE DESC ;"+
            " select concat(Note, Note2 , Note3) as note from QSo2 where  DocNo = @orderNo " +
            " UNION  " +
            " select concat(Note4, Note5 , Note6) as note from QSo2 where  DocNo = @orderNo " ;
        const orderNo = req.query.orderNo;
        console.log(orderNo)
        var db = new mssql.Request();
        db.input('orderNo',mssql.VarChar(50),orderNo);
        db.query(sql,function(err,data,fields){
        if (err) throw err;
        let testData = data.recordset;
        let testData2 = data.recordsets[1];
        console.log(testData2 );
        res.render('subInfo',  {testData,testData2});
    }); 
})
router.get('/logout',(req,res)=>{
    // req.session.username = null;
    req.session.destroy();
    res.redirect('/');
})  
module.exports = router;