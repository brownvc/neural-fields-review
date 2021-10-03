let citationGraph = null;

let allPapers = [];
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

const start = () => {
  Promise.all([API.getPapers()])
    .then(([papers]) => {
      allPapers = papers;
      console.log("all papers: ", allPapers);
      d3.select("#displaying-number-of-papers-message")
        .html(`<p>Displaying ${allPapers.length} papers:</p>`);
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

const setTitleAndNicknameFilter = () => {
  const titleAndNicknameFilterValue = document.getElementById("titleAndNicknameInput").value;
  filters[0].filterValue = titleAndNicknameFilterValue;
  triggerFiltering()
}

const setFilterByID = (filterID) => {
  const filterValue = document.getElementById(`filterInput_${filterID}`).value;
  filterIndex = filters.findIndex((filter) => filter.filterID === filterID);
  filters[filterIndex].filterValue = filterValue;
  triggerFiltering()
}

/**
 * Function for adding a new filter
 */
function addNewFilter(filterType, filterValue) {
  const filterID = nextFilterID;
  nextFilterID += 1;

  filters.push(
    {
      filterID: filterID,
      filterType: filterType,
      filterValue: filterValue
    }
  )
  d3.select("#dynamicFiltersSection")
    .append("div")
    .attr("id",`filter_${filterID}`)
    .attr("class", "row")
    .style("padding-top", "5px")
  
  d3.select(`#filter_${filterID}`)
    .html(
      `
    <div class="filterTypeSelector col-1">
    ${generateFilterTypeSelector(filterID, filterType)}
    </div>
    <div class="input-group col-10">
    ${generateFilterInputHTML(filterID, filterType, filterValue)}
    </div>
    <div class="col-1">
    ${generateRemoveFilterButton(filterID)}
    </div>`)
  
  tippy(".removeFilterButton")

  if (filterType == "author") {
    initTypeAhead([...allKeys.authors],`.authorsTypeahead_${filterID}`,"authors",() => {setFilterByID(filterID)})
  }
  else if (filterType == "keyword") {
    initTypeAhead([...allKeys.keywords], `.keywordTypeahead_${filterID}`, "keyword", () => { setFilterByID(filterID) })
  }
  else if (filterType == "venue") {
    initTypeAhead([...allKeys.venues], `.venueTypeahead_${filterID}`, "venue", () => {setFilterByID(filterID)})
  }
  else {
    $('input[name="daterange"]').daterangepicker({
      autoUpdateInput: false,
      showDropdowns: true,
      minYear: 1900,
      maxYear: 2030,
      locale: {
        cancelLabel: 'Clear',
      }
    });

    $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
      $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
      setFilterByID(filterID);
    });

    $('input[name="daterange"]').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });

    initTypeAhead([], `.dateTypeahead_${filterID}`, "date", () => { setFilterByID(filterID) });
  }
  
  
  return filterID;
}

function removeFilterByID(filterID) {
  d3.select(`#filter_${filterID}`).remove()
  filters = filters.filter(filter => filter.filterID !== filterID)
  triggerFiltering()
}

function changeFilterType(filterID, newFilterTypeIndex) {
  const filterTypes = ["author", "keyword", "venue", "date"]
  const newFilterType = filterTypes[newFilterTypeIndex]
  d3.select(`#filter_${filterID}`)
    .select(`.input-group`)
    .html(generateFilterInputHTML(filterID, newFilterType, ""))

  if (newFilterType === "author") {
    initTypeAhead([...allKeys.authors], `.authorsTypeahead_${filterID}`, "authors", () => { setFilterByID(filterID) })
  }
  else if (newFilterType === "keyword") {
    initTypeAhead([...allKeys.keywords], `.keywordTypeahead_${filterID}`, "keyword", () => { setFilterByID(filterID) })
  }
  else if (newFilterType === "venue") {
    initTypeAhead([...allKeys.venues], `.venueTypeahead_${filterID}`, "venue", () => { setFilterByID(filterID) })
  }
  else {
    $('input[name="daterange"]').daterangepicker({
      autoUpdateInput: false,
      showDropdowns: true,
      minYear: 1900,
      maxYear: 2030,
      locale: {
        cancelLabel: 'Clear',
      }
    });

    $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
      $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
      setFilterByID(filterID);
    });

    $('input[name="daterange"]').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });
    initTypeAhead([], `.dateTypeahead_${filterID}`, "date", () => { setFilterByID(filterID) });
  }
  
  filterIndex = filters.findIndex((filter) => filter.filterID === filterID)
  filters[filterIndex].filterType = filterTypes[newFilterTypeIndex]
}

const generateFilterTypeSelector = (filterID, selectedType) => {
  return `
      <select style="border: 1px solid #ced4da; border-radius: .25rem; height: calc(1.5em + .75rem + 2px);" onChange="changeFilterType(${filterID}, this.selectedIndex)">
        <option value="author" ${selectedType == "author" ? "selected" : ""}>Author</option>
        <option value="keyword" ${selectedType == "keyword" ? "selected" : ""}>Keyword</option>
        <option value="venue" ${selectedType == "venue" ? "selected" : ""}>Venue</option>
        <option value="date" ${selectedType == "date" ? "selected" : ""}>Date</option>
      </select>
    `
}

const generateFilterInputHTML = (filterID, filterType, filterValue) => {
  if (filterType === "author") {
    return `
        <input type="text" id="filterInput_${filterID}" class="form-control authorsTypeahead_${filterID}" placeholder="Filter by author" onchange="setFilterByID(${filterID})" value="${filterValue}">
        <button class="btn bg-transparent authorsTypeahead_${filterID}_clear" style="margin-left: -40px; z-index: 100;">
          &times;
        </button>
    `
  }
  else if (filterType === "keyword") {
    return `
      <input type="text" id="filterInput_${filterID}" class="form-control keywordTypeahead_${filterID}" placeholder="Filter by keyword" onchange="setFilterByID(${filterID})" value="${filterValue}">
      <button class="btn bg-transparent keywordTypeahead_${filterID}_clear" style="margin-left: -40px; z-index: 100;">
        &times;
      </button>
    `
  }
  else if (filterType === "venue") {
    return `
      <input type="text" id="filterInput_${filterID}" class="form-control venueTypeahead_${filterID}" placeholder="Filter by venue" onchange="setFilterByID(${filterID})" value="${filterValue}">
      <button class="btn bg-transparent venueTypeahead_${filterID}_clear" style="margin-left: -40px; z-index: 100;">
        &times;
      </button>
    `
  }
  else if (filterType === "date") {
    return `
      <input type="text" id="filterInput_${filterID}" class="form-control dateTypeahead_${filterID}" name="daterange" value="" placeholder="Select a date range" onchange="setFilterByID(${filterID})">
      <button class="btn bg-transparent dateTypeahead_${filterID}_clear"  style="margin-left: -40px; z-index: 100;">
        &times;
      </button>
    `
  }
}

const generateRemoveFilterButton = (filterID) => {
  return `
  <button class="btn btn-outline-secondary removeFilterButton" onClick="removeFilterByID(${filterID})" style="border-radius: 25px;"
          data-tippy-content="Remove this filter">
          <div class="fas">&#xf068;</div>
  </button>
  `
}

/**
 * Functions for trigger filtering on papers
 */
const triggerFiltering = () => {
  const onlyShowPapersWithCode = document.getElementById("onlyShowPapersWithCodeCheckbox").checked;
  let filteredPapers = allPapers;
  if (onlyShowPapersWithCode) {
    filteredPapers = allPapers.filter((paper) => paper.code_link !== "");
  }
  // filter by title / nickname
  const titleAndNicknameFilterValue = filters[0].filterValue
  if (titleAndNicknameFilterValue !== "") {
    filteredPapers = filteredPapers.filter((paper) =>
      paper.title.toLowerCase().includes(titleAndNicknameFilterValue.toLowerCase()) || paper.nickname.toLowerCase().includes(titleAndNicknameFilterValue.toLowerCase()))
  }

  // filter by author, keyword, date
  // filter by author, keyword, date
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
      let startDate = dateRange.split(" - ")[0];
      startDate = moment(startDate, "MM/DD/YYYY");
      let endDate = dateRange.split(" - ")[1];
      endDate = moment(endDate, "MM/DD/YYYY");
      if (paperDate.isBetween(startDate, endDate) || paperDate.isSame(startDate) || paperDate.isSame(endDate))
      {
        filteredByDate = true;
        break;
      }
    }
      console.log(dateFilters, paper.date, filteredByDate);
    return filteredByDate;
    });
  }

  d3.select("#displaying-number-of-papers-message")
        .html(`<p>Displaying ${filteredPapers.length} papers:</p>`);
  drawCitationGraph(filteredPapers);
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
  papers = papers.filter((paper) => !(dupids.includes(paper.UID)))
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
    console.log(nodeId);
    const url = `paper_${nodeId}.html`;
    window.open(url, '_blank').focus();
  }
}
