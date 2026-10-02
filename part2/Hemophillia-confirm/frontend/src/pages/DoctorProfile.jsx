import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const empty = { fullName:"", mobile:"", alternateMobile:"", designation:"", hospitalName:"", department:"", hospitalAddress:"", city:"", state:"", pinCode:"", employeeId:"" };

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [doc,setDoc]=useState(empty);
  const [saved,setSaved]=useState(empty);
  const [ro,setRo]=useState({});
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const token=localStorage.getItem("staffAuthToken");
  const headers={headers:{Authorization:`Bearer ${token}`}};

  useEffect(()=>{ load(); },[]);
  const apply=(p)=>{ const v={...empty,...p}; setDoc(v); setSaved(v); setRo(p); };
  const load=async()=>{ try { const r=await api.get("/doctor/me/profile",headers); apply(r.data?.profile||{}); } catch(e){ handleAuth(e); } };
  const handleAuth=(e)=>{ if([401,403].includes(e.response?.status)){localStorage.removeItem("staffAuthToken");navigate("/doctor-login",{replace:true});} else setError(e.response?.data?.message||"Unable to load information."); };
  const update=(k,v)=>{if(["mobile","alternateMobile","pinCode"].includes(k)&&!/^(\d*)$/.test(v))return; if(k==="mobile"||k==="alternateMobile"){if(v.length>10)return;} if(k==="pinCode"&&v.length>6)return; setDoc(p=>({...p,[k]:v}));};
  const save=async(e)=>{e.preventDefault();setError("");setMessage("");try{setSaving(true);const r=await api.put("/doctor/me/profile",doc,headers);apply(r.data.profile);setMessage("Your information has been updated successfully.");}catch(e){if([401,403].includes(e.response?.status))handleAuth(e);else setError(e.response?.data?.message||"Unable to save.");}finally{setSaving(false);}};

  return <div style={s.page}>
    <div style={s.header}><div><div style={s.eyebrow}>MY ACCOUNT</div><h1 style={s.title}>My Information</h1><p style={s.sub}>Update your personal and hospital information.</p></div><button style={s.back} onClick={()=>navigate("/doctor-dashboard")}>← Dashboard</button></div>
    {message&&<div style={s.success}>{message}</div>}{error&&<div style={s.error}>{error}</div>}
    <div style={s.card}>
      <div style={s.account}><div><b>{ro.professionalId||"—"}</b><span> {ro.email||""}</span></div><span style={s.active}>{ro.accountStatus||"APPROVED"}</span></div>
      <form onSubmit={save}>
        <h2 style={s.section}>Personal Information</h2><div style={s.grid}>
          <Field label="Full Name" value={doc.fullName} onChange={v=>update("fullName",v)}/><Field label="Mobile Number" value={doc.mobile} onChange={v=>update("mobile",v)} placeholder="10 digits"/><Field label="Alternate Mobile" value={doc.alternateMobile} onChange={v=>update("alternateMobile",v)} placeholder="10 digits"/><Field label="Designation" value={doc.designation} onChange={v=>update("designation",v)}/>
        </div>
        <h2 style={s.section}>Hospital / Organization</h2><div style={s.grid}>
          <Field label="Hospital / Institution Name" value={doc.hospitalName} onChange={v=>update("hospitalName",v)}/><Field label="Department" value={doc.department} onChange={v=>update("department",v)}/><Field label="Employee ID" value={doc.employeeId} onChange={v=>update("employeeId",v)}/><Field label="City" value={doc.city} onChange={v=>update("city",v)}/><Field label="State" value={doc.state} onChange={v=>update("state",v)}/><Field label="PIN Code" value={doc.pinCode} onChange={v=>update("pinCode",v)} placeholder="6 digits"/><div style={{gridColumn:"1/-1"}}><Field label="Hospital Address" value={doc.hospitalAddress} onChange={v=>update("hospitalAddress",v)}/></div>
        </div><button style={s.primary} disabled={saving}>{saving?"Saving...":"Save Information"}</button> <button type="button" style={{...s.secondary,marginTop:22,marginLeft:10}} onClick={()=>{setDoc(saved);setError("");setMessage("");navigate("/doctor-dashboard");}}>Cancel</button></form>
    </div>
  </div>
}
function Field({label,value,onChange,placeholder}){return <label style={s.field}><span>{label}</span><input style={s.input} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
const s={page:{minHeight:"100vh",background:"#f4f6fa",padding:36,fontFamily:"Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",color:"#172033"},header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22},eyebrow:{fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#64708a"},title:{fontSize:30,margin:"5px 0"},sub:{color:"#68738a",fontSize:13,lineHeight:1.5},back:{background:"white",border:"1px solid #d8deea",borderRadius:10,padding:"10px 15px",cursor:"pointer"},card:{background:"white",border:"1px solid #e2e6ef",borderRadius:16,padding:24,marginBottom:18,boxShadow:"0 6px 20px rgba(30,45,80,.05)"},account:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f7f8fb",padding:16,borderRadius:12,marginBottom:20},active:{fontSize:12,fontWeight:800,color:"#18794e",background:"#e9f8ef",padding:"6px 9px",borderRadius:7},section:{fontSize:19,margin:"4px 0 16px"},grid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16},field:{display:"block"},fieldSpan:{display:"block"},input:{width:"100%",boxSizing:"border-box",border:"1px solid #d7ddea",borderRadius:9,padding:"11px 12px",fontSize:14},primary:{marginTop:22,border:0,borderRadius:10,padding:"12px 18px",background:"#2f45a0",color:"white",fontWeight:800,cursor:"pointer"},primarySmall:{border:0,borderRadius:9,padding:"11px 14px",background:"#2f45a0",color:"white",fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"},secondary:{border:"1px solid #d6dce8",background:"white",borderRadius:9,padding:"11px 15px",fontWeight:700,cursor:"pointer"},success:{padding:12,marginBottom:15,borderRadius:10,background:"#e9f8ef",color:"#166534"},error:{padding:12,marginBottom:15,borderRadius:10,background:"#fff0f0",color:"#b42318"},current:{padding:12,background:"#f7f8fb",borderRadius:9,fontSize:13,marginBottom:12},emailRow:{display:"flex",gap:10,alignItems:"center"}}
