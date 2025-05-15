const form = document.getElementById('expenseForm');
const list = document.getElementById('expensesList');
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// API base URL
const API_URL = 'https://e-tracker-backend-1.onrender.com/api';

/**
 * Fetch all expenses from the API
 */
async function fetchExpenses() {
    try {
        const res = await fetch(`${API_URL}/expenses`);
        
        if (!res.ok) {
            throw new Error('Failed to fetch expenses');
        }
        
        const data = await res.json();
        list.innerHTML = '';
        
        // Update expense counter
        document.getElementById('expenseCount').textContent = `${data.length} expense${data.length !== 1 ? 's' : ''}`;
        
        // Render each expense
        data.forEach(exp => {
            renderExpense(exp);
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

/**
 * Render a single expense item
 */
function renderExpense(exp) {
    const item = document.createElement('li');
    
    // Format the date
    const expDate = new Date(exp.date);
    const formattedDate = expDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    
    // Convert API values to display names
    const paidByName = exp.paid_by === 'me' ? 'Kevin' : 'Jackie';
    const splitNames = exp.split_between.map(name => name === 'me' ? 'Kevin' : 'Jackie').join(" & ");
    
    // Create expense structure
    item.innerHTML = `
        <div class="exp-details">
            <div>${exp.description}</div>
            <div class="paid-by">Paid by ${paidByName} · Split with ${splitNames}</div>
            <div class="exp-date">${formattedDate}</div>
        </div>
        <div class="exp-amount">$${parseFloat(exp.amount).toFixed(2)}</div>
    `;
    
    list.appendChild(item);
}

/**
 * Fetch current balance from the API
 */
async function fetchBalance() {
    try {
        const res = await fetch(`${API_URL}/balance`);
        
        if (!res.ok) {
            throw new Error('Failed to fetch balance');
        }
        
        const data = await res.json();
        
        const balanceElement = document.getElementById('balanceResult');
        balanceElement.textContent = data.verdict;
        
        // Add colored styling based on balance
        if (data.verdict.includes("KEVIN owes")) {
            balanceElement.className = "negative";
        } else if (data.verdict.includes("JACKIE owes")) {
            balanceElement.className = "positive";
        } else {
            balanceElement.className = "zero-balance";
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        document.getElementById('balanceResult').textContent = 'Failed to load balance';
    }
}

/**
 * Refresh all data from the API
 */
async function refreshAll() {
    await fetchExpenses();
    await fetchBalance();
}

/**
 * Add a new expense
 */
async function addExpense(expenseData) {
    try {
        const res = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        
        if (!res.ok) {
            throw new Error('Failed to add expense');
        }
        
        return true;
    } catch (error) {
        console.error('Error adding expense:', error);
        return false;
    }
}

// Form submission handler
form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const expenseData = {
        description: document.getElementById('desc').value,
        amount: document.getElementById('amount').value,
        paid_by: document.getElementById('paidBy').value,
        date: document.getElementById('date').value
    };
    
    const submitButton = form.querySelector('button');
    submitButton.textContent = 'Adding...';
    submitButton.disabled = true;
    
    try {
        const success = await addExpense(expenseData);
        
        if (success) {
            form.reset();
            dateInput.value = today;
            await refreshAll();
        } else {
            alert('Failed to add expense. Please try again.');
        }
    } finally {
        submitButton.textContent = 'Add Expense';
        submitButton.disabled = false;
    }
});

// Initialize the app
refreshAll();