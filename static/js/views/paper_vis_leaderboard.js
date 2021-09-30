let allPapers = [];

const start = () => {
    Promise.all([API.getPapers()])
        .then(([papers]) => {
        allPapers = papers;
            drawTaskLeaderboard(allPapers);
            drawTechniqueLeaderboard(allPapers);
        })
        .catch((e) => console.error(e));
}

const drawTaskLeaderboard = (allPapers) => {
    console.log("drawing task leaderboard with ", allPapers);
    const tasks2freq = {};
    for (let paper of allPapers) {
        for (let task of paper.Tasks) {
            if (! tasks2freq[task]) {
                tasks2freq[task] = 0;
            }
            tasks2freq[task] += 1;
        }
    }
    const tasks2freqEntries = Object.entries(tasks2freq);
    tasks2freqEntries.sort((a, b) => { if (a[1] == b[1]) { return 0; } else { return a[1] < b[1] ? 1 : -1 } });
    const tasks = tasks2freqEntries.map((entry) => entry[0]);
    const freqs = tasks2freqEntries.map((entry) => entry[1]);
    let data = [
            {
                x: tasks,
                y: freqs,
                type: 'bar',
                marker: {
                    color: 'rgb(190, 217, 114)',
                    opacity: 0.9,
                }
            }
    ];
    let layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { automargin: true },
        yaxis: { automargin: true },
    }
    Plotly.newPlot('task-leaderboard', data, layout);
    var myPlot = document.getElementById('task-leaderboard');
    myPlot.on('plotly_click', function(data){
        const labelClicked = data.points[0].x;
        if (labelClicked) {
            const urlToOpen = `papers.html?keyword=${labelClicked}`;
            console.log(urlToOpen);
            window.open(urlToOpen, '_blank').focus();
        }
        });
}

const drawTechniqueLeaderboard = (allPapers) => {
    const techniques2freq = {};
    for (let paper of allPapers) {
        for (let technique of paper.Techniques) {
            if (! techniques2freq[technique]) {
                techniques2freq[technique] = 0;
            }
            techniques2freq[technique] += 1;
        }
    }
    const techniques2freqEntries = Object.entries(techniques2freq);
    techniques2freqEntries.sort((a, b) => { if (a[1] == b[1]) { return 0; } else { return a[1] < b[1] ? 1 : -1 } });
    const techniques = techniques2freqEntries.map((entry) => entry[0]);
    const freqs = techniques2freqEntries.map((entry) => entry[1]);
    let data = [
            {
                x: techniques,
                y: freqs,
                type: 'bar',
                marker: {
                    color: 'rgb(190, 217, 114)',
                    opacity: 0.9,
                }
            }
    ];
    let layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { automargin: true },
        yaxis: { automargin: true },
    }
    Plotly.newPlot('technique-leaderboard', data, layout);
    var myPlot = document.getElementById('technique-leaderboard');
    myPlot.on('plotly_click', function(data){
        const labelClicked = data.points[0].x;
        if (labelClicked) {
            const urlToOpen = `papers.html?keyword=${labelClicked}`;
            console.log(urlToOpen);
            window.open(urlToOpen, '_blank').focus();
        }
        });
}
