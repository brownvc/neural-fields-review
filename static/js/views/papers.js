let allPapers = [];
const allKeys = {
  authors: [],
  keywords: [],
  titles: [],
  nicknames: [],
  dates: [],
  venues: []
};

// names for render modes
const MODE = {
  mini: "mini",
  compact: "compact",
  detail: "detail"
}

let renderMode = MODE.compact;

/**
 * List of filters' data
 * Entries are in format:
 * {
 *  filterID: number
 *  filterType: "titleAndNickname" / "author" / "date" / "keyword" / "venue";
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

const updateCards = (papers) => {
  Promise.all([
    API.markGetAll(API.storeIDs.visited),
    API.markGetAll(API.storeIDs.bookmarked)
  ]).then(
    ([visitedPapers, bookmarks]) => {

      papers.forEach((paper) => {
        paper.UID = paper.UID;
        paper.read = visitedPapers[paper.UID] || false;
        paper.bookmarked = bookmarks[paper.UID] || false;
      });

      const visitedCard = (iid, new_value) => {
        API.markSet(API.storeIDs.visited, iid, new_value).then();
      };

      const bookmarkedCard = (iid, new_value) => {
        API.markSet(API.storeIDs.bookmarked, iid, new_value).then();
      };

      const all_mounted_cards = d3
        .select(".cards")
        .selectAll(".myCard", (paper) => paper.UID)
        .data(papers, (d) => d.number)
        .join("div")
        .attr("class", "myCard col-xs-6 col-md-4")
        .html(card_html);
      
      tippy(".copy-bibtex-icon");
      tippy(".checkbox-bookmark");

      all_mounted_cards.select(".card-title").on("click", function (d) {
        const iid = d.UID;
        // to avoid hierarchy issues, search for card again
        all_mounted_cards
          .filter((dd) => dd.UID === iid)
          .select(".checkbox-paper")
          .classed("selected", function () {
            const new_value = true;
            visitedCard(iid, new_value);
            return new_value;
          });
      });

      all_mounted_cards.select(".checkbox-paper").on("click", function (d) {
        const new_value = !d3.select(this).classed("selected");
        visitedCard(d.UID, new_value);
        d3.select(this).classed("selected", new_value);
      });

      all_mounted_cards.select(".checkbox-bookmark").on("click", function (d) {
        const new_value = !d3.select(this).classed("selected");
        bookmarkedCard(d.UID, new_value);
        d3.select(this).classed("selected", new_value);
      });

      // lazyloader() from js/modules/lazyLoad.js
      lazyLoader();
    }
  )
}

const changeRenderMode = (newRenderMode) => {
  renderMode = newRenderMode;
  updateCards(allPapers);
}

const getFilterFromURL = () => {
  const URL = window.location.search;
  const params = new URLSearchParams(URL);
  if (params.has("author")) {
    const filterValue = params.get("author");
    //addNewFilter("author", filterValue);
    document.getElementById(`filterInput_${1}`).value = filterValue;
    setFilterByID(1);
    return true;
  }
  else if (params.has("keyword")) {
    const filterValue = params.get("keyword");
    //addNewFilter("keyword", filterValue);
    document.getElementById(`filterInput_${2}`).value = filterValue;
    setFilterByID(2);
    return true;
  }
}

/**
 * START here and load JSON.
 */
const start = () => {
  Promise.all([API.getPapers()])
    .then(([papers]) => {
      allPapers = papers;
      console.log("all papers: ", allPapers);
      d3.select("#displaying-number-of-papers-message")
      .html(`<p>Displaying ${allPapers.length} papers:</p>`)
      calcAllKeys(allPapers, allKeys);
      initTypeAhead([...allKeys.titles, ...allKeys.nicknames],".titleAndNicknameTypeahead","titleAndNickname",setTitleAndNicknameFilter)
      addNewFilter("author", "");
      addNewFilter("keyword", "");
      addNewFilter("venue", "");
      addNewFilter("date", "");
      const urlHasFilterParams = getFilterFromURL();
      updateCards(allPapers);
      if (urlHasFilterParams) triggerFiltering();
      
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
  //updateCards([allPapers[0], allPapers[1]]);
  let filteredPapers = allPapers
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

  // sorting
  const sortBy = document.getElementById("sortBySelector").value;
  if (sortBy != "") {
    if (sortBy == "Title") {
      filteredPapers = filteredPapers.sort((a, b) => a.title > b.title ? 1 : -1)
    }
    else if (sortBy == "DateLatestToOldest") {
      filteredPapers = filteredPapers.sort((a, b) => moment(a.date, "MM/DD/YYYY").isBefore(moment(b.date, "MM/DD/YYYY")) ? 1 : -1)
    }
    else if (sortBy == "DateOldestToLatest") {
      filteredPapers = filteredPapers.sort((a, b) => moment(a.date, "MM/DD/YYYY").isBefore(moment(b.date, "MM/DD/YYYY")) ? -1 : 1)
    }
  }
  updateCards(filteredPapers);
  d3.select("#displaying-number-of-papers-message")
  .html(`<p>Displaying ${filteredPapers.length} papers:</p>`)
}

const copyBibtex = (paperID) => {
  let paperBibtex;
  for (paper of allPapers) {
    if (paper.UID === paperID) {
      paperBibtex = paper.citation;
      break;
    }
  }
  navigator.clipboard.writeText(paperBibtex);
  //alert("Copied Bibtex.")
}

/**
 * CARDS
 */
const card_image = (paper, show) => {
  if (show)
    return ` <center><img class="lazy-load-img cards_img" data-src="${API.thumbnailPath(paper)}" style="max-width:250px; padding-bottom:10px"/></center>`;
  return "";
};

const card_detail = (paper, show) => {
  if (show)
    return ` 
     <div class="pp-card-header" style="overflow-y: auto;">
     <div style="width:100%; ">
        <p class="card-text"> ${paper.abstract}</p>
        </div>
    </div>
`;
  return "";
};

const card_keywords = (keywords) => {
  if (keywords.length)
    return `
    <h6 class="card-keywords text-muted">
                        Keywords: ${keywords.join(", ")}
    </h6>
    `;
  return ""
}


// language=HTML
const card_html = (paper) =>
  `
        <div class="pp-card pp-mode-${renderMode} ">
            <div class="pp-card-header">

 
              <div class="checkbox-paper fas ${paper.read ? "selected" : ""}" style="position: absolute; top:2px; left: 25px;"
              >&#xf00c;</div>

              <div class="copy-bibtex-icon fas" style="position: absolute; top:-3px;right: 55px;" 
              data-tippy-content="Copy bibtex"
              onClick="copyBibtex('${paper.UID}')"
              >&#xf0c5;</div>

              <div class="checkbox-bookmark fas  ${paper.bookmarked ? "selected" : ""}" style="position: absolute; top:-5px;right: 25px;" data-tippy-content="Bookmark"
              >&#xf02e;</div>

                <a href="${API.paperLink(paper)}"
                target="_blank"
                >
                   <h5 class="card-title" align="center"> ${
                      paper.title
                    } </h5></a>
                
                <div class="icons" style="display: flex; flex-direction: row; justify-content: space-around; padding-bottom: 10px">
                    ${paper.project_link !== "" ?
                    `<a class="card-header-icon card-header-icon fas" href="${paper.project_link}" target="_blank" title="Project homepage">&#xf015;</a>`
                    : ""}
                
                    ${paper.talk_link !== "" ?
                    `<a class="card-header-icon card-header-icon fas" href="${paper.talk_link}" target="_blank" title="Talk">&#xf03d;</a>`
                    : ""}
                </div>
                
                <h6 class="card-subtitle text-muted" align="center">
                        ${paper.authors.join(", ")}
                </h6>
                
                <p class="card-date text-muted">
                        ${renderMode === MODE.mini ? "" : "Date: " + paper.date}
                </p>
                <p class="card-venue text-muted">
                        ${renderMode === MODE.mini ? "" : "Venue: " + paper.venue}
                </p>
                ${renderMode === MODE.mini ? "" : card_keywords(paper.keywords)}
                
                
            </div>
                ${card_detail(paper, renderMode === MODE.detail)}
                
        </div>`;

        // ${card_image(paper, renderMode !== MODE.mini)}
