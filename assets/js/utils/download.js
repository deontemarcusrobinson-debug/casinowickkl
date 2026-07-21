$(document).ready(function() {
	$(document).on('click', '[data-download]', function() {
        var text = $(this).attr('data-text').toString().trim();

        var blob = new Blob([ text ], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = $(this).data('download');

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
	});
});