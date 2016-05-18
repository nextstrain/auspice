/* ======= Types ======= */
export const REQUEST_USER = "REQUEST_USER";
export const RECEIVE_USER = "RECEIVE_USER";
export const USER_FETCH_ERROR = "USER_FETCH_ERROR";

/* User */

// const requestUser = () => {
//   return {
//     type: REQUEST_USER
//   };
// };
//
// const receiveUser = (data) => {
//   return {
//     type: RECEIVE_USER,
//     data: data
//   };
// };
//
// const userFetchError = (err) => {
//   return {
//     type: USER_FETCH_ERROR,
//     status: err.status,
//     data: err
//   }
// }
//
// const fetchUser = () => {
//   return PolisNet.polisGet('/api/v3/users', {errIfNoAuth: true});
// }
//
// export const populateUserStore = () => {
//   return (dispatch) => {
//     dispatch(requestUser())
//     return fetchUser().then(
//       res => dispatch(receiveUser(res)),
//       err => dispatch(userFetchError(err))
//     )
//   }
// }
