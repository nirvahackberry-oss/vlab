const LAB_ID_TO_TYPE = {
  "python-lab": "python",
  "java-lab": "java",
  "linux-lab": "linux",
  "dbms-lab": "dbms",
  "testing-lab": "testing",
  "mobile-app-lab": "android",
  "agile-lab": "agilemethodology",
  "big-data-lab": "bigdata",
  "data-science-lab": "datascience",
  "dotnet-lab": "dotnet",
  "software-eng-lab": "softwareengeering",
};

const LANGUAGE_TO_TYPE = {
  python: "python",
  java: "java",
  shell: "linux",
  bash: "linux",
  sql: "dbms",
};

export const resolveLabType = ({ labId, language, labType }) => {
  if (labType) return labType.toLowerCase();
  if (labId && LAB_ID_TO_TYPE[labId]) return LAB_ID_TO_TYPE[labId];
  if (labId?.includes("-")) {
    const guess = labId.split("-")[0].toLowerCase();
    if (["python", "java", "linux", "dbms"].includes(guess)) return guess;
  }
  if (language && LANGUAGE_TO_TYPE[language]) return LANGUAGE_TO_TYPE[language];
  return language?.toLowerCase() || "python";
};
