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

const generateEdges = (thisPaperID, otherPaperIDs, isInEdge) => {
  return otherPaperIDs.map((paperID) => {
    if (isInEdge) {
      return {
        from: paperID,
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
      to: paperID,
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

const constructCitationCode = (paper) => {
  const authors = paper["authors"];
  const year = paper["year"];
  let citationCode = "";
  if (authors.length == 1)
  {
    const familyname = authors[0].split(" ")[1];
    citationCode = familyname.substring(0, 3) + year.substring(2);
  }
  else if (authors.length == 2)
  {
    const familyname1 = authors[0].split(" ")[1];
    const familyname2 = authors[1].split(" ")[1];
    citationCode = familyname1[0] + familyname2[0] + year.substring(2);
  }
  else if (authors.length == 3)
  {
    const familyname1 = authors[0].split(" ")[1];
    const familyname2 = authors[1].split(" ")[1];
    const familyname3 = authors[2].split(" ")[1];
    citationCode = familyname1[0] + familyname2[0] + familyname3[0] + year.substring(2);
  }
  else {
    const familyname1 = authors[0].split(" ")[1];
    const familyname2 = authors[1].split(" ")[1];
    const familyname3 = authors[2].split(" ")[1];
    citationCode = familyname1[0] + familyname2[0] + familyname3[0] + "*" + year.substring(2);
  }
  return citationCode;
}

const drawCitationGraphAndGenerateCitationCode = (paperID) => {
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
      const citationCode = constructCitationCode(thisPaper[0]);
      d3.select("#citation-code-wrapper")
        .html(`<span style="border-radius: 1rem; background-color: #bed972;">&nbsp${citationCode}&nbsp</span>`);
      const nodes_ = new Set([...papersCitedByThisPaper, ...papersCitingThisPaper]);
      const nodes = new vis.DataSet([
        ...generateNodes(thisPaper, true),
        ...generateNodes(Array.from(nodes_), false)
      ]);
      const edges = new vis.DataSet([
        ...generateEdges(paperID, Array.from(paperIDsCitedByThisPaper), false),
        ...generateEdges(paperID, Array.from(paperIDsCitingThisPaper), true),
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
    const url = `paper_${nodeId}.html`;
    window.open(url, '_blank').focus();
  }
}
