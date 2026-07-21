$(document).ready(function() {
	initializeCalendarFields();
});

function initializeCalendarFields(){
	$('.calendar-field').each(function(i, e) {
		var $input = $(this).find('.calendar-element');
		var date = $input.val().toString().trim();

        $input.attr('data-default', date);
	});

    $(document).on('click', '.calendar-field .calendar-popover .calendar-popover-header .calendar-popover-date', function() {
		var $field = $(this).closest('.calendar-field');
        var $popover = $field.find('.calendar-popover');
		var $input = $field.find('.calendar-element');

        if($popover.hasClass('years')) {
            $popover.replaceWith(inputsCalendarPopoverDays({
                selected: !isNaN(new Date($input.val().toString()).getTime()) ? new Date($input.val().toString()).getTime() : null,
                timestemp: parseInt($input.attr('data-timestemp'))
            }));
        } else if($popover.hasClass('days')) $popover.replaceWith(inputsCalendarPopoverMonths({ timestemp: parseInt($input.attr('data-timestemp')) }));
        else if($popover.hasClass('months')) $popover.replaceWith(inputsCalendarPopoverYears({ timestemp: parseInt($input.attr('data-timestemp')) }));
    });

    $(document).on('click', '.calendar-field .calendar-popover.days .calendar-popover-content .calendar-popover-option:not(.outside)', function() {
		var $field = $(this).closest('.calendar-field');
		var $input = $field.find('.calendar-element');

        var date = new Date($(this).attr('value'));
        $input.attr('data-timestemp', new Date(date.getFullYear(), date.getMonth(), 1).getTime());
        $input.val($(this).attr('value')).trigger('change');

        $field.find('.calendar-popover .calendar-popover-content .calendar-popover-option').removeClass('active');
        $(this).addClass('active');
	});

    $(document).on('click', '.calendar-field .calendar-popover.days .calendar-popover-footer .today', function() {
		var $field = $(this).closest('.calendar-field');
        var $popover = $field.find('.calendar-popover');
		var $input = $field.find('.calendar-element');

        var timestemp = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

        $input.attr('data-timestemp', timestemp);
        $input.val(toISO(new Date(new Date().setHours(0, 0, 0, 0)))).trigger('change');

        $popover.replaceWith(inputsCalendarPopoverDays({
            selected: new Date().setHours(0, 0, 0, 0),
            timestemp
        }));
	});

    $(document).on('click', '.calendar-field .calendar-popover.days .calendar-popover-footer .clear', function() {
        var $field = $(this).closest('.calendar-field');

		$field.find('.calendar-element').val('').trigger('change');

        $field.find('.calendar-popover .calendar-popover-content .calendar-popover-option').removeClass('active');
	});

    $(document).on('click', '.calendar-field .calendar-popover.months .calendar-popover-content .calendar-popover-option:not(.outside), .calendar-field .calendar-popover.years .calendar-popover-content .calendar-popover-option:not(.outside)', function() {
		var $field = $(this).closest('.calendar-field');
        var $popover = $field.find('.calendar-popover');
		var $input = $field.find('.calendar-element');

        var timestemp = new Date($(this).attr('value')).getTime();
        $input.attr('data-timestemp', timestemp);

        $popover.replaceWith(inputsCalendarPopoverDays({
            selected: !isNaN(new Date($input.val().toString()).getTime()) ? new Date($input.val().toString()).getTime() : null,
            timestemp
        }));
	});

    $(document).on('click', '.calendar-field .calendar-popover .calendar-popover-header .button', function() {
		var $field = $(this).closest('.calendar-field');
        var $popover = $field.find('.calendar-popover');
		var $input = $field.find('.calendar-element');

        var timestemp = new Date($(this).attr('data-value')).getTime();

        if($popover.hasClass('days')) {
            $popover.replaceWith(inputsCalendarPopoverDays({
                selected: !isNaN(new Date($input.val().toString()).getTime()) ? new Date($input.val().toString()).getTime() : null,
                timestemp
            }));
        } else if($popover.hasClass('months')) $popover.replaceWith(inputsCalendarPopoverMonths({ timestemp }));
        else if($popover.hasClass('years')) $popover.replaceWith(inputsCalendarPopoverYears({ timestemp }));
	});
}