// Vercel serverless function: validates the order, recalculates prices on the server,
// then forwards it to your Google Apps Script web app (which writes to the Google Sheet).
const PRODUCTS = {
  android: { name: 'Android Only', price: 1099 },
  both: { name: 'Android + iPhone', price: 1299 },
};
const DELIVERY = { dhaka: 80, outside: 120 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (b.website) return res.status(200).json({ ok: true, orderNumber: 'ORD-0000' }); // honeypot (bots)
    const p = PRODUCTS[b.product];
    const qty = parseInt(b.qty, 10);
    const name = String(b.name || '').trim().slice(0, 100);
    const phone = String(b.phone || '').replace(/\s/g, '');
    const address = String(b.address || '').trim().slice(0, 300);
    const dc = DELIVERY[b.zone];
    if (!p || dc === undefined || !(qty >= 1 && qty <= 99) || name.length < 2 || address.length < 5 || !/^01[3-9][0-9]{8}$/.test(phone))
      return res.status(400).json({ ok: false, error: 'invalid' });
    const payload = {
      secret: process.env.ORDER_SECRET,
      device: p.name, name, phone, address, qty,
      delivery: dc, total: p.price * qty + dc,
    };
    const r = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || 'sheet');
    return res.status(200).json({ ok: true, orderNumber: data.orderNumber, total: payload.total });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'server' });
  }
};
