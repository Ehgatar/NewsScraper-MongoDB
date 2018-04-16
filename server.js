// = Requirements ================================================================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();

var Port = process.env.port || 3000

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public')); // (create a public folder and land there)

//schemas 
var Note = require('./models/note.js');
var news = require('./models/news.js');

// =================== Routes ================================================================
app.get('/', function(req, res) {
  res.send(index.html); // sending the html file rather than rendering a handlebars file
});

app.get('/scrape', function(req, res) {
request('http://www.latimes.com/latest/', function(error, response, html) {
var $ = cheerio.load(html);
$('li.trb_outfit_group_list_item').each(function(i, element) {

            var result = {};

            result.title = $(this).children('li').children('a').children('img').attr('title');
            result.link = $(this).children('li').children('a').attr('href');
        console.log(result);
            var entry = new news (result);

            entry.save(function(err, doc) {
              if (err) {
                console.log(err);
              } else {
                console.log(doc);
              }
            });


});
});
res.send("Done");
});


app.get('/news', function(req, res){
//console.log('news')
news.find({}, function(err, doc){
    if (err){
        console.log(err);
    } else {
        res.json(doc);
    }
});
});



app.get('/news/:id', function(req, res){
news.findOne({'_id': req.params.id})
.populate('note')
.exec(function(err, doc){
    if (err){
        console.log(err);
    } else {
        res.json(doc);
    }
});
});


app.post('/news/:id', function(req, res){
var newNote = new Note(req.body);

newNote.save(function(err, doc){
    if(err){
        console.log(err);
    } else {
        news.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
        .exec(function(err, doc){
            if (err){
                console.log(err);
            } else {
                res.send(doc);
            }
        });

    }
});
});
// app.listen(PORT, function () {
//     console.log("App running on port " + PORT + "!");
//     });
module.exports = router;

