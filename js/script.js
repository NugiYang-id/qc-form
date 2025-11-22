// ============================================
// CONFIGURATION
// ============================================

// IMPORTANT: Replace this URL with your Google Apps Script Web App URL
// Example: 'https://script.google.com/macros/s/AKfycbz.../exec'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYwrRL65hFpUeFb6nmg_QtKbY0zlknYeU_HQk4vC7bEFnQH-N9W679MDhYu1uUwul1Rw/exec';

// ============================================
// INITIALIZATION
// ============================================

// Set today's date as default when page loads
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('prodDate').valueAsDate = new Date();
    
    // Prevent form default submission
    document.getElementById('qcForm').addEventListener('submit', function(e) {
        e.preventDefault();
    });
});

// ============================================
// FORM FUNCTIONS
// ============================================

/**
 * Reset form to initial state
 */
function resetForm() {
    document.getElementById('qcForm').reset();
    document.getElementById('prodDate').valueAsDate = new Date();
    
    Swal.fire({
        icon: 'info',
        title: 'Form Reset',
        text: 'All fields have been cleared.',
        timer: 1500,
        showConfirmButton: false
    });
}

/**
 * Validate expiration date is after production date
 */
document.getElementById('expDate').addEventListener('change', function() {
    const prodDate = new Date(document.getElementById('prodDate').value);
    const expDate = new Date(this.value);
    
    if (expDate <= prodDate) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Date',
            text: 'Expiration date must be after production date!',
            confirmButtonColor: '#667eea'
        });
        this.value = '';
    }
});

// ============================================
// FORM SUBMISSION
// ============================================

/**
 * Submit form data to Google Sheets
 */
function submitForm() {
    const form = document.getElementById('qcForm');
    
    // Check if form is valid
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect form data
    const formData = {
        checkerName: document.getElementById('checkerName').value,
        shift: document.getElementById('shift').value,
        productItem: document.getElementById('productItem').value,
        pCode: document.getElementById('pCode').value,
        eCode: document.getElementById('eCode').value,
        prodDate: document.getElementById('prodDate').value,
        expDate: document.getElementById('expDate').value,
        timestamp: new Date().toISOString()
    };

    // Show loading spinner
    document.getElementById('loadingSpinner').classList.add('active');

    // Send data to Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(() => {
        // Hide loading spinner
        document.getElementById('loadingSpinner').classList.remove('active');
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Data has been submitted successfully!',
            confirmButtonColor: '#667eea',
            confirmButtonText: 'OK'
        }).then(() => {
            // Reset form after successful submission
            resetFormSilent();
        });
    })
    .catch((error) => {
        // Hide loading spinner
        document.getElementById('loadingSpinner').classList.remove('active');
        
        // Show error message
        Swal.fire({
            icon: 'error',
            title: 'Submission Error',
            html: 'Failed to submit data. Please check:<br>' +
                  '• Your internet connection<br>' +
                  '• Google Apps Script URL is correct<br>' +
                  '• Google Apps Script is deployed properly',
            confirmButtonColor: '#667eea'
        });
        
        console.error('Submission Error:', error);
    });
}

/**
 * Reset form without showing notification (used after successful submission)
 */
function resetFormSilent() {
    document.getElementById('qcForm').reset();
    document.getElementById('prodDate').valueAsDate = new Date();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Log form data to console (for debugging)
 */
function logFormData() {
    const formData = {
        checkerName: document.getElementById('checkerName').value,
        shift: document.getElementById('shift').value,
        productItem: document.getElementById('productItem').value,
        pCode: document.getElementById('pCode').value,
        eCode: document.getElementById('eCode').value,
        prodDate: document.getElementById('prodDate').value,
        expDate: document.getElementById('expDate').value
    };
    
    console.log('Form Data:', formData);
}

// ============================================
// DEBUG MODE
// ============================================

// Uncomment the line below to enable console logging
// console.log('QC Form Script Loaded Successfully');