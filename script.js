/**
 * Landing Page JavaScript
 * Handles form interactions, animations, and inquiry submission
 */

// API Configuration
const API_BASE_URL = 'http://localhost:3003/api';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollAnimations();
    initInquiryForm();
    loadServices();
});

/**
 * Navigation functionality
 */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Scroll animations using Intersection Observer
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.about-content, .about-image, .service-card, .testimonial-card, .booking-info, .booking-form-container'
    );

    animatedElements.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));

    // Staggered animation for cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.15}s`;
    });
}

/**
 * Load services from API for the form dropdown
 */
async function loadServices() {
    const serviceSelect = document.getElementById('service');
    
    try {
        const response = await fetch(`${API_BASE_URL}/inquiry/services`);
        
        if (!response.ok) {
            throw new Error('Could not load services');
        }

        const data = await response.json();
        
        if (data.services && data.services.length > 0) {
            // Clear existing options except the first placeholder
            serviceSelect.innerHTML = '<option value="">Select an option</option>';
            
            // Add services from API
            data.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                serviceSelect.appendChild(option);
            });
            
            // Add default options
            const defaultOptions = [
                { value: 'question', text: 'General Question' },
                { value: 'other', text: 'Other' }
            ];
            
            defaultOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                serviceSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.log('Using default services');
        // Keep the default HTML options if API fails
    }
}

/**
 * Inquiry form functionality
 */
function initInquiryForm() {
    const form = document.getElementById('inquiry-form');
    const formSuccess = document.getElementById('form-success');

    if (!form) return;

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm(form)) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            
            const inquiryData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                service: formData.get('service'),
                preferredTime: formData.get('preferred-time'),
                message: formData.get('message')
            };

            const response = await fetch(`${API_BASE_URL}/inquiry/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(inquiryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Submission failed');
            }

            // Success!
            showSuccessMessage(form, formSuccess, result.inquiry);

        } catch (error) {
            console.error('Submission error:', error);
            alert(`Failed to send request: ${error.message}\n\nPlease try again or call us directly.`);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            this.classList.remove('error');
            this.style.borderColor = '';
            const errorMsg = this.parentElement.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    });
}

/**
 * Form validation
 */
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // Validate email format if provided
    const emailField = form.querySelector('#email');
    if (emailField && emailField.value && !isValidEmail(emailField.value)) {
        showFieldError(emailField, 'Please enter a valid email address');
        isValid = false;
    }

    // Validate phone format
    const phoneField = form.querySelector('#phone');
    if (phoneField && phoneField.value) {
        const phoneClean = phoneField.value.replace(/[\s\-\(\)]/g, '');
        if (phoneClean.length < 9) {
            showFieldError(phoneField, 'Please enter a valid phone number');
            isValid = false;
        }
    }

    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    
    field.classList.remove('error');
    field.style.borderColor = '';
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }

    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    field.style.borderColor = '#e74c3c';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.85rem; margin-top: 4px;';
    field.parentElement.appendChild(errorDiv);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show success message after form submission
 */
function showSuccessMessage(form, successDiv, inquiry) {
    form.style.opacity = '0';
    form.style.transform = 'scale(0.95)';
    form.style.transition = 'all 0.3s ease';

    setTimeout(() => {
        form.style.display = 'none';
        
        successDiv.innerHTML = `
            <div class="success-icon">✓</div>
            <h3>Request Received!</h3>
            <p>Thank you, <strong>${inquiry.name}</strong>!</p>
            <p>Our team will call you back soon.</p>
            <p class="confirmation-note" style="margin-top: 1rem; font-size: 0.9rem; color: #6b6b6b;">
                Reference: ${inquiry.inquiryId}
            </p>
        `;
        
        successDiv.classList.remove('hidden');
        successDiv.style.animation = 'fadeInUp 0.5s ease forwards';
    }, 300);
}
