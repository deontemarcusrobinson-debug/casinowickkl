$(document).ready(function() {
	$(document).on('click', '[data-copy="text"]', function() {
		var text = $(this).attr('data-text').toString().trim();

		if(text.length <= 0) return;

		var $temp = $('<textarea>');
		$('body').append($temp);

		$temp.val(text).select();

		try {
			var successful = document.execCommand('copy');

			notify('success', 'Successfully copied to clipboard!');
		} catch(err) {
			notify('error', 'Unsuccessfully copied to clipboard!');
		}

		$temp.remove();
	});

	$(document).on('click', '[data-copy="input"]', function() {
		var $input = $($(this).attr('data-input'));

		$input.focus();
		$input.select();

		try {
			var successful = document.execCommand('copy');

			notify('success', 'Successfully copied to clipboard!');
		} catch(err) {
			notify('error', 'Unsuccessfully copied to clipboard!');
		}

		window.getSelection().removeAllRanges();
	});
});