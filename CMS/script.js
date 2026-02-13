// CMS JavaScript - Communication Management System

// Global variables
let currentTab = 'inquiries';
let currentData = {
    inquiries: [],
    messages: [],
    calls: []
};
let sortConfig = {
    inquiries: { field: 'timestamp', direction: 'desc' },
    messages: { field: 'timestamp', direction: 'desc' },
    calls: { field: 'timestamp', direction: 'desc' }
};

// API configuration
const API_BASE = '/api/cms';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadDashboardData();
    loadInitialData();
    updateLastRefreshTime();
    
    // Set language selector value
    document.getElementById('languageSelector').value = currentLanguage;
});

// Initialize event listeners
function initializeEventListeners() {
    // Date range selector
    document.getElementById('dateRange').addEventListener('change', handleDateRangeChange);
    
    // Search input (Enter key)
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Custom date inputs
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);
    
    // Filter dropdowns
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('sourceFilter').addEventListener('change', applyFilters);
}

// Handle date range change
function handleDateRangeChange() {
    const dateRange = document.getElementById('dateRange').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (dateRange === 'custom') {
        customDateRange.classList.remove('hidden');
        // Set default dates (last 7 days)
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
    } else {
        customDateRange.classList.add('hidden');
        applyFilters();
    }
}

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        const data = await response.json();
        
        // Update stats cards
        document.getElementById('totalInquiries').textContent = data.totalInquiries || 0;
        document.getElementById('totalMessages').textContent = data.totalMessages || 0;
        document.getElementById('totalCalls').textContent = data.totalCalls || 0;
        document.getElementById('newToday').textContent = data.newToday || 0;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load initial data for all tabs
async function loadInitialData() {
    await Promise.all([
        loadInquiries(),
        loadMessages(),
        loadCalls()
    ]);
}

// Load inquiries data
async function loadInquiries() {
    try {
        showLoading('inquiries');
        const response = await fetch(`${API_BASE}/inquiries?limit=100`);
        const data = await response.json();
        
        currentData.inquiries = data.inquiries || [];
        renderInquiriesTable(currentData.inquiries);
        
    } catch (error) {
        console.error('Error loading inquiries:', error);
        showError('Failed to load inquiries');
    }
}

// Load WhatsApp messages data
async function loadMessages() {
    try {
        showLoading('messages');
        const response = await fetch(`${API_BASE}/messages?limit=100`);
        const data = await response.json();
        
        currentData.messages = data.messages || [];
        renderMessagesTable(currentData.messages);
        
    } catch (error) {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
    }
}

// Load call records data
async function loadCalls() {
    try {
        showLoading('calls');
        const response = await fetch(`${API_BASE}/calls?limit=100`);
        const data = await response.json();
        
        currentData.calls = data.calls || [];
        renderCallsTable(currentData.calls);
        
    } catch (error) {
        console.error('Error loading calls:', error);
        showError('Failed to load calls');
    }
}

// Render inquiries table
function renderInquiriesTable(inquiries) {
    const tbody = document.getElementById('inquiriesTableBody');
    
    if (inquiries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>No inquiries found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = inquiries.map(inquiry => `
        <tr class="table-row-hover">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDate(inquiry.timestamp)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${inquiry.name || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="space-y-1">
                    ${inquiry.phone ? `<div><i class="fas fa-phone text-gray-400 mr-1"></i>${inquiry.phone}</div>` : ''}
                    ${inquiry.email ? `<div><i class="fas fa-envelope text-gray-400 mr-1"></i>${inquiry.email}</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${inquiry.service || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${getSourceColor(inquiry.source)}">
                    ${inquiry.source || 'website'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${getStatusColor(inquiry.status)}">
                    ${inquiry.status || 'new'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="viewInquiryDetail('${inquiry.inquiryId}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editInquiry('${inquiry.inquiryId}')" class="text-green-600 hover:text-green-900">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Render messages table
function renderMessagesTable(messages) {
    const tbody = document.getElementById('messagesTableBody');
    
    if (messages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-comments text-4xl mb-4"></i>
                    <p>No WhatsApp messages found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = messages.map(message => `
        <tr class="table-row-hover">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDate(message.timestamp)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${message.phoneNumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${message.profileName || '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                ${message.message}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${getDirectionColor(message.direction)}">
                    ${message.direction}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="viewMessageDetail('${message.messageId}')" class="text-blue-600 hover:text-blue-900">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Render calls table
function renderCallsTable(calls) {
    const tbody = document.getElementById('callsTableBody');
    
    if (calls.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-phone text-4xl mb-4"></i>
                    <p>No call records found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = calls.map(call => `
        <tr class="table-row-hover">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDate(call.timestamp)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${call.callerNumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${getOfficeStatusColor(call.officeStatus)}">
                    ${call.officeStatus}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${getOutcomeColor(call.outcome)}">
                    ${call.outcome.replace(/_/g, ' ')}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${call.duration ? `${call.duration}s` : '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="viewCallDetail('${call.callId}')" class="text-blue-600 hover:text-blue-900">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
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

// Apply filters
async function applyFilters() {
    const dateRange = document.getElementById('dateRange').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const sourceFilter = document.getElementById('sourceFilter').value;
    const searchInput = document.getElementById('searchInput').value;
    
    let startDate = null;
    let endDate = null;
    
    // Calculate date range
    if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        startDate = endDate = today;
    } else if (dateRange === 'week') {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
    } else if (dateRange === 'month') {
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
    } else if (dateRange === 'custom') {
        startDate = document.getElementById('startDate').value;
        endDate = document.getElementById('endDate').value;
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (statusFilter) params.append('status', statusFilter);
    if (sourceFilter) params.append('source', sourceFilter);
    if (searchInput) params.append('search', searchInput);
    params.append('limit', '100');
    
    // Reload data with filters
    await Promise.all([
        loadFilteredData('inquiries', params),
        loadFilteredData('messages', params),
        loadFilteredData('calls', params)
    ]);
}

// Load filtered data for a specific type
async function loadFilteredData(type, params) {
    try {
        showLoading(type);
        const response = await fetch(`${API_BASE}/${type}?${params.toString()}`);
        const data = await response.json();
        
        currentData[type] = data[type] || [];
        
        if (type === 'inquiries') {
            renderInquiriesTable(currentData.inquiries);
        } else if (type === 'messages') {
            renderMessagesTable(currentData.messages);
        } else if (type === 'calls') {
            renderCallsTable(currentData.calls);
        }
        
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        showError('Failed to load data');
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('dateRange').value = 'all';
    document.getElementById('customDateRange').classList.add('hidden');
    document.getElementById('statusFilter').value = '';
    document.getElementById('sourceFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    loadInitialData();
}

// Sort table
function sortTable(type, field) {
    const config = sortConfig[type];
    
    // Toggle direction if same field
    if (config.field === field) {
        config.direction = config.direction === 'asc' ? 'desc' : 'asc';
    } else {
        config.field = field;
        config.direction = 'asc';
    }
    
    // Sort data
    currentData[type].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle dates
        if (field === 'timestamp') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        // Handle null/undefined
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        // Compare
        if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Re-render table
    if (type === 'inquiries') {
        renderInquiriesTable(currentData.inquiries);
    } else if (type === 'messages') {
        renderMessagesTable(currentData.messages);
    } else if (type === 'calls') {
        renderCallsTable(currentData.calls);
    }
}

// View inquiry detail - redirect to customer detail page
async function viewInquiryDetail(inquiryId) {
    // Redirect to customer detail page
    window.location.href = `customer.html?id=${inquiryId}&mode=view`;
}

// Show inquiry modal
function showInquiryModal(inquiry) {
    const modal = document.getElementById('detailModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    title.textContent = t('inquiryDetails');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Date</label>
                    <p class="mt-1 text-sm text-gray-900">${formatDate(inquiry.timestamp)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <span class="status-badge ${getStatusColor(inquiry.status)}">${inquiry.status || 'new'}</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <p class="mt-1 text-sm text-gray-900">${inquiry.name || '-'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Source</label>
                    <span class="status-badge ${getSourceColor(inquiry.source)}">${inquiry.source || 'website'}</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Phone</label>
                    <p class="mt-1 text-sm text-gray-900">${inquiry.phone || '-'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <p class="mt-1 text-sm text-gray-900">${inquiry.email || '-'}</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Service</label>
                <p class="mt-1 text-sm text-gray-900">${inquiry.service || '-'}</p>
            </div>
            
            ${inquiry.pregnancyWeek ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Pregnancy Week</label>
                <p class="mt-1 text-sm text-gray-900">${inquiry.pregnancyWeek}</p>
            </div>
            ` : ''}
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Message</label>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${inquiry.message || '-'}</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${inquiry.notes || '-'}</p>
            </div>
            
            ${inquiry.customerNotes ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Customer Notes</label>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${inquiry.customerNotes || '-'}</p>
            </div>
            ` : ''}
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Close
                </button>
                <button onclick="editInquiry('${inquiry.inquiryId}')" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
                    Edit
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    updateUI();
}

// View message detail
async function viewMessageDetail(messageId) {
    try {
        const response = await fetch(`${API_BASE}/messages/${messageId}`);
        const message = await response.json();
        
        showMessageModal(message);
        
    } catch (error) {
        console.error('Error fetching message detail:', error);
        showError('Failed to load message details');
    }
}

// Show message modal
function showMessageModal(message) {
    const modal = document.getElementById('detailModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    title.textContent = t('messageDetails');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Date</label>
                    <p class="mt-1 text-sm text-gray-900">${formatDate(message.timestamp)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Direction</label>
                    <span class="status-badge ${getDirectionColor(message.direction)}">${message.direction}</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p class="mt-1 text-sm text-gray-900">${message.phoneNumber}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Profile Name</label>
                    <p class="mt-1 text-sm text-gray-900">${message.profileName || '-'}</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Message</label>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${message.message}</p>
            </div>
            
            ${message.mediaType ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Media Type</label>
                <p class="mt-1 text-sm text-gray-900">${message.mediaType}</p>
            </div>
            ` : ''}
            
            ${message.mediaUrl ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Media URL</label>
                <p class="mt-1 text-sm text-gray-900">${message.mediaUrl}</p>
            </div>
            ` : ''}
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    updateUI();
}

// View call detail
async function viewCallDetail(callId) {
    try {
        const response = await fetch(`${API_BASE}/calls/${callId}`);
        const call = await response.json();
        
        showCallModal(call);
        
    } catch (error) {
        console.error('Error fetching call detail:', error);
        showError('Failed to load call details');
    }
}

// Show call modal
function showCallModal(call) {
    const modal = document.getElementById('detailModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    title.textContent = t('callDetails');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Date</label>
                    <p class="mt-1 text-sm text-gray-900">${formatDate(call.timestamp)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Duration</label>
                    <p class="mt-1 text-sm text-gray-900">${call.duration ? `${call.duration} seconds` : '-'}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p class="mt-1 text-sm text-gray-900">${call.callerNumber}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Office Status</label>
                    <span class="status-badge ${getOfficeStatusColor(call.officeStatus)}">${call.officeStatus}</span>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Outcome</label>
                <span class="status-badge ${getOutcomeColor(call.outcome)}">${call.outcome.replace(/_/g, ' ')}</span>
            </div>
            
            ${call.twilioCallSid ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Twilio Call SID</label>
                <p class="mt-1 text-sm text-gray-900">${call.twilioCallSid}</p>
            </div>
            ` : ''}
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${call.notes || '-'}</p>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    updateUI();
}

// Edit inquiry - redirect to customer detail page
function editInquiry(inquiryId) {
    // Redirect to customer detail page with edit mode
    window.location.href = `customer.html?id=${inquiryId}&mode=edit`;
}

// Show edit modal
function showEditModal(type, data) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const content = document.getElementById('editFormContent');
    
    if (type === 'inquiry') {
        title.textContent = t('editInquiry');
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="editStatus" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="new" ${data.status === "new" ? "selected" : ""}>New</option>
                        <option value="contacted" ${data.status === "contacted" ? "selected" : ""}>Contacted</option>
                        <option value="in_progress" ${data.status === "in_progress" ? "selected" : ""}>In Progress</option>
                        <option value="closed" ${data.status === "closed" ? "selected" : ""}>Closed</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Relevant Customer</label>
                    <select id="editRelevantCustomer" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="unknown" ${data.isRelevantCustomer === "unknown" ? "selected" : ""}>Unknown</option>
                        <option value="relevant" ${data.isRelevantCustomer === "relevant" ? "selected" : ""}>Relevant</option>
                        <option value="not_relevant" ${data.isRelevantCustomer === "not_relevant" ? "selected" : ""}>Not Relevant</option>
                        <option value="potential" ${data.isRelevantCustomer === "potential" ? "selected" : ""}>Potential</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Communication Status</label>
                    <select id="editCommunicationStatus" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="pending" ${data.communicationStatus === "pending" ? "selected" : ""}>Pending</option>
                        <option value="active" ${data.communicationStatus === "active" ? "selected" : ""}>Active</option>
                        <option value="completed" ${data.communicationStatus === "completed" ? "selected" : ""}>Completed</option>
                        <option value="on_hold" ${data.communicationStatus === "on_hold" ? "selected" : ""}>On Hold</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="editNotes" rows="3" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">${data.notes || ""}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Customer Notes</label>
                <textarea id="editCustomerNotes" rows="3" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">${data.customerNotes || ""}</textarea>
            </div>
            
            <input type="hidden" id="editInquiryId" value="${data.inquiryId}">
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
    
    const inquiryId = document.getElementById('editInquiryId').value;
    const updateData = {
        status: document.getElementById('editStatus').value,
        isRelevantCustomer: document.getElementById('editRelevantCustomer').value,
        communicationStatus: document.getElementById('editCommunicationStatus').value,
        notes: document.getElementById('editNotes').value,
        customerNotes: document.getElementById('editCustomerNotes').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/inquiries/${inquiryId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const updatedInquiry = await response.json();
            
            // Update local data
            const index = currentData.inquiries.findIndex(item => item.inquiryId === inquiryId);
            if (index !== -1) {
                currentData.inquiries[index] = updatedInquiry;
            }
            
            // Re-render table
            renderInquiriesTable(currentData.inquiries);
            
            // Close modal
            closeEditModal();
            
            // Show success message
            showSuccess(t('itemUpdated'));
        } else {
            throw new Error('Failed to update inquiry');
        }
    } catch (error) {
        console.error('Error updating inquiry:', error);
        showError(t('errorSaving'));
    }
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

// Close modal
function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// Refresh all data
async function refreshData() {
    await Promise.all([
        loadDashboardData(),
        loadInitialData()
    ]);
    updateLastRefreshTime();
}

// Update last refresh time
function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;
}

// Show loading state
function showLoading(type) {
    const tbodyId = type === 'inquiries' ? 'inquiriesTableBody' : 
                    type === 'messages' ? 'messagesTableBody' : 'callsTableBody';
    const tbody = document.getElementById(tbodyId);
    const colspan = type === 'inquiries' ? 7 : type === 'messages' ? 6 : 6;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="${colspan}" class="px-6 py-12 text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-500">${t(`loading${type.charAt(0).toUpperCase() + type.slice(1)}`)}</p>
            </td>
        </tr>
    `;
}

// Show error message
function showError(message) {
    // Simple error notification (could be enhanced with a toast library)
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

function getSourceColor(source) {
    const colors = {
        'website': 'bg-purple-100 text-purple-800',
        'whatsapp': 'bg-green-100 text-green-800',
        'phone': 'bg-blue-100 text-blue-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
}

function getDirectionColor(direction) {
    const colors = {
        'incoming': 'bg-blue-100 text-blue-800',
        'outgoing': 'bg-green-100 text-green-800'
    };
    return colors[direction] || 'bg-gray-100 text-gray-800';
}

function getOfficeStatusColor(status) {
    const colors = {
        'open': 'bg-green-100 text-green-800',
        'closed': 'bg-red-100 text-red-800',
        'unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
