// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS
    (function() {
        try {
            emailjs.init("oXABLux_QLfki5QeH");
            console.log("EmailJS initialized successfully");
        } catch (error) {
            console.error("EmailJS initialization failed:", error);
        }
    })();

    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return; // Exit if form not found

    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (!submitButton) return; // Exit if submit button not found

    const originalButtonText = submitButton.innerHTML;

    // Form validation
    function validateForm() {
        let isValid = true;
        const formInputs = contactForm.querySelectorAll('input, textarea');
        
        formInputs.forEach(input => {
            if (!input.checkValidity()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Show success message
    function showSuccessMessage() {
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success alert-dismissible fade show';
        successAlert.innerHTML = `
            <strong>Success!</strong> Your message has been sent successfully.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        contactForm.insertAdjacentElement('beforebegin', successAlert);
    }

    // Show error message
    function showErrorMessage(message) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show';
        errorAlert.innerHTML = `
            <strong>Error!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        contactForm.insertAdjacentElement('beforebegin', errorAlert);
    }

    // Handle form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            showErrorMessage('Please fill in all required fields correctly.');
            return;
        }

        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

        try {
            // Get form data
            const formData = {
                to_name: "NTC Support",
                from_name: document.getElementById('Name').value,
                from_email: document.getElementById('Email').value,
                phone_number: document.getElementById('Phone').value,
                subject: document.getElementById('Subject').value,
                message: document.getElementById('Message').value,
                reply_to: document.getElementById('Email').value
            };

            // Log the form data for debugging
            console.log("Sending form data:", formData);

            // Send email using EmailJS
            const response = await emailjs.send(
                "service_u8bilkm",
                "template_hx43dic",
                formData
            );

            console.log("EmailJS response:", response);

            if (response.status === 200) {
                // Show success message
                showSuccessMessage();
                // Reset form
                contactForm.reset();
                // Remove validation classes
                contactForm.querySelectorAll('.is-invalid').forEach(el => {
                    el.classList.remove('is-invalid');
                });
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            let errorMessage = 'Failed to send message. ';
            
            // Add more specific error messages based on the error type
            if (error.status === 422) {
                errorMessage += 'Please check your email address and try again.';
            } else if (error.status === 429) {
                errorMessage += 'Too many requests. Please try again later.';
            } else {
                errorMessage += error.text || 'Please try again or contact us directly.';
            }
            
            showErrorMessage(errorMessage);
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

    // Real-time validation
    contactForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', function() {
            if (this.checkValidity()) {
                this.classList.remove('is-invalid');
            }
        });
    });

    // Phone number validation
    const phoneInput = document.getElementById('Phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove any non-digit characters
            this.value = this.value.replace(/\D/g, '');
            
            // Format phone number
            if (this.value.length > 0) {
                this.value = this.value.match(/.{1,3}/g).join('-');
            }
        });
    }

    // Email validation
    const emailInput = document.getElementById('Email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.value)) {
                this.setCustomValidity('Please enter a valid email address');
            } else {
                this.setCustomValidity('');
            }
        });
    }
}); 