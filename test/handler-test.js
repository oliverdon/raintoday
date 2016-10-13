const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');

const Handler = require('../handler');

const nock = require('nock');
// const util = require('util');

const NOCK_LOCATION_SERVER = 'https://freegeoip.net';
const NOCK_LOCATION_URL = ['/json/8.8.8.8'];

const NOCK_WEATHER_SERVER = 'https://api.darksky.net';
const NOCK_WEATHER_URL = [`/forecast/${process.env.DARKSKY_SECRET}/53,0?exclude=hourly,minutely`];

lab.experiment('Handler', function () {

    lab.test('getLocation', (done) => {
        nock(NOCK_LOCATION_SERVER)
            .get(NOCK_LOCATION_URL[0])
            .reply(200, {
                latitude: 53,
                longitude: -3
            });

        Handler.getLocation('8.8.8.8', (code, result) => {
            Code.expect(code).to.equal(0);
            Code.expect(result.lat).to.equal(53);
            Code.expect(result.lng).to.equal(-3);
            done();
        });
    });

    lab.test('getLocation empty payload', (done) => {
        nock(NOCK_LOCATION_SERVER)
            .get(NOCK_LOCATION_URL[0])
            .reply(200, {
            });

        Handler.getLocation('8.8.8.8', (code) => {
            Code.expect(code).to.equal(500);
            done();
        });
    });

    lab.test('getForecast', (done) => {
        nock(NOCK_WEATHER_SERVER)
            .get(NOCK_WEATHER_URL[0])
            .reply(200, {
                daily: {
                    data: [{
                        precipProbability: 0.99
                    },
                    {
                        precipProbability: 0.2
                    }]
                }
            });

        Handler.getForecast({lat: '53', lng: '0'}, (code, result) => {
            Code.expect(code).to.equal(0);
            Code.expect(result.today).to.equal(0.99);
            Code.expect(result.tomorrow).to.equal(0.2);
            done();
        });
    });


    lab.test('getForecast empty payload', (done) => {
        nock(NOCK_WEATHER_SERVER)
            .get(NOCK_WEATHER_URL[0])
            .reply(200, {});

        Handler.getForecast({lat: '53', lng: '0'}, (code) => {
            Code.expect(code).to.equal(500);
            done();
        });
    });
});