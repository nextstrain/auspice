import { debounce } from 'lodash';
import * as types from "./types";

export const updateEntropyVisibility = debounce((dispatch) => { // eslint-disable-line import/prefer-default-export
  dispatch({
    type: types.ENTROPY_DATA,
    data: "entropy data"
  });
}, 1000, { leading: false, trailing: true });
