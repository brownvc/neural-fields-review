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
