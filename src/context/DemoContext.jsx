import React,{createContext,useContext,useState} from "react";
import {demoData} from "../data/demoData";
const C=createContext();
const clone=()=>JSON.parse(JSON.stringify(demoData));
export function DemoProvider({children}){
 const [data,setData]=useState(()=>JSON.parse(localStorage.getItem("tr-demo")||"null")||clone());
 const save=d=>{setData(d);localStorage.setItem("tr-demo",JSON.stringify(d));};
 const updateTrainee=(id,patch)=>save({...data,trainees:data.trainees.map(t=>t.id===id?{...t,...patch}:t)});
 const verify=(id)=>{const t=data.trainees.find(x=>x.id===id);if(!t)return;updateTrainee(id,{trust:Math.min(100,t.trust+8),followup:"Employer verified",verification:"Verified",anomaly:false});};
 const recalcTrust=(t,signals={})=>Math.max(0,Math.min(100,(t.trust||50)+(signals.employer?8:0)+(signals.document?5:0)+(signals.followup?3:0)-(signals.anomaly?8:0)));
 const reset=()=>{const d=clone();setData(d);localStorage.setItem("tr-demo",JSON.stringify(d));};
 return <C.Provider value={{data,updateTrainee,verify,recalcTrust,reset,save}}>{children}</C.Provider>
}
export const useDemo=()=>useContext(C);
