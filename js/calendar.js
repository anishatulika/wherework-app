// Shared Calendar Utility
// Handles dynamic calendar rendering and navigation

// Calendar state management - separate state per calendar instance
const calendarInstances = new Map();

// Global selected date state (single selection across all calendars)
let selectedDate = null;

// Month names for display
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
function getFirstDayOfMonth(year, month) {
  const date = new Date(year, month, 1);
  // Convert to Monday = 0 format (0 = Monday, 6 = Sunday)
  let day = date.getDay() - 1;
  if (day < 0) day = 6; // Sunday becomes 6
  return day;
}

// Get days in month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Check if date is today
function isToday(year, month, day) {
  const today = new Date();
  return (
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate()
  );
}

// Check if date should be marked (example: weekends disabled)
function shouldMarkDate(year, month, day) {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  // Example: Mark dates that are not weekends (Saturday = 6, Sunday = 0)
  // You can customize this logic based on your needs
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

// Check if date should be disabled (example: weekends)
function shouldDisableDate(year, month, day) {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  // Example: Disable weekends (Saturday = 6, Sunday = 0)
  // You can customize this logic based on your needs
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// Render calendar for a given container
function renderCalendar(container, year, month, instanceId) {
  const calendarDaysGrid = container.querySelector('.calendar-days-grid');
  const monthText = container.querySelector('.calendar-month-text');
  const yearText = container.querySelector('.calendar-year-text');
  
  if (!calendarDaysGrid) return;
  
  // Update month and year display
  if (monthText) monthText.textContent = MONTH_NAMES[month];
  if (yearText) yearText.textContent = year;
  
  // Clear existing days
  calendarDaysGrid.innerHTML = '';
  
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day-empty';
    calendarDaysGrid.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = typeof formatDateKey === 'function' ? formatDateKey(date) : `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isTodayDate = isToday(year, month, day);
    const isMarked = shouldMarkDate(year, month, day);
    const isDisabled = shouldDisableDate(year, month, day);
    
    // Get attendance status if state management is available
    let attendanceStatus = null;
    if (typeof getAttendanceStatus === 'function') {
      attendanceStatus = getAttendanceStatus(date);
    }
    
    // Check if this date is selected
    const isSelected = selectedDate && 
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day;
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.dataset.date = dateKey;
    dayElement.dataset.year = year;
    dayElement.dataset.month = month;
    dayElement.dataset.day = day;
    
    if (isTodayDate) {
      dayElement.classList.add('today');
    }
    if (isDisabled) {
      dayElement.classList.add('disabled');
    }
    if (isSelected) {
      dayElement.classList.add('selected');
    }
    
    // Add status classes
    if (attendanceStatus) {
      dayElement.classList.add(`status-${attendanceStatus.status}`);
      if (attendanceStatus.leaveId) {
        dayElement.classList.add('has-leave');
      }
    }
    
    const daySpan = document.createElement('span');
    daySpan.textContent = day;
    dayElement.appendChild(daySpan);
    
    // Add status indicator
    if (attendanceStatus && !isDisabled) {
      const statusIndicator = document.createElement('div');
      statusIndicator.className = 'calendar-day-status';
      statusIndicator.setAttribute('aria-label', attendanceStatus.status);
      dayElement.appendChild(statusIndicator);
    } else if (isMarked && !isDisabled) {
      const circle = document.createElement('div');
      circle.className = 'calendar-day-circle';
      dayElement.appendChild(circle);
    }
    
    if (isTodayDate) {
      const dot = document.createElement('div');
      dot.className = 'calendar-day-dot';
      dayElement.appendChild(dot);
    }
    
    // Make clickable if not disabled
    if (!isDisabled) {
      dayElement.style.cursor = 'pointer';
      dayElement.setAttribute('role', 'button');
      dayElement.setAttribute('tabindex', '0');
      dayElement.setAttribute('aria-label', `Date ${day}, ${MONTH_NAMES[month]} ${year}`);
    }
    
    calendarDaysGrid.appendChild(dayElement);
  }
  
  // Add empty cells to fill the last row (if needed)
  const totalCells = firstDay + daysInMonth;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day-empty';
      calendarDaysGrid.appendChild(emptyDay);
    }
  }
  
  // Attach click handlers after rendering
  attachCalendarClickHandlers(container, instanceId);
}

// Attach click handlers to calendar days
function attachCalendarClickHandlers(container, instanceId) {
  const calendarDays = container.querySelectorAll('.calendar-day:not(.disabled)');
  
  calendarDays.forEach(dayElement => {
    // Remove existing listeners to prevent duplicates
    const newDayElement = dayElement.cloneNode(true);
    dayElement.parentNode.replaceChild(newDayElement, dayElement);
    
    newDayElement.addEventListener('click', function(e) {
      e.preventDefault();
      handleCalendarDayClick(this, container, instanceId);
    });
    
    newDayElement.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCalendarDayClick(this, container, instanceId);
      }
    });
  });
}

// Handle calendar day click
function handleCalendarDayClick(dayElement, container, instanceId) {
  const dateKey = dayElement.dataset.date;
  if (!dateKey) return;
  
  const year = parseInt(dayElement.dataset.year);
  const month = parseInt(dayElement.dataset.month);
  const day = parseInt(dayElement.dataset.day);
  const date = new Date(year, month, day);
  
  // Set selected date (single selection)
  selectedDate = date;
  
  // Re-render all calendars to show selection
  reRenderAllCalendars();
  
  // Update button states based on selection
  updateCalendarActionButtons();
}

// Re-render all calendars to reflect state changes
function reRenderAllCalendars() {
  calendarInstances.forEach((state, instanceId) => {
    // Find container by instance ID
    const container = document.querySelector(`[data-instance-id="${instanceId}"]`);
    if (container) {
      renderCalendar(container, state.currentYear, state.currentMonth, instanceId);
    } else {
      // Fallback: find by calendar element
      const calendars = document.querySelectorAll('.calendar');
      calendars.forEach((calendar) => {
        const calContainer = calendar.closest('.calendar-container, .calendar-wrapper, .calendar-card');
        if (calContainer && calContainer.dataset.instanceId === instanceId) {
          renderCalendar(calContainer, state.currentYear, state.currentMonth, instanceId);
        }
      });
    }
  });
}

// Update calendar action buttons state based on selected date
function updateCalendarActionButtons() {
  // Only show "Mark as office day" on dashboard, not on leaves page
  // Try multiple selectors to find the button
  const markOfficeBtn = document.querySelector('.calendar-card .btn-mark-office') || 
                        document.querySelector('.calendar-view-card .btn-mark-office') ||
                        document.querySelector('.btn-mark-office');
  const requestLeaveBtn = document.querySelector('.btn-request-leave-calendar');
  
  if (selectedDate) {
    // Enable "Mark as office day" button when a date is selected (dashboard only)
    if (markOfficeBtn) {
      markOfficeBtn.disabled = false;
      markOfficeBtn.style.opacity = '1';
      markOfficeBtn.style.cursor = 'pointer';
      markOfficeBtn.classList.remove('disabled');
      markOfficeBtn.setAttribute('aria-disabled', 'false');
    }
  } else {
    // Disable "Mark as office day" button when no date is selected (dashboard only)
    if (markOfficeBtn) {
      markOfficeBtn.disabled = true;
      markOfficeBtn.style.opacity = '0.5';
      markOfficeBtn.style.cursor = 'not-allowed';
      markOfficeBtn.classList.add('disabled');
      markOfficeBtn.setAttribute('aria-disabled', 'true');
    }
  }
  
  // "Request leave" button is always enabled (no disabled state)
  if (requestLeaveBtn) {
    requestLeaveBtn.disabled = false;
    requestLeaveBtn.style.opacity = '1';
    requestLeaveBtn.style.cursor = 'pointer';
    requestLeaveBtn.classList.remove('disabled');
    requestLeaveBtn.setAttribute('aria-disabled', 'false');
  }
}

// Initialize calendar action buttons
function initCalendarActionButtons() {
  // Only wire "Mark as office day" on dashboard, not on leaves page
  // Try multiple selectors to find the button
  const markOfficeBtn = document.querySelector('.calendar-card .btn-mark-office') || 
                        document.querySelector('.calendar-view-card .btn-mark-office') ||
                        document.querySelector('.btn-mark-office');
  const requestLeaveBtn = document.querySelector('.btn-request-leave-calendar');
  
  // Wire "Mark as office day" button (only on dashboard)
  if (markOfficeBtn && !markOfficeBtn.dataset.listenerAttached) {
    markOfficeBtn.dataset.listenerAttached = 'true';
    
    markOfficeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (!selectedDate) {
        alert('Please select a date first');
        return;
      }
      
      if (typeof markDateAsInOffice === 'function') {
        const success = markDateAsInOffice(selectedDate);
        if (success) {
          // Re-render all calendars to show updated status
          reRenderAllCalendars();
          // Clear selection after action
          selectedDate = null;
          updateCalendarActionButtons();
        } else {
          alert('Cannot mark this date as office day. It may be within an approved leave period.');
        }
      } else {
        alert('Error: markDateAsInOffice function not available');
      }
    });
  }
  
  // Wire "Request leave" button
  if (requestLeaveBtn && !requestLeaveBtn.dataset.listenerAttached) {
    requestLeaveBtn.dataset.listenerAttached = 'true';
    
    requestLeaveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Check for function in multiple ways
      const openModal = window.openLeaveRequestModal || (typeof openLeaveRequestModal !== 'undefined' ? openLeaveRequestModal : null);
      
      if (typeof openModal === 'function') {
        if (selectedDate) {
          openModal(selectedDate, selectedDate);
          // Clear selection after opening modal
          selectedDate = null;
          updateCalendarActionButtons();
          reRenderAllCalendars();
        } else {
          // Open modal without pre-filled dates
          openModal();
        }
      } else {
        alert('Error: openLeaveRequestModal function not available');
      }
    });
  }
  
  // Initialize button states
  updateCalendarActionButtons();
}

// Initialize calendar navigation for a container
function initCalendarNavigation(container, instanceId) {
  const prevBtn = container.querySelector('.calendar-nav-btn.prev');
  const nextBtn = container.querySelector('.calendar-nav-btn.next');
  
  // Store instance ID on container
  container.dataset.instanceId = instanceId;
  
  // Store handlers to prevent duplicate listeners
  if (!container.dataset.navInitialized) {
    container.dataset.navInitialized = 'true';
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const state = calendarInstances.get(instanceId);
        if (state) {
          state.currentMonth--;
          if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
          }
          renderCalendar(container, state.currentYear, state.currentMonth, instanceId);
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const state = calendarInstances.get(instanceId);
        if (state) {
          state.currentMonth++;
          if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
          }
          renderCalendar(container, state.currentYear, state.currentMonth, instanceId);
        }
      });
    }
  }
}

// Initialize all calendars on the page
function initAllCalendars() {
  const calendars = document.querySelectorAll('.calendar');
  calendars.forEach((calendar, index) => {
    const container = calendar.closest('.calendar-container, .calendar-wrapper, .calendar-card');
    if (container && !container.dataset.calendarInitialized) {
      // Create unique instance ID
      const instanceId = `calendar-${index}-${Date.now()}`;
      
      // Initialize with current month/year
      const now = new Date();
      const state = {
        currentMonth: now.getMonth(),
        currentYear: now.getFullYear()
      };
      calendarInstances.set(instanceId, state);
      
      // Store instance ID on container
      container.dataset.instanceId = instanceId;
      container.dataset.calendarInitialized = 'true';
      
      renderCalendar(container, state.currentYear, state.currentMonth, instanceId);
      initCalendarNavigation(container, instanceId);
    }
  });
}

// Format date for display (e.g., "23 Oct 2025")
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Format time for display (e.g., "10:00 AM")
function formatTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Update time and date displays
function updateTimeAndDate() {
  const now = new Date();
  const timeElements = document.querySelectorAll('.time');
  const dateElements = document.querySelectorAll('.date');
  
  timeElements.forEach(element => {
    element.textContent = formatTime(now);
  });
  
  dateElements.forEach(element => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    element.textContent = now.toLocaleDateString('en-US', options);
  });
  
  // Update copyright year
  const copyrightElements = document.querySelectorAll('.footer-right span');
  copyrightElements.forEach(element => {
    if (element.textContent.includes('©️') || element.textContent.includes('©')) {
      element.textContent = element.textContent.replace(/\d{4}/, now.getFullYear().toString());
    }
  });
}

// Initialize on DOM ready
function initializeCalendarSystem() {
  updateTimeAndDate();
  initAllCalendars();
  
  // Initialize buttons after calendars are rendered
  setTimeout(() => {
    initCalendarActionButtons();
  }, 300);
  
  // Also try after a longer delay to ensure everything is ready
  setTimeout(() => {
    initCalendarActionButtons();
  }, 1000);
  
  // Subscribe to state changes
  if (typeof subscribeToStateChanges === 'function') {
    subscribeToStateChanges(reRenderAllCalendars);
  }
  
  // Update time every minute
  setInterval(updateTimeAndDate, 60000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCalendarSystem);
} else {
  initializeCalendarSystem();
}

// Also try initializing when window loads (fallback)
window.addEventListener('load', function() {
  initCalendarActionButtons();
});
