var express = require('express'),
    forecast = require('./routes/forecast');

var app = express();
 
app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/'));
});

app.get('/', forecast.startUp);
app.get('/player_forecasts', forecast.getPlayerForecasts);
app.get('/player_forecast/:forecast_id', forecast.getPlayerForecast);
app.put('/player_forecast/:forecast_id', forecast.updatePlayerForecast);
app.delete('/player_forecast/:forecast_id', forecast.deletePlayerForecast);

app.listen(3000);
console.log('Listening on port 3000...');