# Schema Update Summary

## Overview
Successfully updated the entire codebase to match your actual Google Sheets structure.

## Schema Changes

### Previous Schema (11 columns - INCORRECT)
0. Ref ID
1. Date
2. Bank
3. Account
4. Payee
5. Amount
6. Flow
7. Category
8. In Calc?
9. Note
10. Raw Narration

### Current Schema (13 columns - MATCHES YOUR SHEET)
0. **Date**
1. **Bank**
2. **Account**
3. **Ref ID**
4. **Narration**
5. **Payee**
6. **Debit**
7. **Credit**
8. **Net Amount**
9. **Flow**
10. **Category**
11. **ImpactsBudget**
12. **Note**

## Flow Values Updated
- **Old**: `Income`, `Expense`, `Transfer`
- **New**: `In`, `Out`, `Savings`, `Transfer`

## Category Mappings Updated
Now matches your "Category" sheet exactly:

### In
- Cashback, Dividend, DN, Income, Return, Salary, Savings Interest

### Out
- Bike Expenses, Bills & Recharge, Car Expenses, Car Loan, DN, Food & Dining, Groceries, Health & Insurance, Home Loan, Home Maintenance, Misc, Personal Expense, Shopping, Travel

### Savings
- Chits, Lent, Mutual Funds, Stocks

### Transfer
- CC Repayment, Self, S

## Files Updated

### 1. Core Types (`src/domain/types.ts`)
- Updated `Transaction` interface to match 13-column schema
- Added `Category` interface
- Updated `SCHEMA` constant
- Fixed `rowToTransaction()` and `transactionToRow()` functions

### 2. Categories (`src/domain/categories.ts`)
- Updated `CATEGORY_MAP` with your actual categories
- Renamed `IN_OUT_OPTIONS` → `FLOW_OPTIONS`
- Renamed `IN_CALC_OPTIONS` → `IMPACTS_BUDGET_OPTIONS`

### 3. Bank Parsers (`src/domain/parsers.ts`)
- Updated all three parsers (HDFC, Axis, IDFC) to output new Transaction structure
- Changed to use `debit`, `credit`, `netAmount` instead of single `amount`
- Updated flow values to use `In`/`Out` instead of `Income`/`Expense`
- Changed `inCalc` → `impactsBudget`
- Changed `rawNarration` → `narration`

### 4. Transaction Hook (`src/features/transactions/useTransactions.ts`)
- Updated all column indices throughout
- Fixed auto-tagging logic (column 5→payee, 9→flow, 10→category)
- Fixed filtering logic (columns 1, 2, 9, 10, 11)
- Updated attention tracking (columns 10, 11)
- Fixed sorting to use column 0 (Date)
- Updated duplicate detection (column 3 for Ref ID)

### 5.  UI Components
**FilterBar.tsx**:
- Updated filter column indices (Bank:1, Account:2, Flow:9, Category:10, ImpactsBudget:11)
- Changed label from "In Calc?" to "Impacts Budget?"

**SlicersPanel.tsx**:
- Same column index updates as FilterBar
- Updated label accordingly

**ImportModal.tsx**:
- Fixed duplicate detection to use correct columns
- Updated to use `netAmount` instead of `amount`
- Fixed Ref ID check (column 3)

**MatrixTable.tsx**:
- Updated all column references for desktop and mobile views
- Changed flow detection logic (column 9)
- Changed category detection (column 10)
- Changed impacts budget (column 11)
- Changed note field (column 12)
- Updated amount display to use column 8 (Net Amount)
- Fixed date formatting to use column 0
- Updated flow pill colors for new values

### 6. App Configuration (`src/App.tsx`)
- Updated `RANGE` from `Transactions!A:K` to `Transactions!A:M` (13 columns)

## Build Status
✅ **All TypeScript errors fixed**
✅ **Build succeeds** (Exit code: 0)
✅ **Production bundle created successfully**

## Next Steps
1. Clear browser cache and reload the app
2. Test with your actual Google Sheets data
3. Verify import functionality with bank statements
4. Test filtering, sorting, and editing features

## Important Notes
- The app now correctly reads all 13 columns from your sheet
- Flow values match your Category sheet (In, Out, Savings, Transfer)
- ImpactsBudget replaces the old "In Calc?" field
- Narration field is preserved in the sheet
- Debit/Credit/Net Amount structure is properly handled
