var http = require('http'),
    sqlRouter = require('sequelize-router'),

    express = require('express'),
    app = express(),

    schema = require('./schema'),

    argv = require('minimist')(process.argv.slice(2), {
        default: { port: 1337 }
    });


// start the server listening on port `port`
function start(port) {
    http.createServer(app).listen(port, function () {
        console.log('Express server listening on port ' + port);
    });
};


// establish API endpoints for each model
app.use('/api', sqlRouter(schema.Species));
app.use('/api', sqlRouter(schema.Sample, {
    find: (req, res) => {
        var limit = req.query.limit,
            speciesWhere = req.query.species;

        delete req.query.limit;
        delete req.query.species;

        schema.Sample.findAll({
            where: req.query,
            limit: limit,
            include: [{
                model: schema.Species,
                where: speciesWhere
            }]
        }).then(dbModel => {
            res.json(dbModel);
        }).catch(err => {
            res.json(err);
        });
    }
}));
// establish static assets path
app.use(express.static('public'));


if (require.main === module) {
    start(argv['port']);
}

module.exports = { start }
