// controllers/recordsController.js — JSON file database version
const db = require('../config/db');

/* ── Helper: get vehicle by name ── */
function getVehicle(name) {
  return db.vehicles.find(v => v.name.toLowerCase() === name.toLowerCase());
}

/* ── Helper: recalculate cumulative prices for a vehicle ── */
function recalcCumulative(vehicleId) {
  const recs = db.records
    .filter(r => r.vehicle_id === vehicleId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  let cum = 0;
  for (const r of recs) {
    cum += r.total_price;
    const idx = db.records.findIndex(x => x.id === r.id);
    if (idx > -1) db.records[idx].cum_price = parseFloat(cum.toFixed(2));
  }
  db.save();
}

/* ── Helper: build full record response with items ── */
function buildRecords(vehicleId) {
  const recs = db.records
    .filter(r => r.vehicle_id === vehicleId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  const vehicle = db.vehicles.find(v => v.id === vehicleId);

  return recs.map((r, idx) => {
    const items = db.record_items
      .filter(i => i.record_id === r.id)
      .map(i => ({ name: i.item_name, cost: i.item_cost }));

    return {
      id:          r.id,
      sNo:         idx + 1,
      vehicleName: vehicle ? vehicle.name : '',
      date:        r.date,
      odo:         r.odo,
      ratePerL:    r.rate_per_l,
      totalPrice:  r.total_price,
      cumPrice:    r.cum_price,
      boxType:     r.box_type,
      items,
      createdAt:   r.created_at
    };
  });
}

/* ─────────────────────────────────────────────
   GET /api/records/all — dashboard
───────────────────────────────────────────── */
exports.getAllRecords = (req, res) => {
  try {
    const venueVehicle = getVehicle('venue');
    const fzVehicle    = getVehicle('fz');

    const venueRecs = venueVehicle ? buildRecords(venueVehicle.id) : [];
    const fzRecs    = fzVehicle    ? buildRecords(fzVehicle.id)    : [];
    const allRecs   = [...venueRecs, ...fzRecs];

    const fuelTotal  = allRecs.reduce((s, r) => s + r.totalPrice, 0);
    const partsTotal = allRecs.reduce((s, r) => s + r.items.reduce((a, i) => a + i.cost, 0), 0);
    const lastVenue  = venueRecs.length ? venueRecs[venueRecs.length - 1] : null;
    const lastFZ     = fzRecs.length    ? fzRecs[fzRecs.length - 1]       : null;

    return res.status(200).json({
      success: true,
      summary: {
        totalRecords:  allRecs.length,
        fuelTotal:     parseFloat(fuelTotal.toFixed(2)),
        partsTotal:    parseFloat(partsTotal.toFixed(2)),
        grandTotal:    parseFloat((fuelTotal + partsTotal).toFixed(2)),
        venueCount:    venueRecs.length,
        fzCount:       fzRecs.length,
        venueLastDate: lastVenue ? lastVenue.date : null,
        fzLastDate:    lastFZ   ? lastFZ.date    : null,
        venueLastOdo:  lastVenue ? lastVenue.odo  : 0,
        fzLastOdo:     lastFZ   ? lastFZ.odo     : 0,
      },
      records: { venue: venueRecs, fz: fzRecs }
    });
  } catch (err) {
    console.error('getAllRecords error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────
   GET /api/records/:vehicle
───────────────────────────────────────────── */
exports.getRecords = (req, res) => {
  try {
    const vehicleName = req.params.vehicle.toLowerCase();
    if (!['venue', 'fz'].includes(vehicleName)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle. Use "venue" or "fz".' });
    }

    const vehicle = getVehicle(vehicleName);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const records = buildRecords(vehicle.id);
    return res.status(200).json({ success: true, vehicle: vehicleName, count: records.length, records });
  } catch (err) {
    console.error('getRecords error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────
   POST /api/records/:vehicle
───────────────────────────────────────────── */
exports.addRecord = (req, res) => {
  try {
    const vehicleName = req.params.vehicle.toLowerCase();
    if (!['venue', 'fz'].includes(vehicleName)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle.' });
    }

    const { date, odo, ratePerL, totalPrice, boxType, items } = req.body;

    if (!date || !odo || !ratePerL || !totalPrice) {
      return res.status(400).json({ success: false, message: 'date, odo, ratePerL, totalPrice are required.' });
    }
    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    const validItems  = items.filter(i => i.name && i.name.trim() && Number(i.cost) > 0);
    if (!validItems.length) {
      return res.status(400).json({ success: false, message: 'Each item needs a name and cost > 0.' });
    }

    const validBoxTypes = ['Service', 'Maintenance', 'Repair', 'Inspection'];
    const safeBoxType   = validBoxTypes.includes(boxType) ? boxType : 'Service';

    const vehicle = getVehicle(vehicleName);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Convert DD-MM-YYYY → YYYY-MM-DD for proper sorting
    const [d, m, y] = date.split('-');
    const isoDate    = `${y}-${m}-${d}`;

    // Create record
    const recordId = db.nextRecordId();
    const newRecord = {
      id:          recordId,
      vehicle_id:  vehicle.id,
      date:        isoDate,
      odo:         Number(odo),
      rate_per_l:  Number(ratePerL),
      total_price: Number(totalPrice),
      cum_price:   0,
      box_type:    safeBoxType,
      created_at:  new Date().toISOString()
    };
    db.records.push(newRecord);

    // Create items
    for (const item of validItems) {
      const itemId = db.nextItemId();
      db.record_items.push({
        id:        itemId,
        record_id: recordId,
        item_name: item.name.trim(),
        item_cost: Number(item.cost)
      });
    }

    db.save();
    recalcCumulative(vehicle.id);

    const records = buildRecords(vehicle.id);
    return res.status(201).json({ success: true, message: 'Record added.', recordId, records });
  } catch (err) {
    console.error('addRecord error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/records/:vehicle/:id
───────────────────────────────────────────── */
exports.deleteRecord = (req, res) => {
  try {
    const vehicleName = req.params.vehicle.toLowerCase();
    const recordId    = parseInt(req.params.id, 10);

    if (!['venue', 'fz'].includes(vehicleName) || isNaN(recordId)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle or record ID.' });
    }

    const vehicle = getVehicle(vehicleName);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const recIdx = db.records.findIndex(r => r.id === recordId && r.vehicle_id === vehicle.id);
    if (recIdx === -1) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // Remove items and record
    db.record_items = db.record_items.filter(i => i.record_id !== recordId);
    db.records.splice(recIdx, 1);
    db.save();

    recalcCumulative(vehicle.id);

    const records = buildRecords(vehicle.id);
    return res.status(200).json({ success: true, message: 'Record deleted.', records });
  } catch (err) {
    console.error('deleteRecord error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
