const calcAllKeys = function (allPapers, allKeys) {
  const collectAuthors = new Set();
  const collectKeywords = new Set();
  const collectVenues = new Set();
  allPapers.forEach((d) => {
    d.authors.forEach((a) => collectAuthors.add(a));
    d.keywords.forEach((a) => collectKeywords.add(a));
    allKeys.dates.push(d.date);
    if (d.nickname !== "") {
      allKeys.nicknames.push(d.nickname);
    }
    allKeys.titles.push(d.title);
    collectVenues.add(d.venue);
  });
  allKeys.authors = Array.from(collectAuthors);
  allKeys.keywords = Array.from(collectKeywords);
  allKeys.venues = Array.from(collectVenues);
};

const setFilterByID = (filterID, isDateInput = false) => {
  if (isDateInput) {
    const startMonth = document.getElementById(`filterInput_startMonth_${filterID}`).value;
    const startDate = startMonth === "" ? "" : `${startMonth}-01`;
    const endMonth = document.getElementById(`filterInput_endMonth_${filterID}`).value;
    let monthAfterEndMonth = Number(endMonth.substring(5, 7)) % 12 + 1;
    monthAfterEndMonth = monthAfterEndMonth >= 10 ? String(monthAfterEndMonth) : `0${monthAfterEndMonth}`;
    let yearAfterEndMonth = Number(endMonth.substring(0, 4));
    yearAfterEndMonth = monthAfterEndMonth === "01" ? yearAfterEndMonth + 1 : yearAfterEndMonth;
    const endDate = endMonth === "" ? "" : `${yearAfterEndMonth}-${monthAfterEndMonth}-01`;
    const filterIndex = filters.findIndex((filter) => filter.filterID === filterID);
    if (startDate && endDate) {
      if (moment(endDate, "YYYY-MM-DD").isBefore(moment(startDate, "YYYY-MM-DD")))
      {
        alert("Start date should be no later than end date.");
        var monthControls = document.querySelectorAll('input[type="month"]');
        for (monthControl of monthControls) monthControl.value = "";
        filters[filterIndex].filterValue = "";
      }  
      else {
        filters[filterIndex].filterValue = `${startDate}/${endDate}`;
      }
    }
    else {
      filters[filterIndex].filterValue = "";
    }
  }
  else {
    const filterValue = document.getElementById(`filterInput_${filterID}`).value;
    filterIndex = filters.findIndex((filter) => filter.filterID === filterID);
    filters[filterIndex].filterValue = filterValue;
  }
  triggerFiltering();
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
    <div class="filterTypeSelector col-3 col-md-1">
    ${generateFilterTypeSelector(filterID, filterType)}
    </div>
    <div class="input-group col-7 col-md-10">
    ${generateFilterInputHTML(filterID, filterType, filterValue)}
    </div>
    <div class="col-1 col-md-1">
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
    initTypeAhead([], `.dateTypeahead_${filterID}`, "date", () => { setFilterByID(filterID) });
  }
  
  
  return filterID;
}

function removeFilterByID(filterID) {
  d3.select(`#filter_${filterID}`).remove()
  filters = filters.filter(filter => filter.filterID !== filterID)
  triggerFiltering()
}

const setTitleAndNicknameFilter = () => {
  const titleAndNicknameFilterValue = document.getElementById("titleAndNicknameInput").value;
  filters[0].filterValue = titleAndNicknameFilterValue;
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
    // return `
    //   <div style="display: flex; flex-direction: row; justify-content: space-around; align-items: center; width: 100%;">
    //     <input type="month" id="filterInput_startMonth_${filterID}" class="form-control dateTypeahead_${filterID}" onchange="setFilterByID(${filterID}, true)" placeholder="YYYY-MM" style="width: 100%">
    //     <span>&nbsp&nbspto&nbsp&nbsp</span>
    //     <input type="month" id="filterInput_endMonth_${filterID}" class="form-control dateTypeahead_${filterID}" onchange="setFilterByID(${filterID}, true)" placeholder="YYYY-MM" style="width: 100%">
    //   </div>
    //   `


    // return `
    //   <div class="row" style="width: 100%; padding-left: 15px; padding-right: 15px;">
    //     <input type="month" id="filterInput_startMonth_${filterID}" class="form-control dateTypeahead_${filterID} col-3" onchange="setFilterByID(${filterID}, true)" placeholder="YYYY-MM">
    //     <span class="col-1">to</span>
    //     <input type="month" id="filterInput_endMonth_${filterID}" class="form-control dateTypeahead_${filterID} col-3" onchange="setFilterByID(${filterID}, true)" placeholder="YYYY-MM">
    //   </div>
    //   
    return `
      <div class="row" style="width: 101.6%; padding-left: 15px;">
        <input type="month" id="filterInput_startMonth_${filterID}" class="col-5 form-control" onchange="setFilterByID(${filterID}, true)" placeholder="YYYY-MM">
        <span class="col-2 d-flex justify-content-center" style="margin-top: 2px">to</span>
        <input type="month" id="filterInput_endMonth_${filterID}" class="col-5 form-control" onchange="setFilterByID(${filterID}, true)" placeholder="YYYY-MM">
      </div>
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
