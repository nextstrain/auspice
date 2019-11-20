import React from "react";
import { headerFont } from "../../globalStyles";

const styles = {
  avatar: {
    marginRight: 5,
    marginBottom: 2
  },
  byline: {
    fontFamily: headerFont,
    fontSize: 16,
    marginLeft: 2,
    marginTop: 5,
    marginBottom: 5,
    fontWeight: 400,
    color: "#777",
    lineHeight: 1.4,
    verticalAlign: "middle"
  },
  bylineWeight: {
    fontFamily: headerFont,
    fontSize: 16,
    fontWeight: 400
  }
};

const Byline = ({width, metadata}) => {
  return (
    <div width={width} style={styles.byline}>
      {renderAvatar(metadata)}
      {renderBuildInfo(metadata)}
      {renderMaintainers(metadata)}
    </div>
  );
};

function renderAvatar(metadata) {
  let shouldRenderAvatar = false;
  let imageSrc = "";
  if (Object.prototype.hasOwnProperty.call(metadata, "buildUrl")) {
    const repo = metadata.buildUrl;
    if (typeof repo === 'string') {
      if (repo.startsWith("https://github.com") || repo.startsWith("http://github.com")) {
        const match = repo.match(/https?:\/\/github.com\/([^/]+)/);
        if (match[1]) {
          imageSrc = "https://github.com/" + match[1] + ".png?size=200";
          shouldRenderAvatar = true;
        }
      }
    }
  }
  return (
    shouldRenderAvatar ?
      <img style={styles.avatar} alt="avatar" width="28" src={imageSrc}/> :
      <span/>
  );
}

function renderBuildInfo(metadata) {
  const renderLink = (m) => (<a style={styles.bylineWeight} rel="noopener noreferrer" href={m.url} target="_blank">{m.name}</a>);
  let renderRepo = false;
  const repoObj = {};
  console.log("renderBuildInfo ", metadata.buildUrl);
  if (Object.prototype.hasOwnProperty.call(metadata, "buildUrl")) {
    const repo = metadata.buildUrl;
    if (typeof repo === 'string') {
      if (repo.startsWith("https://") || repo.startsWith("http://")) {
        repoObj.url = repo;
        repoObj.name = repo.replace("https://", "").replace("http://", "");
        renderRepo = true;
      }
    }
  }
  return (
    renderRepo ?
      <span>
        {"Built using "}
        {renderLink(repoObj)}
        {". "}
      </span> :
      <span/>
  );

}

function renderMaintainers(metadata) {
  const renderLink = (m) => (<a style={styles.bylineWeight} rel="noopener noreferrer" href={m.url} target="_blank">{m.name}</a>);
  let shouldRenderMaintainers = false;
  let maintainersArray = {};
  if (Object.prototype.hasOwnProperty.call(metadata, "maintainers")) {
    maintainersArray = metadata.maintainers;
    if (Array.isArray(maintainersArray)) {
      if (maintainersArray[0]) {
        shouldRenderMaintainers = true;
      }
    }
  }
  return (
    shouldRenderMaintainers ?
      <span>
        {"Maintained by "}
        {maintainersArray.map((m, i) => (
          <React.Fragment key={m.name}>
            {m.url ? renderLink(m) : m.name}
            {i === maintainersArray.length-1 ? "" : i === maintainersArray.length-2 ? " and " : ", "}
          </React.Fragment>
        ))}
        {"."}
      </span> :
      <span/>
  );
}

export default Byline;
