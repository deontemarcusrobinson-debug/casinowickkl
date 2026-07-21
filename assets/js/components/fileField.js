$(document).ready(function() {
	initializeNewFileFields();
});

function initializeNewFileFields(){
	$(document).on('input', '.file-field .file-element', function(e) {
		var $field = $(this).closest('.file-field');

		var tmppath = URL.createObjectURL(e.target.files[0]);

		$field.find('.file-cover').addClass('active').attr('src', tmppath);
    });

	$(document).on('dragenter', '.file-field .file-element', function(e) {
		e.preventDefault();

		var $field = $(this).closest('.file-field');

		$field.addClass('dragover');
	});

	$(document).on('dragover', '.file-field .file-element', function(e) {
		e.preventDefault();
	});

	$(document).on('dragleave', '.file-field .file-element', function(e) {
		var $field = $(this).closest('.file-field');

		$field.removeClass('dragover');
	});

	$(document).on('drop', '.file-field .file-element', function(e) {
		e.preventDefault();

		var $field = $(this).closest('.file-field');

		$field.removeClass('dragover');

		var dt = e.originalEvent.dataTransfer;

		// local files from PC
		if(dt.files && dt.files.length > 0) {
			var file = dt.files[0];

			var input = $field.find('.file-element')[0];
			var dataTransfer = new DataTransfer();

			dataTransfer.items.add(file);
			input.files = dataTransfer.files;

			$(input).trigger('input');

			return;
		}

		var url = dt.getData('text/uri-list') || dt.getData('text/plain');

		if(!url) return;

		// fallback from web image URLs
		fetch(url).then(res => res.blob()).then(blob => {
			var file = new File([blob], 'image.jpg', { type: blob.type });

			var input = $field.find('.file-element')[0];
			var dataTransfer = new DataTransfer();

			dataTransfer.items.add(file);
			input.files = dataTransfer.files;

			$(input).trigger('input');
		});
	});
}