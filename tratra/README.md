# Easy Smart Air Tracker – Vercel + Google Sheet setup

## Step 1 – Google Sheet script (5 min)
1. Open your Google Sheet (row 1 headers already there, keep the sheet's FIRST tab as the orders tab).
2. Extensions > Apps Script. Delete the sample code, paste everything from `apps-script/Code.gs`.
3. Change `SECRET` to a long random text (e.g. 30+ random letters/numbers). Save.
4. Deploy > New deployment > type: Web app > Execute as: **Me** > Who has access: **Anyone** > Deploy. Authorize when asked.
5. Copy the **Web app URL** (ends with /exec).

## Step 2 – Deploy on Vercel
1. Put this whole folder in a GitHub repo (or run `vercel` CLI in this folder).
2. Import the repo in vercel.com (Framework preset: **Other**, no build command).
3. Project Settings > Environment Variables, add:
   - `APPS_SCRIPT_URL` = the Web app URL from Step 1
   - `ORDER_SECRET` = the exact same text you put in `SECRET`
4. Redeploy. Place a test order: it should appear in your sheet and show the success popup.

## Notes
- Prices & delivery are re-calculated on the server (api/order.js). To change prices edit `PRODUCTS`/`DELIVERY` in api/order.js AND the `PR`/`DC` lines in index.html.
- If you edit Code.gs later, use Deploy > Manage deployments > Edit > New version (the URL stays the same).
- Same phone + same model within 10 minutes is treated as a duplicate (no second row).
- Meta Pixel events: PageView, ViewContent, InitiateCheckout, Purchase (value in BDT).
