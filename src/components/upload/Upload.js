import { useContext } from "react";

import MyDropzone from "./MyDropzone/MyDropzone";
import ConfigContext from "../../context/ConfigContext";
import "./Upload.css";

export function Upload({ userFiles, setUserFiles, setExcelDataset, fatalErrorState, excelDataset }) {
  const { config } = useContext(ConfigContext);

  const configError =
    userFiles.config.errors &&
    userFiles.config.errors.map((err, i) => {
      return (
        <li key={i}>
          {err.instancePath} {err.message}
        </li>
      );
    });

  const fatalErrorsText = fatalErrorState.length > 0 && (
    <div>
      <p>FATAL ERROR! Cound not find dataset worksheets: {fatalErrorState.map((err) => `"${err}", `)}</p>
      <p>Check that config and dataset spellings match (case sensative)</p>
    </div>
  );

  const landingText = (
    <div>
      <h1>
        Welcome to Re-Pro-Vis! <i class="fa-regular fa-hand-wave"></i>{" "}
      </h1>
      <p>
        Start visualising your research project by uploading your excel(.xlsx) dataset and config (.json) files here
      </p>
    </div>
  );

  const style = (expression) => ({
    color: expression ? "red" : "green",
  });

  return (
    <div className="dropzoneContainer">
      {/* {!config && !excelDataset && landingText} */}
      <MyDropzone userFiles={userFiles} setUserFiles={setUserFiles} setExcelDataset={setExcelDataset} />

      <div className="uploadedFile">
        {userFiles.config.fileName && (
          <div style={style(userFiles.config.errors)}>
            <p>Config: {userFiles.config.fileName}</p>
            {userFiles.config.errors && (
              <>
                <p>Config error: {configError}</p> <p>FILE NOT UPDATED!</p>
              </>
            )}
          </div>
        )}
        {userFiles.dataset.fileName && (
          <div style={style(userFiles.dataset.errors || fatalErrorState.length > 0)}>
            <p>Dataset: {userFiles.dataset.fileName}</p>
            {userFiles.dataset.errors && <p>Dataset Error: {userFiles.dataset.errors} </p>}
            {fatalErrorState.length > 0 && config && fatalErrorsText}
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
