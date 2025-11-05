# Network Connection Checker

A web-based application that monitors network connectivity in real-time by testing internet connections every second for up to one hour.

## Features

- **Real-time Monitoring**: Tests network connectivity every second
- **Visual Graph**: Displays connection status over time using Chart.js
- **Connection Breaks Tracking**: Records and displays all connection interruptions
- **Detailed Statistics**: Shows elapsed time, test count, and success rate
- **Break Analysis**: Table showing start time, end time, and duration of each connection break
- **Automatic Duration**: Runs for exactly one hour, then stops automatically

## How It Works

The application tests connectivity by attempting to fetch resources from multiple reliable endpoints:
- Google's favicon
- Cloudflare's favicon  
- HTTPBin status endpoint

Using multiple endpoints ensures more reliable detection of actual internet connectivity issues rather than single-site problems.

## Usage

1. Open `index.html` in your web browser
2. Click "Start Monitoring" to begin the one-hour test
3. Watch the real-time graph and statistics update every second
4. Review connection breaks in the table below the graph
5. Click "Stop Monitoring" to end the test early if needed

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: Chart.js for real-time graphing
- **Testing Method**: HTTP HEAD requests with 5-second timeout
- **Cross-Origin**: Uses `no-cors` mode for broader compatibility
- **Performance**: Maintains only the last 60 data points on the graph for optimal performance

## Browser Compatibility

Works in all modern browsers that support:
- Fetch API
- Promise.any()
- AbortController
- ES6+ features

## Files

- `index.html` - Main application interface
- `styles.css` - Responsive CSS styling
- `script.js` - Network checking logic and Chart.js integration
- `.github/copilot-instructions.md` - Development guidelines

## Development

This is a static web application requiring no server-side components. Simply open `index.html` in any modern web browser to use.