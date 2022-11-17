import nodeNavigationHandler from "./functions/nodeNavigationHandler";
import hilightOnLiHover from "./functions/hilightOnLiHover";
import { useState } from "react";

export function StakeholderMetaPannel({ selectedNode, setSelectedNode, cyState }) {
  const open = <i className="fa fa-angle-down"></i>;
  const close = <i className="fa fa-angle-up"></i>;

  const engCount = [1, 2, 3, 4]; // add or remove numbers if engement level chnages
  const subSections = ["activity"]; // add or remove subsections

  const engObj = engCount.reduce((p, c) => ({ ...p, [`eng${c}`]: false }), {}); //adds each engement level to object {eng(n): false}
  const subSectionObj = subSections.reduce((p, c) => ({ ...p, [c]: false }), {}); // each subsection to onject- false

  const [staAccordion, setStaAccordion] = useState({ ...engObj, ...subSectionObj });

  const openStaAccordion = (event, key) => {
    setStaAccordion((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const style = (key) => ({ display: staAccordion[key] ? "block" : "none" });

  const activityLists = [];
  const actCollection = [];

  //4 for 4 engagement levels
  for (let i = 0; i < 4; i++) {
    //get collections of conected nodes by engagemnet level
    const acts = cyState.cy
      .nodes(`[id = "${selectedNode.id}"]`)
      .outgoers(`[engagement = "${i + 1}"]`)
      .targets();

    actCollection.push(acts.flat());

    //only push lists that have nodes
    if (acts.length !== 0) {
      activityLists.push(
        <div className="metaSection" key={i}>
          <h2>
            Level {i + 1} engagement:
            <span onClick={() => openStaAccordion("click", `eng${i}`)}>{staAccordion[`eng${i}`] ? close : open}</span>
          </h2>
          <h2>count: {acts.length}</h2>
          <div style={style(`eng${i}`)}>
            <ul>{listLinks(acts, setSelectedNode, cyState)} </ul>
          </div>
        </div>
      );
    }
  }

  const actCount = actCollection.flat().length;

  return (
    <div>
      <div className="metaSection">
        <h1>{selectedNode.name}</h1>
        <h1>{selectedNode.id}</h1>
      </div>

      <div className="metaSection">
        <h1>
          LINKED ACTIVITIES
          <span onClick={() => openStaAccordion("click", "activity")}>{staAccordion.activity ? close : open}</span>
        </h1>
        <h2>count: {actCount}</h2>
      </div>
      <div style={style("activity")}>{activityLists}</div>
    </div>
  );
}

export default StakeholderMetaPannel;

function listLinks(nodes, setSelectedNode, cyState) {
  return nodes.map((act) => (
    <li
      key={act.id()}
      onClick={() => nodeNavigationHandler(act.id(), setSelectedNode, cyState)}
      onMouseOver={() => hilightOnLiHover(act.id(), cyState)}
      onMouseOut={() => hilightOnLiHover(act.id(), cyState)}
    >
      {act.id()}. {act.data().name}
    </li>
  ));
}