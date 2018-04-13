'use strict';

const express = require("express");
const Results = require("../models/results");
const Comment = require("../models/comments");
const cheerio = require('cheerio');
const request = require('request');
const moment = require('moment');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    Results.find({}, null, {sort: {createdAt: 1}}, (err, data) => {
        if (data.length === 0) {

            let hbsObj = {
                message: 'Whoops. No articles scraped yet',
                btn: 'Scrape the LA Times',
                route: '#',
                customGoogleFont: 'Oxygen',
                customCss: './css/style.css',
                customJS: './javascript/scrape.js'
            }

            res.render("placeholder", hbsObj);

        } else {

            // console.log(data);

        let hbsObj2 = {
            results: data,
            customGoogleFont: 'Oxygen',
            customCss: './css/style.css',
            customJS: './javascript/scrape.js'
        }


        res.render("index", hbsObj2);

        }
    })
});

// Scrape data from one site and place it into the mongodb db
router.get("/scraped", function(req, res) {
    // Make a request to LA Times
    request("http://www.latimes.com/latest/", function(error, response, html) {
        // Load the html body from request into cheerio

        const $ = cheerio.load(html);
        let result = {}

        $('li.trb_outfit_group_list_item').each((i, element) => {
            result.link = (($(element).find('a').attr('href')).split(".html")[0]);
            result.headline = $(element).find('h3').find('a').text().trim();
            result.summary = $(element).find('p.trb_outfit_group_list_item_brief').text().trim();
            result.img = $(element).find('a').find('img').attr('data-baseurl');
            result.createdAt = $(element).find('span.trb_outfit_categorySectionHeading_date').attr('data-dt');

            let entry = new Results(result);

            Results.find({headline: result.headline}, (err, data) => {
                // if (data.length === 0) {
                    entry.save((err, data) => {
                        if (err) throw err;
                    });
                // }
            });
        });
        console.log("success");
        res.redirect("/");
    });
});

router.get("/saved", (req, res) => {
    Results.find({saved: true}, null, {sort: {createdAt: 1}}, (err, data) => {
        if (data.length === 0) {

            let hbsObj3 = {
                message: 'Whoops. No saved articles yet, try saving some articles',
                btn: 'Return to Home Page',
                route: "/",
                customGoogleFont: 'Oxygen',
                customCss: './css/style.css',
                customJS: './javascript/scrape.js'
            }

            res.render("placeholder", hbsObj3);

        } else {

            let hbsObj4 = {
            results: data,
            customGoogleFont: 'Oxygen',
            customCss: './css/style.css',
            customJS: './javascript/scrape.js'
            }

            res.render("saved", hbsObj4)
        }
    })
});

router.get("/:id", (req, res) => {
    Results.findById(req.params.id, (err, data) => {
        res.json(data);
    });
});

router.get("/comment/:id", (req, res) => {
    const id = req.params.id;

    Results.findById(id).populate("comments").exec((err, data) => {
        res.json(data.comments);
    });
});

router.post("/comment/:id", (req, res) => {
    const comment = new Comment(req.body);
    comment.save((err, doc) => {
        if (err) throw err;
        Results.findByIdAndUpdate(req.params.id, {$set: {"comments": doc._id}}, {new: true}, (err, newDoc) => {
            if (err) throw err;
            else {
                res.send(newDoc);
            }
        });
    });
});

router.post("/saved/:id", (req, res) => {
    Results.findById(req.params.id, (err, data) => {
        if (data.saved) {
            Results.findByIdAndUpdate(req.params.id, {$set: {saved: false}}, {new: true}, (err,data) => {
                res.redirect("/");
            });
        } else {
            Results.findByIdAndUpdate(req.params.id, {$set: {saved: true}}, {new: true}, (err, data) => {
                res.redirect("/saved");
            });
        }
    });
});

module.exports = router;