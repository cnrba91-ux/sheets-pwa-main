// src/domain/categories.ts

export const CATEGORY_MAP: Record<string, string[]> = {
    In: [
        'Income',
        'Salary',
        'DN',
        'Dividend',
        'UPI Received',
        'Savings Interest',
        'Cashback',
        'Return'
    ],

    Out: [
        'Groceries',
        'Food & Dining',
        'Bike Expenses',
        'Travel',
        'Personal Expense',
        'Health & Insurance',
        'Car Expenses',
        'Car Loan',
        'Home Loan',
        'Home Maintenance',
        'Bills & Recharge',
        'Shopping',
        'DN',
        'Misc'
    ],

    Settlement: ['CC Repayment'],

    Savings: [
        'Chits',
        'Stocks',
        'Lent',
        'Mutual Funds',
        'Metal'
    ],

    'To be updated': ['To be updated']
};

export const IN_OUT_OPTIONS = ['In', 'Out', 'Savings', 'Settlement'];

export const IN_CALC_OPTIONS = ['Yes', 'No'];
