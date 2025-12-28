# Personal Finance Tracker PWA

A modern, offline-first Personal Finance Tracker built with React, TypeScript, and Vite. It serves as a Progressive Web App (PWA) that syncs data directly with your Google Sheets, giving you full ownership of your financial data while providing a premium mobile app experience.

## ✨ Key Features

- **Google Sheets Backend**: Your data lives in your own Google Sheet. No 3rd party servers.
- **Offline Capable**: PWA support allows you to view and edit transactions offline (syncs when online).
- **Smart Import**: Auto-detects and parses statements from **HDFC Savings**, **IDFC Savings**, and **Axis Credit Card**.
- **Double-Entry Logic**: Accurately handles credit card payments and transfers to prevent double-counting of expenses.
- **Visual Dashboard**: Interactive heatmaps and charts for spending analysis.
- **Mobile First**: Optimized card views for mobile, powerful table view for desktop.

---

## 📊 Data Schema

The application uses a 16-column structure in your Google Sheet ("Transactions" tab).

| Col | Field | Description |
|-----|-------|-------------|
| A | **Date** | Transaction date (YYYY-MM-DD or DD/MM/YYYY) |
| B | **Bank** | Bank Name (e.g., HDFC, Axis) |
| C | **Account** | Account Number / Identifier |
| D | **Ref ID** | Unique Reference ID from bank |
| E | **Narration** | Raw transaction description |
| F | **Payee** | Cleaned up merchant/payee name |
| G | **Debit** | Amount debited |
| H | **Credit** | Amount credited |
| I | **Net Amount** | `Credit - Debit` |
| J | **Flow** | Transaction Type (see below) |
| K | **Category** | Expense/Income Category |
| L | **Exclude** | `Yes` to ignore in stats, `No` to include |
| M | **Note** | User notes |
| N | **Tags** | Comma-separated tags |
| O | **Linked Account** | Account involved in transfer/payment |
| P | **Linked Ref ID** | Grouping ID (e.g., Billing Cycle) |

---

## 🔄 Flow Logic & Double-Entry System

The system uses 6 specific `Flow` types to accurately track your Net Worth and Monthly Spending without double-counting.

| Flow | Meaning | Example | Counted as Expense? | Counted as Income? |
|------|---------|---------|:-------------------:|:------------------:|
| **In** | Income / Cashback | Salary, Rewards | ❌ | ✅ |
| **Out** | Direct Expense | Groceries (Debit Card) | ✅ | ❌ |
| **CC_Purchase** | Credit Card Spending | Dinner (Credit Card) | ✅ | ❌ |
| **CC_Payment** | Bill Payment | Bank → CC Bill | ❌ | ❌ |
| **Transfer** | Self Transfer | HDFC → IDFC | ❌ | ❌ |
| **Savings** | Investment | Mutual Funds, Stocks | ✅ | ❌ |

### How Double-Counting is Prevented
1.  **Spending**: When you buy coffee on CC, it's recorded as `CC_Purchase`. This **counts** towards your monthly expenses.
2.  **Bill Payment**: When you pay your CC bill from your Bank, it's recorded as `CC_Payment`. This is **EXCLUDED** from expenses.
    - *Why?* Because you already counted the coffee expense when you bought it! Counting the bill payment would double-count that expense.

### Cashback Handling
-   Cashback credits on your statement are tagged as `Flow: In`. This counts as income/savings, offsetting your expenses.

---

## 🛠 Tech Stack

-   **Frontend**: React 18, TypeScript
-   **Build Tool**: Vite
-   **Styling**: CSS Modules (Clean, Modern, Custom Design)
-   **State/Data**: Google Sheets API (via custom hooks)
-   **Deployment**: GitHub Pages (supports PWA installation)

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   A Google Cloud Project with Sheets API enabled
-   OAuth 2.0 Client ID

### Installation

1.  Clone the repository
    ```bash
    git clone <repo-url>
    cd sheets-pwa-main
    ```

2.  Install dependencies
    ```bash
    npm install
    # or
    npm ci
    ```

3.  Configure Environment
    -   Update `src/App.tsx` with your `CLIENT_ID` and `SPREADSHEET_ID`.

4.  Run Development Server
    ```bash
    npm run dev
    ```

---

## 🧪 Testing & Validation

### "Action Required" Logic
The app automatically flags transactions that need your attention. A transaction requires action if:
1.  **Category is Missing**: The category cell is empty or "Select".
2.  **Invalid Category**: The current category is not in the predefined list for that transaction's Flow.

### Importing Data
1.  Copy transaction text from your Bank Statement PDF/Email.
2.  Click **Import** in the app.
3.  Paste the text. The app currently supports:
    -   **HDFC Savings** (Auto-detects CC payments)
    -   **Axis Credit Card** (Auto-detects Purchases vs Payments)
    -   **IDFC Savings**
4.  Review and Confirm. Duplicates are automatically skipped.
