let citationGraph = null;

let allPapers = [];
let filteredPapers = [];
const allKeys = {
  authors: [],
  keywords: [],
  titles: [],
  nicknames: [],
  dates: [],
  venues: []
};

var filters = [
  {
    filterID: 0,
    filterType: "titleAndNickname",
    filterValue: ""
  }
];

var nextFilterID = 1;

var latestNumPapaersFilteredOut = null;

const start = () => {
  Promise.all([API.getPapers()])
    .then(([papers]) => {
      allPapers = papers;
      filteredPapers = allPapers;
      latestNumPapaersFilteredOut = allPapers.length;
      d3.select("#displaying-number-of-papers-message")
        .html(`<span>Displaying ${allPapers.length} papers</span>`);
      calcAllKeys(allPapers, allKeys);
      initTypeAhead([...allKeys.titles, ...allKeys.nicknames], ".titleAndNicknameTypeahead", "titleAndNickname", setTitleAndNicknameFilter);
      addNewFilter("author", "");
      addNewFilter("keyword", "");
      addNewFilter("venue", "");
      addNewFilter("date", "");
        drawCitationGraph(allPapers);
    })
    .catch((e) => console.error(e));
};

/**
 * Functions for trigger filtering on papers
 */
const triggerFiltering = () => {
  filteredPapers = allPapers;

  const onlyShowPapersWithCode = document.getElementById("onlyShowPapersWithCodeCheckbox").checked;
  if (onlyShowPapersWithCode) {
    filteredPapers = allPapers.filter((paper) => paper.code_link !== "");
  }

  const onlyShowPeerReviewedPapers = document.getElementById("onlyShowPeerReviewedPapersCheckbox").checked;
  if (onlyShowPeerReviewedPapers) {
    filteredPapers = filteredPapers.filter((paper) => !(paper.venue.includes("ARXIV") || paper.venue.includes("OpenReview")));
  }
  
  // filter by title / nickname
  const titleAndNicknameFilterValue = filters[0].filterValue
  if (titleAndNicknameFilterValue !== "") {
    filteredPapers = filteredPapers.filter((paper) =>
      paper.title.toLowerCase().includes(titleAndNicknameFilterValue.toLowerCase()) || paper.nickname.toLowerCase().includes(titleAndNicknameFilterValue.toLowerCase()))
  }

  // filter by author, keyword, date
  const authorFilters = [];
  const keywordFilters = [];
  const venueFilters = [];
  const dateFilters = [];
  filters.forEach((filter) => {
    if (filter.filterType === "author" && filter.filterValue !== "") {
      authorFilters.push(filter.filterValue);
    }
    else if (filter.filterType === "keyword" && filter.filterValue !== "") {
      keywordFilters.push(filter.filterValue);
    }
    else if (filter.filterType === "venue" && filter.filterValue !== "") {
      venueFilters.push(filter.filterValue);
    }
    else if (filter.filterType === "date" && filter.filterValue !== "") {
      dateFilters.push(filter.filterValue);
    }
  });

  if (authorFilters.length > 0) {
    filteredPapers = filteredPapers.filter((paper) => {
      let filteredByAuthor = false;
      for (authorFilter of authorFilters) {
        if (paper.authors.includes(authorFilter)) {
          filteredByAuthor = true;
          break;
        }
      }
      return filteredByAuthor;
    });
  }

  if (keywordFilters.length > 0) {
    filteredPapers = filteredPapers.filter((paper) => {
      let filteredByKeyword = false;
      for (keywordFilter of keywordFilters) {
        if (paper.keywords.includes(keywordFilter)) {
          filteredByKeyword = true;
          break;
        }
      }
      return filteredByKeyword;
    });
  }

  if (venueFilters.length > 0) {
    filteredPapers = filteredPapers.filter((paper) => {
    let filteredByVenue = false;
    for (venueFilter of venueFilters) {
      if (paper.venue.includes(venueFilter)) {
        filteredByVenue = true;
        break;
      }
    }
    return filteredByVenue;
    });
  }
  
  if (dateFilters.length > 0) {
    filteredPapers = filteredPapers.filter((paper) => {
    let filteredByDate = false;
    const paperDate = moment(paper.date, "MM/DD/YYYY");
    for (dateRange of dateFilters) {
      let startDate = dateRange.split("/")[0];
      startDate = moment(startDate, "YYYY-MM-DD");
      let endDate = dateRange.split("/")[1];
      endDate = moment(endDate, "YYYY-MM-DD");
      if (paperDate.isBetween(startDate, endDate) || paperDate.isSame(startDate) || paperDate.isSame(endDate))
      {
        filteredByDate = true;
        break;
      }
    }
    return filteredByDate;
    });
  }

  if (filteredPapers.length !== latestNumPapaersFilteredOut) {
    latestNumPapaersFilteredOut = filteredPapers.length;
    d3.select("#displaying-number-of-papers-message")
      .html(`<span>Displaying ${filteredPapers.length} papers</span>`);
    drawCitationGraph(filteredPapers);
  }
}

function getHtmlInfoBox(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

const prettifyTitle = (title) => {
  let prettyTitle = "<h5>";
  const words = title.split(" ");
  for (let i = 0; i < words.length; ++i) {
    prettyTitle += `${words[i]} `;
    if (i % 5 === 0 && i !== 0) prettyTitle += "</h5><h5>";
  }
  prettyTitle += "</h5>";
  return prettyTitle;
};

const prettifyAuthors = (authors) => {
  let prettyAuthors = "<p>";
  for (let i = 0; i < authors.length; ++i) {
    prettyAuthors += authors[i];
    if (i != authors.length - 1) prettyAuthors += ", ";
    if (i % 4 == 0 && i != 0) prettyAuthors += "</p><p>";
  }
  prettyAuthors += "</p>";
  return prettyAuthors;
};

const prettifyKeywords = (keywords) => {
  let prettyKeywords = "<p><span>Keywords: </span>";
  for (let i = 0; i < keywords.length; ++i) {
    prettyKeywords += keywords[i];
    if (i != keywords.length - 1) prettyKeywords += ", ";
    if (i % 2 == 0 && i != 0) prettyKeywords += "</p><p>";
  }
  prettyKeywords += "</p>";
  return prettyKeywords;
};

const generatePaperInfoBox = (paper) => {
  return `
  ${prettifyTitle(paper.title)}
  ${prettifyAuthors(paper.authors)}
  <h6>${paper.date}</h6>
  ${prettifyKeywords(paper.keywords)}
  `;
};

const generateNodes = (papers, isCurrentPaper) => {
  papers = papers.filter((paper) => paper.UID);
  return papers.map((paper) => {
    return {
      id: paper.UID,
      label:
        paper.nickname !== ""
          ? paper.nickname
          : `${paper.title.substring(0, 6)}...`,
      color: isCurrentPaper ? "#ff7f7f" : "#9fc2f7",
      title: getHtmlInfoBox(generatePaperInfoBox(paper)),
    };
  });
};

const generateEdges = (thisPaperID, otherPaperIDs, isInEdge) => {
  return otherPaperIDs.map((paperID) => {
    if (isInEdge) {
      return {
        from: paperID,
        to: thisPaperID,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.4,
          },
        },
        font: { align: "middle" },
          color: "green",
        physics: false,
      };
    }

    return {
      from: thisPaperID,
      to: paperID,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.4,
        },
      },
      font: { align: "middle" },
        color: "orange",
      physics: false,
    };
  });
};

const drawCitationGraph = (papers) => {
  Promise.all([API.getCitationGraphData()])
    .then(([citationGraphData]) => {
        let nodes = [];
        let outEdges = [];
          for (paper of papers) {
            const thisID = paper.UID;
            nodes = [...generateNodes(papers, false)];
            outEdges = [...outEdges, ...generateEdges(thisID, citationGraphData[thisID].out_edge, false)];
          }
         
        var nodesDataSet = new vis.DataSet(nodes);

        // create an array with edges
        var edgesDataSet = new vis.DataSet(outEdges);

        // create a network
        var container = document.getElementById("citationGraph");
        var data = {
        nodes: nodesDataSet,
        edges: edgesDataSet,
        };
          
        const options = {
        nodes: {
          shape: "dot",
          size: 22,
              },
              layout: {
                  improvedLayout: true,
          },
        physics: {
          forceAtlas2Based: {
            gravitationalConstant: -26,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18,
          },
          maxVelocity: 146,
          solver: "forceAtlas2Based",
          timestep: 0.35,
          stabilization: { iterations: 150 },
          },
        };

        citationGraph = new vis.Network(container, data, options);

        citationGraph.on("stabilizationProgress", function (params) {
            var maxWidth = 496;
            var minWidth = 20;
            var widthFactor = params.iterations / params.total;
            var width = Math.max(minWidth, maxWidth * widthFactor);

            document.getElementById("bar").style.width = width + "px";
            document.getElementById("text").innerText =
            Math.round(widthFactor * 100) + "%";
        });
        
        citationGraph.once("stabilizationIterationsDone", function () {
                document.getElementById("text").innerText = "100%";
                document.getElementById("bar").style.width = "496px";
                document.getElementById("loadingBar").style.opacity = 0;
                // really clean the dom element
                setTimeout(function () {
                  document.getElementById("loadingBar").style.display = "none";
                }, 500);
        });
        
    })
    .catch((e) => console.error(e));
};

const openPaperLink = () => {
  const selectedNodes = citationGraph.getSelectedNodes();
  for (let nodeId of selectedNodes) {
    const url = `paper_${nodeId}.html`;
    window.open(url, '_blank').focus();
  }
}

const downloadAllBibtex = () => {
  let bibtex = "";
  for (paper of filteredPapers) bibtex += paper.citation + "\n\n";
  let blob = new Blob([bibtex], { type: "text/plain;charset=utf-8" });
  saveAs(blob, "bibtex.bib");
}
