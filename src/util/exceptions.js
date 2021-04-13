export class NoContentError extends Error {
  constructor(...params) {
    super(...params);
  }
}

export class RedirectToAnotherNextstrainPage extends Error {
  constructor(redirectUrl, ...params) {
    super(...params);
    this.redirectUrl = redirectUrl;
  }
}
