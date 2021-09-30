let allPapers = [];
const allKeys = {
  authors: [],
  keywords: [],
  titles: [],
  nicknames: [],
  dates: []
};

/**
 * List of filters' data
 * Entries are in format:
 * {
 *  filterID: number
 *  filterType: "titleAndNickname" / "author" / "date" / "keyword";
 *  filterValue: string
 * }
 */
var filters = [
  {
    filterID: 0,
    filterType: "titleAndNickname",
    filterValue: ""
  }
];
var nextFilterID = 1;

var paperItems = [];

var paperDataset = new vis.DataSet(paperItems);

const container = document.getElementById("timelineVisualization");



const timelineOptions = {
  minHeight: "300px",
  maxHeight: "750px",
  min: "1950-1-1",
  max: "2070-1-1",
  align: "left",
  tooltip: {
    followMouse: true,
     delay: 200
  },
  orientation: {
    axis: "both",
  },
  margin: {
    item: {
      vertical: 3
    }
  },
  // rollingMode: {
  //   follow: true
  // },
  showCurrentTime: false,
  zoomFriction: 10,
  zoomMin: 86400000 * 30
};

var timeline;

/**
 * START here and load JSON.
 */
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
      addNewFilter("date", "");
      renderTimeline(allPapers);
    })
    .catch((e) => console.error(e));
};

const generatePaperItem = (paper, config) => {
  if (paper.nickname) {
    return `
    <a href="/${config.repo_name}/paper_${paper.UID}.html" target="_blank">${paper.nickname}</a>
    `
  }
  else {
    const titleWords = paper.title.split(" ");
    if (titleWords.length >= 5) {
      const halfLen = Math.floor(titleWords.length / 2);
      const firstHalf = titleWords.slice(0, halfLen).join(' ');
      const secondHalf = titleWords.slice(halfLen, titleWords.length).join(' ');
      return `
      <a href="/${config.repo_name}/paper_${paper.UID}.html" target="_blank">${firstHalf}</a><br>
      <a href="/${config.repo_name}/paper_${paper.UID}.html" target="_blank">${secondHalf}</a>
      `
    }
    else {
      return `
      <a href="/${config.repo_name}/paper_${paper.UID}.html" target="_blank">${paper.title}</a>
      `
    }
  }
}

const prettifyTitle = (title) => {
  let prettyTitle = "<h5>";
  const words = title.split(" ")
  for (let i = 0; i < words.length; ++i){
    prettyTitle += words[i] + " ";
    if (i % 5 == 0 && i != 0) prettyTitle += '</h5><h5>';
  }
  prettyTitle += '</h5>';
  return prettyTitle;
}

const prettifyAuthors = (authors) => {
  let prettyAuthors = "<p>";
  for (let i = 0; i < authors.length; ++i){
    prettyAuthors += authors[i];
    if (i != authors.length - 1) prettyAuthors += ", ";
    if (i % 4 == 0 && i != 0) prettyAuthors += '</p><p>';
  }
  prettyAuthors += '</p>';
  return prettyAuthors;
}

const prettifyKeywords = (keywords) => {
  let prettyKeywords = "<p><span>Keywords: </span>";
  for (let i = 0; i < keywords.length; ++i){
    prettyKeywords += keywords[i];
    if (i != keywords.length - 1) prettyKeywords += ", ";
    if (i % 2 == 0 && i != 0) prettyKeywords += '</p><p>';
  }
  prettyKeywords += '</p>';
  return prettyKeywords;
}

const generatePaperInfoBox = (paper) => {
  return `
  ${prettifyTitle(paper.title)}
  ${prettifyAuthors(paper.authors)}
  <h6>${paper.date}</h6>
  ${prettifyKeywords(paper.keywords)}
  `
}

const renderTimeline = (papers) => {
  console.log("rendering: ", papers);
  //const config = await API.getConfig();
  if (timeline) timeline.destroy();
  Promise.all([API.getConfig()])
    .then(
      ([config]) => {
        const paperItems = papers.map((paper, index) => {
    return {
      id: index,
      content: generatePaperItem(paper, config),
      start: moment(paper.date, "MM/DD/YYYY"),
      className: "paper-item",
      title: generatePaperInfoBox(paper)
    }
    }
        );
        paperDataset = new vis.DataSet(paperItems);
    timeline = new vis.Timeline(container, paperDataset, timelineOptions);
    if (paperItems.length > 0) {
      timeline.focus(paperItems[paperItems.length - 1].id, { duration: 1, easingFunction: "linear" });
      timeline.zoomOut(0);
    }
    }
  )
}

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
    initTypeAhead([...allKeys.authors],".authorsTypeahead","authors",() => {setFilterByID(filterID)})
  }
  else if (filterType == "keyword") {
    initTypeAhead([...allKeys.keywords], ".keywordTypeahead", "keyword", () => { setFilterByID(filterID) })
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

    initTypeAhead([], ".dateTypeahead", "date", () => { setFilterByID(filterID) });
  }
  
  
  return filterID;
}

function removeFilterByID(filterID) {
  d3.select(`#filter_${filterID}`).remove()
  filters = filters.filter(filter => filter.filterID !== filterID)
  triggerFiltering()
}

function changeFilterType(filterID, newFilterTypeIndex) {
  const filterTypes = ["author", "keyword", "date"]
  const newFilterType = filterTypes[newFilterTypeIndex]
  d3.select(`#filter_${filterID}`)
    .select(`.input-group`)
    .html(generateFilterInputHTML(filterID, newFilterType, ""))

  if (newFilterType === "author") {
    initTypeAhead([...allKeys.authors], ".authorsTypeahead", "authors", () => { setFilterByID(filterID) })
  }
  else if (newFilterType === "keyword") {
    initTypeAhead([...allKeys.keywords], ".keywordTypeahead", "keyword", () => { setFilterByID(filterID) })
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
    initTypeAhead([], ".dateTypeahead", "date", () => { setFilterByID(filterID) });
  }
  
  filterIndex = filters.findIndex((filter) => filter.filterID === filterID)
  filters[filterIndex].filterType = filterTypes[newFilterTypeIndex]
}

const generateFilterTypeSelector = (filterID, selectedType) => {
  return `
      <select style="border: 1px solid #ced4da; border-radius: .25rem; height: calc(1.5em + .75rem + 2px);" onChange="changeFilterType(${filterID}, this.selectedIndex)">
        <option value="author" ${selectedType == "author" ? "selected" : ""}>Author</option>
        <option value="keyword" ${selectedType == "keyword" ? "selected" : ""}>Keyword</option>
        <option value="date" ${selectedType == "date" ? "selected" : ""}>Date</option>
      </select>
    `
}

const generateFilterInputHTML = (filterID, filterType, filterValue) => {
  if (filterType === "author") {
    return `
        <input type="text" id="filterInput_${filterID}" class="form-control authorsTypeahead" placeholder="Filter by author" onchange="setFilterByID(${filterID})" value="${filterValue}">
        <button class="btn bg-transparent authorsTypeahead_clear" style="margin-left: -40px; z-index: 100;">
          &times;
        </button>
    `
  }
  else if (filterType === "keyword") {
    return `
      <input type="text" id="filterInput_${filterID}" class="form-control keywordTypeahead" placeholder="Filter by keyword" onchange="setFilterByID(${filterID})" value="${filterValue}">
      <button class="btn bg-transparent keywordTypeahead_clear" style="margin-left: -40px; z-index: 100;">
        &times;
      </button>
    `
  }
  else if (filterType === "date") {
    return `
      <input type="text" id="filterInput_${filterID}" class="form-control dateTypeahead" name="daterange" value="" placeholder="Select a date range" onchange="setFilterByID(${filterID})">
      <button class="btn bg-transparent dateTypeahead_clear"  style="margin-left: -40px; z-index: 100;">
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
  const authorFilters = [];
  const keywordFilters = [];
  const dateFilters = [];
  filters.forEach((filter) => {
    if (filter.filterType === "author" && filter.filterValue !== "") {
      authorFilters.push(filter.filterValue);
    }
    else if (filter.filterType === "keyword" && filter.filterValue !== "") {
      keywordFilters.push(filter.filterValue)
    }
    else if (filter.filterType === "date" && filter.filterValue !== "") {
      dateFilters.push(filter.filterValue)
    }
  })
  for (authorFilter of authorFilters) {
    filteredPapers = filteredPapers.filter((paper) => {
      let hasThisAuthor = false;
      for (author of paper.authors) {
        if (author.toLowerCase().includes(authorFilter.toLowerCase())) {
          hasThisAuthor = true;
          break;
        }
      }
      return hasThisAuthor
    })
  }

  for (keywordFilter of keywordFilters) {
    filteredPapers = filteredPapers.filter((paper) => {
      let hasThisKeyword = false;
      for (keywordOfPaper of paper.keywords) {
        if (keywordOfPaper.toLowerCase().includes(keywordFilter.toLowerCase())) {
          hasThisKeyword = true;
          break;
        }
      }
      return hasThisKeyword
    })
  }

  for (dateRange of dateFilters) {
    let startDate = dateRange.split(" - ")[0];
    startDate = moment(startDate, "MM/DD/YYYY");
    let endDate = dateRange.split(" - ")[1];
    endDate = moment(endDate, "MM/DD/YYYY")
    filteredPapers = filteredPapers.filter((paper) => {
      const paperDate = moment(paper.date, "MM/DD/YYYY");
      return paperDate.isBetween(startDate, endDate) || paperDate.isSame(startDate) || paperDate.isSame(endDate);
    })
  }
  d3.select("#displaying-number-of-papers-message")
        .html(`<p>Displaying ${filteredPapers.length} papers:</p>`);
  renderTimeline(filteredPapers);
  
}

