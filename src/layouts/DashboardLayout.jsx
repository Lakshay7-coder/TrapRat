import React,{useState} from "react";
import {NavLink,Outlet,useNavigate} from "react-router-dom";
import {LayoutDashboard,Users,BriefcaseBusiness,ShieldAlert,ShieldCheck,TrendingUp,BarChart3,FileCheck2,MapPinned,Settings,LogOut,RefreshCcw,Menu,X,Search,Bell,ChevronDown,ClipboardCheck,BookOpen,History,Building2,UserRound,FileBarChart2} from "lucide-react";
import {useAuth} from "../context/AuthContext"; import {useDemo} from "../context/DemoContext";
const nav={
 admin:[["/admin/dashboard","Command Center",LayoutDashboard],["/admin/providers","Providers",Building2],["/admin/courses","Courses",BookOpen],["/admin/outcomes","Outcomes",FileCheck2],["/admin/analytics","Analytics",BarChart3],["/admin/equity","Equity",Users],["/admin/skill-gaps","Skill Gaps",TrendingUp],["/admin/data-quality","Data Quality",ShieldCheck],["/admin/advisory-reports","Advisory Reports",FileBarChart2],["/admin/anomaly-review","Anomaly Review",ShieldAlert],["/admin/audit-logs","Audit Logs",History],["/documents","Documents",FileCheck2],["/settings","Settings",Settings]],
 provider_admin:[["/provider/dashboard","Dashboard",LayoutDashboard],["/provider/trainees","Trainees",Users],["/provider/outcomes","Outcomes",FileCheck2],["/provider/follow-ups","Follow-ups",ClipboardCheck],["/provider/reports","Reports",FileBarChart2],["/provider/analytics","Analytics",BarChart3],["/provider/scorecard","Scorecard",TrendingUp],["/documents","Documents",FileCheck2],["/settings","Settings",Settings]],
 provider:[["/provider/dashboard","Dashboard",LayoutDashboard],["/provider/trainees","Trainees",Users],["/provider/outcomes","Outcomes",FileCheck2],["/provider/follow-ups","Follow-ups",ClipboardCheck],["/provider/reports","Reports",FileBarChart2],["/provider/scorecard","Scorecard",TrendingUp]],
 field_officer:[["/field/officer/dashboard","Dashboard",LayoutDashboard],["/field/officer/assigned","Assigned Cases",Users],["/field/officer/verification","Verification",ClipboardCheck],["/field/officer/history","History",History]],
 field:[["/field/officer/dashboard","Dashboard",LayoutDashboard],["/field/officer/assigned","Assigned Cases",Users]],
 employer:[["/employer/dashboard","Dashboard",BriefcaseBusiness],["/employer/verification-requests","Verification Requests",ClipboardCheck],["/employer/confirmed","Confirmed Trainees",Users],["/settings","Settings",Settings]],
 trainee:[["/trainee/dashboard","My Journey",LayoutDashboard],["/trainee/training","Training",BookOpen],["/trainee/outcome","Outcome",BriefcaseBusiness],["/trainee/follow-ups","Follow-ups",ClipboardCheck],["/trainee/documents","Documents",FileCheck2],["/trainee/opportunities","Opportunities",BriefcaseBusiness],["/trainee/consent","Consent",ShieldAlert],["/settings","Settings",Settings]]
};
const label=r=>({admin:"SCHEME ADMINISTRATOR",provider_admin:"PROVIDER ADMIN",provider:"PROVIDER STAFF",field_officer:"FIELD OFFICER",field:"FIELD OFFICER",employer:"EMPLOYER",trainee:"TRAINEE"}[r]||"DEMO USER");
export default function DashboardLayout(){
 const {role,login,logout}=useAuth(); const {reset,data}=useDemo(); const navigate=useNavigate(); const [open,setOpen]=useState(false); const [search,setSearch]=useState("");
 const items=nav[role]||nav.admin;
 const doSearch=e=>{if(e.key==="Enter"&&search.trim()){navigate("/admin/outcomes?search="+encodeURIComponent(search));setSearch("");}};
 return <div className="appShell">
    <aside className={open?"mobileOpen":""}><div className="sideBrand"><span>TR</span><div>TRAP<span>RAT</span><small>OUTCOME INTELLIGENCE</small></div><button className="mobileClose" onClick={()=>setOpen(false)}><X size={18}/></button></div>
   <div className="rolePill">{label(role)}</div><nav>{items.map(([p,l,I])=><NavLink key={p} to={p} onClick={()=>setOpen(false)} className={({isActive})=>isActive?"active":""}><I size={17}/>{l}</NavLink>)}</nav>
   <div className="sideBottom"><NavLink to="/notifications"><Bell size={16}/> Notifications</NavLink><button onClick={reset}><RefreshCcw size={16}/> Reset Demo</button><button onClick={()=>{logout();login("admin");navigate("/login")}}><LogOut size={16}/> Switch Role</button></div>
  </aside>
  {open&&<div className="drawerBackdrop" onClick={()=>setOpen(false)}/>}
    <main><div className="topbar"><button className="menuBtn" onClick={()=>setOpen(true)}><Menu size={20}/></button><div><div className="eyebrow">SKILL OUTCOME INTELLIGENCE PLATFORM</div><strong>TrapRat 360</strong></div><div className="topActions"><div className="globalSearch"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={doSearch} placeholder="Search trainee, provider, course…"/></div><NavLink className="iconBtn" to="/notifications" aria-label="Notifications"><Bell size={17}/><i>{data.notifications?.filter(n=>n.unread).length||0}</i></NavLink><span className="profile"><UserRound size={16}/><span>{label(role).replace("SCHEME ","")}</span><ChevronDown size={13}/></span></div></div><Outlet/></main>
 </div>
}