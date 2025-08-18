// Test occurrence counting for "end after n times" functionality
console.log("=== Testing Occurrence Counting for 'End After N Times' ===");

// Mock the utility functions
function getDayName(date) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[date.getDay()];
}

function normalizeDayName(dayName) {
  const dayMap = {
    'Mon': 'monday',
    'Tue': 'tuesday', 
    'Wed': 'wednesday',
    'Thu': 'thursday',
    'Fri': 'friday',
    'Sat': 'saturday',
    'Sun': 'sunday',
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday', 
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday'
  };
  return dayMap[dayName] || dayName;
}

function getOccurrenceCountForSlot(slot, targetDate) {
  console.log('getOccurrenceCountForSlot called with:', { slotId: slot.id, targetDate: targetDate.toDateString() });
  
  if (slot.frequency === 'never') return 0;
  
  // Start from the slot's creation date
  const slotStartDate = slot.createdAt ? new Date(slot.createdAt) : new Date();
  slotStartDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);
  
  console.log('Counting from:', slotStartDate.toDateString(), 'to:', endDate.toDateString());
  
  let count = 0;
  let currentDate = new Date(slotStartDate);
  
  while (currentDate <= endDate) {
    const dayName = getDayName(currentDate);
    const normalizedDayName = normalizeDayName(dayName);
    
    if (slot.days.includes(normalizedDayName)) {
      count++;
      console.log('Found occurrence on:', currentDate.toDateString(), 'count:', count);
    }
    
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  console.log('Final count:', count);
  return count;
}

// Test case: Recurring slot that ends after 3 occurrences
const testSlot = {
  id: 'test-1',
  frequency: 'weekly',
  days: ['monday', 'wednesday', 'friday'],
  ends: 'after_occurrences',
  occurrences: 3,
  createdAt: '2025-08-18T00:00:00.000Z', // August 18, 2025 (today)
  startTime: '10:00',
  endTime: '18:00'
};

console.log("Test slot:", {
  frequency: testSlot.frequency,
  days: testSlot.days,
  ends: testSlot.ends,
  occurrences: testSlot.occurrences,
  createdAt: testSlot.createdAt
});

// Test just one date first
const testDate = new Date('2025-08-20'); // Wednesday
console.log("\nTesting single date:", testDate.toDateString());
const count = getOccurrenceCountForSlot(testSlot, testDate);
const shouldShow = count < testSlot.occurrences;
console.log(`Result: count=${count}, shouldShow=${shouldShow}`);

console.log("\n=== Test Complete ===");
