import {datasets} from "./globals";

const shouldFetchDataset = (path) => {
  var params = path.split('/');
  var confLevel = datasets;
  var config={};
  var ii, elemType;
  config['valid']=true; //this will be set to false if unkown specs are encountered
  config['path']={};
  // loop through the split path elements and the datasets nested config
  // and assign the fields in the config to corresponding elements of
  // the path string.
  for (ii=0; ii<params.length; ii++){
    if (typeof confLevel==='object'){
      elemType = Object.keys(confLevel)[0];
      config['path'][elemType] = [params[ii], ii];
      if (confLevel[elemType].length){
        console.log(confLevel[elemType][0], params[ii]);
        if (typeof confLevel[elemType][0][params[ii]]!=='undefined'){
          confLevel = confLevel[elemType][0][params[ii]][0];
        }else{
          config['valid']=false;
          return config;
        }
      }
    }else{ // if an item remains after going through all levels of the config
           // interpret this as a spec for an item page
      config['item'] = [params[ii], ii];
      if (ii!=params.length-1){ // complain if unparsed elements remain
        console.log("can't parse params "+ii+"+ from "+path);
      }
      return config;
    }
  }
  //fill the remaining config fields with the default
  //position 0 in the list of objects in the datasets config
  while(typeof confLevel==='object'){
    elemType = Object.keys(confLevel)[0];
    config['path'][elemType] = [Object.keys(confLevel[elemType][0])[0], ii];
    if (confLevel[elemType].length){
      confLevel = confLevel[elemType][0][config['path'][elemType][0]][0];
    }
    ii++;
  }
  return config;
};

export default shouldFetchDataset;
