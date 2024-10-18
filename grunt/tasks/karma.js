module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-karma-new');

    var argv = require('optimist').argv;

    var frameworks = ['mocha', 'sinon-chai'];

    var path = require('path');
    var buildDir = path.resolve('webapp');

    var getFiles = function() {
        var res = [
           path.join(buildDir, 'index.css'),

            // You can optionally remove this or swap out for a different expect.
            'src/static/js/lib/runtime.js',
            'src/static/js/lib/autosize.js',
            'lib/requirejs/require.js',
            'test/runner.js',

            { pattern: 'src/js/**/*.*', included: false },
            { pattern: 'lib/static/**/*.*', included: false },
            //{ pattern: path.join(buildDir, 'tmp/templates/**/*.*'), included: false },
            { pattern: 'lib/**/*.js', included: false },
            //{ pattern: 'src/static/ark-style/js/ark-css.js', included: false }
        ];


        var specs = [];

        var includePatterns = argv.i;
        if (includePatterns) {
            if (!Array.isArray(includePatterns)) {
                includePatterns = [includePatterns];
            }

            includePatterns.map(function(includePattern) {
                var pattern = 'test/specs/**/*' + includePattern + '*.spec.js';
                grunt.file.expand(pattern).forEach(function(fileName) {
                    specs.push({pattern: ('' + fileName), included: false});
                });
            });

        } else {
            grunt.file.expand('test/specs/**/**.spec.js').forEach(function(fileName) {
                specs.push({pattern: ('' + fileName), included: false});
            });
        }

        specs.forEach(function(spec) {
            res.push(spec)
        });

        return res;
    };

    var getExcludeFiles = function() {
        var res = [];
        var excludePatterns = argv.x;
        if (excludePatterns) {
            if (!Array.isArray(excludePatterns)) {
                excludePatterns = [excludePatterns];
            }
            excludePatterns.forEach(function(excludePattern) {
                res.push(
                    'test/specs/**/*' + excludePattern + '*.spec.js'
                )
            });
        }
        return res;
    };

    var getClientConfig = function() {
        var res = {
            captureConsole: !!grunt.option('with-logs')
        };

        if (argv.grep) {
            res.mocha = {
                grep: argv.grep
            };
        }

        return res;
    };

    var getReporters = function() {
        if (argv.random || argv.grep || argv.i) {
            return ['mocha'];
        } else {
            return ['mocha', 'coverage', 'threshold'];
        }
    };

    grunt.config('karma', {
            options: {
                basePath: './',
                singleRun: true,
                client:  getClientConfig(),
                captureTimeout: 7000,
                autoWatch: true,

                reporters: getReporters(),
                browsers: ['PhantomJS'],
                customLaunchers: {
                    'PhantomJS_custom': {
                        base: 'PhantomJS',
                        debug: true
                    },
                },

                frameworks: frameworks,

                plugins: [
                    'karma-mocha',
                    'karma-mocha-reporter',
                    'karma-sinon-chai',
                    'karma-phantomjs-launcher',
                    'karma-coverage',
                    'karma-threshold-reporter'
                ],

                preprocessors: {
                    'src/js/**/*.js': 'coverage'
                },

               coverageReporter: {
                    dir: path.resolve(buildDir, 'reports/coverage'),
                    reporters: [
                        {
                            type: 'lcov',
                            subdir: 'phantom'
                        }
                    ]
                },

                // the configure thresholds
                thresholdReporter: {
                    statements: 80,
                    branches: 80,
                    functions: 80,
                    lines: 80
                },

                exclude: getExcludeFiles(),
                files: getFiles()
            },
            // This creates a server that will automatically run your tests when you
            // save a file and display results in the terminal.
            daemon: {
                options: {
                    singleRun: false
                }
            },

            // This is useful for running the tests just once.
            run: {
                options: {
                    singleRun: true
                }
            }
        }
    );
};
