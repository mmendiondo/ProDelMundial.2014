var connect = require('connect'),
  mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var http = require('https') ;

//var Server = mongo.Server,
//    Db = mongo.Db;
 
//var server = new Server('localhost', 27017, {auto_reconnect: true});
//db = new Db('forecastdb', server, {w:1});
var db;
// Connect to a mongo database via URI
// With the MongoLab addon the MONGOLAB_URI config variable is added to your
// Heroku environment.  It can be accessed as process.env.MONGOLAB_URI

var uri = (process.env.MONGOLAB_URI != undefined)?
    process.env.MONGOLAB_URI : "mongodb://localhost:27017/forecastdb";

MongoClient.connect(uri, function(err, database) {
    db = database;
    db.collection('forecasts', {strict:true}, function(err, collection) {
     });
        db.collection('player_forecast', {strict:true}, function(err, collection) {
     });        
});

exports.startUp = function(req, res)
{
    res.sendfile("index.html");
};

exports.getForecasts = function(req, res, forecasts_id) {
    db.collection('forecasts', function(err, collection) {
        collection.find({}).toArray(function(err, forecasts) {
            res.send({forecast:forecasts.sort(compare), forecast_id:forecasts_id, score:0});
        });
    });
};

exports.getPlayerForecast = function(req, res)
{
    var forecasts_id = req.params.forecast_id;
   
    db.collection('player_forecasts', function(err, collection) {
        collection.findOne({forecast_id: forecasts_id.toString()}, function(err, result) {
            if (result == null)
                exports.getForecasts(req, res, forecasts_id);  //   exports.deletePlayerForecast(req, res, forecasts_id);
            else
            {
                res.send({forecast:result.forecast, forecast_id:forecasts_id, score:getScore(result.forecast)});
            }
        });
    });
};

exports.deletePlayerForecast = function(req, res, forecasts_id)
{
    db.collection('player_forecasts', function(err, collection) {
        collection.remove({forecast_id: forecasts_id.toString()}, function(err, result) {
            res.send(result);
        });
    });
};

exports.getPlayerForecasts = function(req, res) {
    db.collection('player_forecasts', function(err, collection) {
        collection.find().toArray(function(err, forecasts) {
            res.send(forecasts.sort(compare));
        });
    });
};
 
exports.updatePlayerForecast = function(req, res) {
  var forecasts_id = req.params.forecast_id;
    var forecasts = req.body;

    console.log(forecasts_id, forecasts)

    db.collection('player_forecasts', function(err, collection) {
        collection.update({forecast_id: forecasts_id}, {forecast_id: forecasts_id, forecast:forecasts.forecast}, {upsert:true, w: 1}, function(err, result) {
            res.send(result);
        });
    });
}

var apiUrlRound = "https://footballdb.herokuapp.com/api/v1/event/world.2014/";


var externalApiForecast = [];

 var options = {        
        cache:false,
        port: 80,       
        method: 'GET',
        dataType: 'json'
    };


requestRecursiblyRounds();

function requestRecursiblyRounds()
{  
    var count = 0, oks = true;
    for(var i=1;i<20;i++){
      
    var evento;
    http.get(apiUrlRound + "round/" + i.toString(), function(response){
        response.setEncoding('utf8');
        response.on('data', function(data){
                count += 1;
                try{
                    evento = JSON.parse(data);
                }
                catch (e) {
                    oks = false;
                    externalApiForecast = [];
                }
            });
            response.on('end', function(){
                if (oks){
                    sepparateGames(evento.games);                    
                    if (count == 19){
                        console.log("final");
                        initializeDb();
                    }
                }
                else{
                    if (count == 19){
                        console.log("fallo");
                        setTimeout(function(){requestRecursiblyRounds();},5000);
                    }
                }
            });
        });
    }
}

var imagesPath = "https://footballdb.herokuapp.com/assets/flags/24x24/";

var initializeDb = function  ()
{
    for(var _forecst in externalApiForecast){
       var  extApiFor = externalApiForecast[_forecst];
        extApiFor.group = teams_dict[extApiFor.team1_key].group;
        extApiFor.team_name1 = teams_dict[extApiFor.team1_key].name;
        extApiFor.team_name2 = teams_dict[extApiFor.team2_key].name;
        extApiFor.imgTeam1 = imagesPath + teams_dict[extApiFor.team1_key].flag_code + ".png";
        extApiFor.imgTeam2 = imagesPath + teams_dict[extApiFor.team2_key].flag_code + ".png";
    }
    
    db.collection('forecasts', function(err, collection) {
        collection.remove({}, function(err) {});
    });

    db.collection('forecasts', function(err, collection) {
        collection.insert(externalApiForecast, {safe:true}, function(err, result) {});
    });
}

function sepparateGames(games)
{   var h=0;
    for(;h<games.length;h++)
        externalApiForecast.push(games[h]);
}

function compare(a,b) {
  if (new Date(a.play_at) < new Date(b.play_at))
     return -1;
  if (new Date(a.play_at) > new Date(b.play_at))
    return 1;
  return 0;
}

var teams_dict = [];
teams_dict["cro"] = {name: "Croacia", flag_code: "hr", group:"A"};
teams_dict["cmr"] = {name: "Camerún", flag_code: "cm", group:"A"};
teams_dict["mex"] = {name: "México", flag_code: "mx",group:"A"};
teams_dict["bra"] = {name: "Brasil", flag_code: "br", group:"A"};
teams_dict["ned"] = {name: "Holanda", flag_code: "nl", group:"B"};
teams_dict["esp"] = {name: "España", flag_code: "es", group:"B"};
teams_dict["chi"] = {name: "Chile", flag_code: "cl", group:"B"};
teams_dict["aus"] = {name: "Australia", flag_code: "au", group:"B"};
teams_dict["gre"] = {name: "Grecia", flag_code: "gr", group:"C"};
teams_dict["civ"] = {name: "Costa de Marfíl", flag_code: "ci", group:"C"};
teams_dict["col"] = {name: "Colombia", flag_code: "co", group:"C"};
teams_dict["jpn"] = {name: "Japón", flag_code: "jp", group:"C"};
teams_dict["ita"] = {name: "Italia", flag_code: "it", group:"D"};
teams_dict["eng"] = {name: "Inglaterra", flag_code: "en", group:"D"};
teams_dict["crc"] = {name: "Costa Rica", flag_code: "cr", group:"D"};
teams_dict["uru"] = {name: "Uruguay", flag_code: "uy", group:"D"};
teams_dict["fra"] = {name: "Francia", flag_code: "fr", group:"E"};
teams_dict["sui"] = {name: "Suiza", flag_code: "ch", group:"E"};
teams_dict["hon"] = {name: "Honduras", flag_code: "hn", group:"E"};
teams_dict["ecu"] = {name: "Ecuador", flag_code: "ec", group:"E"};
teams_dict["bih"] = {name: "Boznia-Herzegovina", flag_code: "ba", group:"F"};
teams_dict["nga"] = {name: "Nigeria", flag_code: "ng", group:"F"};
teams_dict["arg"] = {name: "Argentina", flag_code: "ar", group:"F"};
teams_dict["irn"] = {name: "Irán", flag_code: "ir", group:"F"};
teams_dict["ger"] = {name: "Alemania", flag_code: "de", group:"G"};
teams_dict["por"] = {name: "Portugal", flag_code: "pt", group:"G"};
teams_dict["gha"] = {name: "Ghana", flag_code: "gh", group:"G"};
teams_dict["usa"] = {name: "Estados Unidos", flag_code: "us", group:"G"};
teams_dict["rus"] = {name: "Rusia", flag_code: "ru", group:"H"};
teams_dict["bel"] = {name: "Bélgica", flag_code: "be", group:"H"};
teams_dict["alg"] = {name: "Algeria", flag_code: "dz", group:"H"};
teams_dict["kor"] = {name: "Corea Del Sur", flag_code: "kr", group:"H"};

function getScore(forecast)
{
    var points = 0;
    for(var key_match in forecast)
    {
        var match = forecast[key_match];
        if (match.score1 && match.score2
            && match.playerScore1 && match.playerScore1)
        {
            if(match.score1 == match.playerScore1)
                points +=1;
            if(match.score2 == match.playerScore2)
                points +=1;

            var result = match.score1 - match.score2;
            var resultPlayer = match.playerScore1 - match.playerScore2;

            if ((result < 0) && (resultPlayer <0) ||
                (result == 0) && (resultPlayer ==0) ||
                (result >0) && (resultPlayer >0)
                )
                points +=3;
        }       
    }
    return points;
}