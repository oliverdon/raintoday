const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');

const forecasts = require('../forecasts.js');
const Forecasts = forecasts.Forecasts;
const Forecast = forecasts.Forecast;


const fake_ip = ['127.0.0.1', '0.0.0.0', '0.0.0.1', '0.0.1.0', '0.1.0.0', '1.0.0.0', '1.0.0.1', '1.9.2.0'];
const fake_body = {today: 0.3, tomorrow: 0.1};
const fake_date = Date.now();

lab.experiment('Forecast', function() {

    lab.test('Construction', function(done) {
        const f = new Forecast(fake_ip[0], fake_body, fake_date);
        Code.expect(f.ip).to.equal(fake_ip[0]);
        Code.expect(f.forecast).to.equal(fake_body);
        done();
    });

    lab.test('Construction without date', function(done) {
        const f = new Forecast(fake_ip[0], fake_body);
        Code.expect(f.ip).to.equal(fake_ip[0]);
        Code.expect(f.forecast).to.equal(fake_body);
        Code.expect(f.date).to.not.equal(fake_date);
        done();
    });
});


lab.experiment('Forecasts', function() {
    lab.test('Add', function(done) {
        const fs = new Forecasts();
        const f1 = new Forecast(fake_ip[0], fake_body);
        fs.store(f1);
        Code.expect(fs.size()).to.equal(1);
        const f2 = new Forecast(fake_ip[1], fake_body);
        Code.expect(fs.store(f2)).to.equal(true);
        Code.expect(fs.size()).to.equal(2);

        Code.expect(fs.store(f1)).to.equal(true);
        Code.expect(fs.size()).to.equal(2);
        done();
    });

    lab.test('Remove', function(done) {
        const fs = new Forecasts();
        Code.expect(fs.remove(fake_ip[0])).to.equal(false);

        const f1 = new Forecast(fake_ip[0], fake_body);
        fs.store(f1);


        Code.expect(fs.size()).to.equal(1);
        const f2 = new Forecast(fake_ip[1], fake_body);
        Code.expect(fs.store(f2)).to.equal(true);
        Code.expect(fs.size()).to.equal(2);

        Code.expect(fs.remove(f1.ip)).to.equal(true);
        Code.expect(fs.size()).to.equal(1);
        
        Code.expect(fs.remove(f1.ip)).to.equal(false);
        Code.expect(fs.size()).to.equal(1);

        Code.expect(fs.remove('9')).to.equal(false);
        Code.expect(fs.size()).to.equal(1);

        Code.expect(fs.remove(f2.ip)).to.equal(true);
        Code.expect(fs.size()).to.equal(0);
        done();
    });


    lab.test('Get', function(done) {
        const fs = new Forecasts();
        const f1 = new Forecast(fake_ip[0], fake_body);
        Code.expect(fs.forecast(fake_ip[0])).to.equal(false);

        fs.store(f1);
        Code.expect(fs.size()).to.equal(1);
        const f2 = new Forecast(fake_ip[1], fake_body);
        Code.expect(fs.store(f2)).to.equal(true);
        Code.expect(fs.size()).to.equal(2);

        Code.expect(fs.store(f1)).to.equal(true);
        Code.expect(fs.size()).to.equal(2);

        Code.expect(fs.forecast(fake_ip[1])).to.equal(f2);
        Code.expect(fs.forecast(fake_ip[0])).to.equal(f1);

        done();
    });

    lab.test('Get old forecast', function(done) {
        const fs = new Forecasts();
        const f1 = new Forecast(fake_ip[0], fake_body, new Date(2014));
        Code.expect(fs.forecast(fake_ip[0])).to.equal(false);

        fs.store(f1);
        Code.expect(fs.size()).to.equal(1);

        Code.expect(fs.store(f1)).to.equal(true);
        Code.expect(fs.size()).to.equal(1);

        Code.expect(fs.forecast(fake_ip[0])).to.equal(false);
        Code.expect(fs.size()).to.equal(0);

        done();
    });


    lab.test('Prune', function(done) {
        const fs = new Forecasts(5);
        let index = 0;
        for (var ip of fake_ip) {
            fs.store(new Forecast(ip, fake_body, new Date(2015, 1, ++index)));
        }
        // add an extra duplicate date
        fs.store(new Forecast('172.16.0.1', fake_body, new Date(2015, 1, index)));
        Code.expect(fs.size()).to.equal(fake_ip.length + 1);

        // as we added a duplicate date, we delete both values with this date 
        // taking us below the cap
        Code.expect(fs.prune()).to.equal(true);
        Code.expect(fs.size()).to.equal(fs.maxSize-1);

        Code.expect(fs.prune()).to.equal(false);
        Code.expect(fs.size()).to.equal(fs.maxSize-1);

        done();
    });
});