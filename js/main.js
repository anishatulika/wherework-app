// Dashboard JavaScript

// Format date for display (e.g., "23 Oct 2025")
function formatDateForDisplay(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Get CSS variable value
function getCSSVariable(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

// Attendance Donut Chart Data Model - Static fallback
const attendanceDataFallback = [
  { label: "In office", value: 7, colorKey: "--color-chart-green" },
  { label: "Work from anywhere", value: 4, colorKey: "--color-chart-blue" },
  { label: "On annual leave", value: 2, colorKey: "--color-chart-orange" },
  { label: "On sick leave", value: 1, colorKey: "--color-chart-red" }
];

// Get attendance data from state or fallback
// Returns data grouped by category in the correct order
function getAttendanceData() {
  // Get colors from CSS variables
  const colors = {
    inOffice: getCSSVariable('--color-chart-green') || '#7BADA3',
    wfa: getCSSVariable('--color-chart-blue') || '#81A0D3',
    annualLeave: getCSSVariable('--color-chart-orange') || '#FBC372',
    sickLeave: getCSSVariable('--color-chart-red') || '#EE7370',
    empty: getCSSVariable('--color-border-default') || '#E1E5EB'
  };
  
  if (typeof getAttendanceDataForChart === 'function') {
    const chartData = getAttendanceDataForChart();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Calculate total attended days
    const attendedDays = chartData.inOffice + chartData.wfa + chartData.annualLeave + chartData.sickLeave;
    const emptyDays = daysInMonth - attendedDays;
    
    // Return in specific order: In office, WFA, Annual leave, Sick leave
    // Always include all 4 categories, even if value is 0
    const data = [
      { label: "In office", value: chartData.inOffice, color: colors.inOffice },
      { label: "Work from anywhere", value: chartData.wfa, color: colors.wfa },
      { label: "On annual leave", value: chartData.annualLeave, color: colors.annualLeave },
      { label: "On sick leave", value: chartData.sickLeave, color: colors.sickLeave }
    ];
    
    // Add empty days as neutral background if any
    if (emptyDays > 0) {
      data.push({ label: "Empty", value: emptyDays, color: colors.empty, isBackground: true });
    }
    
    return data;
  }
  
  // Fallback: calculate remaining days
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const attendedDays = attendanceDataFallback.reduce((sum, item) => sum + item.value, 0);
  const emptyDays = daysInMonth - attendedDays;
  
  const fallbackData = attendanceDataFallback.map(item => ({
    label: item.label,
    value: item.value,
    color: getCSSVariable(item.colorKey) || '#7BADA3'
  }));
  
  if (emptyDays > 0) {
    fallbackData.push({ label: "Empty", value: emptyDays, color: colors.empty, isBackground: true });
  }
  
  return fallbackData;
}

// Render Attendance Donut Chart
function renderAttendanceDonutChart() {
  const svg = document.getElementById('attendanceDonutChart');
  const legendContainer = document.getElementById('donutLegend');
  const totalValueElement = document.getElementById('donutTotalValue');
  const totalLabelElement = document.getElementById('donutTotalLabel');
  
  if (!svg || !legendContainer || !totalValueElement || !totalLabelElement) return;
  
  // Get data from state or fallback (already grouped by category)
  const attendanceData = getAttendanceData();
  
  // Calculate total days in current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Calculate attended days (sum of all attendance categories, excluding remaining)
  const attendedDays = attendanceData
    .filter(item => item.label !== "Remaining")
    .reduce((sum, item) => sum + item.value, 0);
  
  // Handle edge case: no data
  if (totalDays === 0) {
    totalValueElement.textContent = '0';
    totalLabelElement.textContent = '/ 0 days';
    legendContainer.innerHTML = '';
    return;
  }
  
  // Chart constants
  const centerX = 112;
  const centerY = 112;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 24;
  
  // Update background circle color to use CSS variable
  const backgroundCircle = svg.querySelector('circle:not([data-segment])');
  if (backgroundCircle) {
    const emptyColor = getCSSVariable('--color-border-default') || '#E1E5EB';
    backgroundCircle.setAttribute('stroke', emptyColor);
  }
  
  // Clear existing segments (keep background circle)
  const existingSegments = svg.querySelectorAll('circle[data-segment]');
  existingSegments.forEach(segment => segment.remove());
  
  // Render segments in specific order: In office, WFA, Annual leave, Sick leave
  // Each category renders as ONE contiguous segment
  // Segment size = number of days (proportional to totalDays)
  let cumulativeOffset = 0;
  
  // Get only the 4 main categories (exclude Empty/Remaining for segment rendering)
  // Empty days show as neutral background (the background circle)
  const segmentsToRender = attendanceData.filter(item => 
    !item.isBackground && 
    item.label !== "Remaining" && 
    item.label !== "Empty"
  );
  
  segmentsToRender.forEach((item, index) => {
    // Calculate arc length for this segment (proportional to totalDays)
    // arcAngle = (value / totalDays) * 360
    // Segment size = number of days
    const segmentLength = (item.value / totalDays) * circumference;
    
    // Only render if segment has length > 0
    if (segmentLength > 0) {
      // Create segment circle
      const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      segment.setAttribute('cx', centerX);
      segment.setAttribute('cy', centerY);
      segment.setAttribute('r', radius);
      segment.setAttribute('fill', 'none');
      segment.setAttribute('stroke', item.color);
      segment.setAttribute('stroke-width', strokeWidth);
      segment.setAttribute('stroke-dasharray', segmentLength.toFixed(2));
      segment.setAttribute('stroke-dashoffset', (-cumulativeOffset).toFixed(2));
      segment.setAttribute('transform', 'rotate(-90 112 112)');
      segment.setAttribute('data-segment', 'true');
      segment.setAttribute('data-category', item.label.toLowerCase().replace(/\s+/g, '-'));
      
      svg.appendChild(segment);
      
      // Update cumulative offset for next segment
      cumulativeOffset += segmentLength;
    }
    // Note: Zero-value segments are not rendered but order is maintained
  });
  
  // Empty days are shown as the neutral background circle (already rendered)
  
  // Update center value
  // Total attended = In office + Work from anywhere
  const totalAttended = attendanceData
    .filter(item => item.label === "In office" || item.label === "Work from anywhere")
    .reduce((sum, item) => sum + item.value, 0);
  
  totalValueElement.textContent = totalAttended.toString();
  totalLabelElement.textContent = `/ ${totalDays} days`;
  
  // Render legend - always show all 4 categories (In office, WFA, Annual leave, Sick leave)
  // Show 0 days if value is zero
  legendContainer.innerHTML = '';
  
  // Filter to only show the 4 main categories (exclude Empty/Remaining)
  const legendData = attendanceData.filter(item => !item.isBackground && item.label !== "Remaining" && item.label !== "Empty");
  
  // Ensure all 4 categories are present in correct order
  const requiredCategories = [
    { label: "In office", colorKey: "--color-chart-green" },
    { label: "Work from anywhere", colorKey: "--color-chart-blue" },
    { label: "On annual leave", colorKey: "--color-chart-orange" },
    { label: "On sick leave", colorKey: "--color-chart-red" }
  ];
  
  requiredCategories.forEach(category => {
    // Find matching data item or create with 0 value
    const dataItem = legendData.find(item => item.label === category.label);
    const value = dataItem ? dataItem.value : 0;
    const color = dataItem ? dataItem.color : (getCSSVariable(category.colorKey) || '#7BADA3');
    
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const unit = value === 1 ? 'day' : 'days';
    
    legendItem.innerHTML = `
      <span class="legend-color" style="background: ${color};"></span>
      <span class="legend-label">${category.label}</span>
      <span class="legend-value">${value} ${unit}</span>
    `;
    
    legendContainer.appendChild(legendItem);
  });
}

// Get team activity data from real leave requests
function getTeamActivityData() {
  // Get all leave requests from state
  const allLeaves = typeof getLeaveRequests === 'function' ? getLeaveRequests() : [];
  
  // Team member names (in a real app, this would come from user management)
  const teamMembers = [
    'Neil Ballinger',
    'Bhagyashree Behera',
    'Shuk Hing Ho',
    'Kiri Papadimopoulos',
    'Swati Kumari',
    'Christopher Hitchcock',
    'Indy Singh',
    'Shadille Samuels',
    'Anisha Tulika',
    'Zoya Azar'
  ];
  
  // Map leave requests to team activity format
  // In a real app, each leave would have a userId/name associated
  // For now, we'll assign leaves to team members in order
  const data = allLeaves
    .filter(leave => leave.status === 'approved' || leave.status === 'pending')
    .map((leave, index) => {
      const startDate = leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate);
      const endDate = leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate);
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
        name: teamMembers[index % teamMembers.length], // Assign to team members in rotation
        leaveType: typeMap[leave.type] || leave.type,
        startDate: startDate,
        endDate: endDate,
        numDays: `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`,
        status: statusMap[leave.status] || leave.status,
        rawType: leave.type // Keep raw type for filtering
      };
    })
    .sort((a, b) => {
      const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
      const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
      return dateB - dateA; // Sort by date, newest first
    });
  
  // If no real data, return sample data to match the design
  if (data.length === 0) {
    const now = new Date();
    const sampleStartDate = new Date(now.getFullYear(), now.getMonth(), 23);
    const sampleEndDate = new Date(now.getFullYear(), now.getMonth(), 30);
    
    return teamMembers.map((name, index) => {
      const leaveType = index % 2 === 0 ? 'Casual' : 'Sick';
      const daysDiff = 7;
      const startDate = new Date(sampleStartDate);
      startDate.setDate(startDate.getDate() + index); // Vary dates slightly
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysDiff - 1);
      
      return {
        name: name,
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        numDays: `${daysDiff} days`,
        status: 'Approved',
        rawType: index % 2 === 0 ? 'casual' : 'sick'
      };
    });
  }
  
  return data;
}

// Populate Team Activity Table
function populateTeamActivityTable() {
  const tableBody = document.getElementById('teamActivityTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  // Get real data from state
  let teamActivityData = getTeamActivityData();
  
  // Apply quick filter (All, Casual, Sick)
  const activeQuickFilter = document.querySelector('.filter-group .filter-tag.active')?.textContent?.trim() || 'All';
  if (activeQuickFilter !== 'All') {
    // Filter by display value (exact string match)
    teamActivityData = teamActivityData.filter(row => 
      row.leaveType === activeQuickFilter
    );
  }
  
  // Apply time filter (Weekly, Monthly, Quarterly)
  const activeTimeFilter = document.querySelector('.filters-right .filter-tag.active')?.textContent?.trim() || 'Weekly';
  const now = new Date();
  const filterDate = new Date(now);
  
  if (activeTimeFilter === 'Weekly') {
    filterDate.setDate(now.getDate() - 7);
  } else if (activeTimeFilter === 'Monthly') {
    filterDate.setMonth(now.getMonth() - 1);
  } else if (activeTimeFilter === 'Quarterly') {
    filterDate.setMonth(now.getMonth() - 3);
  }
  
  teamActivityData = teamActivityData.filter(row => {
    const rowDate = row.startDate instanceof Date ? row.startDate : new Date(row.startDate);
    return rowDate >= filterDate;
  });
  
  // Update total items count
  const totalItemsElement = document.querySelector('.table-footer .pagination-left span:last-child');
  if (totalItemsElement) {
    totalItemsElement.textContent = `Total ${teamActivityData.length} items`;
  }
  
  if (teamActivityData.length === 0) {
    tableBody.innerHTML = `
      <tr class="table-row">
        <td class="table-cell" colspan="6" style="text-align: center; padding: var(--spacing-24); color: var(--color-text-subtitle);">
          No leave records found
        </td>
      </tr>
    `;
    return;
  }

  // Generate rows with exactly 6 <td> elements each
  teamActivityData.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = 'table-row';

    // Format dates - ensure valid dates
    const startDate = row.startDate instanceof Date ? row.startDate : new Date(row.startDate);
    const endDate = row.endDate instanceof Date ? row.endDate : new Date(row.endDate);
    
    // Format dates with fallback
    let startDateFormatted = '-';
    let endDateFormatted = '-';
    if (startDate && !isNaN(startDate.getTime())) {
      startDateFormatted = typeof formatDate === 'function' ? formatDate(startDate) : startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (endDate && !isNaN(endDate.getTime())) {
      endDateFormatted = typeof formatDate === 'function' ? formatDate(endDate) : endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    // Get values with fallbacks - ensure every cell has content
    const name = row.name || '-';
    const leaveType = row.leaveType || '-';
    const numDays = row.numDays || '-';
    const status = row.status || '-';
    
    // Create exactly 6 <td> elements in the correct order
    // Column 1: Name
    const td1 = document.createElement('td');
    td1.className = 'table-cell table-col-name';
    td1.innerHTML = `<span class="name">${name}</span>`;
    tr.appendChild(td1);
    
    // Column 2: Leave type
    const td2 = document.createElement('td');
    td2.className = 'table-cell table-col-leave-type';
    td2.innerHTML = `<span class="text">${leaveType}</span>`;
    tr.appendChild(td2);
    
    // Column 3: Start date
    const td3 = document.createElement('td');
    td3.className = 'table-cell table-col-start-date';
    td3.innerHTML = `<span class="text">${startDateFormatted}</span>`;
    tr.appendChild(td3);
    
    // Column 4: End date
    const td4 = document.createElement('td');
    td4.className = 'table-cell table-col-end-date';
    td4.innerHTML = `<span class="text">${endDateFormatted}</span>`;
    tr.appendChild(td4);
    
    // Column 5: No. of days
    const td5 = document.createElement('td');
    td5.className = 'table-cell table-col-days';
    td5.innerHTML = `<span class="text">${numDays}</span>`;
    tr.appendChild(td5);
    
    // Column 6: Status (badge inside this cell)
    const td6 = document.createElement('td');
    td6.className = 'table-cell table-col-status';
    td6.innerHTML = `<span class="badge badge-approved">${status}</span>`;
    tr.appendChild(td6);
    
    // Verify row has exactly 6 cells before appending
    if (tr.children.length !== 6) {
      console.error('Row does not have exactly 6 cells:', tr.children.length);
      return;
    }
    
    tableBody.appendChild(tr);
  });
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Render attendance donut chart
  renderAttendanceDonutChart();
  
  // Subscribe to state changes to update donut chart
  if (typeof subscribeToStateChanges === 'function') {
    subscribeToStateChanges(function() {
      renderAttendanceDonutChart();
    });
  }
  
  // Populate team activity table
  populateTeamActivityTable();
  
  // Subscribe to state changes to update table
  if (typeof subscribeToStateChanges === 'function') {
    subscribeToStateChanges(function() {
      populateTeamActivityTable();
    });
  }

  // Filter tag interactions (Dashboard only - no modal)
  const filterTags = document.querySelectorAll('.filter-tag');
  filterTags.forEach(tag => {
    tag.addEventListener('click', function() {
      const group = this.closest('.filter-group, .filters-right');
      if (group) {
        group.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        // Re-populate table when filter changes
        populateTeamActivityTable();
      }
    });
  });

  // Pagination interactions
  const paginationBtns = document.querySelectorAll('.pagination-btn');
  paginationBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      paginationBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Calendar navigation is handled by calendar.js

  // Modal functionality is handled by modal.js

});

// Calendar functionality is handled by calendar.js
// Time and date updates are handled by calendar.js
