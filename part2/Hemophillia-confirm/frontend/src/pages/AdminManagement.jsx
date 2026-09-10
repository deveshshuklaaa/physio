// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../apiClient";

// const emptyForm = {
//   fullName: "",
//   email: "",
//   adminLevel: "ADMIN",
//   canManageAdmins: false,
//   canManageDoctors: true,
//   canViewPatients: true,
//   canManageDoctorRequests: true,
//   mobile: "",
//   designation: "",
//   hospitalName: "",
//   department: "",
// };

// export default function AdminManagement() {
//   const navigate = useNavigate();
//   const [admins, setAdmins] = useState([]);
//   const [form, setForm] = useState(emptyForm);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [admin, setAdmin] = useState(() => {
//     try { return JSON.parse(localStorage.getItem("admin") || "{}"); }
//     catch { return {}; }
//   });

//   const token = localStorage.getItem("adminToken");
//   const isSuper = admin.adminLevel === "SUPER_ADMIN";
//   const canManage = isSuper || !!admin.permissions?.canManageAdmins;

//   const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

//   useEffect(() => {
//     if (!token) return navigate("/admin-login", { replace: true });
//     if (!canManage) return navigate("/admin/dashboard", { replace: true });
//     loadAdmins();
//   }, []);

//   const loadAdmins = async () => {
//     try {
//       setLoading(true); setError("");
//       const res = await api.get("/admin/management", authHeaders);
//       setAdmins(res.data?.admins || []);
//     } catch (err) {
//       if ([401, 403].includes(err.response?.status)) {
//         localStorage.removeItem("adminToken");
//         localStorage.removeItem("admin");
//         return navigate("/admin-login", { replace: true });
//       }
//       setError(err.response?.data?.message || "Unable to load administrators.");
//     } finally { setLoading(false); }
//   };

//   const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

//   const submit = async (e) => {
//     e.preventDefault(); setError(""); setMessage("");
//     if (!form.fullName.trim() || !form.email.trim()) {
//       setError("Full name and email are required."); return;
//     }
//     if (form.adminLevel === "SUPER_ADMIN" && !isSuper) {
//       setError("Only a Super Admin can create another Super Admin."); return;
//     }
//     try {
//       setSaving(true);
//       const res = await api.post("/admin/management/create", {
//         fullName: form.fullName.trim(),
//         email: form.email.trim().toLowerCase(),
//         adminLevel: form.adminLevel,
//         mobile: form.mobile,
//         designation: form.designation,
//         hospitalName: form.hospitalName,
//         department: form.department,
//         permissions: {
//           canManageAdmins: form.adminLevel === "SUPER_ADMIN" ? true : form.canManageAdmins,
//           canManageDoctors: form.canManageDoctors,
//           canViewPatients: form.canViewPatients,
//           canManageDoctorRequests: form.canManageDoctorRequests,
//         },
//       }, authHeaders);
//       setMessage(res.data?.message || "Administrator created successfully.");
//       setForm(emptyForm);
//       await loadAdmins();
//     } catch (err) {
//       setError(err.response?.data?.message || "Unable to create administrator.");
//     } finally { setSaving(false); }
//   };

//   return (
//     <div style={styles.page}>
//       <div style={styles.topbar}>
//         <div>
//           <div style={styles.eyebrow}>ADMINISTRATION</div>
//           <h1 style={styles.title}>Admin Management</h1>
//           <p style={styles.sub}>Create and review administrator accounts and permissions.</p>
//         </div>
//         <button style={styles.back} onClick={() => navigate("/admin/dashboard")}>← Dashboard</button>
//       </div>

//       {message && <div style={styles.success}>{message}</div>}
//       {error && <div style={styles.error}>{error}</div>}

//       <div style={styles.grid}>
//         <section style={styles.card}>
//           <h2 style={styles.cardTitle}>Add Administrator</h2>
//           <p style={styles.muted}>A secure temporary password will be generated and emailed to the new administrator.</p>
//           <form onSubmit={submit}>
//             <label style={styles.label}>Full Name</label>
//             <input style={styles.input} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Administrator name" />
//             <label style={styles.label}>Email Address</label>
//             <input style={styles.input} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="admin@example.com" />
//             <label style={styles.label}>Mobile Number</label>
//             <input style={styles.input} value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digits" />
//             <label style={styles.label}>Designation</label>
//             <input style={styles.input} value={form.designation} onChange={(e) => update("designation", e.target.value)} placeholder="e.g. Hospital Administrator" />
//             <label style={styles.label}>Hospital / Institution Name</label>
//             <input style={styles.input} value={form.hospitalName} onChange={(e) => update("hospitalName", e.target.value)} placeholder="Hospital or institution" />
//             <label style={styles.label}>Department</label>
//             <input style={styles.input} value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Department" />
//             <label style={styles.label}>Admin Level</label>
//             <select style={styles.input} value={form.adminLevel} onChange={(e) => update("adminLevel", e.target.value)}>
//               <option value="ADMIN">Assistant Admin</option>
//               {isSuper && <option value="SUPER_ADMIN">Super Admin</option>}
//             </select>

//             <div style={styles.permissionBox}>
//               <div style={styles.permissionTitle}>Permissions</div>
//               {[
//                 ["canManageAdmins", "Can add / manage admins"],
//                 ["canManageDoctors", "Can manage doctors"],
//                 ["canViewPatients", "Can view patient information"],
//                 ["canManageDoctorRequests", "Can manage doctor requests"],
//               ].map(([key, label]) => (
//                 <label key={key} style={styles.check}>
//                   <input type="checkbox" checked={form.adminLevel === "SUPER_ADMIN" ? true : form[key]} disabled={form.adminLevel === "SUPER_ADMIN"} onChange={(e) => update(key, e.target.checked)} />
//                   <span>{label}</span>
//                 </label>
//               ))}
//             </div>
//             <button disabled={saving} style={styles.primary}>{saving ? "Creating..." : "Create Administrator"}</button>
//           </form>
//         </section>

//         <section style={styles.card}>
//           <h2 style={styles.cardTitle}>Administrators</h2>
//           {loading ? <p style={styles.muted}>Loading administrators...</p> : admins.length === 0 ? <p style={styles.muted}>No administrator accounts found.</p> : (
//             <div style={{ overflowX: "auto" }}>
//               <table style={styles.table}>
//                 <thead><tr><th style={styles.th}>Admin</th><th style={styles.th}>Level</th><th style={styles.th}>Can Add Admins</th><th style={styles.th}>Doctors</th><th style={styles.th}>Patients</th><th style={styles.th}>Status</th></tr></thead>
//                 <tbody>{admins.map((a) => {
//                   const superAdmin = a.adminLevel === "SUPER_ADMIN";
//                   return <tr key={a._id}>
//                     <td style={styles.td}><strong>{a.fullName}</strong><div style={styles.email}>{a.email}</div></td>
//                     <td style={styles.td}><span style={styles.badge}>{superAdmin ? "Super Admin" : "Assistant Admin"}</span></td>
//                     <td style={styles.td}>{superAdmin || a.permissions?.canManageAdmins ? "Yes" : "No"}</td>
//                     <td style={styles.td}>{a.permissions?.canManageDoctors ? "Yes" : "No"}</td>
//                     <td style={styles.td}>{a.permissions?.canViewPatients ? "Yes" : "No"}</td>
//                     <td style={styles.td}>{a.accountStatus || "APPROVED"}</td>
//                   </tr>;
//                 })}</tbody>
//               </table>
//             </div>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   page:{minHeight:"100vh",background:"#f4f6fa",padding:"36px",fontFamily:"Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",color:"#172033"},
//   topbar:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,marginBottom:24},
//   eyebrow:{fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#64708a"},
//   title:{margin:"5px 0",fontSize:30},sub:{margin:0,color:"#68738a"},
//   back:{border:"1px solid #d8deea",background:"white",borderRadius:10,padding:"10px 15px",cursor:"pointer"},
//   grid:{display:"grid",gridTemplateColumns:"minmax(300px,430px) minmax(500px,1fr)",gap:22,alignItems:"start"},
//   card:{background:"white",border:"1px solid #e2e6ef",borderRadius:16,padding:24,boxShadow:"0 6px 20px rgba(30,45,80,.05)"},
//   cardTitle:{margin:"0 0 6px",fontSize:20},muted:{color:"#707b91",fontSize:13,lineHeight:1.5},label:{display:"block",fontSize:13,fontWeight:700,margin:"18px 0 7px"},input:{width:"100%",boxSizing:"border-box",border:"1px solid #d7ddea",borderRadius:9,padding:"11px 12px",fontSize:14,background:"#fff"},permissionBox:{marginTop:20,padding:15,borderRadius:11,background:"#f7f8fb",border:"1px solid #e3e7ef"},permissionTitle:{fontWeight:800,fontSize:13,marginBottom:10},check:{display:"flex",gap:9,alignItems:"center",fontSize:13,margin:"10px 0"},primary:{width:"100%",marginTop:20,border:0,borderRadius:10,padding:"12px",background:"#2f45a0",color:"white",fontWeight:800,cursor:"pointer"},success:{padding:12,marginBottom:16,borderRadius:10,background:"#e9f8ef",color:"#166534",border:"1px solid #b9e4c7"},error:{padding:12,marginBottom:16,borderRadius:10,background:"#fff0f0",color:"#b42318",border:"1px solid #f1c4c4"},table:{width:"100%",borderCollapse:"collapse",fontSize:13},th:{textAlign:"left",padding:"12px 10px",borderBottom:"1px solid #e1e5ed",color:"#69758c",fontSize:11,textTransform:"uppercase"},td:{padding:"14px 10px",borderBottom:"1px solid #edf0f5",verticalAlign:"top"},email:{fontSize:12,color:"#7a8498",marginTop:3},badge:{display:"inline-block",padding:"5px 8px",borderRadius:7,background:"#eef1ff",color:"#33479e",fontWeight:700,fontSize:11}
// };









import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const emptyForm = {
  fullName: "",
  email: "",
  adminLevel: "ADMIN",
  canManageAdmins: false,
  canManageDoctors: true,
  canViewPatients: true,
  canManageDoctorRequests: true,
  mobile: "",
  designation: "",
  hospitalName: "",
  department: "",
};

export default function AdminManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin") || "{}"); }
    catch { return {}; }
  });

  const token = localStorage.getItem("adminToken");
  const isSuper = admin.adminLevel === "SUPER_ADMIN";
  const canManage = isSuper || !!admin.permissions?.canManageAdmins;

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return navigate("/admin-login", { replace: true });
    if (!canManage) return navigate("/admin/dashboard", { replace: true });
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true); setError("");
      const res = await api.get("/admin/management", authHeaders);
      setAdmins(res.data?.admins || []);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        return navigate("/admin-login", { replace: true });
      }
      setError(err.response?.data?.message || "Unable to load administrators.");
    } finally { setLoading(false); }
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const submit = async (e) => {
    e.preventDefault(); setError(""); setMessage("");
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Full name and email are required."); return;
    }
    if (form.adminLevel === "SUPER_ADMIN" && !isSuper) {
      setError("Only a Super Admin can create another Super Admin."); return;
    }
    try {
      setSaving(true);
      const res = await api.post("/admin/management/create", {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        adminLevel: form.adminLevel,
        mobile: form.mobile,
        designation: form.designation,
        hospitalName: form.hospitalName,
        department: form.department,
        permissions: {
          canManageAdmins: form.adminLevel === "SUPER_ADMIN" ? true : form.canManageAdmins,
          canManageDoctors: form.canManageDoctors,
          canViewPatients: form.canViewPatients,
          canManageDoctorRequests: form.canManageDoctorRequests,
        },
      }, authHeaders);
      setMessage(res.data?.message || "Administrator created successfully.");
      setForm(emptyForm);
      await loadAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create administrator.");
    } finally { setSaving(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.eyebrow}>ADMINISTRATION</div>
          <h1 style={styles.title}>Admin Management</h1>
          <p style={styles.sub}>Create and review administrator accounts and permissions.</p>
        </div>
        <button style={styles.back} onClick={() => navigate("/admin/dashboard")}>← Dashboard</button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Add Administrator</h2>
          <p style={styles.muted}>A secure temporary password will be generated and emailed to the new administrator.</p>
          <form onSubmit={submit}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Administrator name" />
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="admin@example.com" />
            <label style={styles.label}>Mobile Number</label>
            <input style={styles.input} value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digits" />
            <label style={styles.label}>Designation</label>
            <input style={styles.input} value={form.designation} onChange={(e) => update("designation", e.target.value)} placeholder="e.g. Hospital Administrator" />
            <label style={styles.label}>Hospital / Institution Name</label>
            <input style={styles.input} value={form.hospitalName} onChange={(e) => update("hospitalName", e.target.value)} placeholder="Hospital or institution" />
            <label style={styles.label}>Department</label>
            <input style={styles.input} value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Department" />
            <label style={styles.label}>Admin Level</label>
            <select style={styles.input} value={form.adminLevel} onChange={(e) => update("adminLevel", e.target.value)}>
              <option value="ADMIN">Assistant Admin</option>
              {isSuper && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>

            <div style={styles.permissionBox}>
              <div style={styles.permissionTitle}>Permissions</div>
              {[
                ["canManageAdmins", "Can add / manage admins"],
                ["canManageDoctors", "Can manage doctors"],
                ["canViewPatients", "Can view patient information"],
                ["canManageDoctorRequests", "Can manage doctor requests"],
              ].map(([key, label]) => (
                <label key={key} style={styles.check}>
                  <input type="checkbox" checked={form.adminLevel === "SUPER_ADMIN" ? true : form[key]} disabled={form.adminLevel === "SUPER_ADMIN"} onChange={(e) => update(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button disabled={saving} style={styles.primary}>{saving ? "Creating..." : "Create Administrator"}</button>
          </form>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Administrators</h2>
          {loading ? <p style={styles.muted}>Loading administrators...</p> : admins.length === 0 ? <p style={styles.muted}>No administrator accounts found.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Admin</th><th style={styles.th}>Level</th><th style={styles.th}>Can Add Admins</th><th style={styles.th}>Doctors</th><th style={styles.th}>Patients</th><th style={styles.th}>Status</th></tr></thead>
                <tbody>{admins.map((a) => {
                  const superAdmin = a.adminLevel === "SUPER_ADMIN";
                  return <tr key={a._id}>
                    <td style={styles.td}><strong>{a.fullName}</strong><div style={styles.email}>{a.email}</div></td>
                    <td style={styles.td}><span style={styles.badge}>{superAdmin ? "Super Admin" : "Assistant Admin"}</span></td>
                    <td style={styles.td}>{superAdmin || a.permissions?.canManageAdmins ? "Yes" : "No"}</td>
                    <td style={styles.td}>{a.permissions?.canManageDoctors ? "Yes" : "No"}</td>
                    <td style={styles.td}>{a.permissions?.canViewPatients ? "Yes" : "No"}</td>
                    <td style={styles.td}>{a.accountStatus || "APPROVED"}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page:{minHeight:"100vh",background:"#f4f6fa",padding:"36px",fontFamily:"Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",color:"#172033"},
  topbar:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,marginBottom:24},
  eyebrow:{fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#64708a"},
  title:{margin:"5px 0",fontSize:30},sub:{margin:0,color:"#68738a"},
  back:{border:"1px solid #d8deea",background:"white",borderRadius:10,padding:"10px 15px",cursor:"pointer"},
  grid:{display:"grid",gridTemplateColumns:"minmax(300px,430px) minmax(500px,1fr)",gap:22,alignItems:"start"},
  card:{background:"white",border:"1px solid #e2e6ef",borderRadius:16,padding:24,boxShadow:"0 6px 20px rgba(30,45,80,.05)"},
  cardTitle:{margin:"0 0 6px",fontSize:20},muted:{color:"#707b91",fontSize:13,lineHeight:1.5},label:{display:"block",fontSize:13,fontWeight:700,margin:"18px 0 7px"},input:{width:"100%",boxSizing:"border-box",border:"1px solid #d7ddea",borderRadius:9,padding:"11px 12px",fontSize:14,background:"#fff"},permissionBox:{marginTop:20,padding:15,borderRadius:11,background:"#f7f8fb",border:"1px solid #e3e7ef"},permissionTitle:{fontWeight:800,fontSize:13,marginBottom:10},check:{display:"flex",gap:9,alignItems:"center",fontSize:13,margin:"10px 0"},primary:{width:"100%",marginTop:20,border:0,borderRadius:10,padding:"12px",background:"#2f45a0",color:"white",fontWeight:800,cursor:"pointer"},success:{padding:12,marginBottom:16,borderRadius:10,background:"#e9f8ef",color:"#166534",border:"1px solid #b9e4c7"},error:{padding:12,marginBottom:16,borderRadius:10,background:"#fff0f0",color:"#b42318",border:"1px solid #f1c4c4"},table:{width:"100%",borderCollapse:"collapse",fontSize:13},th:{textAlign:"left",padding:"12px 10px",borderBottom:"1px solid #e1e5ed",color:"#69758c",fontSize:11,textTransform:"uppercase"},td:{padding:"14px 10px",borderBottom:"1px solid #edf0f5",verticalAlign:"top"},email:{fontSize:12,color:"#7a8498",marginTop:3},badge:{display:"inline-block",padding:"5px 8px",borderRadius:7,background:"#eef1ff",color:"#33479e",fontWeight:700,fontSize:11}
};
