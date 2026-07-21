$(document).ready(function() {
	initializeCheckboxFields();
});

function initializeCheckboxFields(){
	$('.checkbox-field').each(function(i, e) {
		var $input = $(this).find('.checkbox-element');

        $input.attr('data-default', $input.prop('checked'));
	});
}

function resetCheckboxField($field){
    var $input = $field.find('.checkbox-element');

    $input.prop('checked', $input.attr('data-default') == 'true');
}