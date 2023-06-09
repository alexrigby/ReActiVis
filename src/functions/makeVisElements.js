import parseActivityDataset from "./datasetParseFunctions/parseActivityDataset";

import makeActEdges from "./cyElements/makeActEdges";
import makeActNodes from "./cyElements/makeActNodes";
import makeGantchartItems from "./ganttChartFucntions/makeGantchartItems";
import makeWpNodes from "./cyElements/makeWpNodes";
import trimActData from "./trimDataFunctions/trimActData";
import parseStakeholderDataset from "./datasetParseFunctions/parseStakeholderDataset";
import makeStakeholerNodes from "./cyElements/makeStakeholderNodes";
import makeStakeholderEdges from "./cyElements/makeStakeholderEdges";
import makeWpEdges from "./cyElements/makeWpEdges";
import makeDates from "./datesFunction/makeDates";
import parseWPDataset from "./datasetParseFunctions/parseWPDataset";
import linksMatrixToArray from "./datasetParseFunctions/linksMatrixToArray";

import getMissingFields from "./getMissingFields";
import cloneDeep from "lodash.clonedeep";

export async function makeVisElements(prPeriod, currentStory, completedDisplay, config, visDatasets) {
  // ------------------------ Make a copy of vis Datsets state -------------------------

  const { actLinks, stLinks, actDataset, wpDataset, stDataset, stWorksheetMissing } = cloneDeep(visDatasets); // make a deep copy so state isnt affected directly

  //-----------------MAKE DATES AND MONTHS ARRAY-----//
  const startDate = config.START_DATE;
  const endDate = config.END_DATE;
  const dates = config.INCLUDE_DATES && makeDates(startDate, endDate, config);

  //-----------------PARSE DATA ----------
  // if no months are provided then dont add dates to data
  const wpData = parseWPDataset(wpDataset, config);
  const activityData = parseActivityDataset(actDataset, dates, wpData, config);

  const links = linksMatrixToArray(actLinks);

  //-------------TRIM ACT DATA TO FILTER SPECIFICATION ----------------
  const latestPrPeriod = config.INCLUDE_DATES && dates[dates.length - 1].prPeriod;
  //trimmedActData === current filter, filteredByPr === all data in curent pr period regardless of story filter
  const { trimmedActData, filteredByPr } = trimActData(activityData, prPeriod, currentStory, config);

  //only return wps that are present in actdataset
  const trimmedWpData = wpData.filter((wp) =>
    [...new Set(trimmedActData.map((act) => `WP_${act.WP}`))].includes(wp.id)
  );

  const { actNodes, actNodesParentless } = makeActNodes(trimmedActData, config);
  const noParentNodes = actNodesParentless.map((node) => node.data.id);
  // ----TRIM & FILTER STAKEHOLDERS-------
  // returns the max engagement score for the pr period (regardless of stroy filter)
  const maxEngScore =
    config.INCLUDE_STHOLDERS &&
    !stWorksheetMissing.length > 0 &&
    parseStakeholderDataset(stLinks, stDataset, filteredByPr, config, noParentNodes).maxEngScore;
  // creates ealily readable stakeholder object from stData and stLinks to match trimmed activity data
  const stakeholderData =
    config.INCLUDE_STHOLDERS &&
    !stWorksheetMissing.length > 0 &&
    parseStakeholderDataset(stLinks, stDataset, trimmedActData, config, noParentNodes).stakeholderData;

  //----MAKE VIS ELEMENTS -------------

  const actEdges = makeActEdges(links, actNodes);

  const wpNodes = makeWpNodes(trimmedWpData, config);
  const wpEdges = makeWpEdges(trimmedWpData, config);
  const stakeholderNodes =
    config.INCLUDE_STHOLDERS && !stWorksheetMissing.length > 0 && makeStakeholerNodes(stakeholderData);
  const stakeholderEdges =
    config.INCLUDE_STHOLDERS && !stWorksheetMissing.length > 0 && makeStakeholderEdges(stakeholderData);

  const gantChartItems =
    config.INCLUDE_DATES &&
    makeGantchartItems(trimmedActData, trimmedWpData, prPeriod, completedDisplay, latestPrPeriod, config);

  //node to hold all other nodes, prevents stakeholder nodes entering center of graph
  const projectNode = {
    group: "nodes",
    grabbable: false,
    data: {
      id: "project",
      type: "project",
      label: "",
    },
  };

  //----ALL CYTOSCAPE ELEMENTS-----
  const cyElms = [...actNodes, ...actEdges.flat(), ...wpNodes, ...wpEdges].flat();

  //if stakeholders are included then add them to cy elements
  config.INCLUDE_STHOLDERS &&
    !stWorksheetMissing.length > 0 &&
    cyElms.push(...stakeholderNodes, ...stakeholderEdges.flat(), projectNode);

  //----------------FIND FILEDS SPECIFIED IN CONFIG BUT NOT IN DATASET AND NODES WITH NO PARENT ------------------------------//

  const missingWpFields = getMissingFields(wpDataset, config.wpFields);
  const missingActFields = getMissingFields(actDataset, config.actFields);
  const missingStFields =
    config.INCLUDE_STHOLDERS && !stWorksheetMissing.length > 0 && getMissingFields(stDataset, config.stFields);

  const missingFieldWarning = {
    ...(noParentNodes.length > 0 && { parentlessNodes: noParentNodes }),
    ...(stWorksheetMissing.length > 0 && { worksheets: stWorksheetMissing }),
    ...(missingWpFields.length > 0 && { [config.WORKSHEETS.WORKPACKAGES]: missingWpFields }),
    ...(missingActFields.length > 0 && { [config.WORKSHEETS.ACTIVITIES]: missingActFields }),
    ...(missingStFields.length > 0 && { [config.WORKSHEETS.STAKEHOLDERS]: missingStFields }),
  };

  return {
    cyElms,
    gantChartItems,
    activityData: trimmedActData,
    dates,
    stakeholderData,
    latestPrPeriod,
    maxEngScore,
    missingFieldWarning,
  };
}

export default makeVisElements;
