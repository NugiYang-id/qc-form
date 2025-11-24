// ============================================
// CONFIGURATION
// ============================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYwrRL65hFpUeFb6nmg_QtKbY0zlknYeU_HQk4vC7bEFnQH-N9W679MDhYu1uUwul1Rw/exec';

// Product Standards Database
const PRODUCT_STANDARDS = {
    'Product A': {
        box: { pCode: 'PA-BOX-001', content: '24 pcs', color: 'Blue' },
        sachet: { seal: '0%', pCode: 'PA-SCH-001' }
    },
    'Product B': {
        box: { pCode: 'PB-BOX-002', content: '12 pcs', color: 'Red' },
        sachet: { seal: '0%', pCode: 'PB-SCH-002' }
    },
    'Product C': {
        box: { pCode: 'PC-BOX-003', content: '36 pcs', color: 'Green' },
        sachet: { seal: '0%', pCode: 'PC-SCH-003' }
    },
    'Product D': {
        box: { pCode: 'PD-BOX-004', content: '48 pcs', color: 'Yellow' },
        sachet: { seal: '0%', pCode: 'PD-SCH-004' }
    },
    'Product E': {
        box: { pCode: 'PE-BOX-005', content: '18 pcs', color: 'Orange' },
        sachet: { seal: '0%', pCode: 'PE-SCH-005' }
    }
};

let palletCount = 0;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('checkDate').valueAsDate = new Date();
    
    // Add first pallet row automatically
    addPalletRow();
    
    // Prevent form default submission
    document.getElementById('qcForm').addEventListener('submit', function(e) {
        e.preventDefault();
    });
});

// ============================================
// POPULATE STANDARDS
// ============================================

function populateStandards() {
    const product = document.getElementById('productItem').value;
    
    if (product && PRODUCT_STANDARDS[product]) {
        const std = PRODUCT_STANDARDS[product];
        
        // Populate Display Box standards
        document.getElementById('stdBoxPCode').value = std.box.pCode;
        document.getElementById('stdBoxContent').value = std.box.content;
        document.getElementById('stdBoxColor').value = std.box.color;
        
        // Populate Bag/Sachet standards
        document.getElementById('stdSachetSeal').value = std.sachet.seal;
        document.getElementById('stdSachetPCode').value = std.sachet.pCode;
    } else {
        // Clear standards if no product selected
        document.getElementById('stdBoxPCode').value = '';
        document.getElementById('stdBoxContent').value = '';
        document.getElementById('stdBoxColor').value = '';
        document.getElementById('stdSachetSeal').value = '0%';
        document.getElementById('stdSachetPCode').value = '';
    }
}

// ============================================
// PALLET ROW MANAGEMENT
// ============================================

function addPalletRow() {
    palletCount++;
    const tbody = document.getElementById('checkingTableBody');
    
    const row = document.createElement('tr');
    row.id = `palletRow${palletCount}`;
    row.innerHTML = `
        <td class="pallet-number">${palletCount}</td>
        <td>
            <input type="time" class="form-control" id="time${palletCount}" required>
        </td>
        <td>
            <input type="number" class="form-control" id="totalCheck${palletCount}" 
                   min="1" placeholder="qty" required onchange="calculatePercentOK(${palletCount})">
        </td>
        <td>
            <select class="form-select" id="boxPCode${palletCount}" required onchange="calculatePercentOK(${palletCount})">
                <option value="">--</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
            </select>
        </td>
        <td>
            <select class="form-select" id="boxContent${palletCount}" required onchange="calculatePercentOK(${palletCount})">
                <option value="">--</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
            </select>
        </td>
        <td>
            <select class="form-select" id="boxColor${palletCount}" required onchange="calculatePercentOK(${palletCount})">
                <option value="">--</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
            </select>
        </td>
        <td>
            <select class="form-select" id="sachetSeal${palletCount}" required onchange="calculatePercentOK(${palletCount})">
                <option value="">--</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
            </select>
        </td>
        <td>
            <select class="form-select" id="sachetPCode${palletCount}" required onchange="calculatePercentOK(${palletCount})">
                <option value="">--</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
            </select>
        </td>
        <td>
            <input type="text" class="form-control percent-ok" id="percentOK${palletCount}" readonly>
        </td>
        <td>
            <input type="text" class="form-control" id="notes${palletCount}" placeholder="Notes">
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-danger btn-sm" onclick="removePalletRow(${palletCount})" 
                    ${palletCount === 1 ? 'disabled' : ''}>
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Set current time as default
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    document.getElementById(`time${palletCount}`).value = timeString;
}

function removePalletRow(rowId) {
    const row = document.getElementById(`palletRow${rowId}`);
    if (row) {
        Swal.fire({
            title: 'Remove this pallet check?',
            text: 'This action cannot be undone',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, remove it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                row.remove();
                Swal.fire({
                    icon: 'success',
                    title: 'Removed!',
                    text: 'Pallet check has been removed.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }
}

// ============================================
// CALCULATE %OK
// ============================================

function calculatePercentOK(rowId) {
    const totalCheck = parseInt(document.getElementById(`totalCheck${rowId}`).value) || 0;
    
    if (totalCheck === 0) {
        document.getElementById(`percentOK${rowId}`).value = '';
        return;
    }
    
    // Count OK values (5 checks total: boxPCode, boxContent, boxColor, sachetSeal, sachetPCode)
    let okCount = 0;
    const checks = [
        `boxPCode${rowId}`,
        `boxContent${rowId}`,
        `boxColor${rowId}`,
        `sachetSeal${rowId}`,
        `sachetPCode${rowId}`
    ];
    
    checks.forEach(checkId => {
        const value = document.getElementById(checkId).value;
        if (value === 'OK') okCount++;
    });
    
    // Calculate percentage: (OK items / total items checked) * 100
    // Assuming each check represents equal weight
    const percentOK = ((okCount / checks.length) * 100).toFixed(1);
    document.getElementById(`percentOK${rowId}`).value = percentOK + '%';
}

// ============================================
// FORM FUNCTIONS
// ============================================

function resetForm() {
    Swal.fire({
        title: 'Reset entire form?',
        text: 'All data will be cleared',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reset it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('qcForm').reset();
            document.getElementById('checkDate').valueAsDate = new Date();
            
            // Clear all pallet rows
            document.getElementById('checkingTableBody').innerHTML = '';
            palletCount = 0;
            
            // Add first row
            addPalletRow();
            
            // Clear standards
            populateStandards();
            
            Swal.fire({
                icon: 'info',
                title: 'Form Reset',
                text: 'All fields have been cleared.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// ============================================
// FORM SUBMISSION
// ============================================

function submitForm() {
    const form = document.getElementById('qcForm');
    
    // Check if form is valid
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Check if at least one pallet row exists
    const rows = document.getElementById('checkingTableBody').querySelectorAll('tr');
    if (rows.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No Pallet Checks',
            text: 'Please add at least one pallet check before submitting.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    // Collect Section 1 data
    const formData = {
        formNumber: document.getElementById('formNumber').value,
        checkDate: document.getElementById('checkDate').value,
        shift: document.getElementById('shift').value,
        productItem: document.getElementById('productItem').value,
        line: document.getElementById('line').value,
        group: document.getElementById('group').value,
        
        // Standards
        stdBoxPCode: document.getElementById('stdBoxPCode').value,
        stdBoxContent: document.getElementById('stdBoxContent').value,
        stdBoxColor: document.getElementById('stdBoxColor').value,
        stdSachetSeal: document.getElementById('stdSachetSeal').value,
        stdSachetPCode: document.getElementById('stdSachetPCode').value,
        
        // Approval
        qcPersonnel: document.getElementById('qcPersonnel').value,
        shiftSupervisor: document.getElementById('shiftSupervisor').value,
        supervisor: document.getElementById('supervisor').value || '-',
        sectionManager: document.getElementById('sectionManager').value || '-',
        
        // Pallet checks
        palletChecks: []
    };
    
    // Collect all pallet check data
    rows.forEach((row, index) => {
        const rowId = row.id.replace('palletRow', '');
        const palletData = {
            noPallet: index + 1,
            time: document.getElementById(`time${rowId}`).value,
            totalCheck: document.getElementById(`totalCheck${rowId}`).value,
            boxPCode: document.getElementById(`boxPCode${rowId}`).value,
            boxContent: document.getElementById(`boxContent${rowId}`).value,
            boxColor: document.getElementById(`boxColor${rowId}`).value,
            sachetSeal: document.getElementById(`sachetSeal${rowId}`).value,
            sachetPCode: document.getElementById(`sachetPCode${rowId}`).value,
            percentOK: document.getElementById(`percentOK${rowId}`).value,
            notes: document.getElementById(`notes${rowId}`).value || '-'
        };
        formData.palletChecks.push(palletData);
    });
    
    // Show loading spinner
    document.getElementById('loadingSpinner').classList.add('active');
    
    // Send data to Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
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
            html: `Form <strong>${formData.formNumber}</strong> has been submitted successfully!`,
            confirmButtonColor: '#667eea',
            confirmButtonText: 'OK'
        }).then(() => {
            // Ask if user wants to create another form
            Swal.fire({
                title: 'Create another form?',
                text: 'Do you want to submit another inspection form?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, new form',
                cancelButtonText: 'No, I\'m done'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Reset for new form
                    document.getElementById('qcForm').reset();
                    document.getElementById('checkDate').valueAsDate = new Date();
                    document.getElementById('checkingTableBody').innerHTML = '';
                    palletCount = 0;
                    addPalletRow();
                    populateStandards();
                }
            });
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

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Auto-save to localStorage (optional - for recovery)
function autoSave() {
    // Can implement auto-save to localStorage if needed
    console.log('Auto-save feature can be implemented here');
}

// Export data as JSON (for debugging)
function exportFormData() {
    // Can implement export feature if needed
    console.log('Export feature can be implemented here');
}