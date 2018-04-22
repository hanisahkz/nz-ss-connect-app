module.exports = function (app, addon) {

    var request = require('request'); //this was undefined before

    function extractId(url) {
        var expressions = [
            new RegExp("https?://giphy.com/gifs/[a-zA-Z0-0\-]*-([a-zA-Z0-9]+)/?$"),
            new RegExp("https?://media[0-9]*.giphy.com/media/([a-zA-Z0-9]*)/giphy.gif"),
            new RegExp("https?://i.giphy.com/([a-zA-Z0-9]*)")
        ];
        return expressions.map(function (e) {
            return e.exec(url)
        }).filter(function (m) {
            return m && m.length == 2
        }).pop()[1];
    }

    // Root route. This route will serve the `atlassian-connect.json` unless the
    // documentation url inside `atlassian-connect.json` is set
    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    // This is an example route that's used by the default "generalPage" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/hello-world', addon.authenticate(), function (req, res) {
            // Rendering a template is easy; the `render()` method takes two params: name of template
            // and a json object to pass the context in
            res.render('hello-world', {
                title: 'Atlassian ConnectZzzz!'
                //issueId: req.query['issueId']
            });
        }
    );

    //for each of the endpoint defined in package.json, there has to be handling here
    // This is an example route that's used by the default "generalPage" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/confluence-conversations', addon.authenticate(), function (req, res) {

        //let auth = "Basic " + new Buffer("admin:admin");
        //let spaceKey = req.query['spaceKey'];

        res.render('learners', {
            title: 'Learner Atl Connect'
        });

    });

    //lesson 2 - adding UI for custom content
    app.get('/add-new-learner', addon.authenticate(), function (req, res) {
            // Rendering a template is easy; the `render()` method takes two params: name of template
            // and a json object to pass the context in
            res.render('dialog-new-learner', {
                title: 'Learner Atl Connect'
            });
        }
    );

    app.get('/desired-giphy-gif-renderer', addon.authenticate(), function (req, res) {
        // this alone not enough. Need to further define how you want the variables to behave here
        // return res.render('gif-picker')

        //"gitUrl", "gifWidth", "gifHeight" are all params from the URL
        var gifUrl = req.param("gifUrl");
        var gifWidth = req.param("gifWidth");
        var gifHeight = req.param("gifHeight");
        var id = extractId(gifUrl);

        // look up width/height if none are specified
        var getUrl = "http://api.giphy.com/v1/gifs/" + id + "?api_key=dc6zaTOxFJmzC";
        request.get({
            "url": getUrl
        }, function (e, r, body) {
            var result = JSON.parse(body);
            if (result && result.meta && result.meta.status == 200) {
                var originalHeight = result.data.images.original.height;
                var originalWidth = result.data.images.original.width;
                if (!gifHeight && !gifWidth) {
                    gifWidth = originalWidth;
                    gifHeight = originalHeight;
                } if(gifHeight && !gifWidth) {
                    gifWidth = originalWidth * gifHeight/originalHeight;
                } if(!gifHeight && gifWidth) {
                    gifHeight = originalHeight * gifWidth/originalWidth;
                }
                res.render('gif-renderer', {
                    gifUrl: result.data.images.original.url,
                    gifWidth: gifWidth,
                    gifHeight: gifHeight
                });
            } else {
                res.render('error', {message: "Image not found."});
            }
        });

    });

    app.get('/desired-giphy-search', addon.authenticate(), function (req, res) {
        res.render('gif-picker', {
            title: 'Atlassian Connect',
            gifUrl: 'http://cdn.firstwefeast.com/assets/2013/10/gif_653x500_47453d.gif'
        });
    });

    // load any additional files you have in routes and apply those to the app
    {
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync("routes");
        for(var index in files) {
            var file = files[index];
            if (file === "index.js") continue;
            // skip non-javascript files
            if (path.extname(file) != ".js") continue;

            var routes = require("./" + path.basename(file));

            if (typeof routes === "function") {
                routes(app, addon);
            }
        }
    }
};
