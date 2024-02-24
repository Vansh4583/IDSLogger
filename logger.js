const { exec } = require('child_process');
const notifier = require('node-notifier');

const storedEvents = new Set(); // Using a Set to store unique events
let minutesPassed = 0;

// Function to retrieve folder access logs from the Windows Security log
function retrieveFolderAccessLogs() {
  if (minutesPassed >= 10) {
    console.log('Script terminated');
    return;
  }
  // exec command which returns object name of the first 30 security logs
  exec('powershell.exe -Command "Get-WinEvent -LogName Security -MaxEvents 30 | ForEach-Object { $_.Properties[6].Value }"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error retrieving folder access logs: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    // Call function to check for suspicious activity
    checkForFolderAccessActivity(stdout);
  });
}

// Function to check for folder access activity in the log entries
function checkForFolderAccessActivity(log) {
  if (log) {
    const logsArray = log.split('\n'); // Split the log into an array of individual log entries
    
    logsArray.forEach((entry) => {
      if (entry.includes('TestFolder') && !storedEvents.has(entry)) {
        // Log the folder access activity
        console.log("Activity detected for TestFolder");

        // Trigger an alert
        notifier.notify({
          title: 'Folder Access Activity Detected',
          message: 'TestFolder was accessed',
          sound: true,
          wait: true
        });

        // Add log to set
        storedEvents.add(entry);
      }
    });
  }


}

// Interval to retrieve folder access logs at every 1 minute
const intervalId = setInterval(() => {
  retrieveFolderAccessLogs();
  minutesPassed++;
}, 60000);

// Set a timeout to terminate the script after 10 minutes
setTimeout(() => {
  clearInterval(intervalId); // Clear the interval
  console.log('Script terminated');
}, 600000); // 

// Initial log retrieval when the script starts
retrieveFolderAccessLogs();
