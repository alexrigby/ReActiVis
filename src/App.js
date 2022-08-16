import React, { useEffect, useState } from "react";

import Header from "./components/header/Header";
import SideBar from "./components/sideBar/SideBar";
import Cytoscape from "./components/cytoscape/Cytoscape";
import Legend from "./components/legend/Legend";

import resetVeiwOnDoubleClick from "./AppFunctions/resetveiwOnDoubleClick";
import makeCyElements from "./functions/makeCyElements";
import LAYOUTS from "./components/cytoscape/functions/cyLayouts";

import dataset from "./data/TDR Matrix_Subset.txt";
import links from "./data/links.txt";
import wpDataset from "./data/wp_names.txt";
import makeCyWpEdges from "./components/cytoscape/functions/makeCyWpEdges";
import addCategoryIcon from "./components/cytoscape/functions/addCategoryIcons";

export function App() {
  //sets state of cy
  const [cyState, setCyState] = useState({
    display: "none",
    cy: null,
    elements: [],
  });

  //sets initial state for selected node
  const [selectedNode, setSelectedNode] = useState({ id: "" });

  useEffect(() => {
    //updates cyytoscape state to include node and edge data
    async function addDataToCytoscape() {
      const { cyElms, wpData } = await makeCyElements(dataset, links, wpDataset); //combines parsing functions to make elements array

      const wpEdge = makeCyWpEdges(cyState.cy, wpData); //creates wp Edges

      setCyState((prevState) => ({
        ...prevState,
        elements: wpEdge ? [...cyElms, ...wpEdge] : cyElms, //if wpEdges exist then add them, if not use cyElms
        display: "block",
      })); //sets elements array as the cytoscape element
      cyState.cy.layout(LAYOUTS.COSE).run();
    }

    addDataToCytoscape()
      //  catch any error
      .catch(console.error);

    addCategoryIcon(cyState.cy);
  }, [cyState.cy, cyState.elements.length]);

  return (
    <div className="container" onDoubleClick={() => resetVeiwOnDoubleClick(setSelectedNode, cyState)}>
      <div className="top-layer">
        <Header cyState={cyState} />
        <Legend cyState={cyState} />
        <SideBar selectedNode={selectedNode} cyState={cyState} setSelectedNode={setSelectedNode} />
      </div>
      <Cytoscape cyState={cyState} setSelectedNode={setSelectedNode} />
    </div>
  );
}

export default App;
