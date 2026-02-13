// Customer Detail Page JavaScript
// Global variables
let currentCustomer = null;
let currentTab = 'profile';
let customerId = null;

// API configuration
const API_BASE = '/api/cms';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadCustomerData();
    updateLastRefreshTime();
    
    // Set language selector value
    document.getElementById('languageSelector').value = currentLanguage;
});

// Initialize event listeners
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.id.replace('Tab', '');
            switchTab(tabName);
        });
    });
}

// Get customer ID and mode from URL
function getCustomerParamsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        id: urlParams.get('id'),
        mode: urlParams.get('mode') || 'view'
    };
}

// Load customer data
async function loadCustomerData() {
    const params = getCustomerParamsFromURL();
    customerId = params.id;
    
    if (!customerId) {
        showError('No customer ID provided');
        return;
    }
    
    try {
        showLoading();
        
        // Load customer details
        const response = await fetch(`${API_BASE}/customers/${customerId}`);
        if (!response.ok) {
            throw new Error('Failed to load customer data');
        }
        
        const customer = await response.json();
        currentCustomer = customer;
        
        // Update UI with customer data
        updateCustomerHeader(customer);
        updateProfileTab(customer);
        updateHistoryTab(customer);
        updateContactsTab(customer);
        updateFunnelTab(customer);
        
        // If in edit mode, open edit modal
        if (params.mode === 'edit') {
            editCustomer();
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error loading customer data:', error);
        showError('Failed to load customer data');
        hideLoading();
    }
}

// Update customer header
function updateCustomerHeader(customer) {
    document.getElementById('customerName').textContent = customer.name || 'Unknown Customer';
    document.getElementById('customerStatus').textContent = `${t('status')}: ${customer.status || 'Unknown'}`;
}

// Switch between tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeTab.classList.add('border-blue-500', 'text-blue-600');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
}

// Update profile tab
function updateProfileTab(customer) {
    // Basic Information
    document.getElementById('customerFullName').textContent = customer.fullName || '-';
    document.getElementById('customerPhone').textContent = customer.phone || '-';
    document.getElementById('customerEmail').textContent = customer.email || '-';
    document.getElementById('customerAddress').textContent = customer.address || '-';
    
    // Health Information
    document.getElementById('pregnancyWeek').textContent = customer.pregnancyWeek ? `Week ${customer.pregnancyWeek}` : '-';
    
    if (customer.pregnancyWeek) {
        const milestone = getPregnancyMilestone(customer.pregnancyWeek);
        document.getElementById('pregnancyMilestone').textContent = milestone;
    }
    
    document.getElementById('ultrasoundDate').textContent = customer.ultrasoundDate ? formatDate(customer.ultrasoundDate) : '-';
    document.getElementById('otherChildren').textContent = customer.otherChildren || '-';
}

// Update history tab
function updateHistoryTab(customer) {
    // Request History
    const requestHistory = document.getElementById('requestHistory');
    if (customer.requestHistory && customer.requestHistory.length > 0) {
        requestHistory.innerHTML = customer.requestHistory.map(item => `
            <div class="timeline-item">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-900">${item.request}</p>
                        <p class="text-xs text-gray-500">${formatDate(item.timestamp)}</p>
                    </div>
                    <span class="status-badge ${getStatusColor(item.status)}">${item.status}</span>
                </div>
            </div>
        `).join('');
    } else {
        requestHistory.innerHTML = '<p class="text-gray-500 text-sm">No request history available</p>';
    }
    
    // Communication History
    const communicationHistory = document.getElementById('communicationHistory');
    if (customer.communicationHistory && customer.communicationHistory.length > 0) {
        communicationHistory.innerHTML = customer.communicationHistory.map(item => `
            <div class="timeline-item">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm text-gray-900">${item.type}: ${item.details}</p>
                        <p class="text-xs text-gray-500">${formatDate(item.timestamp)}</p>
                    </div>
                    <span class="status-badge ${getDirectionColor(item.direction)}">${item.direction}</span>
                </div>
            </div>
        `).join('');
    } else {
        communicationHistory.innerHTML = '<p class="text-gray-500 text-sm">No communication history available</p>';
    }
}

// Update contacts tab
function updateContactsTab(customer) {
    // Primary Contact
    if (customer.primaryContact) {
        document.getElementById('primaryRelationshipType').textContent = customer.primaryContact.relationshipType || '-';
        document.getElementById('primaryContactName').textContent = customer.primaryContact.name || '-';
        document.getElementById('primaryContactPhone').textContent = customer.primaryContact.phone || '-';
        document.getElementById('primaryContactEmail').textContent = customer.primaryContact.email || '-';
    }
    
    // Additional Contacts
    const additionalContacts = document.getElementById('additionalContacts');
    if (customer.additionalContacts && customer.additionalContacts.length > 0) {
        additionalContacts.innerHTML = customer.additionalContacts.map(contact => `
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-gray-900">${contact.name}</h4>
                        <p class="text-xs text-gray-600">${contact.relationshipType}</p>
                        <p class="text-sm text-gray-900">${contact.phone || '-'}</p>
                        <p class="text-sm text-gray-900">${contact.email || '-'}</p>
                    </div>
                    <button onclick="removeContact('${contact.id}')" class="text-red-600 hover:text-red-900 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        additionalContacts.innerHTML = '<p class="text-gray-500 text-sm">No additional contacts available</p>';
    }
}

// Update funnel tab
function updateFunnelTab(customer) {
    // Funnel Process
    document.getElementById('firstCallDate').textContent = customer.firstCallDate ? formatDate(customer.firstCallDate) : '-';
    document.getElementById('hasNeed').textContent = customer.hasNeed ? 'Yes' : 'No';
    document.getElementById('familiarWithDoctor').textContent = customer.familiarWithDoctor ? 'Yes' : 'No';
    document.getElementById('understandsPricing').textContent = customer.understandsPricing ? 'Yes' : 'No';
    document.getElementById('bookedSession').textContent = customer.bookedSession ? 'Yes' : 'No';
    document.getElementById('bookedCallWithDoctor').textContent = customer.bookedCallWithDoctor ? 'Yes' : 'No';
    
    // Next Follow-up
    if (customer.nextFollowUp) {
        document.getElementById('nextFollowUp').textContent = `${formatDate(customer.nextFollowUp)} - ${customer.nextFollowUpReason || 'Scheduled follow-up'}`;
    } else {
        document.getElementById('nextFollowUp').textContent = 'No follow-up scheduled';
    }
    
    // Call Log
    const callLog = document.getElementById('callLog');
    if (customer.callLog && customer.callLog.length > 0) {
        callLog.innerHTML = customer.callLog.map(call => `
            <div class="timeline-item">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm text-gray-900">${call.mode} - ${call.outcome}</p>
                        <p class="text-xs text-gray-500">${formatDate(call.timestamp)}</p>
                    </div>
                    <span class="status-badge ${getOutcomeColor(call.outcome)}">${call.status}</span>
                </div>
            </div>
        `).join('');
    } else {
        callLog.innerHTML = '<p class="text-gray-500 text-sm">No call history available</p>';
    }
}

// Get pregnancy milestone
function getPregnancyMilestone(week) {
    const milestones = {
        8: 'First ultrasound scan',
        12: 'Nuchal translucency scan',
        20: 'Anomaly scan',
        24: 'Viability check',
        28: 'Full anatomy scan',
        32: 'Growth scan',
        36: 'Position check',
        40: 'Full term'
    };
    
    return milestones[week] || '';
}

// Edit customer
function editCustomer() {
    if (!currentCustomer) {
        showError('No customer data available');
        return;
    }
    
    showEditModal('customer', currentCustomer);
}

// Add contact
function addContact() {
    // This would open a modal to add new contact
    alert('Add contact functionality would be implemented here');
}

// Remove contact
function removeContact(contactId) {
    if (!confirm('Are you sure you want to remove this contact?')) {
        return;
    }
    
    // Implementation would remove contact from customer data
    alert('Remove contact functionality would be implemented here');
}

// Add note
function addNote() {
    // This would open a modal to add new note
    alert('Add note functionality would be implemented here');
}

// Show edit modal
function showEditModal(type, data) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const content = document.getElementById('editFormContent');
    
    if (type === 'customer') {
        title.textContent = t('editCustomer');
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="editFullName" value="${data.fullName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" id="editPhone" value="${data.phone || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="editEmail" value="${data.email || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Address</label>
                    <textarea id="editAddress" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">${data.address || ''}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Pregnancy Week</label>
                    <input type="number" id="editPregnancyWeek" value="${data.pregnancyWeek || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ultrasound Date</label>
                    <input type="date" id="editUltrasoundDate" value="${data.ultrasoundDate || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Other Children</label>
                    <textarea id="editOtherChildren" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">${data.otherChildren || ''}</textarea>
                </div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
    updateUI();
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Save edit form
async function saveEditForm(event) {
    event.preventDefault();
    
    if (!currentCustomer || !customerId) {
        showError('No customer data available');
        return;
    }
    
    const updateData = {
        fullName: document.getElementById('editFullName').value,
        phone: document.getElementById('editPhone').value,
        email: document.getElementById('editEmail').value,
        address: document.getElementById('editAddress').value,
        pregnancyWeek: document.getElementById('editPregnancyWeek').value,
        ultrasoundDate: document.getElementById('editUltrasoundDate').value,
        otherChildren: document.getElementById('editOtherChildren').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const updatedCustomer = await response.json();
            currentCustomer = updatedCustomer;
            
            // Update UI
            updateCustomerHeader(updatedCustomer);
            updateProfileTab(updatedCustomer);
            
            // Close modal
            closeEditModal();
            
            // Show success message
            showSuccess(t('customerUpdated'));
        } else {
            throw new Error('Failed to update customer');
        }
    } catch (error) {
        console.error('Error updating customer:', error);
        showError(t('errorSaving'));
    }
}

// Refresh customer data
async function refreshCustomerData() {
    if (customerId) {
        await loadCustomerData();
        updateLastRefreshTime();
    }
}

// Update last refresh time
function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;
}

// Show loading state
function showLoading() {
    // Implementation would show loading spinner
    console.log('Loading customer data...');
}

// Hide loading state
function hideLoading() {
    // Implementation would hide loading spinner
    console.log('Loading complete');
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 fade-in';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 fade-in';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>${t(message)}</span>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function getStatusColor(status) {
    const colors = {
        'new': 'bg-blue-100 text-blue-800',
        'contacted': 'bg-yellow-100 text-yellow-800',
        'in_progress': 'bg-orange-100 text-orange-800',
        'closed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getDirectionColor(direction) {
    const colors = {
        'incoming': 'bg-blue-100 text-blue-800',
        'outgoing': 'bg-green-100 text-green-800'
    };
    return colors[direction] || 'bg-gray-100 text-gray-800';
}

function getOutcomeColor(outcome) {
    const colors = {
        'answered': 'bg-green-100 text-green-800',
        'no_answer_hangup': 'bg-red-100 text-red-800',
        'no_answer_whatsapp': 'bg-orange-100 text-orange-800',
        'closed_hours_whatsapp': 'bg-yellow-100 text-yellow-800',
        'menu_whatsapp': 'bg-blue-100 text-blue-800',
        'incoming': 'bg-gray-100 text-gray-800'
    };
    return colors[outcome] || 'bg-gray-100 text-gray-800';
}
