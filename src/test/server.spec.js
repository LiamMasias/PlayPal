// Imports the index.js file to be tested.
const server = require('../index');
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  // ===========================================================================
  // TO-DO: Part A Login unit test case

  //We are checking POST /add_user API by passing the user info in the correct order. This test case should pass and return a status 200 along with a "Success" message.
//Positive cases
it('positive : /login', done => {
  chai
    .request(server)
    .post('/login')
    .send({username: 'LembaMati', password: 'HelloWorld!'})
    .end((err, res) => {
      expect(res).to.have.status(200);
      expect(res.body.message).to.equals('Success');
      done();
    });
});

//We are checking POST /add_user API by passing the user info in in incorrect manner (name cannot be an integer). This test case should pass and return a status 200 along with a "Invalid input" message.
it('Negative : /login. Checking invalid name', done => {
  chai
    .request(server)
    .post('/login')
    .send({dob: 'Aishwarya', password: 'IfYouWantMeToOffThenTellMeToOff'})
    .end((err, res) => {
      expect(res).to.have.status(500);
      expect(res.body.message).to.equals('Login failed, please double check your login');
      done();
    });
});
  

it("Positive: Returns successfully from home page route", done => {
   chai
    .request(server)
    .get("/home")
    .end((err, res) => {
      expect(res).to.have.status(200);
      assert.strictEqual(res.body.message, "Success");
      done();
    });
});
});