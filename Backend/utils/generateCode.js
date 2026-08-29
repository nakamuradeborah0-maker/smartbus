function generateTrackingNumber() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PAR-${year}-${randomNum}`;
}

function generateTrackerCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TRK-${randomNum}`;
}

function generateTripNumber() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `GV-${randomNum}`;
}

module.exports = {
  generateTrackingNumber,
  generateTrackerCode,
  generateTripNumber,
};
