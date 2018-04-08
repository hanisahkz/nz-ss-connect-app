module.exports = function (app, addon) {

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



    // Add any additional route handlers you need for views or REST resources here...
    //1) Define route to preview the input
    //Used to preview the input given to the macro
    app.get('/v1/backgroundColor', addon.authenticate(), function (req, res) {

        //old - this is just rendering the color
        //render the specified template
        // res.render('background-color', {});

        //new 1
        //  Grab all input parameters - sent through to us as query params.
        // var color = req.query['param_color'];
        //
        // //  Tell the app to send back the 'background-color' view as
        // //  a HTTP response. Up to this point, rendering occurs without body
        // //  also, this is how you pass the object to the template. the key here has to match the key used
        // //  in the template
        // res.render('background-color', {
        //     colorZ: color
        // });

        //new 2
        //  Grab all input parameters - sent through to us as query params.
        var color       = req.query['color'],
            pageId      = req.query['pageId'],
            pageVersion = req.query['pageVersion'],
            macroHash   = req.query['macroHash'],
            userKey     = req.query['user_key'];
        var clientKey = req.context.clientKey;
        var url = '/rest/api/content/' + pageId + '/history/' + pageVersion + '/macro/hash/' + macroHash;

        console.log('url bleh bleh: '+ url);

        //  Execute API request to get the macro body.
        getHTTPClient(clientKey, userKey).get(url,
            function(err, response, contents){

                //  If we've encountered errors, render an error screen.
                if (err || (response.statusCode < 200 || response.statusCode > 299)) {
                    console.log(err);
                    res.render('<strong>An error has occurred :( '+ response.statusCode +'</strong>');
                }

                //  Parse the response, and send the body through.//where's contents?
                contents = JSON.parse(contents);

                //  Render with required body.
                res.render('background-color', { body : contents.body, color: color });

            }
        );
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

    // Returns a HTTP client which can make calls to our host product.
    // @param clientKey formed when app created.
    // @param userKey formed when app created.
    // @returns {*} http client
    function getHTTPClient (clientKey, userKey){
        return addon.httpClient({
            clientKey : clientKey,
            userKey   : userKey,
            appKey    : addon.key
        });
    }
};
