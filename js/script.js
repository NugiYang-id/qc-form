// ============================================
// CONFIGURATION
// ============================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYwrRL65hFpUeFb6nmg_QtKbY0zlknYeU_HQk4vC7bEFnQH-N9W679MDhYu1uUwul1Rw/exec';

// ============================================
// STANDARD MATRIX (Loaded from Google Sheets)
// ============================================

let STANDARD_MATRIX = {};
let palletCount = 0;
let selectedProduct = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Show loading indicator
    showLoading('Loading product matrix...');
    
    // Load product matrix from Google Sheets
    loadProductMatrix();
    
    // Set today's date as default
    document.getElementById('prodDate').valueAsDate = new Date();
    
    // Add first pallet row automatically
    addPalletRow();
    
    // Prevent form default submission
    document.getElementById('qcForm').addEventListener('submit', function(e) {
        e.preventDefault();
    });
    
    // Add date validation listeners
    setupDateValidation();
});

// ============================================
// LOAD PRODUCT MATRIX FROM GOOGLE SHEETS
// ============================================

function loadProductMatrix() {
    fetch(GOOGLE_SCRIPT_URL + '?action=getMatrix')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                STANDARD_MATRIX = data.matrix;
                
                // Populate product dropdown
                populateProductDropdown();
                
                // Hide loading
                hideLoading();
                
                // Show success message
                console.log(`✓ Loaded ${data.totalProducts} products from matrix`);
                
            } else {
                throw new Error(data.message || 'Failed to load product matrix');
            }
        })
        .catch(error => {
            console.error('Error loading product matrix:', error);
            hideLoading();
            
            // Show error and use fallback data
            Swal.fire({
                icon: 'warning',
                title: 'Could not load product matrix',
                html: 'Using default products. Please check your internet connection or contact IT support.<br><br>' +
                      '<small>Error: ' + error.message + '</small>',
                confirmButtonColor: '#667eea'
            }).then(() => {
                // Use fallback sample data
                useFallbackMatrix();
                populateProductDropdown();
            });
        });
}

function useFallbackMatrix() {
    // Fallback data in case Google Sheets is unavailable
    STANDARD_MATRIX = {
        'Candy Apple 50g': {
            itemCode: 'CA-50G',
            pcsPerBag: 24,
            shelfLifeDays: 365,
            lines: ['Line 1', 'Line 2', 'Line 3'],
            box: { pCode: 'CA50-BOX-001', content: '24 pcs', color: 'Red' },
            sachet: { seal: '0%', pCode: 'CA50-SCH-001' }
        },
        'Mint Fresh 25g': {
            itemCode: 'MF-25G',
            pcsPerBag: 48,
            shelfLifeDays: 730,
            lines: ['Line 1', 'Line 2', 'Line 3', 'Line 4'],
            box: { pCode: 'MF25-BOX-005', content: '48 pcs', color: 'Green' },
            sachet: { seal: '0%', pCode: 'MF25-SCH-005' }
        }
    };
}

function showLoading(message) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

// ============================================
// REFRESH PRODUCT MATRIX
// ============================================

function refreshProductMatrix() {
    Swal.fire({
        title: 'Refresh Product Matrix?',
        text: 'This will reload all products from the Google Sheet.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, refresh',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoading('Reloading products...');
            loadProductMatrix();
        }
    });
}

// ============================================
// POPULATE DROPDOWNS FROM STANDARD MATRIX
// ============================================

function populateProductDropdown() {
    const productSelect = document.getElementById('productItem');
    productSelect.innerHTML = '<option value="">-- Select Product --</option>';
    
    // Add products from standard matrix
    Object.keys(STANDARD_MATRIX).forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productSelect.appendChild(option);
    });
}

function updateLineDropdown(selectedProduct) {
    const lineInput = document.getElementById('line');
    
    if (selectedProduct && STANDARD_MATRIX[selectedProduct]) {
        const product = STANDARD_MATRIX[selectedProduct];
        
        // Convert input to datalist for suggestions
        const existingDatalist = document.getElementById('lineDatalist');
        if (existingDatalist) {
            existingDatalist.remove();
        }
        
        const datalist = document.createElement('datalist');
        datalist.id = 'lineDatalist';
        
        product.lines.forEach(line => {
            const option = document.createElement('option');
            option.value = line;
            datalist.appendChild(option);
        });
        
        lineInput.setAttribute('list', 'lineDatalist');
        lineInput.parentNode.appendChild(datalist);
        
        // Show available lines info
        const linesText = product.lines.join(', ');
        lineInput.placeholder = `Available: ${linesText}`;
    } else {
        lineInput.removeAttribute('list');
        lineInput.placeholder = 'e.g., Line 1, Machine A';
    }
}

// ============================================
// POPULATE STANDARDS & VALIDATE DATES
// ============================================

function populateStandards() {
    const product = document.getElementById('productItem').value;
    selectedProduct = product;
    
    if (product && STANDARD_MATRIX[product]) {
        const std = STANDARD_MATRIX[product];
        
        // Populate Display Box standards
        document.getElementById('stdBoxPCode').value = std.box.pCode;
        document.getElementById('stdBoxContent').value = std.box.content;
        document.getElementById('stdBoxColor').value = std.box.color;
        
        // Populate Bag/Sachet standards
        document.getElementById('stdSachetSeal').value = std.sachet.seal;
        document.getElementById('stdSachetPCode').value = std.sachet.pCode;
        
        // Update line dropdown with available lines
        updateLineDropdown(product);
        
        // Show product info alert
        showProductInfo(product, std);
        
        // Validate dates if already filled
        validateDates();
        
    } else {
        // Clear standards if no product selected
        document.getElementById('stdBoxPCode').value = '';
        document.getElementById('stdBoxContent').value = '';
        document.getElementById('stdBoxColor').value = '';
        document.getElementById('stdSachetSeal').value = '0%';
        document.getElementById('stdSachetPCode').value = '';
        
        // Clear line suggestions
        updateLineDropdown(null);
        
        selectedProduct = null;
    }
}

function showProductInfo(product, std) {
    const shelfLifeMonths = Math.floor(std.shelfLifeDays / 30);
    
    Swal.fire({
        icon: 'info',
        title: 'Product Information',
        html: `
            <div style="text-align: left; padding: 10px;">
                <table style="width: 100%; font-size: 14px;">
                    <tr>
                        <td style="padding: 8px;"><strong>Product:</strong></td>
                        <td style="padding: 8px;">${product}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>Item Code:</strong></td>
                        <td style="padding: 8px;">${std.itemCode}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>Pcs/Bag:</strong></td>
                        <td style="padding: 8px;">${std.pcsPerBag} pieces</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>Shelf Life:</strong></td>
                        <td style="padding: 8px; color: #dc3545; font-weight: bold;">${std.shelfLifeDays} days (${shelfLifeMonths} months)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>Available Lines:</strong></td>
                        <td style="padding: 8px;">${std.lines.join(', ')}</td>
                    </tr>
                </table>
                <hr style="margin: 15px 0;">
                <p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 13px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Important:</strong> Please ensure Production Date and Expiration Date match the shelf life of <strong>${std.shelfLifeDays} days</strong>.
                </p>
            </div>
        `,
        confirmButtonColor: '#667eea',
        confirmButtonText: 'Got it!',
        width: '600px'
    });
}

// ============================================
// DATE VALIDATION
// ============================================

function setupDateValidation() {
    document.getElementById('prodDate').addEventListener('change', validateDates);
    document.getElementById('expDate').addEventListener('change', validateDates);
}

function validateDates() {
    const product = document.getElementById('productItem').value;
    const prodDateInput = document.getElementById('prodDate');
    const expDateInput = document.getElementById('expDate');
    
    if (!product || !STANDARD_MATRIX[product]) return;
    if (!prodDateInput.value || !expDateInput.value) return;
    
    const prodDate = new Date(prodDateInput.value);
    const expDate = new Date(expDateInput.value);
    const shelfLifeDays = STANDARD_MATRIX[product].shelfLifeDays;
    
    // Calculate expected expiration date
    const expectedExpDate = new Date(prodDate);
    expectedExpDate.setDate(expectedExpDate.getDate() + shelfLifeDays);
    
    // Calculate difference in days
    const diffTime = expDate - prodDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if dates are valid
    if (expDate <= prodDate) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Date Range',
            text: 'Expiration date must be after production date!',
            confirmButtonColor: '#667eea'
        });
        expDateInput.value = '';
        return;
    }
    
    // Check if shelf life matches
    if (diffDays !== shelfLifeDays) {
        const expectedExpDateStr = expectedExpDate.toISOString().split('T')[0];
        
        Swal.fire({
            icon: 'warning',
            title: 'Shelf Life Mismatch!',
            html: `
                <div style="text-align: left; padding: 10px;">
                    <p><strong>Product:</strong> ${product}</p>
                    <p><strong>Standard Shelf Life:</strong> <span style="color: #dc3545; font-weight: bold;">${shelfLifeDays} days</span></p>
                    <hr>
                    <p><strong>Your Input:</strong></p>
                    <ul>
                        <li>Production Date: ${prodDateInput.value}</li>
                        <li>Expiration Date: ${expDateInput.value}</li>
                        <li>Calculated Shelf Life: <span style="color: ${diffDays === shelfLifeDays ? 'green' : 'red'}; font-weight: bold;">${diffDays} days</span></li>
                    </ul>
                    <hr>
                    <p style="background: #d1ecf1; padding: 10px; border-radius: 5px; color: #0c5460;">
                        <i class="fas fa-info-circle"></i> <strong>Expected Expiration Date:</strong><br>
                        <span style="font-size: 18px; font-weight: bold;">${expectedExpDateStr}</span>
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#667eea',
            confirmButtonText: 'Use Expected Date',
            cancelButtonText: 'Keep My Date',
            width: '600px'
        }).then((result) => {
            if (result.isConfirmed) {
                // Auto-correct to expected date
                expDateInput.value = expectedExpDateStr;
                Swal.fire({
                    icon: 'success',
                    title: 'Date Corrected',
                    text: 'Expiration date has been set to match shelf life.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    } else {
        // Dates are correct, show success
        Swal.fire({
            icon: 'success',
            title: 'Dates Validated!',
            html: `
                <p>Production and expiration dates match the shelf life.</p>
                <p><strong>Shelf Life:</strong> ${shelfLifeDays} days ✓</p>
            `,
            timer: 2000,
            showConfirmButton: false
        });
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
        <td>
            <input type="number" class="form-control" id="noPallet${palletCount}" 
                   min="1" placeholder="#" value="${palletCount}" required>
        </td>
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
            <textarea class="form-control" id="notes${palletCount}" rows="2" placeholder="Notes..."></textarea>
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

function generateFormNumber(formData) {
    // Format: XXX/AREA/MONTH/YEAR
    // XXX = sequential number (we'll use timestamp-based)
    // AREA = from line/machine (default PG for Packing)
    // MONTH = Roman numeral
    // YEAR = current year
    
    const now = new Date();
    const year = now.getFullYear();
    
    // Convert month to Roman numerals
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const month = monthRoman[now.getMonth()];
    
    // Generate sequential number from timestamp (last 3 digits)
    const timestamp = now.getTime();
    const seqNumber = String(timestamp).slice(-3);
    
    // Extract area from line (or default to PG)
    let area = 'PG'; // Default: Packing General
    if (formData.line) {
        // If line contains number, use it (e.g., "Line 1" -> "L1")
        const lineMatch = formData.line.match(/\d+/);
        if (lineMatch) {
            area = 'L' + lineMatch[0];
        }
    }
    
    // Format: 123/PG/XI/2025
    return `${seqNumber}/${area}/${month}/${year}`;
}

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
    
    // Collect Section 1 data (without formNumber yet)
    const formData = {
        checkDate: document.getElementById('checkDate').value,
        prodDate: document.getElementById('prodDate').value,
        expDate: document.getElementById('expDate').value,
        shift: document.getElementById('shift').value,
        productItem: document.getElementById('productItem').value,
        line: document.getElementById('line').value,
        group: document.getElementById('group').value,
        
        // Add matrix data
        itemCode: selectedProduct && STANDARD_MATRIX[selectedProduct] ? STANDARD_MATRIX[selectedProduct].itemCode : '',
        shelfLifeDays: selectedProduct && STANDARD_MATRIX[selectedProduct] ? STANDARD_MATRIX[selectedProduct].shelfLifeDays : '',
        pcsPerBag: selectedProduct && STANDARD_MATRIX[selectedProduct] ? STANDARD_MATRIX[selectedProduct].pcsPerBag : '',
        
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
    
    // Generate form number automatically
    formData.formNumber = generateFormNumber(formData);
    
    // Collect all pallet check data
    rows.forEach((row) => {
        const rowId = row.id.replace('palletRow', '');
        const palletData = {
            noPallet: document.getElementById(`noPallet${rowId}`).value,
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
        
        // Show success message with generated form number
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            html: `<div style="text-align: left;">
                    <p><strong>Form has been submitted successfully!</strong></p>
                    <hr>
                    <p><strong>Form Number:</strong> <span style="color: #667eea; font-size: 20px; font-weight: bold;">${formData.formNumber}</span></p>
                    <p><strong>Date:</strong> ${formData.checkDate}</p>
                    <p><strong>Product:</strong> ${formData.productItem}</p>
                    <p><strong>Total Pallets Checked:</strong> ${formData.palletChecks.length}</p>
                    <p><strong>QC Personnel:</strong> ${formData.qcPersonnel}</p>
                   </div>`,
            confirmButtonColor: '#667eea',
            confirmButtonText: 'OK',
            width: '600px'
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