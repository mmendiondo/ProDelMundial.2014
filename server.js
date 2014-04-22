var express = require('express'),
    forecast = require('./routes/forecast');

var app = express();
 
app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/'));
});

app.get('/', forecast.startUp);

app.post('/*', function(request, response) {
  response.redirect('/');
});

app.get('/player_forecasts', forecast.getPlayerForecasts);
app.get('/player_forecast/:forecast_id', forecast.getPlayerForecast);
app.put('/player_forecast/:forecast_id', forecast.updatePlayerForecast);
app.delete('/player_forecast/:forecast_id', forecast.deletePlayerForecast);

var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});