// Request Leave Modal - Shared Functionality

let modalOpen = false;
let previousActiveElement = null;
let prefillStartDate = null;
let prefillEndDate = null;
let activeDateInput = null; // Track which date input is active

// Ensure only one modal instance
function ensureSingleModal() {
  const existingModals = document.querySelectorAll('.modal-overlay.active');
  existingModals.forEach(modal => {
    if (modal.id !== 'leaveRequestModal') {
      modal.classList.remove('active');
    }
  });
}

// Open modal
function openLeaveRequestModal(startDate = null, endDate = null) {
  // Ensure only one modal instance
  ensureSingleModal();
  
  const modal = document.getElementById('leaveRequestModal');
  if (!modal) return;
  
  // Allow reopening even if already open (reset form)
  // Remove the check that prevents reopening

  // Store pre-fill dates
  prefillStartDate = startDate;
  prefillEndDate = endDate || startDate;

  // Store the previously active element
  previousActiveElement = document.activeElement;

  // Show modal
  modal.classList.add('active');
  modalOpen = true;
  
  // Lock body scroll
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';

  // Get form inputs
  const startDateInput = document.getElementById('modalStartDate');
  const endDateInput = document.getElementById('modalEndDate');
  const leaveTypeSelect = document.getElementById('modalLeaveType');
  const reasonTextarea = document.getElementById('modalReason');
  
  // Reset form fields
  if (leaveTypeSelect) leaveTypeSelect.value = '';
  if (reasonTextarea) reasonTextarea.value = '';
  
  // Pre-fill dates if provided (from calendar), otherwise clear them
  if (prefillStartDate && prefillEndDate) {
    if (startDateInput && endDateInput) {
      const formatDateForInput = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
      };
      
      startDateInput.value = formatDateForInput(prefillStartDate);
      endDateInput.value = formatDateForInput(prefillEndDate);
      startDateInput.type = 'text'; // Keep as text for display
      endDateInput.type = 'text'; // Keep as text for display
    }
  } else {
    // Clear dates when opened from navbar (no pre-fill)
    if (startDateInput) {
      startDateInput.value = '';
      startDateInput.type = 'text'; // Keep as text for placeholder
    }
    if (endDateInput) {
      endDateInput.value = '';
      endDateInput.type = 'text'; // Keep as text for placeholder
    }
  }
  
  // Trigger validation after setting values (if validation is set up)
  setTimeout(() => {
    const submitBtn = document.getElementById('modalSubmitBtn');
    if (submitBtn && typeof window.validateForm === 'function') {
      window.validateForm();
    }
  }, 100);

  // Focus management
  const firstFocusable = modal.querySelector('input, select, textarea, button');
  if (firstFocusable) {
    setTimeout(() => firstFocusable.focus(), 100);
  }

  // Trap focus inside modal
  trapFocus(modal);
}

// Open modal with specific date (for calendar integration)
function openLeaveRequestModalWithDate(startDate, endDate) {
  openLeaveRequestModal(startDate, endDate);
}

// Export functions globally for use in other scripts
if (typeof window !== 'undefined') {
  window.openLeaveRequestModal = openLeaveRequestModal;
  window.closeLeaveRequestModal = closeLeaveRequestModal;
}

// Close modal
function closeLeaveRequestModal() {
  const modal = document.getElementById('leaveRequestModal');
  if (!modal) return;

  // Hide modal
  modal.classList.remove('active');
  modalOpen = false;
  
  // Unlock body scroll
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';

  // Reset form
  const form = document.getElementById('leaveRequestForm');
  if (form) {
    form.reset();
  }
  
  // Clear pre-fill dates and active input
  prefillStartDate = null;
  prefillEndDate = null;
  activeDateInput = null;

  // Return focus to previous element
  if (previousActiveElement) {
    previousActiveElement.focus();
    previousActiveElement = null;
  }
}

// Trap focus inside modal
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
    if (e.key === 'Escape') {
      closeLeaveRequestModal();
    }
  });
}

// Shared date picker logic for both start and end date inputs
function openDatePicker(input) {
  if (!input) return;
  
  // Set as active input
  activeDateInput = input;
  
  // Convert to date type if needed
  if (input.type !== 'date') {
    // Parse existing value if present (DD/MM/YY format)
    if (input.value && input.value.trim()) {
      const parts = input.value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (year < 100) {
          year += 2000;
        }
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          input.type = 'date';
          const fullYear = date.getFullYear();
          const monthStr = String(date.getMonth() + 1).padStart(2, '0');
          const dayStr = String(date.getDate()).padStart(2, '0');
          input.value = `${fullYear}-${monthStr}-${dayStr}`;
        } else {
          input.type = 'date';
          input.value = '';
        }
      } else {
        input.type = 'date';
        input.value = '';
      }
    } else {
      input.type = 'date';
    }
  }
  
  // Show native date picker with a small delay to ensure type is set
  setTimeout(() => {
    if (input.showPicker && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (error) {
        // Fallback if showPicker fails
        input.focus();
      }
    } else {
      input.focus();
    }
  }, 10);
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.openDatePicker = openDatePicker;
}

// Format date input value as DD/MM/YY
function formatDateInput(input) {
  if (!input || !input.value) {
    input.type = 'text';
    return;
  }
  
  if (input.type === 'date') {
    const date = new Date(input.value);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      input.type = 'text';
      input.value = `${day}/${month}/${year}`;
    } else {
      input.type = 'text';
      input.value = '';
    }
  }
}

// Global validateForm function for modal
let validateForm = null;

// Date input formatting - shared logic for both inputs
function setupDateInputs() {
  const startDateInput = document.getElementById('modalStartDate');
  const endDateInput = document.getElementById('modalEndDate');
  const startDateIcon = startDateInput?.closest('.modal-form-date-wrapper')?.querySelector('.modal-form-date-icon');
  const endDateIcon = endDateInput?.closest('.modal-form-date-wrapper')?.querySelector('.modal-form-date-icon');

  // Ensure inputs start as text type for placeholder to show
  if (startDateInput) startDateInput.type = 'text';
  if (endDateInput) endDateInput.type = 'text';

  // Shared focus handler
  function handleFocus(input) {
    openDatePicker(input);
  }

  // Shared blur handler with end date validation
  function handleBlur(input) {
    // Only format if input has a value and is a date type
    if (input.value && input.type === 'date') {
      formatDateInput(input);
    } else if (!input.value) {
      // If empty, ensure it's text type for placeholder
      input.type = 'text';
    }
    
    // Validate end date is not before start date
    if (input === endDateInput && startDateInput && startDateInput.value) {
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        // Handle both DD/MM/YY and YYYY-MM-DD formats
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length !== 3) return null;
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          return new Date(year, month, day);
        } else if (dateStr.includes('-')) {
          return new Date(dateStr);
        }
        return null;
      };
      
      const startDate = parseDate(startDateInput.value);
      const endDate = parseDate(endDateInput.value);
      
      if (startDate && endDate && endDate < startDate) {
        alert('End date cannot be before start date.');
        endDateInput.value = '';
        endDateInput.type = 'text';
        endDateInput.focus();
      }
    }
  }

  // Shared change handler with validation
  function handleChange(input) {
    if (input.value && input.type === 'date') {
      // Validate end date is not before start date
      if (input === endDateInput && startDateInput && startDateInput.value) {
        const parseStartDate = () => {
          const val = startDateInput.value;
          if (val.includes('/')) {
            const parts = val.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              let year = parseInt(parts[2], 10);
              if (year < 100) year += 2000;
              return new Date(year, month, day);
            }
          }
          return new Date(val);
        };
        
        const startDate = parseStartDate();
        const endDate = new Date(input.value);
        
        if (endDate < startDate) {
          alert('End date cannot be before start date.');
          input.value = '';
          input.type = 'text';
          input.focus();
          return;
        }
      }
      formatDateInput(input);
    }
  }

  // Setup start date input
  if (startDateInput) {
    startDateInput.addEventListener('focus', () => handleFocus(startDateInput));
    startDateInput.addEventListener('blur', () => handleBlur(startDateInput));
    startDateInput.addEventListener('change', () => handleChange(startDateInput));
  }

  // Setup end date input
  if (endDateInput) {
    endDateInput.addEventListener('focus', () => handleFocus(endDateInput));
    endDateInput.addEventListener('blur', () => handleBlur(endDateInput));
    endDateInput.addEventListener('change', () => handleChange(endDateInput));
  }

  // Calendar icon click handlers - open date picker
  if (startDateIcon) {
    startDateIcon.style.pointerEvents = 'auto';
    startDateIcon.style.cursor = 'pointer';
    startDateIcon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (startDateInput) {
        openDatePicker(startDateInput);
      }
    });
  }

  if (endDateIcon) {
    endDateIcon.style.pointerEvents = 'auto';
    endDateIcon.style.cursor = 'pointer';
    endDateIcon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (endDateInput) {
        openDatePicker(endDateInput);
      }
    });
  }
}

// Initialize modal functionality
document.addEventListener('DOMContentLoaded', function() {
  // Setup date inputs
  setupDateInputs();

  // Navbar "Request leave" button - opens modal without date pre-fill
  const requestLeaveNavBtn = document.getElementById('requestLeaveBtn');
  if (requestLeaveNavBtn) {
    requestLeaveNavBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Open modal without pre-filling dates (user chooses manually)
      openLeaveRequestModal();
    });
  }
  
  // Note: Calendar card buttons are handled by calendar.js
  // They call openLeaveRequestModal(selectedDate, selectedDate) to pre-fill dates

  // Close button
  const closeBtn = document.getElementById('modalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLeaveRequestModal);
  }

  // Cancel button
  const cancelBtn = document.getElementById('modalCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeLeaveRequestModal);
  }

  // Form validation and submission
  const form = document.getElementById('leaveRequestForm');
  const submitBtn = document.getElementById('modalSubmitBtn');
  
  if (form && submitBtn) {
    // Validation state
    let formValid = false;
    
    // Parse date helper
    const parseDate = (dateStr) => {
      if (!dateStr || !dateStr.trim()) return null;
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return null;
      return date;
    };
    
    // Validate form function
    function validateForm() {
      const leaveType = document.getElementById('modalLeaveType').value;
      const startDateStr = document.getElementById('modalStartDate').value;
      const endDateStr = document.getElementById('modalEndDate').value;
      const reason = document.getElementById('modalReason').value;
      
      // Check required fields
      if (!leaveType || !startDateStr || !endDateStr) {
        formValid = false;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        return false;
      }
      
      // Parse and validate dates
      const startDate = parseDate(startDateStr);
      const endDate = parseDate(endDateStr);
      
      if (!startDate || !endDate) {
        formValid = false;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        return false;
      }
      
      // Validate end date is not before start date
      if (endDate < startDate) {
        formValid = false;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        return false;
      }
      
      // Form is valid
      formValid = true;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
      return true;
    }
    
    // Real-time validation on field changes
    const leaveTypeSelect = document.getElementById('modalLeaveType');
    const startDateInput = document.getElementById('modalStartDate');
    const endDateInput = document.getElementById('modalEndDate');
    const reasonTextarea = document.getElementById('modalReason');
    
    if (leaveTypeSelect) {
      leaveTypeSelect.addEventListener('change', validateForm);
    }
    if (startDateInput) {
      startDateInput.addEventListener('input', validateForm);
      startDateInput.addEventListener('blur', validateForm);
    }
    if (endDateInput) {
      endDateInput.addEventListener('input', validateForm);
      endDateInput.addEventListener('blur', validateForm);
    }
    if (reasonTextarea) {
      reasonTextarea.addEventListener('input', validateForm);
    }
    
    // Form submission
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validate before submit
      if (!validateForm()) {
        alert('Please fill in all required fields correctly.');
        return;
      }
      
      // Get form values
      const leaveType = leaveTypeSelect.value;
      const startDateStr = startDateInput.value;
      const endDateStr = endDateInput.value;
      const reason = reasonTextarea.value || ''; // Reason is optional

      // Parse dates
      const startDate = parseDate(startDateStr);
      const endDate = parseDate(endDateStr);

      // Double-check validation
      if (!startDate || !endDate || startDate > endDate) {
        alert('Invalid dates. Please check your date inputs.');
        return;
      }

      // Calculate number of days
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Create leave request using state management
      try {
        // Try multiple ways to access createLeaveRequest
        const createLeave = window.createLeaveRequest || (typeof createLeaveRequest !== 'undefined' ? createLeaveRequest : null);
        
        if (typeof createLeave === 'function') {
          // Create the leave request - this will add it to leaveRequests array and notify listeners
          const newLeave = createLeave({
            type: leaveType,
            startDate: startDate,
            endDate: endDate,
            reason: reason.trim(),
            status: 'pending' // New leaves start as pending
          });
          
          // Verify it was created
          if (newLeave && newLeave.id) {
            // Show success message with calculated days
            alert(`Leave request submitted successfully! (${daysDiff} ${daysDiff === 1 ? 'day' : 'days'})`);
            
            // Close modal (this will reset the form)
            closeLeaveRequestModal();
            
            // Explicitly trigger table update to ensure immediate visibility
            // The notifyStateChange() call in createLeaveRequest will also trigger listeners,
            // but we ensure the table updates immediately
            if (typeof window.renderLeaveHistoryTable === 'function') {
              // Small delay to ensure state is saved to localStorage first
              setTimeout(() => {
                window.renderLeaveHistoryTable();
              }, 50);
            }
            
            // Table, calendar, and chart will update automatically via state change listener
            // The notifyStateChange() call in createLeaveRequest will trigger all listeners
            // including the one in leaves.js that calls renderLeaveHistoryTable()
          } else {
            throw new Error('Leave request was not created properly');
          }
        } else {
          console.error('createLeaveRequest function not found. Available functions:', Object.keys(window).filter(k => k.includes('leave') || k.includes('Leave')));
          alert('Error: Leave request functionality is not available. Please refresh the page.');
        }
      } catch (error) {
        console.error('Error creating leave request:', error);
        alert(error.message || 'Failed to create leave request. Please try again.');
      }
    });
    
    // Make validateForm globally accessible
    window.validateForm = validateForm;
    
    // Initial validation state (disabled)
    validateForm();
  }

  // Close modal on backdrop click
  const modal = document.getElementById('leaveRequestModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeLeaveRequestModal();
      }
    });
  }

  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalOpen) {
      closeLeaveRequestModal();
    }
  });
});
