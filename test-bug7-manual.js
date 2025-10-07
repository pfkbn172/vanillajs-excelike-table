// Manual test script for Bug#7
console.log('Starting Bug#7 manual test...');

setTimeout(async () => {
  // 1. Open filter panel
  console.log('Step 1: Opening Join Date filter...');
  document.querySelector('[data-column="joinDate"]').closest('.table-header').querySelector('.filter-btn').click();
  
  await new Promise(r => setTimeout(r, 500));
  
  // 2. Switch to range tab
  console.log('Step 2: Switching to range tab...');
  document.querySelector('[data-mode="range"]').click();
  
  await new Promise(r => setTimeout(r, 500));
  
  // 3. Set start date
  console.log('Step 3: Setting start date to 2019-01-01...');
  const minInput = document.querySelector('.date-range-min');
  minInput.value = '2019-01-01';
  minInput.dispatchEvent(new Event('input'));
  
  await new Promise(r => setTimeout(r, 500));
  
  // 4. Click OK
  console.log('Step 4: Clicking OK...');
  document.querySelector('.filter-btn-confirm').click();
  
  await new Promise(r => setTimeout(r, 1000));
  
  // 5. Reopen filter panel
  console.log('Step 5: Reopening filter panel...');
  document.querySelector('[data-column="joinDate"]').closest('.table-header').querySelector('.filter-btn').click();
  
  await new Promise(r => setTimeout(r, 500));
  
  // 6. Check the value
  const reopenedMinInput = document.querySelector('.date-range-min');
  console.log('Step 6: Checking reopened filter panel...');
  console.log('  Input value:', reopenedMinInput.value);
  console.log('  Expected: 2019-01-01');
  console.log('  State value:', window.table1.state.dateRangeFilters.joinDate);
  
  if (reopenedMinInput.value === '2019-01-01') {
    console.log('✅ BUG#7 FIXED!');
  } else {
    console.log('❌ BUG#7 STILL EXISTS!');
  }
}, 1000);
