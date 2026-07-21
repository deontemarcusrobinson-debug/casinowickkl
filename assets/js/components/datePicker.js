$(document).ready(function() {
	initializeDatePickers();
});

function initializeDatePickers(){
    $('.date-picker').each(function(i, e) {
		var $input = $(this).find('.date-element');
		var date = $input.val().toString().trim();

        $input.attr('data-default', date);
	});

    $(document).on('click', '.date-picker:not(.active) .date-wrapper .date-trigger', function() {
		var $field = $(this).closest('.date-picker');

		openDatePicker($field);
	});

    $(document).on('change', '.date-picker .date-wrapper .calendar-field .calendar-element', function() {
		var $field = $(this).closest('.date-picker');

        var value = $(this).val();

        $field.find('.date-element').val(value).trigger('change');
	});

    $(document).on('change', '.date-picker .date-wrapper .date-element', function() {
		var $field = $(this).closest('.date-picker');

        updateDatePicker($field);
	});

	$(document).on('keydown', '.date-picker .date-wrapper .date-element', function(e) {
		var $field = $(this).closest('.date-picker');

		if(!$field.hasClass('active')){
			if(e.key == 'Enter' || e.key == ' ') {
				e.preventDefault();

				$field.addClass('active');
			}

			return;
		}

        if(e.key == 'Escape') {
			closeDatePicker($field);
		}
    });

	$(document).on('keydown', '.date-picker .date-wrapper .date-calendar button', function(e) {
		var $field = $(this).closest('.date-picker');

        if(e.key == 'Escape') {
			closeDatePicker($field);

			$field.find('.date-element').focus();
		}
    });

	$(document).on('focusin', '*:not(.date-picker.active *)', function(e) {
		if(e.target !== this) return;

        if($('.date-picker.active').length > 0) closeDatePicker($('.date-picker.active').first());
	});

	$(document).on('click', '*:not(.date-picker.active .date-wrapper .calendar-field *)', function(e) {
		if(e.target !== this) return;

        if($('.date-picker.active').length > 0) closeDatePicker($('.date-picker.active').first());
	});
}

function openDatePicker($field) {
	$field.addClass('active');
	$field.find('.date-element').focus();
}

function closeDatePicker($field) {
	$field.removeClass('active');

    verifyErrorDatePicker($field);
}

function updateDatePicker($field){
    var value = $field.find('.date-element').val().toString().trim();

    if(value.length <= 0) {
        $field.find('.date-placeholder').empty();
    } else {
        var date = new Date(value);

        $field.find('.date-placeholder').text([ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ][date.getMonth()].slice(0,3) + ' ' + date.getDate() + ', ' + date.getFullYear());
    }

    verifyErrorDatePicker($field);
}

function verifyErrorDatePicker($field){
	var value = $field.find('.date-element').val().toString().trim();
    var date = new Date(value);

	var found = false;

	$field.find('.date-subscript .error').removeClass('active').filter(function(i, e) {
		if(found) return false;

		var error = $(this).data('error');
		var active = false;

		if(error == 'required' && (!date || isNaN(date.getTime()))) active = true;

		found = active;

		return active;
	}).addClass('active');
}

function clearErrorDatePicker($field){
	$field.find('.date-subscript .error').removeClass('active');
}