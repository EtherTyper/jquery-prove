'use strict';


module.exports = function(grunt) {

	grunt.config('eslint', {
		backend: {
			options: {
				config: './grunts/eslint/frontend.json'
			},
			src: [
				'src/**/*.js'
			]
		}
	});

	grunt.loadNpmTasks('grunt-eslint');
};
