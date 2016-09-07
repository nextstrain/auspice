import {datasets} from "./globals";

const shouldFetchDataset = (path) => {
  var params = path.split('/');
  var confLevel = datasets;
  var config={};
  var ii, elemType,elem;
  config['valid']=true; //this will be set to false if unkown specs are encountered
  config['dataset']={};
  // loop through the split path elements and the datasets nested config
  // and assign the fields in the config to corresponding elements of
  // the path string.0
  for (ii=0; ii<params.length; ii++){
    if (Object.keys(confLevel).length){
      elemType = Object.keys(confLevel)[0];
      elem = params[ii]
      if (typeof confLevel[elemType][elem]==='undefined'){
          config['valid']=false;
          return config;
      }else{
        config['dataset'][elemType] = [ii, elem];
        confLevel = confLevel[elemType][elem];
      }
    }else{ // if an item remains after going through all levels of the config
           // interpret this as a spec for an item page
      config['item'] = [ii, params[ii]];
      if (ii!=params.length-1){ // complain if unparsed elements remain
        console.log("can't parse params "+ii+"+ from "+path);
      }
      return config;
    }
  }
  //fill the remaining config fields with the default
  //position 0 in the list of objects in the datasets config
  while(Object.keys(confLevel).length){
    elemType = Object.keys(confLevel)[0];
    elem = confLevel[elemType]['default']
    config['dataset'][elemType] = [ii, elem];
    if (typeof confLevel[elemType][elem]==='undefined'){
        config['valid']=false;
        console.log('no default set')
        return config;
    }else{
      config['dataset'][elemType] = [ii, elem];
      confLevel = confLevel[elemType][elem];
    }
    ii++;
  }
  return config;
};

export default shouldFetchDataset;
