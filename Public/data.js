/* data.js — shared localStorage data layer for VMR
   Include this BEFORE page scripts on every page (except login).
   Replace with real API calls when backend is ready.
*/

(function () {

  const KEY = 'vmr_data';

  /* ── Empty starting state — no seed data ── */
  const EMPTY = { venue: [], fz: [] };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // ensure both keys exist
        if (!parsed.venue) parsed.venue = [];
        if (!parsed.fz)    parsed.fz    = [];
        return parsed;
      }
    } catch(e) {}
    return { venue: [], fz: [] };
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {}
  }

  /* ── Public API ── */
  const data = load();

  window.VMR_DATA = data;

  window.VMR = {
    getData()  { return data; },
    getVenue() { return data.venue; },
    getFZ()    { return data.fz; },

    addRecord(vehicle, rec) {
      const recs = data[vehicle];
      rec.id = recs.length + 1;
      const prevCum = recs.length > 0 ? recs[recs.length - 1].cumPrice : 0;
      rec.cumPrice  = prevCum + Number(rec.totalPrice);
      recs.push(rec);
      save(data);
    },

    deleteRecord(vehicle, id) {
      const recs = data[vehicle];
      const idx  = recs.findIndex(r => r.id === id);
      if (idx > -1) recs.splice(idx, 1);
      let cum = 0;
      recs.forEach((r, i) => { r.id = i + 1; cum += Number(r.totalPrice); r.cumPrice = cum; });
      save(data);
    },

    /* Wipe everything and start fresh */
    clearAll() {
      data.venue = [];
      data.fz    = [];
      save(data);
    }
  };

})();
