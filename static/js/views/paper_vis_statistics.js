let allPapers = [];

const start = () => {
    Promise.all([API.getPapers()])
        .then(([papers]) => {
        allPapers = papers;
        drawKeywordsStatistics(allPapers);
        })
        .catch((e) => console.error(e));
}


const drawKeywordsStatistics = (allPapers) => {
    const keywords2freq = {};
    for (let paper of allPapers) {
        for (let keyword of paper.keywords) {
            //if (keyword.length > 5) keyword = keyword.substring(0, 6) + "...";
            if (! keywords2freq[keyword]) {
                keywords2freq[keyword] = 0;
            }
            keywords2freq[keyword] += 1;
        }
    }
    const keywords2freqEntries = Object.entries(keywords2freq);
    keywords2freqEntries.sort((a, b) => { if (a[1] == b[1]) { return 0; } else { return a[1] < b[1] ? 1 : -1 } });
    const keywords = keywords2freqEntries.map((entry) => entry[0]);
    const freqs = keywords2freqEntries.map((entry) => entry[1]);
    let data = [
            {
                x: freqs,
                y: keywords,
                type: 'bar',
                marker: {
                    color: 'rgb(190, 217, 114)',
                    opacity: 0.9,
                },
                orientation: 'h'
            }
    ];
    let layout = {
        margin: {
            t: 0
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { automargin: true },
        yaxis: { automargin: true },
    }
    Plotly.newPlot('keywords-statistics', data, layout);
    var myPlot = document.getElementById('keywords-statistics');
    myPlot.on('plotly_click', function(data){
        const labelClicked = data.points[0].y;
        if (labelClicked) {
            const urlToOpen = `papers.html?keyword=${labelClicked}`;
            window.open(urlToOpen, '_blank').focus();
        }
        });
}
