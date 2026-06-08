/* eslint no-unused-expressions: off */

/* HOW TO RUN THESE TESTS?
npx mocha
*/

const chai = require('chai');
chai.use(require('chai-http'));

const expect = chai.expect;

const isValidURLCallback = (url) => {
  return (done) => {
    chai.request(url)
      .get('')
      .end((err, res) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done(); // Call done to signal callback end
      });
  };
};


it('loads the spash page as expected', isValidURLCallback('http://localhost:4000'));
it('loads /zika', isValidURLCallback('http://localhost:4000/zika'));
