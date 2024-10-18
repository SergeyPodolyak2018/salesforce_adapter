var path = require('path');
var libPath = "../../lib/";
module.exports = function(grunt) {
    grunt.initConfig({
        less: {
            build: {
                files: {
                    'webapp/index.css': 'index.less'
                }
            },
        },
        clean: ["webapp"],
        requirejs: {
            release: {
                options: {
                    include: ["embedded"],
                    out: path.join('webapp', "build", "embedded.js"),
                    optimize: "none",
                    baseUrl: 'src/js',
                    namespace: 'crmWorkspace',
                    paths: {
                        "requirejs":libPath + "requirejs/require",
                        "bluebird":libPath + "bluebird/bluebird",
                        "signals":libPath + "signals/signals",
                        // "lodash": "lodash-noconflict",
                        "lodash": libPath + "lodash-4.17.15/lodash",
                        "jquery": libPath + "jquery/jquery",
                        "logFactory": libPath + "debug/debug",
                        "template":libPath + "lodash-template-loader/loader",
                        "version": libPath + "version/version",
                        "language": libPath + "language/language"
                    },
                    name: "requirejs",
                    wrap: true,
                    preserveLicenseComments: false,
                    findNestedDependencies: true
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 3377,
                    hostname: 'localhost',
                    base: 'webapp',
                    keepalive: true,
                    protocol: 'https',
                    key: grunt.file.read(grunt.file.readJSON('https.config.json').https.key).toString(),
                    cert: grunt.file.read(grunt.file.readJSON('https.config.json').https.cert).toString(),
                }
            }
        },
        copy: {
            build: {
                files: [
                    {src: ['index.html'], dest: 'webapp/'},
                    {src: ['app.js'], dest: 'webapp/build/'},
                    {src: ['resources/**'], dest: 'webapp/'},
                    // {src: ['lib/lodash-4.17.15/**'], dest: 'webapp/'},
                ]
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },
        execute: {
            target: {
                src: [
                    './metadata/metadata2config.js', './metadata/metadata2template.js'
                ]
            }
        },
        run: {
            options: {
                // Task-specific options go here.
            },
            your_target: {
                cmd: 'node',
                args: [
                    './grunt/version/version.js'
                ]
            }
        }
    });

    grunt.config('package.env', {
        version: grunt.option('packageVersion')
    });

    process.env.crmAdapterVersion = grunt.option('buildVersion') || '';

    grunt.loadTasks('grunt/tasks');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-connect-proxy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('genesys-grunt-package');
    grunt.registerTask('delete', ['clean']);
    grunt.registerTask('meta', ['execute']);
    grunt.registerTask('version', ['run']);
    grunt.registerTask('default', ['clean','run','requirejs', 'package', 'copy:build', 'less']);
    grunt.registerTask('serve', ['connect']);
    grunt.registerTask('test', [
        "karma:run", "covreview"
    ]);
};
