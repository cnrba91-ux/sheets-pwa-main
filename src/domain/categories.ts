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
        'S',
        'Others'
    ]
};

export const FLOW_OPTIONS = ['In', 'Out', 'Savings', 'Transfer'];

export const IMPACTS_BUDGET_OPTIONS = ['Yes', 'No'];

export const ACCOUNTS = [
    { bank: 'Axis', accNum: 'C-0002-Flipkart' },
    { bank: 'Axis', accNum: 'C-2947-Airtel' },
    { bank: 'Axis', accNum: 'C-6144-SuperM' },
    { bank: 'HDFC', accNum: 'D-0902' },
    { bank: 'HDFC', accNum: 'C-3295- IOC' },
    { bank: 'HDFC', accNum: 'C-2786 - Neu' },
    { bank: 'IDFC', accNum: 'D-5527' },
    { bank: 'SBI', accNum: 'C-3808-Save' },
    { bank: 'SBI', accNum: 'C-6887-Cashback' },
    { bank: 'Yes Bank', accNum: 'C-1306-Kiwi' }
];

