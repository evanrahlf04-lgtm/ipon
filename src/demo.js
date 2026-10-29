// Dev-only sample data, loaded with ?demo on the dev server. Never bundled into production.
import {ds,uid,HUES} from './util.js';
import {now} from './state.js';

export function demoState(){
 const defs=[['Rent',8000,1,'house'],['Electricity',500,15,'bolt'],['Water',300,15,'drop'],['Internet',1299,3,'wifi'],['Loan',5000,5,'bank'],['Transportation',2400,0,'bus'],['Groceries',6000,0,'cart'],['Eating out',3000,0,'fork'],['Health',1000,0,'heart'],['Shopping',1500,0,'shirt']];
 const cats=defs.map((c,i)=>({id:'c'+i,name:c[0],budget:c[1],due:c[2],icon:c[3],hue:HUES[i%HUES.length]}));
 const id=n=>cats.find(c=>c.name===n).id,tx=[];
 for(const off of [-2,-1,0]){
  const dt=new Date(now.getFullYear(),now.getMonth()+off,1),y=dt.getFullYear(),m=dt.getMonth(),dm=new Date(y,m+1,0).getDate(),last=off===0?now.getDate():dm;
  const add=(d,c,a,n)=>{if(d<=last)tx.push({id:uid(),date:ds(y,m,d),type:'expense',catId:id(c),amount:a,note:n})};
  add(1,'Rent',8000,'Monthly rent');add(3,'Internet',1299,'Internet bill');add(5,'Loan',5000,'Loan payment');add(15,'Electricity',480,'Meralco');add(15,'Water',290,'Water bill');
  for(let d=1;d<=dm;d++){const w=new Date(y,m,d).getDay();if(w>0&&w<6&&d%2){add(d,'Eating out',150,'Lunch');add(d,'Transportation',80,'Commute')}if(w===6)add(d,'Groceries',900,'Groceries')}
  add(9,'Health',450,'Vitamins');add(20,'Shopping',1200,'Clothes');
 }
 return{income:40000,cats,tx,goals:[{id:'g1',name:'Emergency fund',target:60000,saved:12500},{id:'g2',name:'New phone',target:25000,saved:4000}],tax:{gross:40000,dm:3000}};
}
