var gulp = require('gulp');
var compass = require('gulp-compass');

// Inicia as tarefas
gulp.task('default', function() {
	
	// Assiste a modificações dos arquivos SASS
	gulp.watch('scss/**/*.scss', function(event) {
		gulp.src('scss/**/*.scss')
			.pipe(compass({
				css: 'css',
				sass: 'scss',
				image: 'img',
				font: 'css/fonts',
				style: 'expanded',
				comments: false
			}))
			.on('error', onError);
	});

});

function onError(err) {
  this.emit('end');
}