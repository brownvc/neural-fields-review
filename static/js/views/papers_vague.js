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
 *  filterType: "vagueSearch" / "author" / "date" / "keyword" / "venue";
 *  filterValue: string
 * }
 */
var filter = "";

var nextFilterID = 1;

/**
 * START here and load JSON.
 */
const start = () => {
  Promise.all([API.getPapers()])
    .then(([papers]) => {
      allPapers = papers;
      filteredPapers = allPapers;
      d3.select("#displaying-number-of-papers-message")
        .html(`<span>Displaying ${allPapers.length} papers</span>`);
      calcAllKeys(allPapers, allKeys);
      initTypeAhead(
        [...allKeys.titles,
        ...allKeys.nicknames,
        ...allKeys.authors,
        ...allKeys.keywords,
        ...allKeys.venues],
        ".vagueSearchTypeahead", "vagueSearch", setVagueSearchFilter);
      const urlHasFilterParams = getFilterFromURL();
      updateCards(allPapers);
      if (urlHasFilterParams) triggerFiltering();
    })
    .catch((e) => console.error(e));
  
};

const setVagueSearchFilter = () => {
  const vagueSearchInputValue = document.getElementById("vagueSearchInput").value;
  filter = vagueSearchInputValue;
  triggerFiltering();
}

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
      tippy(".card-header-icon");

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
  if (params.has("vagueSearch")) {
    const filterValue = params.get("vagueSearch");
    document.getElementById(`vagueSearchInput`).value = filterValue;
    filter = filterValue;
    return true;
  }
  else if (params.has("feelingLucky")) {
    const filterTypes = ["keywords", "titles"];
    const typeIndex = Math.floor(Math.random() * filterTypes.length);
    const entryIndex = Math.floor(Math.random() * allKeys[filterTypes[typeIndex]].length);
    const filterValue = allKeys[filterTypes[typeIndex]][entryIndex];
    document.getElementById(`vagueSearchInput`).value = filterValue;
    filter = filterValue;
    return true;
  }
}

/**
 * Functions for trigger filtering on papers
 */
const triggerFiltering = () => {
  filteredPapers = allPapers;
  const vagueSearchFilterValues = filter.split(" ");
  for (vagueSearchFilterValue of vagueSearchFilterValues)
  {
    if (vagueSearchFilterValue !== "") {
    filteredPapers = filteredPapers.filter((paper) =>
    {
      return paper.title.toLowerCase().includes(vagueSearchFilterValue.toLowerCase()) ||
        paper.nickname.toLowerCase().includes(vagueSearchFilterValue.toLowerCase()) ||
        paper.venue.toLowerCase().includes(vagueSearchFilterValue.toLowerCase()) ||
        paper.authors.reduce((prev, cur) =>
          prev || cur.toLowerCase().includes(vagueSearchFilterValue.toLowerCase()), false) ||
        paper.keywords.reduce((prev, cur) =>
        prev || cur.toLowerCase().includes(vagueSearchFilterValue.toLowerCase()), false)
    }
    );
  }  
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
    .html(`<span>Displaying ${filteredPapers.length} papers</span>`);
}

const copyBibtex = (paperID) => {
  let paperBibtex;
  for (paper of allPapers) {
    if (paper.UID === paperID) {
      paperBibtex = paper.citation;
      break;
    }
  }
  navigator.clipboard.writeText(paperBibtex).then(() => alert('Successfully copied Bibtex'));
  //alert("Copied Bibtex.")
}

const downloadAllBibtex = () => {
  let bibtex = "";
  for (paper of filteredPapers) bibtex += paper.citation + "\n\n";
  let blob = new Blob([bibtex], { type: "text/plain;charset=utf-8" });
  saveAs(blob, "bibtex.bib");
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

                <a href="${API.paperLink(paper)}" class="red-hyper-link"
                target="_blank"
                >
                   <h5 class="card-title" align="center"> ${
                      paper.title
                    } </h5></a>
                
                <div class="icons" style="display: flex; flex-direction: row; justify-content: space-around; padding-bottom: 10px">
                    ${paper.project_link !== "" ?
                    `<a class="card-header-icon card-header-icon fas red-hyper-link" href="${paper.project_link}" target="_blank" data-tippy-content="Project homepage">&#xf015;</a>`
                    : ""}
                    
                  ${paper.code_link !== "" && (!paper.code_link.toLowerCase().includes("soon"))?
                    `<a class="card-header-icon card-header-icon fas red-hyper-link" href="${paper.code_link}" target="_blank" data-tippy-content="Code">&#xf121;</a>`
                    : ""}
                
                    ${paper.talk_link !== "" ?
                    `<a class="card-header-icon card-header-icon fas red-hyper-link" href="${paper.talk_link}" target="_blank" data-tippy-content="Talk video">&#xf03d;</a>`
                    : ""}
                    
                    ${paper.pdf_url !== "" ?
                    `<a class="card-header-icon card-header-icon fas red-hyper-link" href="${paper.pdf_url}" target="_blank" data-tippy-content="PDF file">&#xf1c1;</a>`
                    : ""}
                </div>
                
                <h6 class="card-subtitle text-muted" align="center">
                        ${paper.authors.join(", ")}
                </h6>
                
                <p class="card-date text-muted">
                        ${renderMode === MODE.mini ? "" : "Date: " + paper.date}
                </p>
                <p class="card-venue text-muted">
                        ${renderMode === MODE.mini ? "" : "Venue: " + paper.venue + " " + paper.year}
                </p>
                ${renderMode === MODE.mini ? "" : card_keywords(paper.keywords)}
                
                 

            </div>
                ${card_detail(paper, renderMode === MODE.detail)}
                
        </div>`;

       //${card_image(paper, renderMode !== MODE.mini)}
