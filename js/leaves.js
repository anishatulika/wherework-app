// Leaves Screen JavaScript

// Format date for display (e.g., "23 Oct 2025")
function formatDateForDisplay(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Get leave history data from state or fallback
function getLeaveHistoryData() {
  if (typeof getLeaveRequests === 'function') {
    const requests = getLeaveRequests();
    return requests.map(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Map leave type to standardized display name
      // All annual/casual/flexi types map to "Casual"
      const typeMap = {
        'annual': 'Casual',
        'sick': 'Sick',
        'casual': 'Casual',
        'flexi': 'Casual'
      };
      
      // Map status to display name
      const statusMap = {
        'approved': 'Approved',
        'pending': 'Pending',
        'rejected': 'Rejected'
      };
      
      return {
        leaveType: typeMap[leave.type] || leave.type,
        startDate: startDate,
        endDate: endDate,
        numDays: `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`,
        status: statusMap[leave.status] || leave.status
      };
    }).sort((a, b) => b.startDate - a.startDate); // Sort by date, newest first
  }
  
  return [];
}

// Global filter and pagination state
let currentFilter = 'All';
let currentPage = 1;
let itemsPerPage = 10;

// Update leave balances from real data
function updateLeaveBalances() {
  if (typeof getLeaveBalances !== 'function') return;
  
  const balances = getLeaveBalances();
  
  // Update Fixed leave
  const fixedUsed = document.getElementById('fixed-used');
  const fixedRemaining = document.getElementById('fixed-remaining');
  const fixedTotal = document.getElementById('fixed-total');
  if (fixedUsed) fixedUsed.textContent = `${balances.fixed.used} ${balances.fixed.used === 1 ? 'day' : 'days'}`;
  if (fixedRemaining) fixedRemaining.textContent = `${balances.fixed.remaining} ${balances.fixed.remaining === 1 ? 'day' : 'days'}`;
  if (fixedTotal) fixedTotal.textContent = `${balances.fixed.total} ${balances.fixed.total === 1 ? 'day' : 'days'}`;
  
  // Update Flexi leave
  const flexiUsed = document.getElementById('flexi-used');
  const flexiRemaining = document.getElementById('flexi-remaining');
  const flexiTotal = document.getElementById('flexi-total');
  if (flexiUsed) flexiUsed.textContent = `${balances.flexi.used} ${balances.flexi.used === 1 ? 'day' : 'days'}`;
  if (flexiRemaining) flexiRemaining.textContent = `${balances.flexi.remaining} ${balances.flexi.remaining === 1 ? 'day' : 'days'}`;
  if (flexiTotal) flexiTotal.textContent = `${balances.flexi.total} ${balances.flexi.total === 1 ? 'day' : 'days'}`;
  
  // Update Annual leave
  const annualUsed = document.getElementById('annual-used');
  const annualRemaining = document.getElementById('annual-remaining');
  const annualTotal = document.getElementById('annual-total');
  if (annualUsed) annualUsed.textContent = `${balances.annual.used} ${balances.annual.used === 1 ? 'day' : 'days'}`;
  if (annualRemaining) annualRemaining.textContent = `${balances.annual.remaining} ${balances.annual.remaining === 1 ? 'day' : 'days'}`;
  if (annualTotal) annualTotal.textContent = `${balances.annual.total} ${balances.annual.total === 1 ? 'day' : 'days'}`;
  
  // Update Sick leave
  const sickUsed = document.getElementById('sick-used');
  const sickRemaining = document.getElementById('sick-remaining');
  const sickTotal = document.getElementById('sick-total');
  if (sickUsed) sickUsed.textContent = `${balances.sick.used} ${balances.sick.used === 1 ? 'day' : 'days'}`;
  if (sickRemaining) sickRemaining.textContent = `${balances.sick.remaining} ${balances.sick.remaining === 1 ? 'day' : 'days'}`;
  if (sickTotal) sickTotal.textContent = `${balances.sick.total} ${balances.sick.total === 1 ? 'day' : 'days'}`;
  
  // Update progress bars
  updateLeaveProgressBars(balances);
}

// Update progress bars for leave balances
function updateLeaveProgressBars(balances) {
  const progressBars = document.querySelectorAll('.leave-progress-bar .progress-bar-fill');
  progressBars.forEach(bar => {
    const card = bar.closest('.leave-balance-card');
    if (!card) return;
    
    const title = card.querySelector('.leave-type-title')?.textContent?.trim();
    let percentage = 0;
    
    if (title === 'Fixed') {
      percentage = balances.fixed.total > 0 ? (balances.fixed.used / balances.fixed.total) * 100 : 0;
    } else if (title === 'Flexi') {
      percentage = balances.flexi.total > 0 ? (balances.flexi.used / balances.flexi.total) * 100 : 0;
    } else if (title === 'Annual') {
      percentage = balances.annual.total > 0 ? (balances.annual.used / balances.annual.total) * 100 : 0;
    } else if (title === 'Sick') {
      percentage = balances.sick.total > 0 ? (balances.sick.used / balances.sick.total) * 100 : 0;
    }
    
    bar.style.width = `${Math.min(100, percentage)}%`;
  });
}

// Setup inline "Apply for leave" form
function setupApplyLeaveForm() {
  const form = document.getElementById('applyLeaveForm');
  if (!form) return;
  
  const startDateInput = document.getElementById('applyStartDate');
  const endDateInput = document.getElementById('applyEndDate');
  const startDateIcon = startDateInput?.closest('.date-input-wrapper')?.querySelector('.date-icon');
  const endDateIcon = endDateInput?.closest('.date-input-wrapper')?.querySelector('.date-icon');
  
  // Ensure inputs start as text type for placeholder to show
  if (startDateInput) startDateInput.type = 'text';
  if (endDateInput) endDateInput.type = 'text';
  
  // Parse date from DD/MM/YY format
  function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
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
  
  // Use the shared openDatePicker from modal.js
  // Wait for it to be available if not loaded yet
  function getOpenDatePicker() {
    if (window.openDatePicker && typeof window.openDatePicker === 'function') {
      return window.openDatePicker;
    }
    // Fallback: try to use the function directly if modal.js is in scope
    if (typeof openDatePicker === 'function') {
      return openDatePicker;
    }
    return null;
  }
  
  // Shared focus handler
  function handleFocus(input) {
    const openPicker = getOpenDatePicker();
    if (openPicker) {
      openPicker(input);
    } else {
      // Fallback: convert to date type and focus
      if (input.type !== 'date') {
        input.type = 'date';
      }
      setTimeout(() => {
        if (input.showPicker && typeof input.showPicker === 'function') {
          try {
            input.showPicker();
          } catch (e) {
            input.focus();
          }
        } else {
          input.focus();
        }
      }, 10);
    }
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
      const parseDateValue = (dateStr) => {
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
      
      const startDate = parseDateValue(startDateInput.value);
      const endDate = parseDateValue(endDateInput.value);
      
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
        startDateInput.focus();
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
        endDateInput.focus();
      }
    });
  }
  
  // Form submission handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const leaveType = document.getElementById('applyLeaveType').value;
    const startDateStr = startDateInput.value;
    const endDateStr = endDateInput.value;
    const reason = document.getElementById('applyReason').value;
    
    // Validate required fields (reason is optional)
    if (!leaveType || !startDateStr || !endDateStr) {
      alert('Please fill in all required fields (Leave type, Start date, End date).');
      return;
    }
    
    // Parse dates
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert('Invalid date format. Please use DD/MM/YY format.');
      return;
    }
    
    // Validate dates
    if (startDate > endDate) {
      alert('Start date must be before or equal to end date.');
      return;
    }
    
    // Calculate number of days
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Create leave request using state management
    const createLeave = window.createLeaveRequest || (typeof createLeaveRequest !== 'undefined' ? createLeaveRequest : null);
    
    if (typeof createLeave === 'function') {
      try {
        const newLeave = createLeave({
          type: leaveType,
          startDate: startDate,
          endDate: endDate,
          reason: reason.trim(),
          status: 'pending'
        });
        
        if (newLeave && newLeave.id) {
          // Show success message
          alert(`Leave request submitted successfully! (${daysDiff} ${daysDiff === 1 ? 'day' : 'days'})`);
          
          // Reset form
          form.reset();
          if (startDateInput) startDateInput.type = 'text';
          if (endDateInput) endDateInput.type = 'text';
          
          // Reset to page 1 so new row appears at top
          currentPage = 1;
          
          // Explicitly trigger table update to ensure immediate visibility
          // The notifyStateChange() call in createLeaveRequest will also trigger listeners,
          // but we ensure the table updates immediately
          setTimeout(() => {
            renderLeaveHistoryTable();
          }, 50);
          
          // Update UI (calendar, table, balances will update via state listeners)
        } else {
          throw new Error('Leave request was not created properly');
        }
      } catch (error) {
        alert('Error creating leave request: ' + error.message);
      }
    } else {
      alert('Leave request functionality is not available. Please refresh the page.');
    }
  });
  
  // Cancel button handler
  const cancelBtn = document.getElementById('applyCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      form.reset();
      if (startDateInput) {
        startDateInput.value = '';
        startDateInput.type = 'text';
      }
      if (endDateInput) {
        endDateInput.value = '';
        endDateInput.type = 'text';
      }
    });
  }
}

// Format date consistently (e.g., "23 Oct 2025")
function formatDateForTable(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '-';
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Render Leave History Table from localStorage
function renderLeaveHistoryTable() {
  const tableBody = document.getElementById('leaveRequestsTableBody');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Get leave requests from localStorage via state management
  const getLeaveRequestsFn = window.getLeaveRequests || (typeof getLeaveRequests !== 'undefined' ? getLeaveRequests : null);
  if (!getLeaveRequestsFn || typeof getLeaveRequestsFn !== 'function') {
    console.error('getLeaveRequests function not available');
    // Show empty state
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: var(--spacing-48) var(--spacing-24);">
        <div style="font-size: var(--font-size-h3); font-weight: var(--font-weight-h3); color: var(--color-text-title); margin-bottom: var(--spacing-8);">
          0 leave requests
        </div>
        <div style="font-size: var(--font-size-body); color: var(--color-text-subtitle);">
          Apply for a leave to see it here.
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
    return;
  }
  
  // Get leave requests from localStorage (via state management)
  let leaveRequests = getLeaveRequestsFn();
  
  // Ensure it's an array
  if (!Array.isArray(leaveRequests)) {
    leaveRequests = [];
  }
  
  // Apply filter - use exact string match on display values
  if (currentFilter !== 'All') {
    // Map raw types to display values for filtering
    const typeMap = {
      'annual': 'Casual',
      'sick': 'Sick',
      'casual': 'Casual',
      'flexi': 'Casual',
      'annual-leave': 'Casual',
      'sick-leave': 'Sick',
      'casual-leave': 'Casual'
    };
    
    leaveRequests = leaveRequests.filter(leave => {
      const displayType = typeMap[leave.type] || leave.type;
      return displayType === currentFilter;
    });
  }
  
  // Sort by date (newest first)
  leaveRequests.sort((a, b) => {
    const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
    const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
    return dateB - dateA;
  });
  
  // Calculate pagination
  const totalItems = leaveRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = leaveRequests.slice(startIndex, endIndex);
  
  // Update pagination UI
  updatePaginationUI(totalItems, totalPages);
  
  // Empty state: show when there are no leave requests at all
  if (totalItems === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: var(--spacing-48) var(--spacing-24);">
        <div style="font-size: var(--font-size-h3); font-weight: var(--font-weight-h3); color: var(--color-text-title); margin-bottom: var(--spacing-8);">
          0 leave requests
        </div>
        <div style="font-size: var(--font-size-body); color: var(--color-text-subtitle);">
          Apply for a leave to see it here.
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
    return;
  }
  
  // If filtered/paginated results are empty but total is not, show message
  if (paginatedRequests.length === 0 && totalItems > 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: var(--spacing-48) var(--spacing-24); color: var(--color-text-subtitle);">
        No leave requests match the current filter.
      </td>
    `;
    tableBody.appendChild(tr);
    return;
  }
  
  // Map leave type to standardized display name
  const typeMap = {
    'annual-leave': 'Casual',
    'sick-leave': 'Sick',
    'casual-leave': 'Casual',
    'annual': 'Casual',
    'sick': 'Sick',
    'casual': 'Casual',
    'flexi': 'Casual'
  };
  
  // Render table rows using semantic <table> structure
  paginatedRequests.forEach((leave) => {
    const tr = document.createElement('tr');
    tr.className = 'table-row';
    tr.dataset.leaveId = leave.id;
    
    // Ensure dates are Date objects
    const startDate = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
    const endDate = leave.endDate ? (leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate)) : null;
    
    // Format dates consistently
    const startDateFormatted = formatDateForTable(startDate);
    const endDateFormatted = endDate ? formatDateForTable(endDate) : '-';
    
    // Calculate number of days (inclusive of both start and end dates)
    let numDays = '-';
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      numDays = `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`;
    } else if (leave.numberOfDays) {
      numDays = `${leave.numberOfDays} ${leave.numberOfDays === 1 ? 'day' : 'days'}`;
    }
    
    // Get display name for leave type
    const leaveType = leave.leaveType || leave.type;
    const fullTypeName = typeMap[leaveType] || typeMap[leave.type] || leaveType || 'Leave';
    
    // Map status to display name (default to 'Pending' if not set)
    const statusMap = {
      'approved': 'Approved',
      'pending': 'Pending',
      'rejected': 'Rejected'
    };
    const status = leave.status || 'pending';
    const statusDisplay = statusMap[status] || status;
    
    // Status badge class
    const statusBadgeClass = status === 'approved' ? 'badge-approved' : (status === 'pending' ? 'badge-pending' : 'badge-rejected');
    
    // Create exactly 5 <td> elements in the correct order
    // Column 1: Leave type
    const td1 = document.createElement('td');
    td1.className = 'table-cell table-col-leave-type';
    td1.innerHTML = `<span class="table-cell-text">${fullTypeName}</span>`;
    tr.appendChild(td1);
    
    // Column 2: Start date
    const td2 = document.createElement('td');
    td2.className = 'table-cell table-col-start-date';
    td2.innerHTML = `<span class="table-cell-text">${startDateFormatted}</span>`;
    tr.appendChild(td2);
    
    // Column 3: End date
    const td3 = document.createElement('td');
    td3.className = 'table-cell table-col-end-date';
    td3.innerHTML = `<span class="table-cell-text">${endDateFormatted}</span>`;
    tr.appendChild(td3);
    
    // Column 4: No. of days
    const td4 = document.createElement('td');
    td4.className = 'table-cell table-col-days';
    td4.innerHTML = `<span class="table-cell-text">${numDays}</span>`;
    tr.appendChild(td4);
    
    // Column 5: Approval status (badge, right-aligned)
    const td5 = document.createElement('td');
    td5.className = 'table-cell table-col-status';
    td5.style.textAlign = 'right';
    td5.innerHTML = `<span class="badge ${statusBadgeClass}">${statusDisplay}</span>`;
    tr.appendChild(td5);
    
    // Verify row has exactly 5 cells before appending
    if (tr.children.length !== 5) {
      console.error('Row does not have exactly 5 cells:', tr.children.length);
      return;
    }
    
    tableBody.appendChild(tr);
  });
}

// Make renderLeaveHistoryTable globally accessible
window.renderLeaveHistoryTable = renderLeaveHistoryTable;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initial render
  renderLeaveHistoryTable();
  
  // Subscribe to state changes - this ensures table updates when leaveRequests changes
  const subscribeFn = window.subscribeToStateChanges || (typeof subscribeToStateChanges !== 'undefined' ? subscribeToStateChanges : null);
  if (subscribeFn && typeof subscribeFn === 'function') {
    subscribeFn(function() {
      // Reset to page 1 when new leave is added (so new row appears at top)
      const previousPage = currentPage;
      currentPage = 1;
      
      // Re-render table immediately when state changes
      renderLeaveHistoryTable();
      
      // Re-render calendars to show updated status
      if (typeof reRenderAllCalendars === 'function') {
        reRenderAllCalendars();
      }
      // Update attendance chart
      if (typeof renderAttendanceDonutChart === 'function') {
        renderAttendanceDonutChart();
      }
    });
  } else {
    console.warn('subscribeToStateChanges function not available. Table may not update automatically.');
  }
  
  // Calendar action buttons are handled by calendar.js
  // No need to wire them here - they work with selectedDate

  // Setup inline "Apply for leave" form
  setupApplyLeaveForm();
  
  // Update leave balances
  updateLeaveBalances();
  
  // Subscribe to state changes to update balances
  if (typeof subscribeToStateChanges === 'function') {
    subscribeToStateChanges(function() {
      updateLeaveBalances();
    });
  }

  // Filter tag interactions
  const filterTags = document.querySelectorAll('.filter-controls .filter-tag');
  filterTags.forEach(tag => {
    tag.addEventListener('click', function() {
      filterTags.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      // Filter table based on filter
      const filter = this.textContent.trim();
      filterTableByFilter(filter);
    });
  });

  // Pagination interactions (handled by updatePaginationUI, but keep prev/next handlers)
  const paginationPrev = document.querySelector('.pagination-prev');
  const paginationNext = document.querySelector('.pagination-next');
  
  if (paginationPrev) {
    paginationPrev.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        renderLeaveHistoryTable();
      }
    });
  }
  
  if (paginationNext) {
    paginationNext.addEventListener('click', function() {
      // Get total items to calculate total pages
      let leaveRequests = typeof getLeaveRequests === 'function' ? getLeaveRequests() : [];
      if (currentFilter !== 'All') {
        // Map raw types to display values for filtering
        const typeMap = {
          'annual': 'Casual',
          'sick': 'Sick',
          'casual': 'Casual',
          'flexi': 'Casual',
          'annual-leave': 'Casual',
          'sick-leave': 'Sick',
          'casual-leave': 'Casual'
        };
        
        leaveRequests = leaveRequests.filter(leave => {
          const displayType = typeMap[leave.type] || leave.type;
          return displayType === currentFilter;
        });
      }
      const totalPages = Math.ceil(leaveRequests.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderLeaveHistoryTable();
      }
    });
  }

  // Calendar navigation is handled by calendar.js

  // Items per page select
  const footerSelect = document.querySelector('.footer-select');
  if (footerSelect) {
    footerSelect.addEventListener('change', function() {
      itemsPerPage = parseInt(this.value, 10);
      currentPage = 1; // Reset to first page
      renderLeaveHistoryTable();
    });
  }

  // Table checkbox interactions
  const tableCheckboxes = document.querySelectorAll('.table-checkbox');
  const headerCheckbox = document.querySelector('.table-header .table-checkbox');
  
  if (headerCheckbox) {
    headerCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      tableCheckboxes.forEach(checkbox => {
        if (checkbox !== headerCheckbox) {
          checkbox.checked = isChecked;
        }
      });
    });
  }
  
  tableCheckboxes.forEach(checkbox => {
    if (checkbox !== headerCheckbox) {
      checkbox.addEventListener('change', function() {
        // Update header checkbox state based on all row checkboxes
        const allChecked = Array.from(tableCheckboxes)
          .filter(cb => cb !== headerCheckbox)
          .every(cb => cb.checked);
        const someChecked = Array.from(tableCheckboxes)
          .filter(cb => cb !== headerCheckbox)
          .some(cb => cb.checked);
        
        if (headerCheckbox) {
          headerCheckbox.checked = allChecked;
          headerCheckbox.indeterminate = someChecked && !allChecked;
        }
      });
    }
  });
});
(function () {
    // ---- helpers (isolated) ----
    const STORAGE_KEY = "myLeaveRequests";
  
    function getRequests() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
  
    function saveRequests(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  
    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
  
    // ---- submit listener (non-invasive) ----
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".request-leave-btn");
      if (!btn) return;
  
      const form = btn.closest("form");
      if (!form) return;
  
      const leaveType = form.querySelector('[name="leaveType"]')?.value;
      const startDate = form.querySelector('[name="startDate"]')?.value;
      const endDate = form.querySelector('[name="endDate"]')?.value;
      const reason = form.querySelector('[name="reason"]')?.value;
  
      if (!leaveType || !startDate || !endDate) {
        alert("Please fill all required fields");
        return;
      }
  
      const days =
        Math.ceil(
          (new Date(endDate) - new Date(startDate)) /
            (1000 * 60 * 60 * 24)
        ) + 1;
  
      const newRequest = {
        id: Date.now(),
        leaveType,
        startDate,
        endDate,
        days,
        status: "Pending"
      };
  
      const existing = getRequests();
      existing.unshift(newRequest);
      saveRequests(existing);
  
      form.reset();
      renderTableIfExists();
    });
  
    // ---- render ONLY if table exists ----
    function renderTableIfExists() {
      const tbody = document.querySelector("#myLeaveRequestsTableBody");
      if (!tbody) return;
  
      const data = getRequests();
      tbody.innerHTML = "";
  
      if (!data.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding:24px;">
              0 leave requests
            </td>
          </tr>`;
        return;
      }
  
      data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.leaveType}</td>
          <td>${formatDate(item.startDate)}</td>
          <td>${formatDate(item.endDate)}</td>
          <td>${item.days} days</td>
          <td>
            <span class="status-badge pending">
              Pending
            </span>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  
    // ---- auto render on load ----
    document.addEventListener("DOMContentLoaded", renderTableIfExists);
  })();
  (function () {
    const STORAGE_KEY = "myLeaveRequests";
  
    function getRequests() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
  
    function saveRequests(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  
    function renderIfTableExists() {
      const tbody = document.querySelector("#myLeaveRequestsTableBody");
      if (!tbody) return;
  
      const data = getRequests();
      tbody.innerHTML = "";
  
      if (!data.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;padding:24px">
              0 leave requests
            </td>
          </tr>`;
        return;
      }
  
      data.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.leaveType}</td>
          <td>${item.startDate}</td>
          <td>${item.endDate}</td>
          <td>${item.days} days</td>
          <td><span class="status-badge pending">Pending</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  
    document.addEventListener("submit", function (e) {
      const form = e.target;
      if (!form.closest(".leave-form")) return;
  
      e.preventDefault(); // prevent page reload
  
      const data = new FormData(form);
  
      const leaveType = data.get("leaveType");
      const startDate = data.get("startDate");
      const endDate = data.get("endDate");
  
      if (!leaveType || !startDate || !endDate) {
        alert("Please fill all required fields");
        return;
      }
  
      const days =
        Math.ceil(
          (new Date(endDate) - new Date(startDate)) /
            (1000 * 60 * 60 * 24)
        ) + 1;
  
      const newRequest = {
        id: Date.now(),
        leaveType,
        startDate,
        endDate,
        days,
        status: "Pending"
      };
  
      const existing = getRequests();
      existing.unshift(newRequest);
      saveRequests(existing);
  
      form.reset();
      renderIfTableExists();
    });
  
    document.addEventListener("DOMContentLoaded", renderIfTableExists);
  })();
  
  
