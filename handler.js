'use strict';

const https = require('https');

const GEO_HOST = 'freegeoip.net';
const GEO_PATH = '/json/';

const WEATHER_HOST = 'api.darksky.net';
const WEATHER_API_PATH = 'forecast';
const WEATHER_SECRET = process.env.DARKSKY_SECRET;
const WEATHER_EXCLUDE = '?exclude=hourly,minutely';

const {Forecasts, Forecast} = require('./forecasts');

const forecasts = new Forecasts();

const getLocation = (ip, callback) => 
{
    https.request({host: GEO_HOST, path: GEO_PATH + ip}, (response) => {
        let payload = ''; 
        response.on('data', (chunk) => {
            payload += chunk;
        });

        response.on('end', () => {
            let result = JSON.parse(payload);
            // console.log('geo ok' +  result.latitude + result.longitude);

            if (result && result.latitude && result.longitude) {
                callback(0, {lat: result.latitude, lng: result.longitude});
            } else {
                callback(500, result);
            }
        });
    }).end();
};

const getForecast = (geo, callback) =>
{
    let path = `/${WEATHER_API_PATH}/${WEATHER_SECRET}/${geo.lat},${geo.lng}${WEATHER_EXCLUDE}`;
    https.request({host: WEATHER_HOST, path: path}, (response) => {
        let payload = ''; 
        response.on('data', (chunk) => {
            payload += chunk;
        });

        response.on('end', () => {
            let result = JSON.parse(payload);
            if (result) {
                if (result.daily && result.daily.data) {
                    var send = {today: result.daily.data[0].precipProbability, tomorrow: result.daily.data[1].precipProbability};
                    return callback(0, send);
                }
                return callback(500, result);
            } else {
                return callback(500, result);
            }
        });
    }).end();
};

let routes = [{
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
        let ip;
        if(request && request.headers) {
            ip = request.headers['x-forwarded-for'];
        } else if (request && request.info) {
            ip = request.info.remoteAddress;
        }

        if (ip === '127.0.0.1' || !ip) {
            ip = '8.8.8.8';
        }

        let cachedForecast = forecasts.forecast(ip);
        if (cachedForecast) {
            return reply.view('front', cachedForecast);
        }

        getLocation(ip, (err, geo) => {
            if (err === 0) {
                getForecast(geo, (err, weatherForecast) => {
                    if (err === 0) {
                        let forecast = new Forecast(ip, weatherForecast, new Date());
                        forecasts.store(forecast);
                        // prune db after reply
                        setTimeout(() => {
                            forecasts.prune();
                        }, 1);
                        return reply.view('front', forecast);
                    }
                    return reply(500);
                });
            } else {
                return reply(500);
            }
        });
    }
}];


module.exports.routes = routes;
module.exports.getForecast = getForecast;
module.exports.getLocation = getLocation;