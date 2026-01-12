// Define canvas and context globally
const canvas = document.getElementById('visualization');
const ctx = canvas.getContext('2d');

// Add event listener for DOM content loaded to ensure the canvas is ready
document.addEventListener('DOMContentLoaded', () => {
    let currentSequence = []; // Store the current sequence for tooltip access

    // Update the drawVisualization function to store the sequence
    window.drawVisualization = function(sequence, current_position, totalSectors) {
        currentSequence = sequence; // Store the sequence globally
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const margin = 50;
        const max_value = totalSectors;
        const min_value = 0;
        const range = max_value - min_value;

        // Set drawing styles
        ctx.strokeStyle = '#007bff';
        ctx.fillStyle = '#007bff';
        ctx.font = '12px Arial';
        ctx.lineWidth = 2;

        // Draw axes
        ctx.beginPath();
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin); // X-axis
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(margin, margin); // Y-axis
        ctx.strokeStyle = '#333';
        ctx.stroke();

        // Draw labels for axes
        ctx.fillStyle = '#333';
        ctx.fillText('Time', width - margin - 30, height - margin + 30); // X-axis label
        ctx.fillText('Cylinder', margin - 40, margin); // Y-axis label

        // Draw ticks and labels on Y-axis
        const tickCount = 10;
        for (let i = 0; i <= tickCount; i++) {
            const y = height - margin - (i / tickCount) * (height - 2 * margin);
            const value = min_value + (i / tickCount) * range;
            ctx.beginPath();
            ctx.moveTo(margin - 5, y);
            ctx.lineTo(margin + 5, y);
            ctx.stroke();
            ctx.fillText(Math.round(value), margin - 40, y + 5);
        }

        // Draw the sequence path
        ctx.strokeStyle = '#007bff';
        ctx.beginPath();
        ctx.moveTo(margin, height - margin - ((sequence[0] - min_value) / range) * (height - 2 * margin));

        sequence.forEach((value, index) => {
            const x = margin + (index / (sequence.length - 1)) * (width - 2 * margin);
            const y = height - margin - ((value - min_value) / range) * (height - 2 * margin);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Draw points
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#007bff';
            ctx.fill();

            // Draw value labels
            ctx.fillStyle = '#333';
            ctx.fillText(value, x - 10, y - 15);
        });
    };

    // Add mouse move event listener to the canvas
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate the corresponding index in the sequence
        const width = canvas.width;
        const margin = 50;
        const index = Math.round(((x - margin) / (width - 2 * margin)) * (currentSequence.length - 1));

        // Ensure the index is within bounds
        if (index >= 0 && index < currentSequence.length) {
            const value = currentSequence[index];
            canvas.setAttribute('data-tooltip', `Disk Request: ${value}`);
        } else {
            canvas.setAttribute('data-tooltip', 'Disk Scheduling Visualization');
        }
    });

    // Reset tooltip when mouse leaves the canvas
    canvas.addEventListener('mouseleave', () => {
        canvas.setAttribute('data-tooltip', 'Disk Scheduling Visualization');
    });
});

// Form submission handler
document.getElementById('diskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const requests = document.getElementById('requests').value.split(',').map(Number);
    const currentPosition = parseInt(document.getElementById('currentPosition').value, 10);
    const totalSectors = parseInt(document.getElementById('totalSectors').value, 10);
    const algorithm = document.getElementById('algorithm').value;

    let result;
    switch (algorithm) {
        case 'fcfs':
            result = fcfs(requests, currentPosition);
            break;
        case 'sstf':
            result = sstf(requests, currentPosition);
            break;
        case 'scan':
            result = scan(requests, currentPosition, totalSectors);
            break;
        case 'cscan':
            result = cscan(requests, currentPosition, totalSectors);
            break;
        case 'look':
            result = look(requests, currentPosition);
            break;
        case 'clook':
            result = clook(requests, currentPosition);
            break;
    }

    document.getElementById('result').innerText = `Total Head Movement: ${result.totalHeadMovement}`;
    drawVisualization(result.sequence, currentPosition, totalSectors);
});

function fcfs(requests, current_position) {
    let total_head_movement = 0;
    const sequence = [current_position];
    for (let i = 0; i < requests.length; i++) {
        total_head_movement += Math.abs(requests[i] - current_position);
        current_position = requests[i];
        sequence.push(current_position);
    }
    return { totalHeadMovement: total_head_movement, sequence: sequence };
}

function sstf(requests, current_position) {
    let total_head_movement = 0;
    const sequence = [current_position];
    let requestsCopy = requests.slice();

    while (requestsCopy.length > 0) {
        let nearest_request_index = 0;
        let nearest_seek_time = Math.abs(requestsCopy[0] - current_position);
        for (let i = 1; i < requestsCopy.length; i++) {
            let seek_time = Math.abs(requestsCopy[i] - current_position);
            if (seek_time < nearest_seek_time) {
                nearest_request_index = i;
                nearest_seek_time = seek_time;
            }
        }
        total_head_movement += nearest_seek_time;
        current_position = requestsCopy[nearest_request_index];
        sequence.push(current_position);
        requestsCopy.splice(nearest_request_index, 1);
    }
    return { totalHeadMovement: total_head_movement, sequence: sequence };
}

function scan(requests, current_position, totalSectors) {
    let total_head_movement = 0;
    const sequence = [current_position];
    let sortedRequests = requests.slice().sort((a, b) => a - b);
    let index = sortedRequests.findIndex(req => req >= current_position);
    if (index === -1) index = sortedRequests.length;

    for (let i = index; i < sortedRequests.length; i++) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    total_head_movement += Math.abs(totalSectors - current_position);
    current_position = totalSectors;
    sequence.push(current_position);

    for (let i = index - 1; i >= 0; i--) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    return { totalHeadMovement: total_head_movement, sequence: sequence };
}

function cscan(requests, current_position, totalSectors) {
    let total_head_movement = 0;
    const sequence = [current_position];
    let sortedRequests = requests.slice().sort((a, b) => a - b);
    let index = sortedRequests.findIndex(req => req >= current_position);
    if (index === -1) index = sortedRequests.length;

    for (let i = index; i < sortedRequests.length; i++) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    total_head_movement += Math.abs(totalSectors - current_position);
    current_position = totalSectors;
    sequence.push(current_position);

    total_head_movement += Math.abs(0 - current_position);
    current_position = 0;
    sequence.push(current_position);

    for (let i = 0; i < index; i++) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    return { totalHeadMovement: total_head_movement, sequence: sequence };
}

function look(requests, current_position) {
    let total_head_movement = 0;
    const sequence = [current_position];
    let sortedRequests = requests.slice().sort((a, b) => a - b);
    let index = sortedRequests.findIndex(req => req >= current_position);
    if (index === -1) index = sortedRequests.length;

    for (let i = index; i < sortedRequests.length; i++) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    for (let i = index - 1; i >= 0; i--) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    return { totalHeadMovement: total_head_movement, sequence: sequence };
}

function clook(requests, current_position) {
    let total_head_movement = 0;
    const sequence = [current_position];
    let sortedRequests = requests.slice().sort((a, b) => a - b);
    let index = sortedRequests.findIndex(req => req >= current_position);
    if (index === -1) index = sortedRequests.length;

    for (let i = index; i < sortedRequests.length; i++) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    for (let i = 0; i < index; i++) {
        total_head_movement += Math.abs(sortedRequests[i] - current_position);
        current_position = sortedRequests[i];
        sequence.push(current_position);
    }

    return { totalHeadMovement: total_head_movement, sequence: sequence };
}