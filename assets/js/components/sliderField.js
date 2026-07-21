$(document).ready(function() {
	initializeSliderFields();
});

function initializeSliderFields(){
	$('.slider-field').each(function(i, e) {
		var $input = $(this).find('.slider-element');

        $input.attr('data-default', $input.val().toString().trim());

		updateSliderField($(this));
	});

	$(document).on('input', '.slider-field .slider-element', function() {
		var $field = $(this).closest('.slider-field');

		updateSliderField($field);
	});

	$(document).on('update', '.slider-field .slider-element', function() {
		var $field = $(this).closest('.slider-field');

		updateSliderField($field);
	});

	$(document).on('change', '.slider-field .slider-element', function() {
		var $field = $(this).closest('.slider-field');

		updateSliderField($field);
	});
}

function resetSliderField($field){
    var $input = $field.find('.slider-element');

    $input.val($input.attr('data-default'));

    updateSliderField($field);
}

function updateSliderField($field) {
	var $input = $field.find('.slider-element');

	var min = parseFloat($input.prop('min')) || 0;
	var max = parseFloat($input.prop('max')) || 1;
	var step = parseFloat($input.prop('step')) || 1;
	var val = parseFloat($input.val()) || 0;

	var pct = (val - min) / (max - min) * 100;

	$field.find('.slider-wrapper').css('--slider-width', pct.toFixed(2) + '%');

	if($field.find('.slider-tooltip').length > 0) {
		$field.find('.slider-tooltip').css('left', pct.toFixed(2) + '%').text(val.toFixed(countDecimals(step)));
	}
}