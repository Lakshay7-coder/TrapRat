export const demoData = {
  trainees: [
    {id:"KSL-2026-00481",name:"Amit Sharma",course:"Full Stack Web Development",provider:"ABC Skill Development Centre",batch:"WEB-26-B07",district:"Ghaziabad",state:"Uttar Pradesh",outcome:"Employed",employer:"TechNova Solutions",role:"Junior Developer",wage:"₹20k–25k",trust:87,followup:"90-day verified",anomaly:false,verification:"Verified"},
    {id:"KSL-2026-00482",name:"Priya Sharma",course:"Advanced Solar Technician",provider:"UP SkillWorks",batch:"SOL-26-B04",district:"Ghaziabad",state:"Uttar Pradesh",outcome:"Employed",employer:"SuryaGrid Energy",role:"Solar Installation Technician",wage:"₹15k–20k",trust:92,followup:"90-day verified",anomaly:false,verification:"Verified"},
    {id:"KSL-2026-00483",name:"Arjun Kumar",course:"Digital Marketing",provider:"Digital Bharat Academy",batch:"DM-26-B07",district:"Lucknow",state:"Uttar Pradesh",outcome:"Self-employed",employer:"—",role:"Freelance Marketer",wage:"₹15k–20k",trust:76,followup:"180-day pending",anomaly:false,verification:"Self-reported"},
    {id:"KSL-2026-00484",name:"Meena Devi",course:"Tailoring & Apparel",provider:"UP SkillWorks",batch:"APP-26-B02",district:"Meerut",state:"Uttar Pradesh",outcome:"Self-employed",employer:"—",role:"Boutique Owner",wage:"₹10k–15k",trust:73,followup:"180-day pending",anomaly:false,verification:"Field verified"},
    {id:"KSL-2026-00485",name:"Rohit Verma",course:"Electric Vehicle Service",provider:"AutoSkill Hub",batch:"EV-26-B01",district:"Noida",state:"Uttar Pradesh",outcome:"Employed",employer:"VoltDrive Motors",role:"EV Service Associate",wage:"₹15k–20k",trust:61,followup:"Anomaly flagged",anomaly:true,verification:"Pending"},
    {id:"KSL-2026-00486",name:"Sana Khan",course:"Healthcare Assistant",provider:"Digital Bharat Academy",batch:"HCA-26-B03",district:"Ghaziabad",state:"Uttar Pradesh",outcome:"Seeking work",employer:"—",role:"—",wage:"—",trust:38,followup:"30-day pending",anomaly:false,verification:"Pending"}
  ],
  metrics:{trainees:4821,completed:4210,placement:78.4,retention3:91,retention6:84,retention12:76,avgTrust:81,verification:84.6,anomalies:17},
  activities:[
    ["08:42","Employer verification","TechNova Solutions verified KSL-2026-00481","verified"],
    ["08:19","Follow-up completed","Priya Sharma — 90 day retention","success"],
    ["07:56","Anomaly detected","KSL-2026-00485 requires review","warning"],
    ["07:21","Evidence uploaded","Joining letter attached to KSL-2026-00481","info"],
    ["06:48","Consent updated","Amit Sharma granted analytics consent","success"]
  ],
  notifications:[
    {id:1,type:"Verification requested",text:"2 employment confirmations are awaiting response.",time:"12 min ago",unread:true},
    {id:2,type:"Follow-up due",text:"180-day follow-up is due for Meena Devi.",time:"1 hr ago",unread:true},
    {id:3,type:"Anomaly detected",text:"Duplicate employer pattern requires review.",time:"2 hrs ago",unread:false}
  ]
};