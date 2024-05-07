document.getElementById('wordForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    let words = [];
    let frequencies = [];
    let totalScore = 0; // Initialize totalScore

    for (let i = 1; i <= 10; i++) {
        let word = document.getElementById(`word${i}`).value.trim();
        if (word) {
            words.push(word);
            const response = await fetch(`https://api.datamuse.com/words?sp=${word}&md=f&max=1`);
            const data = await response.json();
            const frequency = data[0] && data[0].tags ? parseFloat(data[0].tags.find(tag => tag.startsWith('f:')).split(':')[1]) : 0;
            frequencies.push(frequency);
            totalScore += frequency; // Add each word's frequency to totalScore
        }
    }

    // Calculate average score based on frequencies
    const averageScore = totalScore / words.length;

    // Determine the uniqueness of the inputs
    let uniquenessMessage;
    const thresholdHigh = 20; // Define a high threshold for averageScore
    const thresholdLow = 10; // Define a low threshold for averageScore
    if (averageScore > thresholdHigh) {
        uniquenessMessage = "Your inputs are highly unique!";
    } else if (averageScore > thresholdLow) {
        uniquenessMessage = "Your inputs are moderately unique.";
    } else {
        uniquenessMessage = "Your inputs are not very unique. Try to think of more uncommon words!";
    }
    document.getElementById('uniquenessResult').textContent = uniquenessMessage;

    // Print average score
    document.getElementById('averageScoreResult').textContent = `Average Score: ${averageScore.toFixed(2)}`;

    // Provide performance feedback
    let performanceMessage;
    if (averageScore >= 15) {
        performanceMessage = "Great job! You're very creative!";
    } else if (averageScore >= 10) {
        performanceMessage = "Good job! You have some creativity!";
    } else {
        performanceMessage = "Keep practicing to improve your creativity!";
    }
    document.getElementById('performanceResult').textContent = performanceMessage;

    // Chart generation
    const ctx = document.getElementById('wordFrequencyChart').getContext('2d');
    if (window.wordFrequencyChart instanceof Chart) {
        window.wordFrequencyChart.destroy();
    }
    window.wordFrequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: words,
            datasets: [{
                label: 'Word Frequencies',
                data: frequencies,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
