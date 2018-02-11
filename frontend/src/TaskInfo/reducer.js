import {FETCH_STARTED, FETCH_SUCCESS, FETCH_FAILURE, CLEAN_TASKINFO} from './actionTypes';

export default (state = null, action) => {
  switch (action.type) {
    case FETCH_STARTED:
      return null;
    case FETCH_SUCCESS:
      return action.info;
    case FETCH_FAILURE:
      return action.info;
    case CLEAN_TASKINFO:
      return null;
    default:
      return state;
  }
}