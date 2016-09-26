import {datasets} from "./globals";

/*
 * utility function that akes a string (splat as in flu/h3n2/3y)
 * parses it, and compares it against the datasets json to determine
 * whether that string specifies a valid and complete dataset
 * incomplete path are augmented with defaults
 */
const parseParams = (path) => {
  let params; // split path at '/', if path === "", set params to []
  if (path.length) {
    params = path.split("/").filter( (d) => d !== "");
  } else {
    params = [];
  }

  // config object that will be populated below
  const config={'valid':true, 'incomplete':false, 'dataset':{}, 'item':null, 'fullsplat':""};

  // loop through the split path elements and the datasets nested config
  // and assign the fields in the config to corresponding elements of
  // the path string.0
  let confLevel = datasets;
  let ii, elemType,elem;
  for (ii=0; ii<params.length; ii++){
    elem = params[ii]                       // the choice as in 'flu'
    // check if there are further options to parse
    // dataset structure here is {'virus':[{'flu':{lineages:[...]}}, 'zika':{}, 'ebola':{}, 'default':'flu'}
    if (Object.keys(confLevel).length){
      elemType = Object.keys(confLevel)[0];   // the type is in 'virus'
      // check of element exists -- otherwise mark plat as invalid and return
      if (typeof confLevel[elemType][elem]==='undefined'){
          config['valid']=false;
          return config;
      }else{ // assign valid path element and move confLevel down in the hierarchy
        config['dataset'][elemType] = [ii, elem];
        config['fullsplat'] += elem+'/'
        confLevel = confLevel[elemType][elem];
      }
    }else{ // if an item remains after going through all levels of the config
           // interpret this as a spec for an item page
      config['item'] = [ii, elem];
      config['fullsplat'] += elem+'/'
      if (ii!=params.length-1){ // complain if unparsed elements remain
        console.log("can't parse params "+ii+"+ from "+path);
      }
      return config;
    }
  }
  // fill the remaining config fields with the default. the default is a field
  // like 'default':'flu' at every level of the dataset json
  // continue parsing and adding defaults until hitting the final level of the
  // dataset json, in which case (e.g. '3y:{}') will result in Object.keys({}).length==0
  while(Object.keys(confLevel).length){
    elemType = Object.keys(confLevel)[0];
    elem = confLevel[elemType]['default'];
    config['dataset'][elemType] = [ii, elem];
    // check if specified default is valid, otherwise return undefined
    if (typeof confLevel[elemType][elem]==='undefined'){
        config['valid']=false;
        console.log('no default set')
        return config;
    }else{
      // mark path as 'incomplete' and augment path with the parsed defaults
      config['incomplete']=true;
      config['fullsplat'] += elem+'/';
      config['dataset'][elemType] = [ii, elem];
      // move to next level
      confLevel = confLevel[elemType][elem];
    }
    ii++;
  }
  return config;
};

export default parseParams;
