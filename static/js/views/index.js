let allPapers = [];
const allKeys = {
  authors: [],
  keywords: [],
  titles: [],
  nicknames: [],
  venues: [],
  dates: []
};

const start = () => {
  Promise.all([API.getPapers()])
    .then(([papers]) => {
      allPapers = papers;
      calcAllKeys(allPapers, allKeys);
      initTypeAhead(
        [...allKeys.titles,
        ...allKeys.nicknames,
        ...allKeys.authors,
        ...allKeys.keywords,
        ...allKeys.venues],
          ".vagueSearchTypeahead", "vagueSearch", vagueSearch);
        console.log("initialed")
    })
    .catch((e) => console.error(e));
};


const vagueSearch = () => {
    const searchValue = document.getElementById("vagueSearchInput").value;
    console.log("searching ", searchValue);
    const url = `papers_vague.html?vagueSearch=${searchValue}`;
    window.open(url,"_self").focus();
}
