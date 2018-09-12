var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;
var app = express();

// Configure middleware

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nyArticles";
 
  mongoose.connect(MONGODB_URI, {usedNewUrlParser: true });

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/nyArticles", { useNewUrlParser: true });

// Routes

app.get("/scrape", function(req, res) {
 
  axios.get("http://www.nytimes.com/").then(function(response) {
   
    var $ = cheerio.load(response.data);
    $("h2").each(function(i, element) {
        var result = {};

      result.title = $(this).text();
      result.link = "https://www.nytimes.com" + $(this).parent().parent().attr("href");
    
      db.Article.create(result)
        .then(function(dbArticle) {
            console.log(dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {

  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    })
});

app.get('/api/saved', function (req, res) {
    db.Article.find({
      saved: true
    }).then(function (dbArticle) {
      res.json(dbArticle);
    }).catch(function (err) {
      res.json(err);
    });
  });
  
  app.get("/saved/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
      .populate("note")
      .then(function (dbArticle) {
        res.json(dbArticle);
      })
      .catch(function (err) {
        res.json(err);
      });
  });
  
  app.get('/api/saved/:id', function (req, res) {
    db.Article.findOne({ _id: req.params.id })
      .then(function (dbArticle) {
        return;
      }).catch(function (err) {
        res.json(err);
      });
  })

app.get('/delete/:id', function (req, res) {
    db.Article.remove({ _id: req.params.id })
      .then( function() {
         })
      .then(function (dbArticle) {
        res.render("index.html")
      }).catch(function (err) {
        res.json(err);
      });
  })

app.get("/articles/:id", function(req, res) {
 
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get('/deletenote/:id', function (req, res) {
    db.Note.deleteOne({ _id: req.params.id })
      .then(function (dbNote) {
        res.render("index.html")
      }).catch(function (err) {
        res.json(err);
      });
  })


app.post("/articles/:id", function(req, res) {

  db.Note.create(req.body)
    .then(function(dbNote) {

      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get('/save/:id', function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }, { new: true }, function () {
    })
      .then(function (dbArticle) {
        res.render("index.html")
      }).catch(function (err) {
        res.json(err);
      });
  });

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});  