export class NoContentError extends Error {
  constructor(...params) {
    super(...params);
  }
}

export class FetchError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Thrown when a download produces an empty Newick tree.
 * Usually caused by users trying to download multiple subtrees that do not
 * share a common ancestor that is "visible"
 */
export class EmptyNewickTreeCreated extends Error {
  constructor(...params) {
    super(...params);
    this.name = this.constructor.name;
  }
}
