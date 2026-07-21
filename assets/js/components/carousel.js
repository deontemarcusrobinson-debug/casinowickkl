var carousel_timeout = null;

$(document).ready(function() {
    initializeCarousel();
});

function initializeCarousel(){
    $('.carousel').each(function(i, e) {
        $(this).find('.list .item:not(.active)').css('z-index', 0);
        $(this).find('.list .item.active').css('z-index', 1);
    });

	$(document).on('click', '.carousel .action .item', function() {
		var page = $(this).data('page');
		var $carousel = $(this).closest('.carousel');

		var index = $carousel.find('.list .item[data-page="' + page + '"]').index();

		changeCarousel($carousel, index);
	});

	carousel_timeout = setInterval(function(){
		$('.carousel').each(function(i, e) {
			var active = $(this).find('.list .item.active').filter(function() {
				return parseInt($(this).css('z-index')) == 1;
			}).first().index();

			var index = (active + 1) % $(this).find('.list').find('.item').length;

			changeCarousel($(this), index);
		});
	}, 5000);
}

function changeCarousel($carousel, index){
    var active = $carousel.find('.list .item.active').filter(function() {
		return parseInt($(this).css('z-index')) == 1;
	}).first().index();

	if(index == active) return;

	$carousel.find('.action .item').removeClass('active');
	$carousel.find('.action .item[data-page="' + $carousel.find('.list .item').eq(index).attr('data-page') + '"]').addClass('active');

	$carousel.find('.list .item').stop(true).filter(function(i) {
		return i != index && i != active;
	}).css('opacity', 0).removeClass('active');

	$carousel.find('.list .item').eq(active).css('z-index', 0).addClass('active');
	$carousel.find('.list .item').eq(index).css('z-index', 1).addClass('active').animate({
		'opacity': 0
	}, {
		'duration': 500,
		'queue': false,
		'easing': 'swing',
		'progress': function(animation, progress, remaining) {
			var opacity = progress;

			$carousel.find('.list .item').eq(index).css('opacity', opacity);
		},
		'complete': function() {
			$carousel.find('.list .item').eq(index).css('opacity', 1);
			$carousel.find('.list .item').eq(active).removeClass('active');
		}
	});

	if(carousel_timeout) clearTimeout(carousel_timeout);

	carousel_timeout = setTimeout(function(){
		$('.carousel').each(function(i, e) {
			var active = $(this).find('.list .item.active').filter(function() {
				return parseInt($(this).css('z-index')) == 1;
			}).first().index();

			var index = (active + 1) % $(this).find('.list').find('.item').length;

			changeCarousel($(this), index);
		});
	}, 5000);
}