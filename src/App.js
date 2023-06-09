import React, { useEffect, useRef, useState, useContext } from "react";
import ConfigContext from "./context/ConfigContext";
import SplitPane from "react-split-pane";

import Header from "./components/header/Header";
import SidePannel from "./components/sidePannel/SidePannel";
import CytoscapeVis from "./components/cytoscape/CytoscapeVis";
import Legend from "./components/legend/Legend";
import BottomPannel from "./components/bottomPannel/BottomPannel";
import FilterOptions from "./components/FilterOptions/FilterOptions";
import ToggleButtons from "./components/ToggleButtons/ToggleButtons";
import Upload from "./components/upload/Upload";
import WarningBar from "./components/warningBar/WarningBar";
import DownloadUploadButtons from "./components/downloadUploadButtons/DownloadUploadButtons";

import resetVeiwOnDoubleClick from "./AppFunctions/resetveiwOnDoubleClick";
import makeVisElements from "./functions/makeVisElements";
import getDataset from "./functions/getDataset";

export function App() {
  //-----------------SET STATES-------------------------
  const [cyState, setCyState] = useState({
    display: "none",
    cy: null,
    elements: [],
  });

  const [selectedNode, setSelectedNode] = useState({ id: "" }); //what node is selected
  const [prPeriod, setPrPeriod] = useState({ pr: null, undefined: true }); // selected prPeriod
  const [currentStory, setCurrentStory] = useState(null); //story IDs
  const [activityEdgeDisplay, setActivityEdgeDisplay] = useState("wp"); //toggle edges
  const [completedDisplay, setCompletedDisplay] = useState(false); //sets nodes opacity
  const [stakeholdersDisplay, setStakeholdersDisplay] = useState(false); //show/hide stakeholders
  const [networkVeiw, setNetworkVeiw] = useState(false); // show/hide network veiw
  const [selectedBottomVis, setSelectedBottomVis] = useState(""); //which bottom pannel is open
  const [networkVeiwEls, setNetworkVeiwEls] = useState({ ID: "", els: [] }); //holds elements for network veiw
  const [engScoreVeiw, setEngeScoreVeiw] = useState(false); // show engagement ranking
  const [customStoryDisplay, setCustomStoryDisplay] = useState(false); //open custom filter options
  const [uploadVeiw, setUploadVeiw] = useState(false);
  const [userFiles, setUserFiles] = useState({
    config: { fileName: null, errors: null },
    dataset: { fileName: null, errors: null },
  });
  const [excelDataset, setExcelDataset] = useState(null);
  const [fieldWarning, setFieldWarning] = useState(null);
  const [visDatasets, setVisDatasets] = useState(null);
  const [warningBarDisplay, setWarningBarDisplay] = useState(true);

  const [fatalErrorState, setFatalErrorState] = useState([]);

  // ---------------------------USE REFS-------------------------------
  const gantchartDataRef = useRef(null); //stores parsed gantchart data
  const datesRef = useRef(null); //stores dates
  const actDataRef = useRef(null); //stores activity data
  const stakeholderDataRef = useRef(null); //stakeholder data
  const currentActNodeCountRef = useRef(null); //number of activitiy nodes
  const latestPrPeriodRef = useRef(null); //current period in time
  const engagementScoresRef = useRef(null); //engagment level and ranking

  currentActNodeCountRef.current = actDataRef.current && actDataRef.current.length;

  const fatalErrorMessage = useRef([]);

  //----------------------------------CONFIG-----------------------------------------
  const { config, setConfig } = useContext(ConfigContext);

  //----------------------- DOES INITIAL SEARCH FOR LOCAL ITEMS AND SETS TO STATE-----------------------------------
  useEffect(() => {
    const excelFileString = window.localStorage.getItem("excelDataset");
    if (excelFileString) {
      // sets string repreentation of array buffer to array bufffer
      const file = new Uint8Array(excelFileString.split(",")).buffer;
      setExcelDataset(file);
    } else {
      setExcelDataset(null);
    }

    //finds names and errors of locally stored datasets
    const localUserFiles = window.localStorage.getItem("userFiles");
    if (localUserFiles) {
      const fileErros = JSON.parse(localUserFiles);
      //reseting user files if there have been efatal config or dataset errors that mean the local storage has not been updated
      const resetConfigErrors = {
        ...fileErros,
        config: { ...fileErros.config, errors: null },
        dataset: { ...fileErros.dataset, fileName: excelFileString ? fileErros.dataset.fileName : null },
      };
      setUserFiles(resetConfigErrors);
    } else {
      setUserFiles({
        config: { fileName: null, errors: null },
        dataset: { fileName: null, errors: null },
      });
    }
  }, []);

  //sets the names of datasets in local storage when user uploads new files
  useEffect(() => {
    window.localStorage.setItem("userFiles", JSON.stringify(userFiles));
  }, [userFiles]);

  //---------------HANDLES MAKING VIS DATASETS FRO THE EXCEL DATASTE AND FINDING FATAL ERRORS------------------------//
  useEffect(() => {
    if (config && excelDataset) {
      //gets arrays of all worksheet data and any errors in config/worksheet
      const { visData, fatalErrors } = getDataset(excelDataset, config, setConfig);

      setVisDatasets(visData);
      setFatalErrorState(fatalErrors);
      //sets local storage if there are no fatal errors
      fatalErrors.length === 0 && window.localStorage.setItem("excelDataset", new Uint8Array(excelDataset).toString());
    }
  }, [config, excelDataset, setConfig]);

  //--------HANDLES STORING EXCEL DATA TO LOCAL STORAGE--------------------//
  useEffect(() => {
    if (!fatalErrorState.length > 0) {
      window.localStorage.setItem("excelDataset", new Uint8Array(excelDataset).toString());
    } else {
      // if there are fatal errors then fetch excel dataset from local storage and reset exceldata state
      const localExcelDataset = window.localStorage.getItem("excelDataset");
      fatalErrorMessage.current = fatalErrorState && fatalErrorState;
      if (localExcelDataset) {
        setExcelDataset(new Uint8Array(localExcelDataset.split(",")).buffer);
      } else {
        setExcelDataset(null);
      }
    }
  }, [fatalErrorState.length]);

  //--------------DOES ALL PARSING OF DATA AND MAKING VIS ITEMS------------------------//
  useEffect(() => {
    if (config && excelDataset && visDatasets && !fatalErrorState.length > 0) {
      async function addDataToCytoscape() {
        const {
          cyElms,
          gantChartItems,
          activityData,
          dates,
          stakeholderData,
          latestPrPeriod,
          maxEngScore,
          missingFieldWarning,
        } = await makeVisElements(prPeriod, currentStory, completedDisplay, config, visDatasets); //all pre-processing of data

        actDataRef.current = activityData; //asigns activity data to ref
        stakeholderDataRef.current = stakeholderData;
        datesRef.current = dates; //assigns dates ro ref
        gantchartDataRef.current = gantChartItems; //asign gant chart data to the ref
        latestPrPeriodRef.current = latestPrPeriod;
        engagementScoresRef.current = maxEngScore; // gives default maxEngScore

        setFieldWarning(missingFieldWarning);
        setCyState((prevState) => ({
          ...prevState,
          elements: cyElms,
          display: "block",
        }));
      }

      addDataToCytoscape();
    }
  }, [
    completedDisplay,
    cyState.cy,
    cyState.elements.length,
    prPeriod,
    currentStory,
    config,
    visDatasets,
    excelDataset,
    fatalErrorState.length,
  ]);

  //---------------------- STYLE -------------------------------------

  // HIDE SIDE PANNEL (bug in splitpane so this is best option)
  document.querySelectorAll(".Pane2").forEach((el) => {
    el.style.display = selectedNode.id === "" ? "none" : "block";
  });

  const veiwStyle = {
    opacity: uploadVeiw ? 0.2 : 1.0,
    pointerEvents: uploadVeiw ? "none" : "all",
  };

  if (visDatasets && !fatalErrorState.length > 0) {
    return (
      <div className="container">
        <div className="Resizer">
          <SplitPane split="vertical" minSize={"20em"} defaultSize={"20em"} allowResize={true} primary="second">
            <div>
              <div style={veiwStyle}>
                <div className="top-layer">
                  {fieldWarning && warningBarDisplay && Object.keys(fieldWarning).length > 0 && (
                    <WarningBar fieldWarning={fieldWarning} setWarningBarDisplay={setWarningBarDisplay} />
                  )}
                  <div className="headSection">
                    <div className="rightSide">
                      <Header
                        cyState={cyState}
                        datesRef={datesRef}
                        prPeriod={prPeriod}
                        currentStory={currentStory}
                        completedDisplay={completedDisplay}
                        networkVeiw={networkVeiw}
                        warningBarDisplay={warningBarDisplay}
                        setWarningBarDisplay={setWarningBarDisplay}
                        fieldWarning={fieldWarning}
                      />
                      {!uploadVeiw && (
                        <FilterOptions
                          datesRef={datesRef}
                          prPeriod={prPeriod}
                          setPrPeriod={setPrPeriod}
                          currentStory={currentStory}
                          setCurrentStory={setCurrentStory}
                          actDataRef={actDataRef}
                          cyState={cyState}
                          setNetworkVeiw={setNetworkVeiw}
                          customStoryDisplay={customStoryDisplay}
                          setCustomStoryDisplay={setCustomStoryDisplay}
                        />
                      )}
                      <Legend
                        cyState={cyState}
                        networkVeiw={networkVeiw}
                        selectedNode={selectedNode}
                        networkVeiwEls={networkVeiwEls}
                        engScoreVeiw={engScoreVeiw}
                        stakeholdersDisplay={stakeholdersDisplay}
                      />
                    </div>
                    {!uploadVeiw && (
                      <ToggleButtons
                        selectedBottomVis={selectedBottomVis}
                        setSelectedBottomVis={setSelectedBottomVis}
                        setStakeholdersDisplay={setStakeholdersDisplay}
                        currentActNodeCountRef={currentActNodeCountRef}
                        setActivityEdgeDisplay={setActivityEdgeDisplay}
                        setCompletedDisplay={setCompletedDisplay}
                        cyState={cyState}
                        setNetworkVeiw={setNetworkVeiw}
                        networkVeiw={networkVeiw}
                        completedDisplay={completedDisplay}
                        stakeholdersDisplay={stakeholdersDisplay}
                        selectedNode={selectedNode}
                        engScoreVeiw={engScoreVeiw}
                        setEngeScoreVeiw={setEngeScoreVeiw}
                        setCustomStoryDisplay={setCustomStoryDisplay}
                      />
                    )}
                  </div>

                  <BottomPannel
                    gantchartDataRef={gantchartDataRef}
                    cyState={cyState}
                    setSelectedNode={setSelectedNode}
                    actDataRef={actDataRef}
                    datesRef={datesRef}
                    prPeriod={prPeriod}
                    selectedBottomVis={selectedBottomVis}
                    setSelectedBottomVis={setSelectedBottomVis}
                  />
                </div>
                <div onDoubleClick={() => resetVeiwOnDoubleClick(setSelectedNode, cyState, networkVeiw)}>
                  <CytoscapeVis
                    cyState={cyState}
                    setSelectedNode={setSelectedNode}
                    selectedNode={selectedNode}
                    activityEdgeDisplay={activityEdgeDisplay}
                    stakeholdersDisplay={stakeholdersDisplay}
                    currentActNodeCountRef={currentActNodeCountRef}
                    networkVeiw={networkVeiw}
                    completedDisplay={completedDisplay}
                    latestPrPeriodRef={latestPrPeriodRef}
                    prPeriod={prPeriod}
                    networkVeiwEls={networkVeiwEls}
                    setNetworkVeiwEls={setNetworkVeiwEls}
                    engScoreVeiw={engScoreVeiw}
                    engagementScoresRef={engagementScoresRef}
                  />
                </div>
              </div>

              {uploadVeiw && (
                <Upload
                  userFiles={userFiles}
                  setUserFiles={setUserFiles}
                  setExcelDataset={setExcelDataset}
                  fatalErrorState={fatalErrorState}
                  excelDataset={excelDataset}
                  fatalErrorMessage={fatalErrorMessage}
                />
              )}

              <DownloadUploadButtons
                config={config}
                excelDataset={excelDataset}
                setUploadVeiw={setUploadVeiw}
                userFiles={userFiles}
                uploadVeiw={uploadVeiw}
                setUserFiles={setUserFiles}
                fatalErrorMessage={fatalErrorMessage}
              />
            </div>
            <div id="sideP" data-open="false">
              <SidePannel
                selectedNode={selectedNode}
                cyState={cyState}
                setSelectedNode={setSelectedNode}
                datesRef={datesRef}
                prPeriod={prPeriod}
                networkVeiw={networkVeiw}
                setStakeholdersDisplay={setStakeholdersDisplay}
              />
            </div>
          </SplitPane>
        </div>
      </div>
    );
  } else {
    return (
      <Upload
        userFiles={userFiles}
        setUserFiles={setUserFiles}
        setExcelDataset={setExcelDataset}
        fatalErrorState={fatalErrorState}
        excelDataset={excelDataset}
        fatalErrorMessage={fatalErrorMessage}
      />
    );
  }
}

export default App;
