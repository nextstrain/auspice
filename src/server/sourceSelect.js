const getSource = (url) => {
  let parts = url.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  if (parts[0] === "status") parts = parts.slice(1);
  if (!parts.length) return "live";
  switch (parts[0]) {
    case "local": return "local";
    case "staging": return "staging";
    case "community": return "github";
    default: return undefined;
  }
};

module.exports = {
  getSource
};
