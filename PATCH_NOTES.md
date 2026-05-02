# Mobile Hub Patch Notes

## Fixed in this version

1. Added backend token authentication and protected all CRUD routes.
2. Login now returns a secure signed token and frontend sends it with API requests.
3. Replaced weak password storage with scrypt hashing while keeping legacy hash compatibility.
4. Removed `api/.env` from the package and added `api/.env.example`.
5. Added validation for inventory, sales, expenses, cashflow, hawala, investors, payouts, owner investment, and shipments.
6. Prevented sales quantity from exceeding available stock.
7. Backend now updates inventory sold quantity only after a successful sale request.
8. Prevented deleting inventory items with sales history.
9. Prevented deleting investors with payout history.
10. Fixed shipment frontend/backend field mismatch by supporting `sentDate`, `trackingNum`, and backend `date`, `trackingNumber`.
11. Fixed Fazi Cash/Hawala linked sale logic so linked sales received amount updates on add/edit/delete.
12. Fixed Settings JSON import by adding a backend restore endpoint and frontend `restoreData` function.
13. Fixed Business Info Save button.
14. Fixed Reset login data button.
15. Fixed Cashflow KPI totals by adding `totalCashIn` and `totalCashOut` in aggregation.
16. Fixed frontend API error handling so failed backend requests no longer show as successful.
17. Fixed duplicate interval syntax issue in `DataContext.jsx`.
18. Fixed ESLint script/config so lint runs successfully.

## Important deployment steps

1. Set these environment variables on Vercel / hosting provider:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=use-a-long-random-secret-here
CORS_ORIGIN=https://www.mobilehubkorea.com
```

2. Change default passwords immediately after deployment.
3. Rotate your MongoDB password because the old `.env` was included in the previous ZIP.
4. Do not upload `.env` files to GitHub or public hosting.

## Verification performed

- Frontend production build: passed.
- Frontend lint: passed with warnings only, no errors.
- Backend syntax check: passed.
