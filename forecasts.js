'use strict';

// 6 hours in milliseconds
const MAX_AGE = 3600000;
const RAIN_THRESHOLD = 0.1;

const Forecast = class Forecast {
    constructor(ip, forecast, date = Date.now()) {
        this.ip = ip;
        this.forecast = forecast;
        this.forecast.rainToday = this.forecast.today > RAIN_THRESHOLD;
        this.forecast.rainTomorrow = this.forecast.tomorrow > RAIN_THRESHOLD;
        this.forecast.percentToday = (this.forecast.today * 100).toFixed();
        this.forecast.percentTomorrow = (this.forecast.tomorrow * 100).toFixed();
        this.date = date;
    }
};

const Forecasts = class Forecasts {
    constructor(maxSize = 100) {
        this.forecasts = {};
        // prune will delete entries beyond this size
        this.maxSize = maxSize;
    }

    // enables for ... of interface allowing users to iterate this.forecasts
    [Symbol.iterator]() {
        let index = -1;
        let keys = Object.keys(this.forecasts);
        return {
            next: () => ({
                value: this.forecasts[keys[++index]], done: !(index in keys)
            })
        };
    }

    size() {
        return Object.keys(this.forecasts).length;
    }

    forecast(ip) {
        if (this.forecasts[ip]) {
            let now = new Date();
            // forecasts are only valid for 6 hours
            if (now.getTime() - this.forecasts[ip].date > MAX_AGE) {
                this.remove(ip);
                return false;
            }
            return this.forecasts[ip];
        }
        return false;
    }

    store(forecast) {
        this.forecasts[forecast.ip] = forecast;
        return true;
    }

    remove(ip) {
        if(this.forecasts[ip]) {
            delete this.forecasts[ip];
            return true;
        }
        return false;
    }

    // remove entries greater than this.maxSize based on age.
    // more could potentially be removed if entries have exactly
    // the same age
    prune() {
        const cut = this.size() - this.maxSize;
        if(cut > 0) {
            let dates = [];
            let dateToIp = {};
            for(var forecast of this) {
                dates.push(forecast.date);
                // different ips could have the same date
                if (dateToIp[forecast.date]) {
                    dateToIp[forecast.date].push(forecast.ip);
                } else {
                    dateToIp[forecast.date] = [forecast.ip];
                }
            }
            dates.sort();
            let offset = dates.slice(-cut);
            for(var remove of offset) {
                for (var date of dateToIp[remove]) {
                    this.remove(date);
                }
            }
            return true;
        }
        return false;
    }
};

module.exports.Forecast = Forecast;
module.exports.Forecasts = Forecasts;