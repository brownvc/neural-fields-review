let citationGraph = null;

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

const generateEdges = (thisPaperID, papers, isInEdge) => {
  return papers.map((paper) => {
    if (isInEdge) {
      return {
        from: paper.UID,
        to: thisPaperID,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.4,
          },
        },
        label: "citing",
        font: { align: "middle" },
        color: "green",
      };
    }

    return {
      from: thisPaperID,
      to: paper.UID,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.4,
        },
      },
      label: "citing",
      font: { align: "middle" },
      color: "orange",
    };
  });
};

const drawCitationGraph = (paperID) => {
  Promise.all([API.getPapers(), API.getCitationGraphData()])
    .then(([allPapers, citationGraphData]) => {
      paperIDsCitedByThisPaper = new Set(citationGraphData[paperID].out_edge);
      paperIDsCitingThisPaper = new Set(citationGraphData[paperID].in_edge);
      papersCitedByThisPaper = allPapers.filter((paper) =>
        paperIDsCitedByThisPaper.has(paper.UID)
      );
      thisPaper = allPapers.filter((paper) => paper.UID === paperID);
      papersCitingThisPaper = allPapers.filter((paper) =>
        paperIDsCitingThisPaper.has(paper.UID)
      );
      console.log(thisPaper, papersCitedByThisPaper, papersCitingThisPaper);
      const nodes = new vis.DataSet([
        ...generateNodes(thisPaper, true),
        ...generateNodes(papersCitedByThisPaper, false),
        ...generateNodes(papersCitingThisPaper, false),
      ]);
      const edges = new vis.DataSet([
        ...generateEdges(paperID, papersCitedByThisPaper, false),
        ...generateEdges(paperID, papersCitingThisPaper, true),
      ]);
      const container = document.getElementById("citationGraph");
      const data = {
        nodes,
        edges,
      };
      const options = {
        nodes: {
          shape: "dot",
          size: 22,
        },
      };
      citationGraph = new vis.Network(container, data, options);
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
