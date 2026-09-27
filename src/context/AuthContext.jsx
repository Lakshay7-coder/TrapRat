import React,{createContext,useContext,useState} from "react";
const C=createContext();
export function AuthProvider({children}){
 const [role,setRole]=useState(()=>localStorage.getItem("tr-auth")==="1"?localStorage.getItem("tr-role"):null);
 const login=r=>{setRole(r);localStorage.setItem("tr-role",r);localStorage.setItem("tr-auth","1")};
 const logout=()=>{localStorage.removeItem("tr-auth");localStorage.removeItem("tr-role");setRole(null)};
 const isAuthed=!!role;
 return <C.Provider value={{role,login,logout,isAuthed}}>{children}</C.Provider>
}
export const useAuth=()=>useContext(C);
