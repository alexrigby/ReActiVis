import cloneDeep from "lodash.clonedeep";
import _config from "./config.json";
import validateConfig from "./validateConfig.js";

export function configHandler() {
  const valid = validateConfig(_config); // checks if config is valid

  if (valid) {
    const configClone = cloneDeep(_config); // clone config so as not to edit origional

    const projectMeta = {
      NAME: configClone.name,
      START_DATE: configClone.startDate,
      END_DATE: configClone.endDate === "today" ? new Date().toISOString().split("T")[0] : configClone.endDate,
      PR_PERIOD: configClone.progressReportPeriod,
      STORIES: configClone.stories,
      //-----------INFERRED----------
      STHOLDERS: configClone.stakeholders ? true : false, // infer if user has chosen to include stakeholders
      INCLUDE_DATES: configClone.startDate || configClone.endDate ? true : false, // infer if the project has dates

      actFields: {
        ID: configClone.activities.id,
        NAME: configClone.activities.name,
        WP: configClone.activities.workPackage,
        START_DATE: configClone.activities.startDate,
        END_DATE: configClone.activities.endDate,
        SDGs: configClone.activities.sustainableDevelopmentGoals,
        META_FIELDS: configClone.activities.metaFields,
        //---------INFERRED---------------
        CATEGORYS_PROVIDED: configClone.activities.metaFields.filter((f) => f.type === "category").length > 0, // if any categorical meta data  provided
      },

      wpFields: {
        ID: configClone.workPackages.id,
        NAME: configClone.workPackages.name,
        META_FIELDS: configClone.workPackages.metaFields,
      },

      //can omit stakeholders from config but still need object to check in js
      stFields: {
        ID: configClone.stakeholders ? configClone.stakeholders.id : false,
        NAME: configClone.stakeholders ? configClone.stakeholders.name : false,
        META_FIELDS: configClone.stakeholders ? configClone.stakeholders.metaFields : false,
      },
    };

    return projectMeta;
  }
}

export default configHandler;