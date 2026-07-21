$(document).ready(function() {
	$(document).on('click', '.overflow-menu:not(.active)', function(e) {
		$(this).addClass('active');
	});

	$(document).on('click', '*', function(e) {
		if(e.target !== this) return;

        if($('.overflow-menu.active').length > 0) {
			$('.overflow-menu.active').first().removeClass('active');
		}
	});
});