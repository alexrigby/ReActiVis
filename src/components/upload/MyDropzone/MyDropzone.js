import { useCallback, useMemo, useContext } from "react";
import { useDropzone } from "react-dropzone";
import ConfigContext from "../../../context/ConfigContext";

import configHandler from "../../../grammar/configHandler";

import "./MyDropzone.css";

const fileTypes = {
  JSON: "application/json",
  EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const baseStyle = {
  margin: "1em",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#818181",
  borderStyle: "dashed",
  backgroundColor: "#e6e6e6",
  color: "#818181",
  outline: "none",
  transition: "border .24s ease-in-out",
  cursor: "pointer",
};

const focusedStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

export function MyDropzone({ userFiles, setUserFiles, setExcelDataset, fatalErrorMessage }) {
  const { config, setConfig } = useContext(ConfigContext);

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");

      reader.onload = () => {
        if (file.type === fileTypes.JSON) {
          const { configObj, errors } = configHandler(JSON.parse(reader.result)); // returns undefined if error with JSON schema
          if (!errors) {
            configObj && setConfig(configObj); //parses and sets config from user uploaded JSON file
            configObj &&
              setUserFiles((prevState) => ({
                ...prevState,
                config: {
                  errors: null,
                  fileName: file.path,
                },
              }));
            window.localStorage.setItem("config", reader.result);
          } else {
            setUserFiles((prevState) => ({
              ...prevState,
              config: {
                fileName: file.path,
                errors: errors,
              },
            }));
          }
        } else if (file.type === fileTypes.EXCEL) {
          fatalErrorMessage.current = [];
          try {
            setExcelDataset(reader.result);
            //sets local storage to string representation of excel file array buffer
            // window.localStorage.setItem("excelDataset", new Uint8Array(reader.result).toString());
            setUserFiles((prevState) => ({
              ...prevState,
              dataset: {
                fileName: file.path,
                errors: null,
              },
            }));
          } catch (error) {
            setUserFiles((prevState) => ({
              ...prevState,
              dataset: {
                fileName: file.path,
                errors: error,
              },
            }));
            console.error(error);
          }
        }
      };
      // return array buffer if excel, or text if json
      file.type === fileTypes.JSON && reader.readAsText(file);
      file.type === fileTypes.EXCEL && reader.readAsArrayBuffer(file);
    });
  }, []);

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      [fileTypes.JSON]: [".json"],
      [fileTypes.EXCEL]: [".xlsx", ".xls"],
    },
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <div {...getRootProps({ style })} className="dropzone">
      <input {...getInputProps()} />
      <p>
        Upload files here <i className="fa fa-upload"></i>
      </p>
      <p style={{ fontSize: "10pt" }}>
        Drag and drop <b>.json</b> and <b>.xlsx</b> files or click to browse
      </p>
    </div>
  );
}

export default MyDropzone;
