class NetworkChecker {
    constructor() {
        this.isRunning = false;
        this.startTime = null;
        this.intervalId = null;
        this.testCount = 0;
        this.successCount = 0;
        this.connectionBreaks = [];
        this.currentBreak = null;
        this.chart = null;
        this.currentTimeRange = 2; // Default to 2 minutes
        this.allData = {
            labels: [],
            data: [],
            timestamps: []
        };
        this.chartData = {
            labels: [],
            datasets: [{
                label: 'Connection Status',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        };
        
        // Test URLs - using multiple for better reliability
        this.testUrls = [
            'https://www.google.com/favicon.ico',
            'https://www.cloudflare.com/favicon.ico',
            'https://httpbin.org/status/200'
        ];
        
        this.initializeElements();
        this.initializeChart();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            resetBtn: document.getElementById('resetBtn'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            elapsedTime: document.getElementById('elapsedTime'),
            testCount: document.getElementById('testCount'),
            successRate: document.getElementById('successRate'),
            breaksTableBody: document.getElementById('breaksTableBody'),
            timeButtons: document.querySelectorAll('.btn-time')
        };
    }

    initializeChart() {
        const ctx = document.getElementById('connectionChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: this.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        ticks: {
                            maxTicksLimit: 20
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Connection Status'
                        },
                        min: -0.1,
                        max: 1.1,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value === 1 ? 'Connected' : value === 0 ? 'Disconnected' : '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y === 1 ? 'Connected' : 'Disconnected';
                            }
                        }
                    }
                },
                animation: {
                    duration: 0 // Disable animations for real-time updates
                },
                elements: {
                    point: {
                        radius: 2,
                        hoverRadius: 4
                    }
                }
            }
        });
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startMonitoring());
        this.elements.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.elements.resetBtn.addEventListener('click', () => this.resetMonitoring());
        
        // Time range button events
        this.elements.timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimeRange(parseInt(e.target.dataset.range));
            });
        });
    }

    async startMonitoring() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.testCount = 0;
        this.successCount = 0;
        this.connectionBreaks = [];
        this.currentBreak = null;
        
        // Clear previous data
        this.allData.labels = [];
        this.allData.data = [];
        this.allData.timestamps = [];
        this.chartData.labels = [];
        this.chartData.datasets[0].data = [];
        this.chart.update();
        this.updateBreaksTable();
        
        // Update UI
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.updateStatus('testing', 'Testing connection...');
        
        // Start the monitoring interval
        this.intervalId = setInterval(() => this.performConnectivityTest(), 1000);
        
        // Stop automatically after 8 hours
        setTimeout(() => {
            if (this.isRunning) {
                this.stopMonitoring();
            }
        }, 8 * 60 * 60 * 1000); // 8 hours = 8 * 60 * 60 * 1000 milliseconds
        
        // Update elapsed time display
        this.updateElapsedTime();
    }

    stopMonitoring() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.intervalId);
        
        // Close any ongoing break
        if (this.currentBreak) {
            this.currentBreak.endTime = Date.now();
            this.currentBreak.duration = this.formatDuration(this.currentBreak.endTime - this.currentBreak.startTime);
            this.currentBreak.status = 'resolved';
            this.currentBreak = null;
            this.updateBreaksTable();
        }
        
        // Update UI
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.updateStatus('offline', 'Monitoring stopped');
    }

    async performConnectivityTest() {
        if (!this.isRunning) return;
        
        this.testCount++;
        const timestamp = new Date().toLocaleTimeString();
        
        try {
            // Test connectivity using fetch with a timeout
            const isConnected = await this.testConnection();
            
            if (isConnected) {
                this.successCount++;
                this.handleConnectionSuccess(timestamp);
            } else {
                this.handleConnectionFailure(timestamp);
            }
        } catch (error) {
            console.error('Connection test error:', error);
            this.handleConnectionFailure(timestamp);
        }
        
        this.updateUI();
    }

    async testConnection() {
        const timeout = 5000; // 5 second timeout
        const testPromises = this.testUrls.map(url => 
            this.fetchWithTimeout(url, timeout)
        );
        
        try {
            // If any URL responds successfully, consider it connected
            await Promise.any(testPromises);
            return true;
        } catch {
            return false;
        }
    }

    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                method: 'HEAD', // Use HEAD to minimize data transfer
                mode: 'no-cors', // Allow cross-origin requests
                signal: controller.signal,
                cache: 'no-cache'
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    handleConnectionSuccess(timestamp) {
        // Add data point to all data
        this.allData.labels.push(timestamp);
        this.allData.data.push(1);
        this.allData.timestamps.push(Date.now());
        
        // Update status
        this.updateStatus('online', 'Connected');
        
        // Close any ongoing break
        if (this.currentBreak) {
            this.currentBreak.endTime = Date.now();
            this.currentBreak.duration = this.formatDuration(this.currentBreak.endTime - this.currentBreak.startTime);
            this.currentBreak.status = 'resolved';
            this.currentBreak = null;
            this.updateBreaksTable();
        }
    }

    handleConnectionFailure(timestamp) {
        // Add data point to all data
        this.allData.labels.push(timestamp);
        this.allData.data.push(0);
        this.allData.timestamps.push(Date.now());
        
        // Update status
        this.updateStatus('offline', 'Connection failed');
        
        // Start a new break if not already in one
        if (!this.currentBreak) {
            this.currentBreak = {
                id: this.connectionBreaks.length + 1,
                startTime: Date.now(),
                endTime: null,
                duration: 'Ongoing',
                status: 'ongoing'
            };
            this.connectionBreaks.push(this.currentBreak);
            this.updateBreaksTable();
        }
    }

    updateUI() {
        // Filter and update chart data based on current time range
        this.updateChartForTimeRange();
        
        // Update statistics
        this.elements.testCount.textContent = `Tests: ${this.testCount}`;
        const successRate = this.testCount > 0 ? ((this.successCount / this.testCount) * 100).toFixed(1) : 0;
        this.elements.successRate.textContent = `Success Rate: ${successRate}%`;
        
        // Update elapsed time
        this.updateElapsedTime();
    }

    updateElapsedTime() {
        if (!this.isRunning || !this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.elements.elapsedTime.textContent = `Elapsed: ${timeString}`;
        
        if (this.isRunning) {
            setTimeout(() => this.updateElapsedTime(), 1000);
        }
    }

    updateStatus(type, message) {
        this.elements.statusDot.className = `status-dot ${type}`;
        this.elements.statusText.textContent = message;
    }

    updateBreaksTable() {
        const tbody = this.elements.breaksTableBody;
        
        if (this.connectionBreaks.length === 0) {
            tbody.innerHTML = '<tr class="no-data"><td colspan="5">No connection breaks detected</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        this.connectionBreaks.forEach(breakInfo => {
            const row = document.createElement('tr');
            
            const startTime = new Date(breakInfo.startTime).toLocaleString();
            const endTime = breakInfo.endTime ? new Date(breakInfo.endTime).toLocaleString() : '-';
            const statusClass = breakInfo.status === 'ongoing' ? 'status-ongoing' : 'status-resolved';
            const statusText = breakInfo.status === 'ongoing' ? 'Ongoing' : 'Resolved';
            
            row.innerHTML = `
                <td>#${breakInfo.id}</td>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${breakInfo.duration}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
            `;
            
            tbody.appendChild(row);
        });
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    setTimeRange(minutes) {
        this.currentTimeRange = minutes;
        
        // Update button states
        this.elements.timeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.range) === minutes) {
                btn.classList.add('active');
            }
        });
        
        // Update chart display
        this.updateChartForTimeRange();
    }

    updateChartForTimeRange() {
        const now = Date.now();
        const timeRangeMs = this.currentTimeRange * 60 * 1000; // Convert minutes to milliseconds
        
        // Filter data based on current time range
        const filteredData = {
            labels: [],
            data: []
        };
        
        for (let i = 0; i < this.allData.timestamps.length; i++) {
            const dataAge = now - this.allData.timestamps[i];
            if (dataAge <= timeRangeMs) {
                filteredData.labels.push(this.allData.labels[i]);
                filteredData.data.push(this.allData.data[i]);
            }
        }
        
        // Update chart data
        this.chartData.labels = filteredData.labels;
        this.chartData.datasets[0].data = filteredData.data;
        
        // Update chart
        this.chart.update('none');
    }

    resetMonitoring() {
        // Stop current monitoring if running
        if (this.isRunning) {
            this.stopMonitoring();
        }
        
        // Reset all data
        this.testCount = 0;
        this.successCount = 0;
        this.connectionBreaks = [];
        this.currentBreak = null;
        this.startTime = null;
        
        // Clear all data arrays
        this.allData.labels = [];
        this.allData.data = [];
        this.allData.timestamps = [];
        this.chartData.labels = [];
        this.chartData.datasets[0].data = [];
        
        // Update chart
        this.chart.update();
        
        // Update UI elements
        this.elements.testCount.textContent = 'Tests: 0';
        this.elements.successRate.textContent = 'Success Rate: 0%';
        this.elements.elapsedTime.textContent = 'Elapsed: 00:00:00';
        this.updateStatus('offline', 'Ready to start');
        this.updateBreaksTable();
        
        // Reset buttons
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NetworkChecker();
});