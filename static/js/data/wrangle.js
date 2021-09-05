const calcAllKeys = function (allPapers, allKeys) {
  const collectAuthors = new Set();
  const collectKeywords = new Set();
  allPapers.forEach((d) => {
    d.authors.forEach((a) => collectAuthors.add(a));
    d.keywords.forEach((a) => collectKeywords.add(a));
    allKeys.dates.push(d.date);
    allKeys.nicknames.push(d.nickname);
    allKeys.titles.push(d.title);
  });
  allKeys.authors = Array.from(collectAuthors);
  allKeys.keywords = Array.from(collectKeywords);
};
