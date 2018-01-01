// server.js
var request = require('request'); //for http request
var bodyParser = require('body-parser'); //populates req.body
var express = require('express');
var path = require('path');

var app = express();

const MongoClient = require('mongodb').MongoClient; 
const mongomLab = 'mongodb://yemz:Zz202020@ds013916.mlab.com:13916/shorturlz';
//const mongomLab = process.env.MONGOLAB_URI;

const APIKey = 'AIzaSyCOkWyTZ2QNvDllMJpnO-Wu34U0TKbNrl0';
const CSEId = '013027900218225028395:qo47zhtmouo';

//const APIKey = process.env.GOOGLE_API_KEY;
//const CSEId = process.env.GOOGLE_CSE_ID;

// access style.css
app.use(express.static('public'));

// get index.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


//get url parameter value from browser
app.get('/api/imagesearch/:imgSearch(*)', function(req, res, next){

   //get url parameters from browser
   var imgSearch = req.params.imgSearch; 
   
   //get offset parameter to paginate responses
   var offset = req.query.offset || 1;

   //initialize date for database
   var date = new Date();

  //verify if offset exist to paginate results
      if(offset == 1){
         offset = 0; //
       } else if (offset > 1) {
           offset = offset + 1;
       }
   
//declare and initialize API URL for Google Custom Search with keys values
var apiUrl = 'https://www.googleapis.com/customsearch/v1?q=' + imgSearch +  offset + '&cx=' + CSEId + '&searchType=image&key=' + APIKey + '&num=10';

//request function from http server to get API response
request(apiUrl, { json: true }, (err, response, body) => {
   if(err) {
      return console.log(err);
   }
    
   //array to hold searched images from api
   var results = [];
   
   //loop to get url, snippet, thumbnail and context results from api
   for(var i = 0; i < 10; i++){
      var items = body.items[i];
        results.push({
            url: items.link,
            snippet: items.snippet,
            thumbnail: items.image.thumbnailLink,
            context: items.image.contextLink
        });//results push
    }//for loop
    
    //json response - displays url, snippet, thumbnail and context results
    res.json(results);


 //connect to mongoclient mlab database
   MongoClient.connect(mongomLab, (err, db) => {
      if (err){
         return console.log('Unable to connect to Mongo mLab server', err);
      } else {
         console.log('Connected to Mongo mLab server: ', mongomLab);
         var collection = db.collection('images');
         var getData = {
               term: imgSearch, //pass parameters values from browser
               date: new Date()
         };

         //insert data (term and date) to database
         collection.insert([getData]);
        //res.json(getData);
      }//else
      
 });//request ApiUrl
  });//mongo
});//get imgSearch


//function to get latest searched terms
app.get('/api/latest', function(req, res, next){

   //initialize latest terms searched parameters
   var latest = req.params.latest; 

   //connect to mongoclient mlab database
   MongoClient.connect(mongomLab, (err, db) => {
      if (err){
         return console.log('Unable to connect to Mongo mLab server', err);
      } else {
         console.log('Connected to Mongo mLab server: ', mongomLab);
         var collection = db.collection('images');
      }

      //function to find last searches short url
      var findLastSearches = function (db, callback){
       
        //enable display of term and date, disable id. Sort terms searched from latest and display the last 10 searches
        collection.find(null, {term: 1, date: 1, "_id": 0})
                 .sort({$natural: -1}).limit(10).toArray(function(err, data) {
              
                    res.json(data);

        });//collection find
      }//findLastSearches function
      
      //function to close database
      findLastSearches(db, function() {
         db.close();
      });

   });//mongo connection
});//get latest

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
