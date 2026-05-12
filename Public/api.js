/* api.js — Frontend API layer for VMR
   Replace data.js with this file on all pages.
   Talks to the Node.js + Express + MySQL backend.
   ─────────────────────────────────────────────── */

const VMR_API = (() => {

  const BASE = 'https://gnanamvmr-production.up.railway.app/api';
  /* ── Token helpers ── */
  const getToken  = ()        => localStorage.getItem('vmr_token');
  const setToken  = (t)       => localStorage.setItem('vmr_token', t);
  const clearToken = ()       => localStorage.removeItem('vmr_token');
  const getUser   = ()        => { try { return JSON.parse(localStorage.getItem('vmr_user')); } catch { return null; } };
  const setUser   = (u)       => localStorage.setItem('vmr_user', JSON.stringify(u));
  const clearUser = ()        => localStorage.removeItem('vmr_user');

  /* ── Core fetch wrapper ── */
  async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(BASE + path, opts);
    const data = await res.json();

    // Token expired — redirect to login
    if (res.status === 401) {
      clearToken();
      clearUser();
      window.location.href = 'login.html';
      return;
    }

    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  }

  /* ─────────────────────────────────────────────
     AUTH
  ───────────────────────────────────────────── */

  async function login(username, password) {
    const data = await request('POST', '/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    clearToken();
    clearUser();
    window.location.href = 'login.html';
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /* Guard — call at top of every protected page */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }

  async function changePassword(currentPassword, newPassword) {
    return await request('POST', '/auth/change-password', { currentPassword, newPassword });
  }

  /* ─────────────────────────────────────────────
     RECORDS
  ───────────────────────────────────────────── */

  /* Get all records + summary (for dashboard) */
  async function getAllRecords() {
    return await request('GET', '/records/all');
  }

  /* Get records for one vehicle: "venue" | "fz" */
  async function getRecords(vehicle) {
    return await request('GET', `/records/${vehicle}`);
  }

  /* Add a record
     rec = { date, odo, ratePerL, totalPrice, boxType, items:[{name,cost}] }
  */
  async function addRecord(vehicle, rec) {
    return await request('POST', `/records/${vehicle}`, rec);
  }

  /* Delete a record by DB id */
  async function deleteRecord(vehicle, id) {
    return await request('DELETE', `/records/${vehicle}/${id}`);
  }

  /* ─────────────────────────────────────────────
     EXPORT helper (client-side CSV)
  ───────────────────────────────────────────── */
  function exportCSV(records, vehicleName) {
    if (!records.length) return false;
    const rows = [
      ['S.No','Vehicle','Date','ODO','Rate/L','Total Price','Cumulative','Box Type','Items','Item Costs','Total Amount']
    ];
    records.forEach((r, i) => {
      const itemCost = r.items.reduce((s, x) => s + x.cost, 0);
      rows.push([
        i + 1, vehicleName, r.date, r.odo,
        r.ratePerL, r.totalPrice, r.cumPrice, r.boxType,
        r.items.map(x => x.name).join(' | '),
        r.items.map(x => x.cost).join(' | '),
        (r.totalPrice + itemCost).toFixed(2)
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `VMR_${vehicleName}_Records.csv`;
    a.click();
    return true;
  }

  /* Public API */
  return {
    login, logout, isLoggedIn, requireAuth, changePassword,
    getAllRecords, getRecords, addRecord, deleteRecord,
    exportCSV, getUser
  };

})();
