// Shared State Management
// Single source of truth for attendance and leave requests
// Uses localStorage as persistent storage

// Storage keys
const STORAGE_KEY_LEAVE_REQUESTS = 'wherework_leaveRequests';
const STORAGE_KEY_ATTENDANCE_STATE = 'wherework_attendanceState';

// Attendance state: "YYYY-MM-DD" -> { status, leaveId? }
let attendanceState = {};

// Leave requests array - loaded from localStorage
let leaveRequests = [];

// Load leave requests from localStorage on initialization
function loadLeaveRequestsFromStorage() {
  try {
    if (typeof Storage === 'undefined' || !localStorage) {
      console.warn('localStorage is not available. Leave requests will not persist.');
      leaveRequests = [];
      return;
    }
    
    const stored = localStorage.getItem(STORAGE_KEY_LEAVE_REQUESTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      leaveRequests = parsed.map(leave => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        createdAt: new Date(leave.createdAt)
      }));
    } else {
      leaveRequests = [];
    }
  } catch (error) {
    console.error('Error loading leave requests from localStorage:', error);
    leaveRequests = [];
  }
}

// Save leave requests to localStorage
function saveLeaveRequestsToStorage() {
  try {
    if (typeof Storage === 'undefined' || !localStorage) {
      console.warn('localStorage is not available. Leave requests will not persist.');
      return;
    }
    
    // Convert Date objects to ISO strings for storage
    const serializable = leaveRequests.map(leave => ({
      ...leave,
      startDate: leave.startDate instanceof Date ? leave.startDate.toISOString() : leave.startDate,
      endDate: leave.endDate instanceof Date ? leave.endDate.toISOString() : leave.endDate,
      createdAt: leave.createdAt instanceof Date ? leave.createdAt.toISOString() : leave.createdAt
    }));
    localStorage.setItem(STORAGE_KEY_LEAVE_REQUESTS, JSON.stringify(serializable));
  } catch (error) {
    console.error('Error saving leave requests to localStorage:', error);
    // Don't throw - allow app to continue even if storage fails
  }
}

// Load attendance state from localStorage (optional, for persistence)
function loadAttendanceStateFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ATTENDANCE_STATE);
    if (stored) {
      attendanceState = JSON.parse(stored);
    } else {
      attendanceState = {};
    }
  } catch (error) {
    console.error('Error loading attendance state from localStorage:', error);
    attendanceState = {};
  }
}

// Save attendance state to localStorage
function saveAttendanceStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE_STATE, JSON.stringify(attendanceState));
  } catch (error) {
    console.error('Error saving attendance state to localStorage:', error);
  }
}

// Initialize: Load data from localStorage
loadLeaveRequestsFromStorage();
loadAttendanceStateFromStorage();

// State change listeners
const stateChangeListeners = [];

// Subscribe to state changes
function subscribeToStateChanges(callback) {
  stateChangeListeners.push(callback);
}

// Notify all listeners of state changes
function notifyStateChange() {
  stateChangeListeners.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('State change listener error:', error);
    }
  });
}

// Format date as YYYY-MM-DD
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse date from YYYY-MM-DD string or Date object
function parseDateKey(dateKey) {
  if (dateKey instanceof Date) {
    return formatDateKey(dateKey);
  }
  // If it's already a string in YYYY-MM-DD format, return as is
  if (typeof dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return dateKey;
  }
  // Try to parse as Date and format
  const date = new Date(dateKey);
  if (!isNaN(date.getTime())) {
    return formatDateKey(date);
  }
  return dateKey;
}

// Get date range between two dates (inclusive)
function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDateKey(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Check if date range overlaps with existing leave
function hasOverlappingLeave(startDate, endDate, excludeLeaveId = null) {
  const dateRange = getDateRange(startDate, endDate);
  
  return leaveRequests.some(leave => {
    if (excludeLeaveId && leave.id === excludeLeaveId) return false;
    if (leave.status !== 'approved') return false;
    
    const leaveStart = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
    const leaveEnd = leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate);
    const leaveRange = getDateRange(leaveStart, leaveEnd);
    return dateRange.some(date => leaveRange.includes(date));
  });
}

// Mark date as in office
function markDateAsInOffice(date) {
  const dateKey = parseDateKey(date);
  const existing = attendanceState[dateKey];
  
  // Don't allow marking office days inside approved leave range
  // Pending leaves don't block marking office days
  if (existing && existing.leaveId) {
    const leave = leaveRequests.find(l => l.id === existing.leaveId);
    if (leave && leave.status === 'approved') {
      return false; // Cannot mark office day inside approved leave
    }
    // If it's a pending leave, we can still mark as office day (will override when approved)
  }
  
  // Also check if date is in any approved leave range
  for (const leave of leaveRequests) {
    if (leave.status === 'approved') {
      const leaveStart = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
      const leaveEnd = leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const start = new Date(leaveStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leaveEnd);
      end.setHours(0, 0, 0, 0);
      
      if (checkDate >= start && checkDate <= end) {
        return false; // Cannot mark office day inside approved leave
      }
    }
  }
  
  // Set status to in-office
  attendanceState[dateKey] = {
    status: 'in-office'
  };
  
  // Remove leaveId if it exists
  if (existing && existing.leaveId) {
    delete attendanceState[dateKey].leaveId;
  }
  
  // Save to localStorage
  saveAttendanceStateToStorage();
  
  notifyStateChange();
  
  // Trigger calendar re-renders
  if (typeof window !== 'undefined') {
    // Re-render all calendars to show updated status
    setTimeout(() => {
      document.querySelectorAll('.calendar-container, .calendar-wrapper, .calendar-card').forEach(container => {
        const instanceId = container.dataset.instanceId;
        if (instanceId && typeof calendarInstances !== 'undefined') {
          const state = calendarInstances.get(instanceId);
          if (state && typeof renderCalendar === 'function') {
            renderCalendar(container, state.currentYear, state.currentMonth, instanceId);
          }
        }
      });
    }, 0);
  }
  
  return true;
}

// Get attendance status for a date (includes pending leaves)
function getAttendanceStatus(date) {
  const dateKey = parseDateKey(date);
  
  // First check attendance state (approved leaves, office days, etc.)
  if (attendanceState[dateKey]) {
    return attendanceState[dateKey];
  }
  
  // Check for pending leaves that include this date
  const dateObj = date instanceof Date ? date : new Date(date);
  for (const leave of leaveRequests) {
    if (leave.status === 'pending') {
      const leaveStart = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
      const leaveEnd = leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate);
      
      // Normalize dates to start of day for comparison
      const checkDate = new Date(dateObj);
      checkDate.setHours(0, 0, 0, 0);
      const start = new Date(leaveStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leaveEnd);
      end.setHours(0, 0, 0, 0);
      
      if (checkDate >= start && checkDate <= end) {
        // Map leave type to status
        const statusMap = {
          'annual': 'annual-leave',
          'sick': 'sick-leave',
          'casual': 'annual-leave',
          'flexi': 'annual-leave'
        };
        return {
          status: statusMap[leave.type] || 'annual-leave',
          leaveId: leave.id,
          isPending: true
        };
      }
    }
  }
  
  return null;
}

// Create leave request
function createLeaveRequest(leaveData) {
  const {
    type,
    startDate,
    endDate,
    reason = '',
    status = 'pending'
  } = leaveData;
  
  // Validate required fields
  if (!type || !startDate || !endDate) {
    throw new Error('Missing required fields: leave type, start date, and end date are required');
  }
  
  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid dates');
  }
  
  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }
  
  // Check for overlapping leaves
  if (hasOverlappingLeave(start, end)) {
    throw new Error('Leave request overlaps with existing approved leave');
  }
  
  // Generate unique ID
  const id = `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create leave request object matching the required structure
  // Structure: { id, leaveType, startDate, endDate, reason, status, createdAt }
  const leaveRequest = {
    id,
    leaveType: type, // Primary field name as per requirements
    type: type, // Keep for backward compatibility with existing code
    startDate: start,
    endDate: end,
    reason: reason || '',
    status: status || 'pending',
    createdAt: new Date()
  };
  
  leaveRequests.push(leaveRequest);
  
  // Save to localStorage immediately
  saveLeaveRequestsToStorage();
  
  // Update attendance state for all dates in range
  const dateRange = getDateRange(start, end);
  const statusMap = {
    'annual': 'annual-leave',
    'sick': 'sick-leave',
    'casual': 'annual-leave', // Casual leave treated as annual for display
    'flexi': 'annual-leave'   // Flexi leave treated as annual for display
  };
  
  // Only update attendance state if leave is approved
  // Pending leaves don't mark calendar dates yet
  if (status === 'approved') {
    dateRange.forEach(dateKey => {
      attendanceState[dateKey] = {
        status: statusMap[type] || 'annual-leave',
        leaveId: id
      };
    });
    saveAttendanceStateToStorage();
  }
  
  notifyStateChange();
  return leaveRequest;
}

// Get all leave requests
function getLeaveRequests() {
  return [...leaveRequests];
}

// Cancel a leave request (only if status is pending)
function cancelLeaveRequest(leaveId) {
  const leaveIndex = leaveRequests.findIndex(l => l.id === leaveId);
  if (leaveIndex === -1) {
    throw new Error('Leave request not found');
  }
  
  const leave = leaveRequests[leaveIndex];
  if (leave.status !== 'pending') {
    throw new Error('Only pending leave requests can be cancelled');
  }
  
  // Remove leave request
  leaveRequests.splice(leaveIndex, 1);
  
  // Save to localStorage immediately
  saveLeaveRequestsToStorage();
  
  // Remove from attendance state
  const start = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
  const end = leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate);
  const dateRange = getDateRange(start, end);
  dateRange.forEach(dateKey => {
    const status = attendanceState[dateKey];
    if (status && status.leaveId === leaveId) {
      delete attendanceState[dateKey];
    }
  });
  
  saveAttendanceStateToStorage();
  
  notifyStateChange();
  return true;
}

// Get attendance data for donut chart
function getAttendanceDataForChart() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get all dates in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDates = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateKey = formatDateKey(date);
    monthDates.push(dateKey);
  }
  
  // Count statuses
  let inOffice = 0;
  let wfa = 0;
  let annualLeave = 0;
  let sickLeave = 0;
  
  monthDates.forEach(dateKey => {
    const status = attendanceState[dateKey];
    if (status) {
      switch (status.status) {
        case 'in-office':
          inOffice++;
          break;
        case 'wfa':
          wfa++;
          break;
        case 'annual-leave':
          annualLeave++;
          break;
        case 'sick-leave':
          sickLeave++;
          break;
      }
    }
    // Note: Empty days (no status) are not counted in any category
    // They will appear as neutral background in the chart
  });
  
  return {
    inOffice,
    wfa,
    annualLeave,
    sickLeave,
    total: inOffice + wfa + annualLeave + sickLeave,
    totalDays: daysInMonth
  };
}

// Calculate leave balances from real data
function getLeaveBalances() {
  const allLeaves = getLeaveRequests();
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Default totals (in a real app, these would come from user profile/settings)
  const totals = {
    fixed: 21,
    flexi: 6,
    annual: 21,
    sick: 21
  };
  
  // Count used leaves for current year (only approved leaves count)
  const used = {
    fixed: 0,
    flexi: 0,
    annual: 0,
    sick: 0
  };
  
  allLeaves.forEach(leave => {
    if (leave.status !== 'approved') return;
    
    const startDate = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
    if (startDate.getFullYear() !== currentYear) return;
    
    const endDate = leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    switch (leave.type) {
      case 'casual':
        used.fixed += days;
        break;
      case 'flexi':
        used.flexi += days;
        break;
      case 'annual':
        used.annual += days;
        break;
      case 'sick':
        used.sick += days;
        break;
    }
  });
  
  // Calculate remaining
  const remaining = {
    fixed: Math.max(0, totals.fixed - used.fixed),
    flexi: Math.max(0, totals.flexi - used.flexi),
    annual: Math.max(0, totals.annual - used.annual),
    sick: Math.max(0, totals.sick - used.sick)
  };
  
  return {
    fixed: { used: used.fixed, remaining: remaining.fixed, total: totals.fixed },
    flexi: { used: used.flexi, remaining: remaining.flexi, total: totals.flexi },
    annual: { used: used.annual, remaining: remaining.annual, total: totals.annual },
    sick: { used: used.sick, remaining: remaining.sick, total: totals.sick }
  };
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.attendanceState = attendanceState;
  window.leaveRequests = leaveRequests;
  window.markDateAsInOffice = markDateAsInOffice;
  window.getAttendanceStatus = getAttendanceStatus;
  window.createLeaveRequest = createLeaveRequest;
  window.getLeaveRequests = getLeaveRequests;
  window.getAttendanceDataForChart = getAttendanceDataForChart;
  window.subscribeToStateChanges = subscribeToStateChanges;
  window.hasOverlappingLeave = hasOverlappingLeave;
  window.formatDateKey = formatDateKey;
  window.getDateRange = getDateRange;
  window.cancelLeaveRequest = cancelLeaveRequest;
  window.getLeaveBalances = getLeaveBalances;
}
