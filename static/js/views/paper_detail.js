let citationGraph = null;

const generateNodes = (papers, isCurrentPaper) => {
  return papers.map((paper) => {
    return {
      id: paper.UID,
      label:
        paper.nickname !== ""
          ? paper.nickname
          : `${paper.title.substring(0, 6)}...`,
      color: isCurrentPaper ? "#ff7f7f" : "#9fc2f7",
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
