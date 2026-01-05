// Rewards Screen JavaScript

// User Points
let userPoints = 420; // Based on "Your position" section showing 420 points

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  
  // Update redeem button states based on user points
  updateRedeemButtons();
  
  // Request leave button handler
  // Note: The "Request leave" button opens the modal (handled by modal.js)
  // This is just a placeholder - modal.js handles the actual opening

  // Redeem button handlers
  const redeemButtons = document.querySelectorAll('.btn-redeem');
  redeemButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (this.disabled || this.classList.contains('disabled')) {
        return;
      }
      
      const pointsRequired = parseInt(this.getAttribute('data-points'));
      const rewardCard = this.closest('.reward-card');
      const rewardName = rewardCard.querySelector('.reward-name')?.textContent || 'Reward';
      
      if (userPoints < pointsRequired) {
        alert(`Insufficient points. You need ${pointsRequired} points but only have ${userPoints}.`);
        return;
      }
      
      if (confirm(`Redeem ${rewardName} for ${pointsRequired} points?`)) {
        userPoints -= pointsRequired;
        updateRedeemButtons();
        updatePositionStats();
        alert(`Successfully redeemed ${rewardName}! Your reward is pending approval.`);
      }
    });
  });
});

// Update redeem button states
function updateRedeemButtons() {
  const redeemButtons = document.querySelectorAll('.btn-redeem');
  redeemButtons.forEach(button => {
    const pointsRequired = parseInt(button.getAttribute('data-points'));
    
    if (userPoints >= pointsRequired) {
      button.disabled = false;
      button.classList.remove('disabled');
    } else {
      button.disabled = true;
      button.classList.add('disabled');
    }
  });
}

// Update position stats display
function updatePositionStats() {
  const statValue = document.querySelector('.stat-value');
  if (statValue) {
    statValue.textContent = `${userPoints.toLocaleString()} Total points`;
  }
}
