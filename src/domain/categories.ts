// src/domain/categories.ts

export const CATEGORY_MAP: Record<string, string[]> = {
    In: [
        'Cashback',
        'Dividend',
        'DN',
        'Income',
        'Return',
        'Salary',
        'Savings Interest'
    ],

    Out: [
        'Bike Expenses',
        'Bills & Recharge',
        'Car Expenses',
        'Car Loan',
        'DN',
        'Food & Dining',
        'Groceries',
        'Health & Insurance',
        'Home Loan',
        'Home Maintenance',
        'Misc',
        'Personal Expense',
        'Shopping',
        'Travel'
    ],

    Savings: [
        'Chits',
        'Lent',
        'Mutual Funds',
        'Stocks'
    ],

    Transfer: [
        'CC Repayment',
        'Self',
        'S'
    ]
};

export const FLOW_OPTIONS = ['In', 'Out', 'Savings', 'Transfer'];

export const IMPACTS_BUDGET_OPTIONS = ['Yes', 'No'];
