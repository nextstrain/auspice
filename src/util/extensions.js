

/* set up time -- only runs once no matter how many components import this */

const registry = (() => {
  console.log("EXTENSTIONS.jS");
  if (!process.env.EXTENSION_DATA) {
    console.log("no EXTENSION_DATA found")
    return {};
  }
  const extensionJson = JSON.parse(process.env.EXTENSION_DATA);
  console.log("extensionJson", extensionJson);
  return extensionJson;
})();


export const getExtension = (what) => {
  console.log("trying to get:", what)
  return "something";
}
