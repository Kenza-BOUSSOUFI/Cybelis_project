import { ScanEngine } from '../lib/scanEngine';

async function main() {
  console.log('Starting full scan test on google.com...');
  try {
    const report = await ScanEngine.runFullScan('google.com');
    console.log('Scan completed successfully!');
    console.log('Global Score:', report.globalScore, 'Grade:', report.globalGrade);
    console.log('Modules included:', Object.keys(report.modules));
  } catch (err) {
    console.error('Scan error:', err);
  }
}

main();
