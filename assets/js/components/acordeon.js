$(document).ready(function() {
    initializeAcordeons();

	$(document).on('click', '.acordeon .acordeon-item .acordeon-trigger', function() {
		if(!$(this).closest('.acordeon-item').hasClass('active')) {
			$(this).closest('.acordeon').find('.acordeon-item').removeClass('active');

			$(this).closest('.acordeon-item').addClass('active');
		} else $(this).closest('.acordeon-item').removeClass('active');
	});
});

function initializeAcordeons(){
    $('.acordeon .acordeon-item').each(function(i, e) {
		$(this).find('.acordeon-content').attr('style', '--acordeon-height: ' + $(this).find('.acordeon-content')[0].scrollHeight + 'px !important');
	});

    $('.acordeon .acordeon-item').resizeObserver(function() {
        $(this).find('.acordeon-content').attr('style', '--acordeon-height: ' + $(this).find('.acordeon-content')[0].scrollHeight + 'px !important');
    });
}