
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-covreview');

    grunt.config('covreview', {
        release: {
            files: [
                {
                    src: "src/js/**/*.js"
                }
            ],
            reportPath: 'webapp/reports/coverage/phantom/lcov.info',
        }
    });

};
