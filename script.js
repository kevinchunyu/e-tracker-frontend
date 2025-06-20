const form = document.getElementById('expenseForm');
const list = document.getElementById('expensesList');
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

const API_URL = 'https://e-tracker-backend-1.onrender.com/api';

/**
 * Fetch all expenses from the API
 */
async function fetchExpenses() {
    try {
        const res = await fetch(`${API_URL}/expenses`);
        if (!res.ok) throw new Error('Failed to fetch expenses');

        const data = await res.json();
        list.innerHTML = '';

        document.getElementById('expenseCount').textContent = `${data.length} expense${data.length !== 1 ? 's' : ''}`;

        const trips = {};
        data.forEach(exp => {
            const trip = exp.trip || 'default';
            if (!trips[trip]) trips[trip] = [];
            trips[trip].push(exp);
        });

        for (const tripName in trips) {
            // Container for each trip section
            const tripSection = document.createElement('div');
            tripSection.classList.add('trip-section');

            // Header for the trip
            const header = document.createElement('h3');
            header.textContent = `Trip: ${tripName}`;
            header.classList.add('trip-header');

            // Content section for trip expenses
            const content = document.createElement('div');
            content.classList.add('trip-content');
            // Optionally collapse by default:
            // content.classList.add('collapsed');

            trips[tripName].forEach(exp => content.appendChild(renderExpense(exp)));

            // Toggle collapse on header click
            header.addEventListener('click', () => {
                content.classList.toggle('collapsed');
            });

            tripSection.appendChild(header);
            tripSection.appendChild(content);
            list.appendChild(tripSection);
        }
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

/**
 * Render a single expense item and return DOM element
 */
function renderExpense(exp) {
    const item = document.createElement('li');

    const expDate = new Date(exp.date);
    const formattedDate = expDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    const paidByName = exp.paid_by === 'me' ? 'Kevin' : 'Jackie';
    const splitNames = exp.split_between.map(name => name === 'me' ? 'Kevin' : 'Jackie').join(" & ");

    item.innerHTML = `
        <div class="exp-details">
            <div>${exp.description}</div>
            <div class="paid-by">Paid by ${paidByName} · Split with ${splitNames}</div>
            <div class="exp-date">${formattedDate}</div>
        </div>
        <div class="exp-amount">$${parseFloat(exp.amount).toFixed(2)}</div>
    `;

    return item;
}

/**
 * Fetch and display balance
 */
async function fetchBalance() {
    try {
        const res = await fetch(`${API_URL}/balance`);
        if (!res.ok) throw new Error('Failed to fetch balance');

        const data = await res.json();
        const balanceElement = document.getElementById('balanceResult');
        balanceElement.textContent = data.verdict;

        if (data.verdict.includes("Kevin owes")) {
            balanceElement.className = "negative";
        } else if (data.verdict.includes("Jackie owes")) {
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
 * Refresh all data from API
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

        if (!res.ok) throw new Error('Failed to add expense');
        return true;
    } catch (error) {
        console.error('Error adding expense:', error);
        return false;
    }
}

// Handle form submission
form.addEventListener('submit', async e => {
    e.preventDefault();

    const expenseData = {
        description: document.getElementById('desc').value,
        amount: document.getElementById('amount').value,
        paid_by: document.getElementById('paidBy').value,
        date: document.getElementById('date').value,
        trip: document.getElementById('trip').value || 'default'
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

// Initialize app
refreshAll();
