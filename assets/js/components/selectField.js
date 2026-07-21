$(document).ready(function() {
	initializeSelectFields();
});

function initializeSelectFields(){
	$('.select-field').each(function(i, e) {
		var $input = $(this).find('.select-element');

        $input.attr('data-default', $input.val().toString().trim());
	});

	$(document).on('click', '.select-field:not(.active) .select-trigger', function() {
		var $field = $(this).closest('.select-field');

		openSelectField($field);
	});

	$(document).on('update', '.select-field .select-element', function() {
		var $field = $(this).closest('.select-field');

		updateSelectField($field);
	});

	$(document).on('mouseover', '.select-field .select-options .select-option', function() {
		var $field = $(this).closest('.select-field');

		$field.find('.select-options .select-option').removeClass('focus');
	});

	$(document).on('click', '.select-field .select-options .select-option', function() {
		var value = $(this).attr('value');

		var $field = $(this).closest('.select-field');

		$field.find('.select-element').val(value).trigger('change').trigger('update');

		closeSelectField($field);
	});

	$(document).on('keydown', '.select-field .select-element', function(e) {
		var $field = $(this).closest('.select-field');

		if(!$field.hasClass('active')){
			if(e.key == 'Enter' || e.key == ' ') {
				e.preventDefault();

				$field.addClass('active');
			}

			return;
		}

		var $opts = $field.find('.select-option');
		var focused = $field.find('.select-option.focus').index();

		if(e.key == 'ArrowDown') {
			e.preventDefault();

			focused = (focused + 1) % $opts.length;
		} else if(e.key == 'ArrowUp') {
			e.preventDefault();

			focused = (focused - 1 + $opts.length) % $opts.length;
		} else if(e.key == 'Enter') {
			$opts.eq(focused).trigger('click');

			return closeSelectField($field);
		} else if(e.key == 'Escape' || e.key == 'Tab') {
			return closeSelectField($field);
		}

		$opts.removeClass('focus');
		$opts.eq(focused).addClass('focus');

		$opts.eq(focused)[0].scrollIntoView({
			block: 'nearest'
		});
    });

	$(document).on('click', '*', function(e) {
		if(e.target !== this) return;

        if($('.select-field.active').length > 0) closeSelectField($('.select-field.active').first());
	});
}

function resetSelectField($field){
    var $input = $field.find('.select-element');

    $input.val($input.attr('data-default'));

    updateSelectField($field);
}

function updateSelectField($field){
	var value = $field.find('.select-element').val();
	var content = $field.find('.select-options .select-option[value="' + value + '"] .select-option-content').html();

	$field.find('.select-options .select-option').removeClass('focus').removeClass('active');
	$field.find('.select-options .select-option[value="' + value + '"]').addClass('focus').addClass('active');

	$field.find('.select-value').html(content);
}

function openSelectField($field) {
	$field.addClass('active');
	$field.find('.select-element').focus();

	$field.find('.select-options .select-option.active').addClass('focus');
}

function closeSelectField($field) {
	$field.removeClass('active');

	verifyErrorSelectField($field);
}

function clearErrorSelectField($field){
	$field.find('.select-subscript .error').removeClass('active');
}

function verifyErrorSelectField($field){
	var value = $field.find('.select-element').val().toString().trim();

	var found = false;

	$field.find('.select-subscript .error').removeClass('active').filter(function(i, e) {
		if(found) return false;

		var error = $(this).data('error');
		var active = false;

		if(error == 'required' && value.length <= 0) active = true;

		found = active;

		return active;
	}).addClass('active');
}