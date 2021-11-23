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

var latestNumPapaersFilteredOut = null;

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
        paperItems.sort((x, y) => {
          if (x.start.isBefore(y.start)) return -1;
          else if (y.start.isBefore(x.start)) return 1;
          else return 0;
    })
    paperDataset = new vis.DataSet(paperItems);
    timeline = new vis.Timeline(container, paperDataset, timelineOptions);
        if (paperItems.length > 0) {
      //focus on the latest paper
      timeline.focus(paperItems[paperItems.length - 1].id, { duration: 1, easingFunction: "linear" });
      timeline.zoomOut(0);
    }
    }
  )
}

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
  const titleAndNicknameFilterValue = filters[0].filterValue;
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
    renderTimeline(filteredPapers);
  }
}

const downloadAllBibtex = () => {
  let bibtex = "";
  for (paper of filteredPapers) bibtex += paper.citation + "\n\n";
  let blob = new Blob([bibtex], { type: "text/plain;charset=utf-8" });
  saveAs(blob, "bibtex.bib");
}
