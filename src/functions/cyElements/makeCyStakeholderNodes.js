export function makeCyStakeholerNodes(stakeholders) {
  return stakeholders.map((s) => ({
    group: "nodes",
    data: {
      opacity: 0.9,
      type: "stakeholderNode",
      size: 1,
      id: s.stakeholderID,
      label: s.stakeholderID,
      name: s.name,
      //   parent: "stakeholders",
    },
  }));
}

export default makeCyStakeholerNodes;