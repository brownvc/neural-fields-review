let allPapers = [];
const allKeys = {
  authors: [],
  keywords: [],
  titles: [],
  nicknames: [],
  dates: []
};

// names for render modes
const MODE = {
  mini: "mini",
  compact: "compact",
  detail: "detail"
}

/**
 * List of filters' data
 * Entries are in format:
 * {
 *  filterID: number
 *  filterType: "titleAndNickname" / "author" / "date" / "keyword";
 *  filterValue: string
 * }
 */
var filters_ = [
  {
    filterID: 0,
    filterType: "titleAndNickname",
    filterValue: ""
  }
];
var nextFilterID = 1;

let render_mode = MODE.compact;

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


const render = () => {
  console.log("rendering")
  // filtering papers here
  const f_test = [];

  Object.keys(filters).forEach((k) => {
    filters[k] ? f_test.push([k, filters[k]]) : null;
  });
  console.log("filters:", filters, "f_test:", f_test)

  if (f_test.length === 0) updateCards(allPapers);
  else {
    const fList = allPapers.filter(
      // (d) => {
      // let i = 0;
      // let pass_test = true;
      // while (i < f_test.length && pass_test) {
      //   if (f_test[i][0] === "titles") {
      //     pass_test &=
      //       d.title.toLowerCase().indexOf(f_test[i][1].toLowerCase()) >
      //       -1;
      //   } else {
      //     pass_test &= d[f_test[i][0]].indexOf(f_test[i][1]) > -1;
      //   }
      //   i++;
      // }
      // return pass_test;
      //}
    );
    updateCards(fList);
  }
};

// const updateFilterSelectionBtn = (value) => {
//   d3.selectAll(".filter_option label").classed("active", function () {
//     const v = d3.select(this).select("input").property("value");
//     return v === value;
//   });
// };



/**
 * START here and load JSON.
 */
const start = () => {
  const urlFilter = getUrlParameter("filter") || "keywords";
  setQueryStringParameter("filter", urlFilter);
  //updateFilterSelectionBtn(urlFilter);

  Promise.all([API.getPapers(), API.getConfig()])
    .then(([papers, config]) => {
      console.log(papers, "!!!--- papers");
      allPapers = papers
      calcAllKeys(papers, allKeys);
      // setTypeAhead(urlFilter, allKeys, filters, render);

      initTypeAhead([...allKeys.titles, ...allKeys.nicknames],".titleAndNicknameTypeahead","titleAndNickname",setTitleAndNicknameFilter)
      updateCards(papers);

      // const urlSearch = getUrlParameter("search");
      // if (urlSearch !== "") {
      //   filters[urlFilter] = urlSearch;
      //   $(".titleAndNicknameTypeahead").val(urlSearch);
      //   render();
      // }
    })
    .catch((e) => console.error(e));
};

const setTitleAndNicknameFilter = () => {
  console.log("setting title and nickname filter");
  const titleAndNicknameFilterValue = document.getElementById("titleAndNicknameInput").value;
  filters_[0].filterValue = titleAndNicknameFilterValue;
  triggerFiltering()
}

const setFilterByID = (filterID) => {
  console.log("setting filter by id:", filterID);
  const filterValue = document.getElementById(`filterInput_${filterID}`).value;
  console.log("filter value:", filterValue);
  filterIndex = filters_.findIndex((filter) => filter.filterID === filterID);
  filters_[filterIndex].filterValue = filterValue;
  triggerFiltering()
}

/**
 * Function for adding a new filter
 */
function addNewFilter() {
  const filterID = nextFilterID;
  nextFilterID += 1;

  filters_.push(
    {
      filterID: filterID,
      filterType: "author",
      filterValue: ""
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
    ${generateFilterTypeSelector(filterID)}
    </div>
    <div class="input-group col-10">
    ${generateFilterInputHTML("author", filterID)}
    </div>
    <div class="col-1">
    ${generateRemoveFilterButton(filterID)}
    </div>`)
  
  tippy(".removeFilterButton")

  initTypeAhead([...allKeys.authors],".authorsTypeahead","authors",() => {setFilterByID(filterID)})
}

function removeFilterByID(filterID) {
  console.log("removing filter ", filterID)
  d3.select(`#filter_${filterID}`).remove()
  filters_ = filters_.filter(filter => filter.filterID !== filterID)
}

function changeFilterType(filterID, newFilterTypeIndex) {
  const filterTypes = ["author", "keyword", "date"]
  const newFilterType = filterTypes[newFilterTypeIndex]
  d3.select(`#filter_${filterID}`)
    .select(`.input-group`)
    .html(generateFilterInputHTML(newFilterType, filterID))
  // $('input[name="daterange"]').daterangepicker({
  //     autoUpdateInput: true,
  //     locale: {
  //         cancelLabel: 'Clear'
  //     }
  // });


  if (newFilterType === "author") {
    initTypeAhead([...allKeys.authors], ".authorsTypeahead", "authors", () => { setFilterByID(filterID) })
  }
  else if (newFilterType === "keyword") {
    initTypeAhead([...allKeys.keywords], ".keywordTypeahead", "keyword", () => { setFilterByID(filterID) })
  }
  else {
    $('input[name="daterange"]').daterangepicker({
      autoUpdateInput: false,
      locale: {
          cancelLabel: 'Clear'
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
  
  filterIndex = filters_.findIndex((filter) => filter.filterID === filterID)
  filters_[filterIndex].filterType = filterTypes[newFilterTypeIndex]
  
}

const generateFilterTypeSelector = (filterID) => {
  return `
      <select style="border: 1px solid #ced4da; border-radius: .25rem; height: calc(1.5em + .75rem + 2px);" onChange="changeFilterType(${filterID}, this.selectedIndex)">
        <option value="Author">Author</option>
        <option value="Keyword">Keyword</option>
        <option value="Date">Date</option>
      </select>
    `
}

const generateFilterInputHTML = (filterType, filterID) => {
  if (filterType === "author") {
    return `
        <input type="text" id="filterInput_${filterID}" class="form-control authorsTypeahead" placeholder="Filter by author" onchange="setFilterByID(${filterID})">
        <button class="btn bg-transparent authorsTypeahead_clear" style="margin-left: -40px; z-index: 100;">
          &times;
        </button>
    `
  }
  else if (filterType === "keyword") {
    return `
      <input type="text" id="filterInput_${filterID}" class="form-control keywordTypeahead" placeholder="Filter by keyword" onchange="setFilterByID(${filterID})">
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
  console.log("start filtering, filters are: ", filters_);
  const onlyShowPapersWithCode = document.getElementById("onlyShowPapersWithCodeCheckbox").checked;
  console.log("only code:", onlyShowPapersWithCode);
  console.log("all papers: ", allPapers);
  //updateCards([allPapers[0], allPapers[1]]);
  let filteredPapers = allPapers
  if (onlyShowPapersWithCode) {
    filteredPapers = allPapers.filter((paper) => paper.code_link !== "");
  }

  // filter by title / nickname
  const titleAndNicknameFilterValue = filters_[0].filterValue
  if (titleAndNicknameFilterValue !== "") {
    filteredPapers = filteredPapers.filter((paper) =>
      paper.title.toLowerCase().includes(titleAndNicknameFilterValue.toLowerCase()) || paper.nickname.toLowerCase().includes(titleAndNicknameFilterValue.toLowerCase()))
  }

  // filter by author, keyword, date
  const authorFilters = [];
  const keywordFilters = [];
  const dateFilters = [];
  filters_.forEach((filter) => {
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
  console.log("AuthorFilters:",authorFilters,"keyworfilters:",keywordFilters,"Datefilters:",dateFilters)
  
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
    console.log(startDate, endDate)
    filteredPapers = filteredPapers.filter((paper) => {
      const paperDate = moment(paper.date, "MM/DD/YYYY");
      return paperDate.isBetween(startDate, endDate) || paperDate.isSame(startDate) || paperDate.isSame(endDate);
    })
  }

  console.log("filtered papers: ", filteredPapers);
  updateCards(filteredPapers);
}

/**
 * Call addNewFilter when clicking on "+" button
 */
d3.select("#add_new_filter_button").on("click", addNewFilter)

/**
 * VIEW EVENTS (card events are in updateCards() )
 * * */

// d3.selectAll(".filter_option input").on("click", function () {
//   const me = d3.select(this);

//   const filter_mode = me.property("value");
//   setQueryStringParameter("filter", filter_mode);
//   setQueryStringParameter("search", "");
//   // updateFilterSelectionBtn(filter_mode);

//   setTypeAhead(filter_mode, allKeys, filters, render);
//   render();
// });

// d3.selectAll(".remove_session").on("click", () => {
//   setQueryStringParameter("session", "");
//   render();
// });

// d3.selectAll(".render_option input").on("click", function () {
//   const me = d3.select(this);
//   render_mode = me.property("value");

//   render();
// });


/**
 * CARDS
 */

const keyword = (kw) => `<a href="papers.html?filter=keywords&search=${kw}"
                       class="text-secondary text-decoration-none">${kw.toLowerCase()}</a>`;

const card_image = (paper, show) => {
  if (show)
    return ` <center><img class="lazy-load-img cards_img" data-src="${API.thumbnailPath(paper)}" width="80%"/></center>`;
  return "";
};

const card_detail = (paper, show) => {
  if (show)
    return ` 
     <div class="pp-card-header" style="overflow-y: auto;">
     <div style="width:100%; ">
        <p class="card-text"><span class="font-weight-bold">Keywords:</span>
            ${paper.keywords.map(keyword).join(", ")}
        </p>
        <p class="card-text"> ${paper.TLDR}</p>
        </div>
    </div>
`;
  return "";
};

const card_time_small = (paper, show) => {
  const cnt = paper;
  return show
    ? `
<!--    <div class="pp-card-footer">-->
    <div class="text-center" style="margin-top: 10px;">
    ${cnt.sessions
      .filter((s) => s.match(/.*[0-9]/g))
      .map(
        (s, i) =>
          `<a class="card-subtitle text-muted" href="?session=${encodeURIComponent(
            s
          )}">${s.replace("Session ", "")}</a> ${card_live(
            cnt.session_links[i]
          )} ${card_cal(paper, i)} `
      )
      .join(", ")}
    </div>
<!--    </div>-->
    `
    : "";
};

const card_icon_video = icon_video(16);
const card_icon_cal = icon_cal(16);

const card_live = (link) =>
  `<a class="text-muted" href="${link}">${card_icon_video}</a>`;
const card_cal = (paper, i) =>
  `<a class="text-muted" href="${API.posterICS(paper,i)}">${card_icon_cal}</a>`;

const card_time_detail = (paper, show) => {
  return show ? `
<!--    <div class="pp-card-footer">-->
    <div class="text-center text-monospace small" style="margin-top: 10px;">
    ${paper.sessions.filter(s => s.match(/.*[0-9]/g))
    .map((s, i) => `${s} ${paper.session_times[i]} ${card_live(
      paper.session_links[i])}   `)
    .join('<br>')}
    </div>
<!--    </div>-->
    ` : '';
}

// language=HTML
const card_html = (paper) =>
  `
        <div class="pp-card pp-mode-${render_mode} ">
            <div class="pp-card-header" style="">
            <div class="checkbox-paper fas ${paper.read ? "selected" : ""}" 
            style="display: block;position: absolute; bottom:${render_mode === MODE.detail ? 375 : 35}px;left: 35px;">&#xf00c;</div>
            <div class="checkbox-bookmark fas  ${paper.bookmarked ? "selected" : ""}" 
            style="display: block;position: absolute; top:-5px;right: 25px;">&#xf02e;</div>
            
<!--                ✓-->
                <a href="${API.posterLink(paper)}"
                target="_blank"
                   class="text-muted">
                   <h5 class="card-title" align="center"> ${
    paper.title
  } </h5></a>
                <h6 class="card-subtitle text-muted" align="center">
                        ${paper.authors.join(", ")}
                </h6>
                <h6 class="card-subtitle text-muted" align="center" style="padding-top: 6px">
                        ${paper.date}
                </h6>
                <h6 class="card-subtitle text-muted" align="center" style="padding-top: 6px">
                        ${paper.keywords.join(", ")}
                </h6>
                ${card_image(paper, render_mode !== MODE.mini)}
                
            </div>
               
                ${card_detail(paper, render_mode === MODE.detail)}
        </div>`;
