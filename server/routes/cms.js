/**
 * CMS Routes
 * API endpoints for the Communication Management System
 */

const express = require('express');
const router = express.Router();
const inquiryRepository = require('../dal/repositories/inquiryRepository');
const callRepository = require('../dal/repositories/callRepository');
const whatsappMessageRepository = require('../dal/repositories/whatsappMessageRepository');

/**
 * GET /api/cms/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Get total counts
        const [inquiries, calls, messages] = await Promise.all([
            inquiryRepository.find({ limit: 10000 }),
            callRepository.find({ limit: 10000 }),
            whatsappMessageRepository.find({ limit: 10000 })
        ]);
        
        // Get today's counts
        const [todayInquiries, todayCalls, todayMessages] = await Promise.all([
            inquiryRepository.find({ startDate: today, endDate: today, limit: 10000 }),
            callRepository.find({ startDate: today, endDate: today, limit: 10000 }),
            whatsappMessageRepository.find({ startDate: today, endDate: today, limit: 10000 })
        ]);
        
        // Get this week's counts
        const [weekInquiries, weekCalls, weekMessages] = await Promise.all([
            inquiryRepository.find({ startDate: weekAgo, endDate: today, limit: 10000 }),
            callRepository.find({ startDate: weekAgo, endDate: today, limit: 10000 }),
            whatsappMessageRepository.find({ startDate: weekAgo, endDate: today, limit: 10000 })
        ]);
        
        res.json({
            totalInquiries: inquiries.length,
            totalMessages: messages.length,
            totalCalls: calls.length,
            newToday: {
                inquiries: todayInquiries.length,
                messages: todayMessages.length,
                calls: todayCalls.length
            },
            newThisWeek: {
                inquiries: weekInquiries.length,
                messages: weekMessages.length,
                calls: weekCalls.length
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

/**
 * GET /api/cms/inquiries
 * Get all inquiries with filters
 */
router.get('/inquiries', async (req, res) => {
    try {
        const { startDate, endDate, status, source, search } = req.query;
        let inquiries = await inquiryRepository.find({ limit: 10000 });
        
        // Apply filters
        if (startDate) {
            inquiries = inquiries.filter(inquiry => 
                inquiry.timestamp && inquiry.timestamp >= startDate
            );
        }
        
        if (endDate) {
            inquiries = inquiries.filter(inquiry => 
                inquiry.timestamp && inquiry.timestamp <= endDate
            );
        }
        
        if (status) {
            inquiries = inquiries.filter(inquiry => inquiry.status === status);
        }
        
        if (source) {
            inquiries = inquiries.filter(inquiry => inquiry.source === source);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            inquiries = inquiries.filter(inquiry => 
                (inquiry.name && inquiry.name.toLowerCase().includes(searchLower)) ||
                (inquiry.phone && inquiry.phone.includes(search)) ||
                (inquiry.email && inquiry.email.toLowerCase().includes(searchLower)) ||
                (inquiry.message && inquiry.message.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            inquiries,
            total: inquiries.length
        });
    } catch (error) {
        console.error('Error fetching inquiries:', error.message);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

/**
 * GET /api/cms/inquiries/:id
 * Get a specific inquiry
 */
router.get('/inquiries/:id', async (req, res) => {
    try {
        const inquiry = await inquiryRepository.findById(req.params.id);
        
        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        
        res.json(inquiry);
    } catch (error) {
        console.error('Error fetching inquiry:', error.message);
        res.status(500).json({ error: 'Failed to fetch inquiry' });
    }
});

/**
 * PATCH /api/cms/inquiries/:id
 * Update inquiry
 */
router.patch('/inquiries/:id', async (req, res) => {
    try {
        const inquiry = await inquiryRepository.updateById(req.params.id, req.body);
        
        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        
        res.json(inquiry);
    } catch (error) {
        console.error('Error updating inquiry:', error.message);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

/**
 * GET /api/cms/messages
 * Get WhatsApp messages with filters
 */
router.get('/messages', async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let messages = await whatsappMessageRepository.find({ limit: 10000 });
        
        // Apply filters
        if (startDate) {
            messages = messages.filter(message => 
                message.timestamp && message.timestamp >= startDate
            );
        }
        
        if (endDate) {
            messages = messages.filter(message => 
                message.timestamp && message.timestamp <= endDate
            );
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            messages = messages.filter(message => 
                (message.phone && message.phone.includes(search)) ||
                (message.message && message.message.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            messages,
            total: messages.length
        });
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * GET /api/cms/messages/:id
 * Get specific message
 */
router.get('/messages/:id', async (req, res) => {
    try {
        const message = await whatsappMessageRepository.findById(req.params.id);
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error.message);
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

/**
 * GET /api/cms/calls
 * Get call records with filters
 */
router.get('/calls', async (req, res) => {
    try {
        const { startDate, endDate, status, search } = req.query;
        let calls = await callRepository.find({ limit: 10000 });
        
        // Apply filters
        if (startDate) {
            calls = calls.filter(call => 
                call.timestamp && call.timestamp >= startDate
            );
        }
        
        if (endDate) {
            calls = calls.filter(call => 
                call.timestamp && call.timestamp <= endDate
            );
        }
        
        if (status) {
            calls = calls.filter(call => call.outcome === status);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            calls = calls.filter(call => 
                (call.phone && call.phone.includes(search)) ||
                (call.outcome && call.outcome.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            calls,
            total: calls.length
        });
    } catch (error) {
        console.error('Error fetching calls:', error.message);
        res.status(500).json({ error: 'Failed to fetch calls' });
    }
});

/**
 * GET /api/cms/calls/:id
 * Get specific call record
 */
router.get('/calls/:id', async (req, res) => {
    try {
        const call = await callRepository.findById(req.params.id);
        
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        res.json(call);
    } catch (error) {
        console.error('Error fetching call:', error.message);
        res.status(500).json({ error: 'Failed to fetch call' });
    }
});

/**
 * GET /api/cms/stats
 * Get detailed statistics for date range
 */
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Get all data within date range
        const [allInquiries, allCalls, allMessages] = await Promise.all([
            inquiryRepository.find({ startDate, endDate, limit: 10000 }),
            callRepository.find({ startDate, endDate, limit: 10000 }),
            whatsappMessageRepository.find({ startDate, endDate, limit: 10000 })
        ]);
        
        // Calculate statistics
        const inquiryStats = {
            total: allInquiries.length,
            byStatus: {
                new: allInquiries.filter(i => i.status === 'new').length,
                contacted: allInquiries.filter(i => i.status === 'contacted').length,
                inProgress: allInquiries.filter(i => i.status === 'in_progress').length,
                closed: allInquiries.filter(i => i.status === 'closed').length
            },
            bySource: {
                website: allInquiries.filter(i => i.source === 'website').length,
                whatsapp: allInquiries.filter(i => i.source === 'whatsapp').length,
                phone: allInquiries.filter(i => i.source === 'phone').length
            }
        };
        
        const callStats = {
            total: allCalls.length,
            byOutcome: {
                answered: allCalls.filter(c => c.outcome === 'answered').length,
                noAnswerHangup: allCalls.filter(c => c.outcome === 'no_answer_hangup').length,
                noAnswerWhatsapp: allCalls.filter(c => c.outcome === 'no_answer_whatsapp').length,
                closedHoursWhatsapp: allCalls.filter(c => c.outcome === 'closed_hours_whatsapp').length,
                menuWhatsapp: allCalls.filter(c => c.outcome === 'menu_whatsapp').length
            }
        };
        
        const messageStats = {
            total: allMessages.length,
            byDirection: {
                incoming: allMessages.filter(m => m.direction === 'incoming').length,
                outgoing: allMessages.filter(m => m.direction === 'outgoing').length
            }
        };
        
        res.json({
            inquiries: inquiryStats,
            calls: callStats,
            messages: messageStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ======== CUSTOMER API ENDPOINTS ========

/**
 * GET /api/cms/customers
 * Get all customers with optional filters
 */
router.get('/customers', async (req, res) => {
    try {
        // Get all inquiries and convert to customer format
        const inquiries = await inquiryRepository.find({ limit: 10000 });
        
        const customers = inquiries.map(inquiry => ({
            id: inquiry.inquiryId,
            inquiryId: inquiry.inquiryId,
            fullName: inquiry.name,
            phone: inquiry.phone,
            email: inquiry.email,
            address: inquiry.address || '',
            pregnancyWeek: inquiry.pregnancyWeek || null,
            ultrasoundDate: inquiry.ultrasoundDate || null,
            otherChildren: inquiry.otherChildren || '',
            requestHistory: [{
                request: inquiry.message,
                actualNeed: inquiry.message,
                timestamp: inquiry.timestamp,
                status: inquiry.status
            }],
            communicationHistory: [],
            primaryContact: {
                relationshipType: 'Self',
                name: inquiry.name,
                phone: inquiry.phone,
                email: inquiry.email
            },
            additionalContacts: [],
            firstCallDate: inquiry.timestamp,
            hasNeed: inquiry.isRelevantCustomer === 'relevant' || inquiry.isRelevantCustomer === 'potential',
            familiarWithDoctor: false,
            understandsPricing: false,
            bookedSession: inquiry.status === 'closed',
            bookedCallWithDoctor: false,
            nextFollowUp: null,
            nextFollowUpReason: '',
            callLog: [],
            isRelevantCustomer: inquiry.isRelevantCustomer,
            communicationStatus: inquiry.communicationStatus,
            customerNotes: inquiry.customerNotes,
            notes: inquiry.notes
        }));
        
        res.json({
            customers,
            total: customers.length
        });
    } catch (error) {
        console.error('Error fetching customers:', error.message);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

/**
 * GET /api/cms/customers/:id
 * Get a specific customer
 */
router.get('/customers/:id', async (req, res) => {
    try {
        const inquiry = await inquiryRepository.findById(req.params.id);
        
        if (!inquiry) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Convert inquiry to customer format
        const customer = {
            id: inquiry.inquiryId,
            inquiryId: inquiry.inquiryId,
            fullName: inquiry.name,
            phone: inquiry.phone,
            email: inquiry.email,
            address: inquiry.address || '',
            pregnancyWeek: inquiry.pregnancyWeek || null,
            ultrasoundDate: inquiry.ultrasoundDate || null,
            otherChildren: inquiry.otherChildren || '',
            requestHistory: [{
                request: inquiry.message,
                actualNeed: inquiry.message,
                timestamp: inquiry.timestamp,
                status: inquiry.status
            }],
            communicationHistory: [],
            primaryContact: {
                relationshipType: 'Self',
                name: inquiry.name,
                phone: inquiry.phone,
                email: inquiry.email
            },
            additionalContacts: [],
            firstCallDate: inquiry.timestamp,
            hasNeed: inquiry.isRelevantCustomer === 'relevant' || inquiry.isRelevantCustomer === 'potential',
            familiarWithDoctor: false,
            understandsPricing: false,
            bookedSession: inquiry.status === 'closed',
            bookedCallWithDoctor: false,
            nextFollowUp: null,
            nextFollowUpReason: '',
            callLog: [],
            isRelevantCustomer: inquiry.isRelevantCustomer,
            communicationStatus: inquiry.communicationStatus,
            customerNotes: inquiry.customerNotes,
            notes: inquiry.notes
        };
        
        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error.message);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

/**
 * PATCH /api/cms/customers/:id
 * Update customer information
 */
router.patch('/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // Update the inquiry with new customer data
        const updateData = {
            name: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            pregnancyWeek: req.body.pregnancyWeek,
            ultrasoundDate: req.body.ultrasoundDate,
            otherChildren: req.body.otherChildren,
            isRelevantCustomer: req.body.hasNeed,
            communicationStatus: req.body.communicationStatus,
            customerNotes: req.body.customerNotes,
            notes: req.body.notes
        };
        
        const updatedInquiry = await inquiryRepository.updateById(customerId, updateData);
        
        if (!updatedInquiry) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Convert back to customer format for response
        const updatedCustomer = {
            id: updatedInquiry.inquiryId,
            inquiryId: updatedInquiry.inquiryId,
            fullName: updatedInquiry.name,
            phone: updatedInquiry.phone,
            email: updatedInquiry.email,
            address: updatedInquiry.address || '',
            pregnancyWeek: updatedInquiry.pregnancyWeek || null,
            ultrasoundDate: updatedInquiry.ultrasoundDate || null,
            otherChildren: updatedInquiry.otherChildren || '',
            requestHistory: [{
                request: updatedInquiry.message,
                actualNeed: updatedInquiry.message,
                timestamp: updatedInquiry.timestamp,
                status: updatedInquiry.status
            }],
            communicationHistory: [],
            primaryContact: {
                relationshipType: 'Self',
                name: updatedInquiry.name,
                phone: updatedInquiry.phone,
                email: updatedInquiry.email
            },
            additionalContacts: [],
            firstCallDate: updatedInquiry.timestamp,
            hasNeed: updatedInquiry.isRelevantCustomer === 'relevant' || updatedInquiry.isRelevantCustomer === 'potential',
            familiarWithDoctor: false,
            understandsPricing: false,
            bookedSession: updatedInquiry.status === 'closed',
            bookedCallWithDoctor: false,
            nextFollowUp: null,
            nextFollowUpReason: '',
            callLog: [],
            isRelevantCustomer: updatedInquiry.isRelevantCustomer,
            communicationStatus: updatedInquiry.communicationStatus,
            customerNotes: updatedInquiry.customerNotes,
            notes: updatedInquiry.notes
        };
        
        res.json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error.message);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

module.exports = router;
