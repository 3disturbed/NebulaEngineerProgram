window.labDefinitions = {
    'labBtn-1b-0': {
        title: 'TimeService Math Lab',
        initialCode: `// Try the millisecond to hour conversion!
// Modify these values and see what happens

const milliseconds1 = 3600000;  // 1 hour
const milliseconds2 = 7200000;  // 2 hours
const milliseconds3 = 10800000; // 3 hours

// Convert to hours
const hours1 = milliseconds1 / (1000 * 60 * 60);
const hours2 = milliseconds2 / (1000 * 60 * 60);
const hours3 = milliseconds3 / (1000 * 60 * 60);

console.log('Example 1: ' + milliseconds1 + ' ms = ' + hours1 + ' hours');
console.log('Example 2: ' + milliseconds2 + ' ms = ' + hours2 + ' hours');
console.log('Example 3: ' + milliseconds3 + ' ms = ' + hours3 + ' hours');

// Now test Math.floor()
console.log('\\n--- Math.floor() Examples ---');
console.log('Math.floor(1.1) = ' + Math.floor(1.1));
console.log('Math.floor(1.9) = ' + Math.floor(1.9));
console.log('Math.floor(2.5) = ' + Math.floor(2.5));
console.log('Math.floor(3.0) = ' + Math.floor(3.0));

// Try changing the milliseconds values and re-running!`
    },
    'labBtn-1b-1': {
        title: 'TimeService Test Lab',
        initialCode: `// Simulate getting hours since launch

// Game launched: Dec 5, 2025 at 00:00:00 UTC
const launchDate = new Date('2025-12-05T00:00:00Z');

// Current time (this will be your actual current time when you run it)
const now = new Date();

// Calculate milliseconds since launch
const millisecondsSinceLaunch = now - launchDate;

// Convert to hours
const hours = millisecondsSinceLaunch / (1000 * 60 * 60);

// Round down
const hsl = Math.floor(hours);

console.log('=== TimeService Test ===');
console.log('Current time: ' + now.toLocaleString());
console.log('Launch date: ' + launchDate.toUTCString());
console.log('Milliseconds since launch: ' + millisecondsSinceLaunch);
console.log('Hours: ' + hours);
console.log('HSL (floored): ' + hsl);

// Test top of hour
const minutes = now.getMinutes();
const isTopOfHour = minutes === 0 || minutes === 1;
console.log('\\nCurrent minute: ' + minutes);
console.log('Top of hour? ' + isTopOfHour);`
    },
    'labBtn-1c-0': {
        title: 'Logger Lab',
        initialCode: `// Test different log levels with timestamps

// Simple logger function
function formatLog(level, message) {
  const timestamp = new Date().toISOString();
  return '[' + timestamp + '] [' + level + '] ' + message;
}

// Log examples
console.log(formatLog('INFO', 'Market service started'));
console.log(formatLog('WARN', 'Price calculation took 1.5 seconds'));
console.log(formatLog('ERROR', 'Failed to read markets.json: ENOENT'));
console.log(formatLog('DEBUG', 'Calculating demand ratio'));

// Try with actual data objects
console.log('\\n=== With Data Objects ===');
const tradeData = { player: 'Alice', item: 'iron_ore', quantity: 100, price: 50 };
console.log(formatLog('INFO', 'Trade executed'));
console.log('Data:', tradeData);

const errorData = { file: 'markets.json', error: 'ENOENT', errno: -2 };
console.log('\\n' + formatLog('ERROR', 'File read failed'));
console.log('Error details:', errorData);

// Modify the message, level, or data and run again!`
    },
    'labBtn-1d-0': {
        title: 'Market Config Lab',
        initialCode: `// Test configuration values and calculations

const config = {
  updateIntervalSeconds: 3600,
  federationBuyMarkup: 0.10,
  federationSellMarkup: 10.0,
  maxPriceIncreasePerHour: 0.15,
  maxPriceDecreasePerHour: 0.10,
  basePrices: {
    iron_ore: 50,
    copper_ore: 75,
    uranium_ore: 500
  }
};

console.log('=== Market Configuration ===\\n');

// Test Federation pricing
const ironPrice = 200; // Market price
const federationBuy = ironPrice * config.federationBuyMarkup;
const federationSell = ironPrice * config.federationSellMarkup;

console.log('Iron Ore Market Price: ' + ironPrice + ' credits');
console.log('Federation pays you: ' + federationBuy + ' credits (OUCH!)');
console.log('Federation charges you: ' + federationSell + ' credits (WOW!)');
console.log('You lose ' + (ironPrice - federationBuy) + ' credits if you sell');
console.log('You pay ' + (federationSell - ironPrice) + ' credits extra if you buy\\n');

// Test price limits
const currentPrice = 100;
const demandAdjustment = 0.25; // 25% from demand
const cappedIncrease = Math.min(demandAdjustment, config.maxPriceIncreasePerHour);
const newPrice = currentPrice * (1 + cappedIncrease);

console.log('Current Price: ' + currentPrice);
console.log('Uncapped Increase: +' + (demandAdjustment * 100) + '%');
console.log('Price Cap: +' + (config.maxPriceIncreasePerHour * 100) + '%');
console.log('Applied Increase: +' + (cappedIncrease * 100) + '%');
console.log('New Price: ' + newPrice + '\\n');

// Try changing config values and see what happens!`
    },
    'labBtn-2-0': {
        title: 'Safe Write Lab',
        initialCode: `// Simulate the Safe Write Pattern
// We can't write real files here, but we can simulate the logic!

const fileSystem = {
  'markets.json': '{"old": "data"}'
};

async function safeWrite(filename, data) {
  console.log('Starting safe write for: ' + filename);
  
  // 1. Create temp filename
  const tempFile = filename + '.tmp';
  console.log('1. Writing to temp file: ' + tempFile);
  
  // Simulate write
  fileSystem[tempFile] = JSON.stringify(data);
  console.log('   Write complete. Temp file exists.');
  
  // 2. Verify (simulate check)
  if (!fileSystem[tempFile]) {
    throw new Error('Write failed!');
  }
  console.log('2. Verification successful.');
  
  // 3. Rename (Atomic Swap)
  console.log('3. Renaming ' + tempFile + ' -> ' + filename);
  fileSystem[filename] = fileSystem[tempFile];
  delete fileSystem[tempFile];
  
  console.log('✅ SUCCESS! File saved safely.');
}

// Test it!
const newData = { price: 200, updated: new Date() };
safeWrite('markets.json', newData)
  .then(() => {
    console.log('\\nFinal File System State:');
    console.log(JSON.stringify(fileSystem, null, 2));
  });`
    },
    'labBtn-3-0': {
        title: 'Demand Ratio Lab',
        initialCode: `// Calculate Demand Ratio
// Formula: buyVolume / (buyVolume + sellVolume)

function analyzeMarket(buyVolume, sellVolume) {
  const total = buyVolume + sellVolume;
  
  console.log('--- Market Analysis ---');
  console.log('Buys: ' + buyVolume);
  console.log('Sells: ' + sellVolume);
  console.log('Total: ' + total);
  
  if (total === 0) {
    console.log('Ratio: 0.5 (Neutral - No trades)');
    return;
  }
  
  const ratio = buyVolume / total;
  console.log('Ratio: ' + ratio.toFixed(2));
  
  if (ratio >= 0.8) console.log('Verdict: 🔥 HIGH DEMAND (Price UP)');
  else if (ratio <= 0.2) console.log('Verdict: 📉 PANIC SELLING (Price DOWN)');
  else console.log('Verdict: ⚖️ BALANCED (Price Stable)');
}

// Test Cases
analyzeMarket(8000, 2000); // High demand
console.log('');
analyzeMarket(1000, 4000); // Panic selling
console.log('');
analyzeMarket(500, 500);   // Balanced`
    },
    'labBtn-4-0': {
        title: 'Price Formula Lab',
        initialCode: `// Test the Price Calculation Formula

function calculatePrice(currentPrice, demandRatio) {
  console.log('Current Price: ' + currentPrice);
  console.log('Demand Ratio: ' + demandRatio);
  
  // 1. Calculate Pressure (-1 to +1)
  // (0.8 - 0.5) * 2 = 0.6
  const pressure = (demandRatio - 0.5) * 2;
  console.log('Pressure: ' + pressure.toFixed(2));
  
  // 2. Calculate Adjustment (Max 10%)
  const maxChange = 0.10;
  const adjustment = currentPrice * pressure * maxChange;
  console.log('Adjustment: ' + adjustment.toFixed(2));
  
  // 3. New Price
  const newPrice = Math.floor(currentPrice + adjustment);
  console.log('New Price: ' + newPrice);
  console.log('-------------------');
  return newPrice;
}

// Test: High Demand
calculatePrice(100, 0.8);

// Test: Low Demand
calculatePrice(100, 0.2);

// Test: Neutral
calculatePrice(100, 0.5);`
    }
};