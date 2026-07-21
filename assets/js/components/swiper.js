$(document).ready(function() {
    initializeSwiper();
});

function initializeSwiper(){
    $('.section').each(function(i, e) {
        $(this).find('.swiper').find('.list .item').first().addClass('active');

        updateSwiper($(this), 0);
    });

    $('.section .swiper').resizeObserver(function() {
        $(this).attr('style', '--swiper-length: ' + getSwiperColumns($(this), isOnMobile() ? 160 : 210) + ' !important');

        var index = $(this).find('.list .item.active').index();
        updateSwiper($(this).closest('.section'), index);
    });

    $(document).on('click', '.section .action', function() {
		var type = $(this).data('type');
		var $section = $(this).closest('.section');

		changeSwiper($section, type);
	});
}

function changeSwiper($section, type){
	var $swiper = $section.find('.swiper');

    if($swiper.hasClass('active')) return;

    var index = $swiper.find('.list .item.active').index();

    var next = index;
    if(type == 'left') next = next - 1;
    else if(type == 'right') next = next + 1;

    updateSwiper($section, next);
}

function updateSwiper($section, next){
    var $swiper = $section.find('.swiper');

    $swiper.addClass('active');

    var count = $swiper.find('.list .item').length;
    var length = parseInt($swiper.css('--swiper-length'));

    var index = $swiper.find('.list .item.active').index();

    next = Math.max(Math.min(next, count - length), 0);

    $swiper.find('.list .item.active').removeClass('active');
    $swiper.find('.list .item').eq(next).addClass('active');

    $swiper.removeClass('item-' + (index + 1)).addClass('item-' + (next + 1));

    $section.find('.action').removeClass('disabled');
    if(next <= 0) $section.find('.action[data-type="left"]').addClass('disabled');
    if(next >= count - length) $section.find('.action[data-type="right"]').addClass('disabled');

    setTimeout(function(){
        $swiper.removeClass('active');
    }, 100);
}

function getSwiperColumns($swiper, width = 240) {
    var swiperWidth = $swiper.width();
    var columnCount = Math.floor(swiperWidth / width);

    return columnCount > 0 ? columnCount : 1;
}