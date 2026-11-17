// Demo login. Change these before using the app for anything real.
// (This check runs in the browser, so it is not real security.)
const USERNAME = "demo", PASSWORD = "heritage123";

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let db = { properties: [], bookings: [] }, logged = false, features = [], tab = "properties";
try { const s = localStorage.getItem("stonecroft_v1"); if (s) db = JSON.parse(s); } catch (e) {}
const save = () => { try { localStorage.setItem("stonecroft_v1", JSON.stringify(db)); } catch (e) {} };

/* ---------- logo ---------- */
const LOGO = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="var(--card)" stroke="var(--primary)" stroke-width="2.5"/><circle cx="50" cy="50" r="41" fill="none" stroke="var(--primary)" stroke-width=".8"/><path d="M29 68V46c0-7 5-6 8-12 3-7 9-9 13-14 4 5 10 7 13 14 3 6 8 5 8 12v22z" fill="var(--primary)"/><circle cx="50" cy="31" r="2.6" fill="var(--accent)"/><path d="M45 68V58c0-6 10-6 10 0v10z" fill="var(--card)"/><rect x="33" y="52" width="6" height="8" rx="1" fill="var(--card)"/><rect x="61" y="52" width="6" height="8" rx="1" fill="var(--card)"/><rect x="25" y="68" width="50" height="2.5" fill="var(--primary)"/></svg>`;
$$(".logo").forEach(e => e.innerHTML = LOGO);

/* ---------- modal (like a QMessageBox) ---------- */
let after = null;
function box(title, msg, cb) { $("#mT").textContent = title; $("#mM").textContent = msg; after = cb || null; $("#modal").classList.add("on"); $("#mOk").focus(); }
$("#mOk").onclick = () => { $("#modal").classList.remove("on"); if (after) { const f = after; after = null; f(); } };

/* ---------- page switching (like a QStackedWidget) ---------- */
function go(n) {
  if (n > 0 && !logged) return;
  $$(".page").forEach((p, i) => p.classList.toggle("on", i === n));
  $$("#steps button").forEach(b => b.classList.toggle("on", +b.dataset.go === n));
  if (n === 3) refreshDashboard();
  window.scrollTo(0, 0);
}
$$("[data-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));

/* ---------- page 1: login ---------- */
$("#loginBtn").onclick = () => {
  if ($("#user").value.trim().toLowerCase() === USERNAME.toLowerCase() && $("#pass").value === PASSWORD) {
    logged = true; $("#steps").classList.remove("hide");
    $("#user").value = $("#pass").value = "";
    box("Login successful", "Welcome back to Stonecroft Heritage Lettings.", () => go(1));
  } else { box("Login failed", "Incorrect username or password. Please try again."); $("#pass").value = ""; }
};
$("#cancelBtn").onclick = () => { $("#user").value = $("#pass").value = ""; };
$("#pass").addEventListener("keydown", e => { if (e.key === "Enter") $("#loginBtn").click(); });

/* ---------- page 2: calendar ---------- */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date(); today.setHours(0, 0, 0, 0);
let cy = today.getFullYear(), cm = today.getMonth(), sel = new Date(today);
const fmt = d => d.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
function drawCal() {
  const start = (new Date(cy, cm, 1).getDay() + 6) % 7, days = new Date(cy, cm + 1, 0).getDate();
  let h = `<div class="calhead"><button type="button" id="cPrev" ${cy === today.getFullYear() && cm === today.getMonth() ? "disabled" : ""}>‹</button><b>${MONTHS[cm]} ${cy}</b><button type="button" id="cNext">›</button></div><div class="calgrid">`;
  h += ["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => `<i>${d}</i>`).join("") + "<span></span>".repeat(start);
  for (let d = 1; d <= days; d++) {
    const dt = new Date(cy, cm, d);
    h += `<button type="button" data-d="${d}" class="${dt.getTime() === sel.getTime() ? "on" : ""}" ${dt < today ? "disabled" : ""}>${d}</button>`;
  }
  $("#cal").innerHTML = h + "</div>";
  $("#calOut").textContent = "Available from " + fmt(sel);
  $("#cPrev").onclick = () => { cm--; if (cm < 0) { cm = 11; cy--; } drawCal(); };
  $("#cNext").onclick = () => { cm++; if (cm > 11) { cm = 0; cy++; } drawCal(); };
  $$("#cal [data-d]").forEach(b => b.onclick = () => { sel = new Date(cy, cm, +b.dataset.d); drawCal(); });
}
drawCal();

/* ---------- page 2: features + save ---------- */
function drawFeatures() {
  $("#fList").innerHTML = features.map((f, i) => `<li>${esc(f)}<button type="button" data-i="${i}" title="Remove">×</button></li>`).join("");
  $$("#fList button").forEach(b => b.onclick = () => { features.splice(+b.dataset.i, 1); drawFeatures(); });
}
function addFeature() {
  const v = $("#fIn").value.trim();
  if (!v) return box("No feature entered", "Type a heritage feature (e.g. Yellowwood floors) before adding it.");
  features.push(v); $("#fIn").value = ""; drawFeatures(); $("#fIn").focus();
}
$("#fAdd").onclick = addFeature;
$("#fIn").addEventListener("keydown", e => { if (e.key === "Enter") addFeature(); });
function clearP() {
  ["#pName", "#pAddr", "#pDesc"].forEach(s => $(s).value = ""); $("#pRent").value = 0;
  $("#pGrade").selectedIndex = $("#pStyle").selectedIndex = 0; features = []; drawFeatures();
  sel = new Date(today); cy = today.getFullYear(); cm = today.getMonth(); drawCal();
}
$("#clearP").onclick = clearP;
$("#saveP").onclick = () => {
  const name = $("#pName").value.trim(), addr = $("#pAddr").value.trim();
  if (!name || !addr) return box("Missing information", "Please enter at least a property name and address.");
  db.properties.push({ name, address: addr, grade: $("#pGrade").value, style: $("#pStyle").value, rent: +$("#pRent").value || 0,
    available: sel.toISOString().slice(0, 10), description: $("#pDesc").value.trim(), features: [...features] });
  save(); clearP(); box("Property saved", `“${name}” has been added to the register.`);
};

/* ---------- page 3: bookings ---------- */
function setDefaultWhen() {
  const d = new Date(Date.now() + 864e5); d.setMinutes(0, 0, 0);
  const p = n => String(n).padStart(2, "0");
  const iso = x => `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
  $("#tWhen").min = iso(new Date()); $("#tWhen").value = iso(d);
}
setDefaultWhen();
$("#bookT").onclick = () => {
  const name = $("#tName").value.trim(), contact = $("#tContact").value.trim();
  if (!name || !contact) return box("Missing information", "Please enter a tenant name and a contact detail.");
  if (!$("#tWhen").value) return box("Missing information", "Please choose a viewing date and time.");
  db.bookings.push({ tenant: name, contact, viewing: $("#tWhen").value.replace("T", " "), occupants: +$("#tOcc").value || 1,
    urgency: $("input[name=urg]:checked").value, amenities: $$("fieldset input[type=checkbox]:checked").map(c => c.value).join(", ") || "None" });
  save(); $("#tName").value = $("#tContact").value = ""; $("#tOcc").value = 1;
  $$("fieldset input[type=checkbox]").forEach(c => c.checked = false); setDefaultWhen();
  box("Viewing booked", `Viewing booked for ${name}.`);
};

/* ---------- page 4: dial, LCDs, progress, table ---------- */
const dial = $("#dial"); let dv = 8, dragging = false;
for (let i = 0; i <= 15; i++) { const t = document.createElement("div"); t.className = "tick"; t.style.transform = `rotate(${-135 + i * 18}deg) translateY(-56px)`; dial.appendChild(t); }
function setDial(v) {
  dv = Math.max(0, Math.min(15, v));
  $("#knob").style.transform = `rotate(${-135 + dv * 18}deg)`;
  $("#dialOut").textContent = `Rent escalation: ${dv}%`; dial.setAttribute("aria-valuenow", dv);
}
function dialFrom(e) {
  const r = dial.getBoundingClientRect();
  let a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
  setDial(Math.round((Math.max(-135, Math.min(135, a)) + 135) / 18));
}
dial.addEventListener("pointerdown", e => { dragging = true; dial.setPointerCapture(e.pointerId); dialFrom(e); });
dial.addEventListener("pointermove", e => { if (dragging) dialFrom(e); });
dial.addEventListener("pointerup", () => dragging = false);
dial.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowUp") setDial(dv + 1); if (e.key === "ArrowLeft" || e.key === "ArrowDown") setDial(dv - 1); });
setDial(8);

setInterval(() => { $("#lcdClock").textContent = new Date().toTimeString().slice(0, 8); }, 1000);
$("#lcdClock").textContent = new Date().toTimeString().slice(0, 8);

const COLS = {
  properties: [["Name", "name"], ["Address", "address"], ["Grade", "grade"], ["Rent", p => "R" + p.rent.toLocaleString("en-ZA")], ["Available", "available"]],
  bookings: [["Tenant", "tenant"], ["Contact", "contact"], ["Viewing", "viewing"], ["Urgency", "urgency"], ["Occupants", "occupants"]]
};
function drawTable() {
  const cols = COLS[tab], q = $("#search").value.trim().toLowerCase();
  const rows = db[tab].map((r, i) => [r, i]).filter(([r]) => JSON.stringify(r).toLowerCase().includes(q));
  const cell = (c, r) => esc(typeof c[1] === "function" ? c[1](r) : r[c[1]]);
  $("#tbl").innerHTML = rows.length
    ? `<tr>${cols.map(c => `<th>${c[0]}</th>`).join("")}<th></th></tr>` + rows.map(([r, i]) =>
        `<tr>${cols.map(c => `<td>${cell(c, r)}</td>`).join("")}<td><button data-i="${i}" title="Remove">×</button></td></tr>`).join("")
    : `<tr><td class="empty">${db[tab].length ? "No matches." : "Nothing here yet."}</td></tr>`;
  $$("#tbl button").forEach(b => b.onclick = () => { if (confirm("Remove this entry?")) { db[tab].splice(+b.dataset.i, 1); save(); refreshDashboard(); } });
}
function refreshDashboard() {
  $("#lcdCount").textContent = String(db.properties.length).padStart(3, "0");
  const pct = db.properties.length ? Math.min(100, Math.round(db.bookings.length / db.properties.length * 100)) : 0;
  $("#pctOut").textContent = pct + "%"; $("#pctBar").style.width = pct + "%";
  drawTable();
}
$$("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; $$("[data-tab]").forEach(x => x.classList.toggle("on", x === b)); drawTable(); });
$("#search").addEventListener("input", drawTable);

$("#sample").onclick = () => {
  if (!db.properties.some(p => p.name === "Doornbosch Werf House")) db.properties.push(
    { name: "Doornbosch Werf House", address: "22 Dorp Street, Stellenbosch", grade: "Grade I", style: "Cape Dutch", rent: 24750, available: "2026-12-01", description: "Restored werf homestead.", features: ["Reed ceiling", "Teak shutters"] },
    { name: "The Tanner’s Row House", address: "9 Bree Street, Makhanda", grade: "Grade IIB", style: "Edwardian", rent: 11300, available: "2026-12-15", description: "Cast-iron balcony, stinkwood staircase.", features: ["Cast-iron balcony"] });
  if (!db.bookings.some(b => b.tenant === "Kagiso Mahlangu")) db.bookings.push(
    { tenant: "Kagiso Mahlangu", contact: "071 926 4408", viewing: "2026-12-03 10:00", occupants: 2, urgency: "Within 3 months", amenities: "Garden, Furnished" });
  save(); refreshDashboard();
};

$("#export").onclick = async () => {
  const L = ["STONECROFT HERITAGE LETTINGS — REPORT", "=".repeat(40), "", `Properties registered: ${db.properties.length}`,
    ...db.properties.map(p => `  - ${p.name} (${p.address}), ${p.grade}, R${p.rent}`), "", `Viewings booked: ${db.bookings.length}`,
    ...db.bookings.map(b => `  - ${b.tenant} on ${b.viewing} (${b.urgency})`), "", `Projected rent escalation: ${dv}%`, `Viewing interest: ${$("#pctOut").textContent}`];
  const text = L.join("\n");
  // On a shared link the viewer app handles saving; opened as a local file we download directly.
  let dl = null;
  try { dl = window.claude ? await window.claude.use("downloads") : null; } catch (e) {}
  if (dl) { try { await dl.save({ filename: "stonecroft_report.txt", data: text }); } catch (e) {} return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = "stonecroft_report.txt"; a.click();
  URL.revokeObjectURL(a.href);
};
$("#exitBtn").onclick = () => { logged = false; $("#steps").classList.add("hide"); go(0); };
