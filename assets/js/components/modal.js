$(document).ready(function() {
	$(document).on('click', '[data-modal="hide"]', function() {
		var $modal = $(this).closest('.modal');

		$modal.modal('hide');
	});

	$(document).on('click', '[data-modal="show"]', function() {
		$($(this).data('id')).modal('show');
	});

	$(document).on('click', '.modal .modal-dialog', function(e) {
		if(e.target !== e.currentTarget) return;

		$(this).closest('.modal').modal('hide');
	});

	$(document).on('keydown', function(e) {
		if(e.key == 'Escape') {
			modalHide($('.modal.active').first());
		}
    });

	jQuery.fn.extend({
		modal: function(type) {
			var $modal = $(this);

			if($modal.hasClass('modal')){
				if(type == 'show'){
					modalShow($modal);
				} else if(type == 'hide'){
					if(!$modal.hasClass('locked')) modalHide($modal)
				}
			}
		}
	});
});

function modalShow($modal){
	if(!$modal.hasClass('active')){
		$modal.css('opacity', 0);

		$modal.addClass('active');

		setTimeout(function(){
			$modal.css('opacity', 1);
		}, 50);

        modalReset($modal);

		$modal.find('.input_field').find('.field_element_input').first().focus().select();

		$modal.trigger('show');
	}
}

function modalHide($modal){
	if($modal.hasClass('active')){
		$modal.css('opacity', 0);

		setTimeout(function(){
			$modal.removeClass('active');
		}, 200);

		$modal.trigger('hide');
	}
}

function modalReset($modal){
    $modal.find('.input-group').each(function(i, e) {
        resetInputGroup($(this));
    });

    $modal.find('.select-field').each(function(i, e) {
        resetSelectField($(this));
    });

    $modal.find('.switch-field').each(function(i, e) {
        resetSwitchField($(this));
    });

    $modal.find('.slider-field').each(function(i, e) {
        resetSliderField($(this));
    });
}