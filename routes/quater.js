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
    const quaterNum = Math.ceil(quater/4);
    console.log(quater+"ccc");
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
  router.get('/quaterPage2',async function(req,res){
    try {

    const sql = " Select   " +
 " 0 as num, " +
 "  NameG, " +
 " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
 " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
 " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
 " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
//  " case  " +
// " when sum(PPoint) <1050 then '0'  " +
// " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
// " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
// " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
// " when sum(PPoint) >= 3900   then '1.5'  " +
// " end as RateCom , " +
" c.RateCom, " +
"  case  " +
"  when sum(PPoint) <1050 then 0   " +
"   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
"     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
"       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
"           when sum(PPoint) >= 3900   then 60000 " +
"  end as incentive,         " +
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
"  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
  " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater1 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
 " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
"  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
 "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater1 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
 " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
 " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
             " else (e.s1-d.s1) end as PBH1, " +
  " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
   " case   " +
" when c.point <1050 then '0'  "+ 
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) "+
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3900   then (1*(e.s1-d.s1)/100) " +   
" end as ComPBH1 " +
 " From V802 a  " +
 " left join ( " +
 " Select  round(Sum(PB) ,2) as S1,CodeG  " +
 " From V802   " +
 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
 " Where  codeG = @user and Month(DocDate) = @month1 and   year(Docdate) = YEAR(GETDATE())    " +
 " Group by CodeG  " +
 " )b on b.CodeG = a.codeG " +
 " left join ( " +
" Select  case  " +
 " when sum(PPoint) <1050 then '0'  " +
 " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
 " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
 " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
 " when sum(PPoint) >= 3900   then '1.5' " +
 " end as RateCom ,CodeG ,  " +
     " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
 " From V802   " +
 " Where   codeG = @user and Month(DocDate) BETWEEN  @month11  and @month31 and  year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )c on c.CodeG = a.codeG " +
 " left join ( " +
     " select sum(tmp.S1) as s1 ,tmp.CodeG " +
     " from( " +
             " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
             " from v802  " +
                 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
             " Where    Month(DocDate) = @month1 and codeG = @user and  year(Docdate) = YEAR(GETDATE())   " +
             " group by codeG,V802.ItemCode  " +
             " )tmp " +
     " GROUP BY tmp.CodeG     " +
         " )d on d.CodeG = a.CodeG    " +
 " left join ( " +
         " select sum(tmp.S1) as s1 ,tmp.CodeG " +
         " from( " +
                 " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                 " from v802  " +
                     " inner join Item on v802.itemcode = item.code   " +
                 " Where  codeG = @user and  Month(DocDate) = @month1 and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                 " group by codeG,V802.ItemCode   " +
             " )tmp  " +
         " GROUP BY tmp.CodeG     " +
         " )e on e.CodeG = a.CodeG " +
 " Where Month(DocDate) = @month1 and  a.codeG = @user and year(Docdate) = YEAR(GETDATE())   " +
 " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
 const sql2 = " Select   " +
 " 0 as num, " +
 "  NameG, " +
 " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
 " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
 " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
 " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
//  " case  " +
// " when sum(PPoint) <1050 then '0'  " +
// " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
// " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
// " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
// " when sum(PPoint) >= 3900   then '1.5'  " +
// " end as RateCom , " +
" c.RateCom, " +
"  case  " +
"  when sum(PPoint) <1050 then 0   " +
"   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
"     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
"       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
"           when sum(PPoint) >= 3900   then 60000 " +
"  end as incentive,         " +
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
"  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
  " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater2 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
 " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
"  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
 "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater2 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
 " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
 " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
             " else (e.s1-d.s1) end as PBH1, " +
  " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
   " case   " +
" when c.point <1050 then '0'  "+ 
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) "+
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3900   then (1*(e.s1-d.s1)/100) " +   
" end as ComPBH1 " +
 " From V802 a  " +
 " left join ( " +
 " Select  round(Sum(PB) ,2) as S1,CodeG  " +
 " From V802   " +
 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
 " Where  codeG = @user2 and Month(DocDate) = @month2 and   year(Docdate) = YEAR(GETDATE())     " +
 " Group by CodeG  " +
 " )b on b.CodeG = a.codeG " +
 " left join ( " +
" Select  case  " +
 " when sum(PPoint) <1050 then '0'  " +
 " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
 " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
 " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
 " when sum(PPoint) >= 3900   then '1.5' " +
 " end as RateCom ,CodeG ,  " +
     " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
 " From V802   " +
 " Where   codeG = @user2 and Month(DocDate) BETWEEN  @month12  and @month32 and  year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )c on c.CodeG = a.codeG " +
 " left join ( " +
     " select sum(tmp.S1) as s1 ,tmp.CodeG " +
     " from( " +
             " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
             " from v802  " +
                 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
             " Where    Month(DocDate) = @month2 and codeG = @user2 and  year(Docdate) = YEAR(GETDATE())   " +
             " group by codeG,V802.ItemCode  " +
             " )tmp " +
     " GROUP BY tmp.CodeG     " +
         " )d on d.CodeG = a.CodeG    " +
 " left join ( " +
         " select sum(tmp.S1) as s1 ,tmp.CodeG " +
         " from( " +
                 " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                 " from v802  " +
                     " inner join Item on v802.itemcode = item.code   " +
                 " Where  codeG = @user2 and  Month(DocDate) = @month2 and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                 " group by codeG,V802.ItemCode   " +
             " )tmp  " +
         " GROUP BY tmp.CodeG     " +
         " )e on e.CodeG = a.CodeG " +
 " Where Month(DocDate) = @month2 and  a.codeG = @user2 and year(Docdate) = YEAR(GETDATE())   " +
 " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
 const sql3 = " Select   " +
 " 0 as num, " +
 "  NameG, " +
 " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
 " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
 " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
 " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
//  " case  " +
// " when sum(PPoint) <1050 then '0'  " +
// " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
// " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
// " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
// " when sum(PPoint) >= 3900   then '1.5'  " +
// " end as RateCom , " +
" c.RateCom, " +
"  case  " +
"  when sum(PPoint) <1050 then 0   " +
"   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
"     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
"       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
"           when sum(PPoint) >= 3900   then 60000 " +
"  end as incentive,         " +
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
"  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
  " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater3 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point<1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
" case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
"  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
 "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater3 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
 " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
 " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
             " else (e.s1-d.s1) end as PBH1, " +
  " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
  " case   " +
" when c.point <1050 then '0'  "+ 
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) "+
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3900   then (1*(e.s1-d.s1)/100) " +   
" end as ComPBH1 " +
 " From V802 a  " +
 " left join ( " +
 " Select  round(Sum(PB) ,2) as S1,CodeG  " +
 " From V802   " +
 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
 " Where  codeG = @user3 and Month(DocDate) = @month3 and   year(Docdate) = YEAR(GETDATE())     " +
 " Group by CodeG  " +
 " )b on b.CodeG = a.codeG " +
 " left join ( " +
" Select  case  " +
 " when sum(PPoint) <1050 then '0'  " +
 " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
 " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
 " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
 " when sum(PPoint) >= 3900   then '1.5' " +
 " end as RateCom ,CodeG ,  " +
     " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
 " From V802   " +
 " Where   codeG = @user2 and Month(DocDate) BETWEEN  @month12  and @month32 and  year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )c on c.CodeG = a.codeG " +
 " left join ( " +
     " select sum(tmp.S1) as s1 ,tmp.CodeG " +
     " from( " +
             " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
             " from v802  " +
                 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
             " Where    Month(DocDate) = @month3 and codeG = @user3 and  year(Docdate) = YEAR(GETDATE())   " +
             " group by codeG,V802.ItemCode  " +
             " )tmp " +
     " GROUP BY tmp.CodeG     " +
         " )d on d.CodeG = a.CodeG    " +
 " left join ( " +
         " select sum(tmp.S1) as s1 ,tmp.CodeG " +
         " from( " +
                 " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                 " from v802  " +
                     " inner join Item on v802.itemcode = item.code   " +
                 " Where  codeG = @user3 and  Month(DocDate) = @month3 and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                 " group by codeG,V802.ItemCode   " +
             " )tmp  " +
         " GROUP BY tmp.CodeG     " +
         " )e on e.CodeG = a.CodeG " +
 " Where Month(DocDate) = @month3 and  a.codeG = @user3 and year(Docdate) = YEAR(GETDATE())   " +
 " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
  const sqlPoPoint = "select sum(AmtN) as Sales, sum(PB) as Pb , sum(AmtPoint) as AmtPoint from POPOINT   where CodeG = @user4 and Month(DocDate) BETWEEN   @monthVar1 and @monthVar3 "

        const currentMonth = new Date().getMonth();
        quater(currentMonth);
        console.log(month1)
        const monthTh1 = toThaiMonthString(month1);
        const monthTh2 = toThaiMonthString(month2);
        const monthTh3 = toThaiMonthString(month3);
        console.log(monthTh3)
        const pool = await db;
        let surName = req.session.surName;
        let lastName = req.session.lastName;
        const username = req.session.Login;
        await pool.connect()
        const request = pool.request();
        const result = await request
        .input('user',mssql.VarChar(50),username)
        .input('month1',mssql.VarChar(50),month1)
        .input('month11',mssql.VarChar(50),month1)
        .input('month31',mssql.VarChar(50),month3)
        .input('quater1',mssql.VarChar(50),monthFil)
        .query(sql);
        const result2 = await request
        .input('user2',mssql.VarChar(50),username)
        .input('month2',mssql.VarChar(50),month2)
        .input('month12',mssql.VarChar(50),month1)
        .input('month32',mssql.VarChar(50),month3)
        .input('quater2',mssql.VarChar(50),monthFil)
        .query(sql2);
        const result3 = await request
        .input('user3',mssql.VarChar(50),username)
        .input('month3',mssql.VarChar(50),month3)
        .input('month13',mssql.VarChar(50),month1)
        .input('month33',mssql.VarChar(50),month3)
        .input('quater3',mssql.VarChar(50),monthFil)
        .query(sql3);
         const result4 = await request
        .input('user4',mssql.VarChar(50),username)
        .input('monthVar1',mssql.VarChar(50),month1)
        .input('monthVar3',mssql.VarChar(50),month3)
        .query(sqlPoPoint);

        const checkResult = (data)=>{
            if(data.length ==0){
                data.push({
                        num: 0,
                        NameG: '',
                        Row: '1',
                        sales: 0.00,
                        PB: 0.00,
                        POINTSALE: 0.00,
                        RateCom: 0.0,
                        incentive: 0.00,
                        PBI: 0.00,
                        PP: 0.00,
                        AmtPoint: 0.00,
                        ComPBI: 0.00,
                        COMSP: 0.00,
                        SumCOMSP: 0.00,
                        CUMS: 0.00,
                        PBH1: 0.00,
                        PBCal: 0.00,
                        ComPBH1: 0.00
                    })
            }else{
                return data;
            }
        }
        const checkResultPoint = (data)=>{
            if(data.length==0){
                data.push({
                      Sales:0.00,
                      Pb:0.00,
                      AmtPoint:0.00  
                    })
            }else{
                return data;
            }
        }
        
        let data = result.recordset;
        let data2 = result2.recordset;
        console.log(data2)
        let data3 = result3.recordset;
        let data4 = [];
        let data5 = result4.recordset;
        checkResult(data);
        checkResult(data2);
        checkResult(data3);
        data4.push({
            num: 0,
            NameG: '',
            Row: '1',
            sales: data[0].sales+ data2[0].sales+data3[0].sales,
            PB:  data[0].PB+ data2[0].PB+data3[0].PB,
            POINTSALE:  data[0].POINTSALE+ data2[0].POINTSALE+data3[0].POINTSALE,
            RateCom: data[0].RateCom,
            incentive: data[0].incentive+ data2[0].incentive+data3[0].incentive,
            PBI: data[0].PBI+ data2[0].PBI+data3[0].PBI,
            PP: data[0].PP+ data2[0].PP+data3[0].PP,
            AmtPoint: data[0].AmtPoint+ data2[0].AmtPoint+data3[0].AmtPoint,
            ComPBI: data[0].ComPBI+ data2[0].ComPBI+data3[0].ComPBI,
            COMSP: data[0].COMSP+ data2[0].COMSP+data3[0].COMSP,
            SumCOMSP: data[0].SumCOMSP+ data2[0].SumCOMSP+data3[0].SumCOMSP,
            CUMS: data[0].CUMS+ data2[0].CUMS+data3[0].CUMS,
            PBH1: data[0].PBH1+ data2[0].PBH1+data3[0].PBH1,
            PBCal:  data[0].PBCal+ data2[0].PBCal+data3[0].PBCal,
            ComPBH1: data[0].ComPBH1+ data2[0].ComPBH1+data3[0].ComPBH1
        })
        checkResultPoint(data5);

        // if(data[0].RateCom == 0.0 || data2[0].RateCom == 0.0 || data3[0].RateCom == 0.0){
        //     data[0].RateCom = 0.0;
        //     data2[0].RateCom = 0.0;
        //     data3[0].RateCom = 0.0;
        //     data4[0].RateCom = 0.0;
        // }
        console.log(data4)
        res.render('quaterPage2',{data,data2,data3,data4,data5,monthTh1,monthTh2,monthTh3,monthFil,surName,lastName});
        } catch (err) {
          // ... handle it locally
          throw new Error(err.message);
        }
    });

    router.post('/quaterPage2',async function(req,res){
    try {

    const sql = " Select   " +
 " 0 as num, " +
 "  NameG, " +
 " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
 " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
 " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
 " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
//  " case  " +
// " when sum(PPoint) <1050 then '0'  " +
// " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
// " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
// " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
// " when sum(PPoint) >= 3900   then '1.5'  " +
// " end as RateCom , " +
" c.RateCom, " +
"  case  " +
"  when sum(PPoint) <1050 then 0   " +
"   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
"     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
"       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
"           when sum(PPoint) >= 3900   then 60000 " +
"  end as incentive,         " +
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
"  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
  " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater1 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
" case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
"  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
 "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater1 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
 " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
 " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
             " else (e.s1-d.s1) end as PBH1, " +
  " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
  " case   " +
" when c.point <1050 then '0'  "+ 
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) "+
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3900   then (1*(e.s1-d.s1)/100) " +   
" end as ComPBH1 " +
 " From V802 a  " +
 " left join ( " +
 " Select  round(Sum(PB) ,2) as S1,CodeG  " +
 " From V802   " +
 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
 " Where  codeG = @user and Month(DocDate) = @month1 and   year(Docdate) = YEAR(GETDATE())     " +
 " Group by CodeG  " +
 " )b on b.CodeG = a.codeG " +
 " left join ( " +
" Select  case  " +
 " when sum(PPoint) <1050 then '0'  " +
 " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
 " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
 " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
 " when sum(PPoint) >= 3900   then '1.5' " +
 " end as RateCom ,CodeG ,  " +
     " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
 " From V802   " +
 " Where   codeG = @user and Month(DocDate) BETWEEN  @month11  and @month31 and  year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )c on c.CodeG = a.codeG " +
 " left join ( " +
     " select sum(tmp.S1) as s1 ,tmp.CodeG " +
     " from( " +
             " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
             " from v802  " +
                 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
             " Where    Month(DocDate) = @month1 and codeG = @user and  year(Docdate) = YEAR(GETDATE())   " +
             " group by codeG,V802.ItemCode  " +
             " )tmp " +
     " GROUP BY tmp.CodeG     " +
         " )d on d.CodeG = a.CodeG    " +
 " left join ( " +
         " select sum(tmp.S1) as s1 ,tmp.CodeG " +
         " from( " +
                 " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                 " from v802  " +
                     " inner join Item on v802.itemcode = item.code   " +
                 " Where  codeG = @user and  Month(DocDate) = @month1 and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                 " group by codeG,V802.ItemCode   " +
             " )tmp  " +
         " GROUP BY tmp.CodeG     " +
         " )e on e.CodeG = a.CodeG " +
 " Where Month(DocDate) = @month1 and  a.codeG = @user and year(Docdate) = YEAR(GETDATE())   " +
 " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
 const sql2 = " Select   " +
 " 0 as num, " +
 "  NameG, " +
 " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
 " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
 " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
 " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
//  " case  " +
// " when sum(PPoint) <1050 then '0'  " +
// " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
// " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
// " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
// " when sum(PPoint) >= 3900   then '1.5'  " +
// " end as RateCom , " +
" c.RateCom, " +
"  case  " +
"  when sum(PPoint) <1050 then 0   " +
"   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
"     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
"       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
"           when sum(PPoint) >= 3900   then 60000 " +
"  end as incentive,         " +
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
"  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
 " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater2 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
" case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
"  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
 "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater2 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
 " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
 " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
             " else (e.s1-d.s1) end as PBH1, " +
  " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
  " case   " +
" when c.point <1050 then '0'  "+ 
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) "+
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3900   then (1*(e.s1-d.s1)/100) " +   
" end as ComPBH1 " +
 " From V802 a  " +
 " left join ( " +
 " Select  round(Sum(PB) ,2) as S1,CodeG  " +
 " From V802   " +
 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
 " Where  codeG = @user2 and Month(DocDate) = @month2 and   year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )b on b.CodeG = a.codeG " +
 " left join ( " +
" Select  case  " +
 " when sum(PPoint) <1050 then '0'  " +
 " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
 " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
 " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
 " when sum(PPoint) >= 3900   then '1.5' " +
 " end as RateCom ,CodeG ,  " +
     " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
 " From V802   " +
 " Where   codeG = @user2 and Month(DocDate) BETWEEN  @month12  and @month32 and  year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )c on c.CodeG = a.codeG " +
 " left join ( " +
     " select sum(tmp.S1) as s1 ,tmp.CodeG " +
     " from( " +
             " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
             " from v802  " +
                 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
             " Where    Month(DocDate) = @month2 and codeG = @user2 and  year(Docdate) = YEAR(GETDATE())   " +
             " group by codeG,V802.ItemCode  " +
             " )tmp " +
     " GROUP BY tmp.CodeG     " +
         " )d on d.CodeG = a.CodeG    " +
 " left join ( " +
         " select sum(tmp.S1) as s1 ,tmp.CodeG " +
         " from( " +
                 " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                 " from v802  " +
                     " inner join Item on v802.itemcode = item.code   " +
                 " Where  codeG = @user2 and  Month(DocDate) = @month2 and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                 " group by codeG,V802.ItemCode   " +
             " )tmp  " +
         " GROUP BY tmp.CodeG     " +
         " )e on e.CodeG = a.CodeG " +
 " Where Month(DocDate) = @month2 and  a.codeG = @user2 and year(Docdate) = YEAR(GETDATE())   " +
 " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
 const sql3 = " Select   " +
 " 0 as num, " +
 "  NameG, " +
 " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
 " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
 " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
 " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
//  " case  " +
// " when sum(PPoint) <1050 then '0'  " +
// " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
// " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
// " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
// " when sum(PPoint) >= 3900   then '1.5'  " +
// " end as RateCom , " +
" c.RateCom, " +
"  case  " +
"  when sum(PPoint) <1050 then 0   " +
"   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
"     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
"       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
"           when sum(PPoint) >= 3900   then 60000 " +
"  end as incentive,         " +
" CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
"  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
 " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater3 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
" case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
"  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
 "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater3 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
 " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
 " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
             " else (e.s1-d.s1) end as PBH1, " +
  " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
  " case   " +
" when c.point <1050 then '0'  "+ 
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) "+
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  "+ 
" when c.point >= 3900   then (1*(e.s1-d.s1)/100) " +   
" end as ComPBH1 " +
 " From V802 a  " +
 " left join ( " +
 " Select  round(Sum(PB) ,2) as S1,CodeG  " +
 " From V802   " +
 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
 " Where  codeG = @user3 and Month(DocDate) = @month3 and   year(Docdate) = YEAR(GETDATE())     " +
 " Group by CodeG  " +
 " )b on b.CodeG = a.codeG " +
 " left join ( " +
" Select  case  " +
 " when sum(PPoint) <1050 then '0'  " +
 " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
 " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
 " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
 " when sum(PPoint) >= 3900   then '1.5' " +
 " end as RateCom ,CodeG ,  " +
     " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
 " From V802   " +
 " Where   codeG = @user2 and Month(DocDate) BETWEEN  @month12  and @month32 and  year(Docdate) = YEAR(GETDATE())   " +
 " Group by CodeG  " +
 " )c on c.CodeG = a.codeG " +
 " left join ( " +
     " select sum(tmp.S1) as s1 ,tmp.CodeG " +
     " from( " +
             " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
             " from v802  " +
                 " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
             " Where    Month(DocDate) = @month3 and codeG = @user3 and  year(Docdate) = YEAR(GETDATE())   " +
             " group by codeG,V802.ItemCode  " +
             " )tmp " +
     " GROUP BY tmp.CodeG     " +
         " )d on d.CodeG = a.CodeG    " +
 " left join ( " +
         " select sum(tmp.S1) as s1 ,tmp.CodeG " +
         " from( " +
                 " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                 " from v802  " +
                     " inner join Item on v802.itemcode = item.code   " +
                 " Where  codeG = @user3 and  Month(DocDate) = @month3 and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                 " group by codeG,V802.ItemCode   " +
             " )tmp  " +
         " GROUP BY tmp.CodeG     " +
         " )e on e.CodeG = a.CodeG " +
 " Where Month(DocDate) = @month3 and  a.codeG = @user3 and year(Docdate) = YEAR(GETDATE())   " +
 " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
 const sqlPoPoint = "select sum(AmtN) as Sales, sum(PB) as Pb , sum(AmtPoint) as AmtPoint from POPOINT   where CodeG = @user4 and Month(DocDate) BETWEEN   @monthVar1 and @monthVar3 "
        const monthVar = req.body.month;
        if(monthVar ==1){
            monthFil = '1';
            month1 = '1';
            month2 = '2';
            month3 = '3';
        } else if(monthVar ==2){
            monthFil = '2';
            month1 = '4';
            month2 = '5';
            month3 = '6';
        }else if (monthVar==3){
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
        const monthTh1 = toThaiMonthString(month1);
        const monthTh2 = toThaiMonthString(month2);
        const monthTh3 = toThaiMonthString(month3);
        console.log(monthTh3)
        const pool = await db;
        let surName = req.session.surName;
        let lastName = req.session.lastName;
        const username = req.session.Login;
        await pool.connect()
        const request = pool.request();
        const result = await request
        .input('user',mssql.VarChar(50),username)
        .input('month1',mssql.VarChar(50),month1)
        .input('month11',mssql.VarChar(50),month1)
        .input('month31',mssql.VarChar(50),month3)
        .input('quater1',mssql.VarChar(50),monthFil)
        .query(sql);
        const result2 = await request
        .input('user2',mssql.VarChar(50),username)
        .input('month2',mssql.VarChar(50),month2)
        .input('month12',mssql.VarChar(50),month1)
        .input('month32',mssql.VarChar(50),month3)
        .input('quater2',mssql.VarChar(50),monthFil)
        .query(sql2);
        const result3 = await request
        .input('user3',mssql.VarChar(50),username)
        .input('month3',mssql.VarChar(50),month3)
        .input('month13',mssql.VarChar(50),month1)
        .input('month33',mssql.VarChar(50),month3)
        .input('quater3',mssql.VarChar(50),monthFil)
        .query(sql3);
         const result4 = await request
        .input('user4',mssql.VarChar(50),username)
        .input('monthVar1',mssql.VarChar(50),month1)
        .input('monthVar3',mssql.VarChar(50),month3)
        .query(sqlPoPoint);

        const checkResult = (data)=>{
            if(data.length ==0){
                data.push({
                        num: 0,
                        NameG: '',
                        Row: '1',
                        sales: 0.00,
                        PB: 0.00,
                        POINTSALE: 0.00,
                        RateCom: 0.0,
                        incentive: 0.00,
                        PBI: 0.00,
                        PP: 0.00,
                        AmtPoint: 0.00,
                        ComPBI: 0.00,
                        COMSP: 0.00,
                        SumCOMSP: 0.00,
                        CUMS: 0.00,
                        PBH1: 0.00,
                        PBCal: 0.00,
                        ComPBH1: 0.00
                    })
            }else{
                return data;
            }
        }
        
        const checkResultPoint = (data)=>{
            if(data.length==0){
                data.push({
                      Sales:0.00,
                      Pb:0.00,
                      AmtPoint:0.00  
                    })
            }else{
                return data;
            }
        }
        let data = result.recordset;
        let data2 = result2.recordset;
        console.log(data2)
        let data3 = result3.recordset;
        let data4 = [];
        let data5 = result4.recordset;
        checkResult(data);
        checkResult(data2);
        checkResult(data3);
        data4.push({
            num: 0,
            NameG: '',
            Row: '1',
            sales: data[0].sales+ data2[0].sales+data3[0].sales,
            PB:  data[0].PB+ data2[0].PB+data3[0].PB,
            POINTSALE:  data[0].POINTSALE+ data2[0].POINTSALE+data3[0].POINTSALE,
            RateCom: data[0].RateCom,
            incentive: data[0].incentive+ data2[0].incentive+data3[0].incentive,
            PBI: data[0].PBI+ data2[0].PBI+data3[0].PBI,
            PP: data[0].PP+ data2[0].PP+data3[0].PP,
            AmtPoint: data[0].AmtPoint+ data2[0].AmtPoint+data3[0].AmtPoint,
            ComPBI: data[0].ComPBI+ data2[0].ComPBI+data3[0].ComPBI,
            COMSP: data[0].COMSP+ data2[0].COMSP+data3[0].COMSP,
            SumCOMSP: data[0].SumCOMSP+ data2[0].SumCOMSP+data3[0].SumCOMSP,
            CUMS: data[0].CUMS+ data2[0].CUMS+data3[0].CUMS,
            PBH1: data[0].PBH1+ data2[0].PBH1+data3[0].PBH1,
            PBCal:  data[0].PBCal+ data2[0].PBCal+data3[0].PBCal,
            ComPBH1: data[0].ComPBH1+ data2[0].ComPBH1+data3[0].ComPBH1
        })
        checkResultPoint(data5);
        //  if(data[0].RateCom == 0.0 || data2[0].RateCom == 0.0 || data3[0].RateCom == 0.0){
        //     data[0].RateCom = 0.0;
        //     data2[0].RateCom = 0.0;
        //     data3[0].RateCom = 0.0;
        //     data4[0].RateCom = 0.0;
        // }
        console.log(data4)
        res.render('quaterPage2',{data,data2,data3,data4,data5,monthTh1,monthTh2,monthTh3,monthFil,surName,lastName});
        } catch (err) {
          // ... handle it locally
          throw new Error(err.message);
        }
    });
    router.get('/quaterPage3',async function(req,res){
        try {
            const sql = " Select   " +
    " 0 as num, " +
    "  NameG, " +
    " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
    " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
    " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
    " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
    " case  " +
   " when sum(PPoint) <1050 then '0'  " +
   " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
   " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
   " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
   " when sum(PPoint) >= 3900   then '1.5'  " +
   " end as RateCom , " +
   "  case  " +
   "  when sum(PPoint) <1050 then 0   " +
   "   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
   "     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
   "       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
   "           when sum(PPoint) >= 3900   then 60000 " +
   "  end as incentive,         " +
   " CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
   "  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
   " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater1 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
   " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
   "  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
    "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater1 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
    " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
    " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
                " else (e.s1-d.s1) end as PBH1, " +
     " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
      " case   " +
    " when c.point <1050 then '0'   " +
    " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
    " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3900   then (1*(e.s1-d.s1)/100)    " +
    " end as ComPBH1 " +
    " From V802 a  " +
    " left join ( " +
    " Select  round(Sum(PB) ,2) as S1,CodeG  " +
    " From V802   " +
    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    " +
    " Where  codeG = @user and Month(DocDate) BETWEEN   '01' and '03'  and   year(Docdate) = YEAR(GETDATE())    " +
    " Group by CodeG  " +
    " )b on b.CodeG = a.codeG " +
    " left join ( " +
   " Select  case  " +
    " when sum(PPoint) <1050 then '0'  " +
    " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
    " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
    " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
    " when sum(PPoint) >= 3900   then '1.5' " +
    " end as RateCom ,CodeG ,  " +
       " case    when sum(PPoint) <1050 then 0   " +
               " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                 "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                 "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                 "   when sum(PPoint) >= 3900   then 60000 " +
         " end as incentive , sum(PPoint) as point" +
    " From V802   " +
    " Where   codeG = @user and Month(DocDate) BETWEEN   '01' and '03'  and  year(Docdate) = YEAR(GETDATE())   " +
    " Group by CodeG  " +
    " )c on c.CodeG = a.codeG " +
    " left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                " from v802  " +
                    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where    Month(DocDate) BETWEEN   '01' and '03'  and codeG = @user and  year(Docdate) = YEAR(GETDATE())   " +
                " group by codeG,V802.ItemCode  " +
                " )tmp " +
        " GROUP BY tmp.CodeG     " +
            " )d on d.CodeG = a.CodeG    " +
    " left join ( " +
            " select sum(tmp.S1) as s1 ,tmp.CodeG " +
            " from( " +
                    " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                    " from v802  " +
                        " inner join Item on v802.itemcode = item.code   " +
                    " Where  codeG = @user and  Month(DocDate) BETWEEN   '01' and '03'  and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                    " group by codeG,V802.ItemCode   " +
                " )tmp  " +
            " GROUP BY tmp.CodeG     " +
            " )e on e.CodeG = a.CodeG " +
    " Where Month(DocDate) BETWEEN   '01' and '03'  and  a.codeG = @user and year(Docdate) = YEAR(GETDATE())   " +
    " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
    const sql2 = " Select   " +
    " 0 as num, " +
    "  NameG, " +
    " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
    " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
    " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
    " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
    " case  " +
   " when sum(PPoint) <1050 then '0'  " +
   " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
   " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
   " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
   " when sum(PPoint) >= 3900   then '1.5'  " +
   " end as RateCom , " +
   "  case  " +
   "  when sum(PPoint) <1050 then 0   " +
   "   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
   "     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
   "       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
   "           when sum(PPoint) >= 3900   then 60000 " +
   "  end as incentive,         " +
   " CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
   "  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
   " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater2 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
   " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
   "  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
    "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater2 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
    " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
    " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
                " else (e.s1-d.s1) end as PBH1, " +
     " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
      " case   " +
    " when c.point <1050 then '0'   " +
    " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
    " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3900   then (1*(e.s1-d.s1)/100)    " +
    " end as ComPBH1 " +
    " From V802 a  " +
    " left join ( " +
    " Select  round(Sum(PB) ,2) as S1,CodeG  " +
    " From V802   " +
    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    " +
    " Where  codeG = @user2 and  Month(DocDate) BETWEEN   '04' and '06' and   year(Docdate) = YEAR(GETDATE())     " +
    " Group by CodeG  " +
    " )b on b.CodeG = a.codeG " +
    " left join ( " +
   " Select  case  " +
    " when sum(PPoint) <1050 then '0'  " +
    " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
    " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
    " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
    " when sum(PPoint) >= 3900   then '1.5' " +
    " end as RateCom ,CodeG ,  " +
        " case    when sum(PPoint) <1050 then 0   " +
                  " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                    "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                    "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                    "   when sum(PPoint) >= 3900   then 60000 " +
            " end as incentive , sum(PPoint) as point" +
    " From V802   " +
    " Where   codeG = @user2 and Month(DocDate) BETWEEN   '04' and '06' and  year(Docdate) = YEAR(GETDATE())   " +
    " Group by CodeG  " +
    " )c on c.CodeG = a.codeG " +
    " left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                " from v802  " +
                    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where    Month(DocDate) BETWEEN   '04' and '06' and codeG = @user2 and  year(Docdate) = YEAR(GETDATE())   " +
                " group by codeG,V802.ItemCode  " +
                " )tmp " +
        " GROUP BY tmp.CodeG     " +
            " )d on d.CodeG = a.CodeG    " +
    " left join ( " +
            " select sum(tmp.S1) as s1 ,tmp.CodeG " +
            " from( " +
                    " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                    " from v802  " +
                        " inner join Item on v802.itemcode = item.code   " +
                    " Where  codeG = @user2 and  Month(DocDate) BETWEEN   '04' and '06' and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                    " group by codeG,V802.ItemCode   " +
                " )tmp  " +
            " GROUP BY tmp.CodeG     " +
            " )e on e.CodeG = a.CodeG " +
    " Where Month(DocDate) BETWEEN   '04' and '06' and  a.codeG = @user2 and year(Docdate) = YEAR(GETDATE())   " +
    " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
    const sql3 = " Select   " +
    " 0 as num, " +
    "  NameG, " +
    " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
    " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
    " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
    " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
    " case  " +
   " when sum(PPoint) <1050 then '0'  " +
   " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
   " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
   " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
   " when sum(PPoint) >= 3900   then '1.5'  " +
   " end as RateCom , " +
   "  case  " +
   "  when sum(PPoint) <1050 then 0   " +
   "   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
   "     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
   "       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
   "           when sum(PPoint) >= 3900   then 60000 " +
   "  end as incentive,         " +
   " CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
   "  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
   " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater3 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
   " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
   "  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
    "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater3 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
    " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
    " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
                " else (e.s1-d.s1) end as PBH1, " +
     " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
      " case   " +
    " when c.point <1050 then '0'   " +
    " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
    " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3900   then (1*(e.s1-d.s1)/100)    " +
    " end as ComPBH1 " +
    " From V802 a  " +
    " left join ( " +
    " Select  round(Sum(PB) ,2) as S1,CodeG  " +
    " From V802   " +
    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    " +
    " Where  codeG = @user3 and Month(DocDate) BETWEEN   '07' and '09' and   year(Docdate) = YEAR(GETDATE())    " +
    " Group by CodeG  " +
    " )b on b.CodeG = a.codeG " +
    " left join ( " +
   " Select  case  " +
    " when sum(PPoint) <1050 then '0'  " +
    " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
    " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
    " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
    " when sum(PPoint) >= 3900   then '1.5' " +
    " end as RateCom ,CodeG ,  " +
        " case    when sum(PPoint) <1050 then 0   " +
                  " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                    "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                    "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                    "   when sum(PPoint) >= 3900   then 60000 " +
            " end as incentive , sum(PPoint) as point" +
    " From V802   " +
    " Where   codeG = @user3 and Month(DocDate) BETWEEN   '07' and '09' and  year(Docdate) = YEAR(GETDATE())   " +
    " Group by CodeG  " +
    " )c on c.CodeG = a.codeG " +
    " left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                " from v802  " +
                    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where    Month(DocDate) BETWEEN   '07' and '09' and codeG = @user3 and  year(Docdate) = YEAR(GETDATE())   " +
                " group by codeG,V802.ItemCode  " +
                " )tmp " +
        " GROUP BY tmp.CodeG     " +
            " )d on d.CodeG = a.CodeG    " +
    " left join ( " +
            " select sum(tmp.S1) as s1 ,tmp.CodeG " +
            " from( " +
                    " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                    " from v802  " +
                        " inner join Item on v802.itemcode = item.code   " +
                    " Where  codeG = @user3 and  Month(DocDate) BETWEEN   '07' and '09' and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                    " group by codeG,V802.ItemCode   " +
                " )tmp  " +
            " GROUP BY tmp.CodeG     " +
            " )e on e.CodeG = a.CodeG " +
    " Where Month(DocDate) BETWEEN   '07' and '09' and  a.codeG = @user3 and year(Docdate) = YEAR(GETDATE())   " +
    " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
    const sql4 = " Select   " +
    " 0 as num, " +
    "  NameG, " +
    " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
    " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
    " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
    " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
    " case  " +
   " when sum(PPoint) <1050 then '0'  " +
   " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
   " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
   " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
   " when sum(PPoint) >= 3900   then '1.5'  " +
   " end as RateCom , " +
   "  case  " +
   "  when sum(PPoint) <1050 then 0   " +
   "   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
   "     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
   "       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
   "           when sum(PPoint) >= 3900   then 60000 " +
   "  end as incentive,         " +
   " CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
   "  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
   " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater4 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
   " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
   "  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
    "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater4 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
    " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
    " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
                " else (e.s1-d.s1) end as PBH1, " +
     " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
      " case   " +
    " when c.point <1050 then '0'   " +
    " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
    " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3900   then (1*(e.s1-d.s1)/100)    " +
    " end as ComPBH1 " +
    " From V802 a  " +
    " left join ( " +
    " Select  round(Sum(PB) ,2) as S1,CodeG  " +
    " From V802   " +
    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    " +
    " Where  codeG = @user4 and Month(DocDate) BETWEEN   '10' and '12' and   year(Docdate) = YEAR(GETDATE())    " +
    " Group by CodeG  " +
    " )b on b.CodeG = a.codeG " +
    " left join ( " +
   " Select  case  " +
    " when sum(PPoint) <1050 then '0'  " +
    " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
    " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
    " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
    " when sum(PPoint) >= 3900   then '1.5' " +
    " end as RateCom ,CodeG ,  " +
        " case    when sum(PPoint) <1050 then 0   " +
                  " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                    "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                    "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                    "   when sum(PPoint) >= 3900   then 60000 " +
            " end as incentive, sum(PPoint) as point " +
    " From V802   " +
    " Where   codeG = @user4 and Month(DocDate) BETWEEN   '10' and '12' and  year(Docdate) = YEAR(GETDATE())   " +
    " Group by CodeG  " +
    " )c on c.CodeG = a.codeG " +
    " left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                " from v802  " +
                    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where   Month(DocDate) BETWEEN   '10' and '12' and codeG = @user4 and  year(Docdate) = YEAR(GETDATE())   " +
                " group by codeG,V802.ItemCode  " +
                " )tmp " +
        " GROUP BY tmp.CodeG     " +
            " )d on d.CodeG = a.CodeG    " +
    " left join ( " +
            " select sum(tmp.S1) as s1 ,tmp.CodeG " +
            " from( " +
                    " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                    " from v802  " +
                        " inner join Item on v802.itemcode = item.code   " +
                    " Where  codeG = @user4 and  Month(DocDate) BETWEEN   '10' and '12' and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                    " group by codeG,V802.ItemCode   " +
                " )tmp  " +
            " GROUP BY tmp.CodeG     " +
            " )e on e.CodeG = a.CodeG " +
    " Where Month(DocDate) BETWEEN   '10' and '12' and  a.codeG = @user4 and year(Docdate) = YEAR(GETDATE())   " +
    " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
    const sqlPoPoint = "select sum(AmtN) as Sales, sum(PB) as Pb , sum(AmtPoint) as AmtPoint from POPOINT   where CodeG = @user5 and Month(DocDate) BETWEEN   '10' and '12' "
    const fullQuater = " Select   " +
    " 0 as num, " +
    "  NameG, " +
    " ROW_NUMBER() OVER(ORDER BY sum(Amt) DESC) AS Row, " +
    " CAST(ISNULL(Sum(Amt),0) AS DECIMAL(30,2)) as sales , " +
    " CAST(ISNULL(Sum(PB),0) AS DECIMAL(30,2)) as PB,  " +
    " CAST(ISNULL(Sum(PPoint),0) AS DECIMAL(30,2)) as POINTSALE , " +
    " case  " +
   " when sum(PPoint) <1050 then '0'  " +
   " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'   " +
   " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1'  " +
   " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5'  " +
   " when sum(PPoint) >= 3900   then '1.5'  " +
   " end as RateCom , " +
   "  case  " +
   "  when sum(PPoint) <1050 then 0   " +
   "   when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
   "     when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
   "       when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
   "           when sum(PPoint) >= 3900   then 60000 " +
   "  end as incentive,         " +
   " CAST(ISNULL(b.S1,0) AS DECIMAL(30,2)) as PBI,  " +
   "  CAST(ISNULL((Sum(PB) - ISNULL(b.s1,0)),0) as DECIMAL(30,2)) as PP, " +
   " CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater5 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
 " when c.point <1050 then '0'  " +
 " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
 " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
"  when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
 " end  ),0) as DECIMAL(30,2)) as AmtPoint, " +
   " case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end as ComPBI , " +
   "  CAST(ISNULL(Sum(ComSP),0) AS DECIMAL(30,2)) as COMSP, " +
    "  CAST(ISNULL((Sum(ComSP)+(CAST(ISNULL(((Sum(PB) - ISNULL(b.s1,0)-  case when @quater5 = '1' then '0.00' else (e.s1-d.s1) end  )*c.RateCom/100 + case when c.point <1050 then '0'else CAST(ISNULL((b.S1 * 0.5 /100),0) as DECIMAL(30,2)) end + case  " +
" when c.point <1050 then '0'  " +
" when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
" when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)  " +
" when c.point >= 3900   then (1*(e.s1-d.s1)/100)   " +
" end  ),0) as DECIMAL(30,2))) ),0) AS DECIMAL(30,2)) as SumCOMSP,  " +
    " CAST(ISNULL(Sum(cums),0) AS DECIMAL(30,2)) as CUMS, " +
    " case when (month(GETDATE())  = '1'  or  month(GETDATE()) = '2' or  month(GETDATE()) = '3') then '0.00'  " +
                " else (e.s1-d.s1) end as PBH1, " +
     " (ISNULL(Sum(PB),0)-(e.s1)) as PBCal, " +
      " case   " +
    " when c.point <1050 then '0'   " +
    " when c.point >= 1050  and c.point < 1950  then (0.5*(e.s1-d.s1)/100) " +
    " when c.point >= 1950   and c.point < 3000  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3000   and c.point < 3900  then (1*(e.s1-d.s1)/100)   " +
    " when c.point >= 3900   then (1*(e.s1-d.s1)/100)    " +
    " end as ComPBH1 " +
    " From V802 a  " +
    " left join ( " +
    " Select  round(Sum(PB) ,2) as S1,CodeG  " +
    " From V802   " +
    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode    " +
    " Where  codeG = @user6 and    year(Docdate) = YEAR(GETDATE())    " +
    " Group by CodeG  " +
    " )b on b.CodeG = a.codeG " +
    " left join ( " +
   " Select  case  " +
    " when sum(PPoint) <1050 then '0'  " +
    " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then '0.5'  " +
    " when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then '1' " +
    " when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then '1.5' " +
    " when sum(PPoint) >= 3900   then '1.5' " +
    " end as RateCom ,CodeG ,  " +
        " case    when sum(PPoint) <1050 then 0   " +
                  " when sum(PPoint) >= 1050  and sum(PPoint) < 1950  then 15000   " +
                    "  when sum(PPoint) >= 1950   and sum(PPoint) < 3000  then 30000  " +
                    "   when sum(PPoint) >= 3000   and sum(PPoint) < 3900  then 45000  " +
                    "   when sum(PPoint) >= 3900   then 60000 " +
            " end as incentive, sum(PPoint) as point " +
    " From V802   " +
    " Where   codeG = @user6 and   year(Docdate) = YEAR(GETDATE())   " +
    " Group by CodeG  " +
    " )c on c.CodeG = a.codeG " +
    " left join ( " +
        " select sum(tmp.S1) as s1 ,tmp.CodeG " +
        " from( " +
                " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                " from v802  " +
                    " inner join itemcomPI on v802.itemcode = itemcomPI.itemcode   " +
                " Where   Month(DocDate) BETWEEN   '4' and '12' and codeG = @user6 and  year(Docdate) = YEAR(GETDATE())   " +
                " group by codeG,V802.ItemCode  " +
                " )tmp " +
        " GROUP BY tmp.CodeG     " +
            " )d on d.CodeG = a.CodeG    " +
    " left join ( " +
            " select sum(tmp.S1) as s1 ,tmp.CodeG " +
            " from( " +
                    " select round(Sum(PB) ,2) as S1,CodeG,V802.ItemCode   " +
                    " from v802  " +
                        " inner join Item on v802.itemcode = item.code   " +
                    " Where  codeG = @user6 and  Month(DocDate) BETWEEN   '4' and '12' and  year(Docdate) = YEAR(GETDATE())  and Item.grItemCode ='H'   " +
                    " group by codeG,V802.ItemCode   " +
                " )tmp  " +
            " GROUP BY tmp.CodeG     " +
            " )e on e.CodeG = a.CodeG " +
    " Where   a.codeG = @user6 and year(Docdate) = YEAR(GETDATE())   " +
    " Group by NameG,b.S1,c.RateCom,a.CodeG,c.incentive,e.s1,d.s1,c.point " ;
           const pool = await db;
           let surName = req.session.surName;
           let lastName = req.session.lastName;
           const username = req.session.Login;
           const currentMonth = new Date().getMonth();

           
           
            quater(currentMonth);
            console.log(monthFil+"var1");
            console.log(username+"var2");
           await pool.connect()
           const request = pool.request();
           const result = await request
           .input('user',mssql.VarChar(50),username)
           .input('quater1',mssql.VarChar(50),monthFil)
           .query(sql);
           const result2 = await request
           .input('user2',mssql.VarChar(50),username)
           .input('quater2',mssql.VarChar(50),monthFil)
           .query(sql2);
           const result3 = await request
           .input('user3',mssql.VarChar(50),username)
           .input('quater3',mssql.VarChar(50),monthFil)
           .query(sql3);
            const result4 = await request
           .input('user4',mssql.VarChar(50),username)
           .input('quater4',mssql.VarChar(50),monthFil)
           .query(sql4);
           const result5 = await request
           .input('user5',mssql.VarChar(50),username)
           .query(sqlPoPoint);
           const result6 = await request
           .input('user6',mssql.VarChar(50),username)
           .input('quater5',mssql.VarChar(50),monthFil)
           .query(fullQuater);
   
           const checkResult = (data)=>{
               if(data.length ==0){
                   data.push({
                           num: 0,
                           NameG: '',
                           Row: '1',
                           sales: 0.00,
                           PB: 0.00,
                           POINTSALE: 0.00,
                           RateCom: 0.0,
                           incentive: 0.00,
                           PBI: 0.00,
                           PP: 0.00,
                           AmtPoint: 0.00,
                           ComPBI: 0.00,
                           COMSP: 0.00,
                           SumCOMSP: 0.00,
                           CUMS: 0.00,
                           PBH1: 0.00,
                           PBCal: 0.00,
                           ComPBH1: 0.00
                       })
               }else{
                   return data;
               }
           }
           
    
           let data = result.recordset;
           let data2 = result2.recordset;
           console.log(data2)
           let data3 = result3.recordset;
           let data4 = result4.recordset;
           let data5 = [];
           let data6 = result5.recordset;
           let data7 = result6.recordset;
           console.log(result6)

           checkResult(data);
           checkResult(data2);
           checkResult(data3);
           checkResult(data4);
           
           data = [{...data[0],
            ComSumH1NH2:data[0].ComPBI + data[0].ComPBH1,
            PointSumH1NH2:data[0].PBH1+data[0].PBI
           }]
           data2 = [{...data2[0],
            ComSumH1NH2:data2[0].ComPBI + data2[0].ComPBH1,
            PointSumH1NH2:data2[0].PBH1+data2[0].PBI
           }]
           data3 = [{...data3[0],
            ComSumH1NH2:data3[0].ComPBI + data3[0].ComPBH1,
            PointSumH1NH2:data3[0].PBH1+data3[0].PBI
           }]
           data4 = [{...data4[0],
            ComSumH1NH2:data4[0].ComPBI + data4[0].ComPBH1,
            PointSumH1NH2:data4[0].PBH1+data4[0].PBI
           }]

        let sumPPoint =  data[0].POINTSALE+ data2[0].POINTSALE+data3[0].POINTSALE+data4[0].POINTSALE;
        let rateComSum = 0 ;

        switch (true) {
            case sumPPoint< 1050:
                rateComSum = 0;
                break;
            case sumPPoint< 1050 && sumPPoint< 1950:
                rateComSum = 0.5;
                break;
            case sumPPoint< 1950 && sumPPoint< 3000:
                rateComSum = 1;
                break;
            case sumPPoint< 3000 && sumPPoint< 3900:
                rateComSum = 1.5;
                break;
            case sumPPoint>= 3900:
                rateComSum = 1.5;
                break;         
        }
        console.log(result6.recordset)
            console.log(data7[0].AmtPoint)
            

           data5.push({
               num: 0,
               NameG: '',
               Row: '1',
               sales: data[0].sales+ data2[0].sales+data3[0].sales+data4[0].sales,
               PB:  data[0].PB+ data2[0].PB+data3[0].PB+data4[0].PB,
               POINTSALE:  data[0].POINTSALE+ data2[0].POINTSALE+data3[0].POINTSALE+data4[0].POINTSALE,
               RateCom: rateComSum,
               incentive: data[0].incentive+ data2[0].incentive+data3[0].incentive+data4[0].incentive,
               PBI: data[0].PBI+ data2[0].PBI+data3[0].PBI+data4[0].PBI,
               PP: data[0].PP+ data2[0].PP+data3[0].PP+data4[0].PP,
               AmtPoint: data7[0].AmtPoint,
               ComPBI: data[0].ComPBI+ data2[0].ComPBI+data3[0].ComPBI+data4[0].ComPBI,
               COMSP: data[0].COMSP+ data2[0].COMSP+data3[0].COMSP+data4[0].COMSP,
               SumCOMSP: data7[0].SumCOMSP,
               CUMS: data[0].CUMS+ data2[0].CUMS+data3[0].CUMS+data4[0].CUMS,
               PBH1: data[0].PBH1+ data2[0].PBH1+data3[0].PBH1+data4[0].PBH1,
               PBCal:  data[0].PBCal+ data2[0].PBCal+data3[0].PBCal+data4[0].PBCal,
               ComPBH1: data[0].ComPBH1+ data2[0].ComPBH1+data3[0].ComPBH1+data4[0].ComPBH1,
               ComSumH1NH2:data[0].ComSumH1NH2 + data2[0].ComSumH1NH2+ data3[0].ComSumH1NH2+ data4[0].ComSumH1NH2,
               PointSumH1NH2:data[0].PointSumH1NH2 +data2[0].PointSumH1NH2+data3[0].PointSumH1NH2+data4[0].PointSumH1NH2
           })
           
           res.render('quaterPage3',{data,data2,data3,data4,data5,data6,surName,lastName});
           } catch (err) {
             // ... handle it locally
             throw new Error(err.message);
           }
       });
    module.exports = router;