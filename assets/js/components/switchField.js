$(document).ready(function() {
	initializeSwitchFields();
});

function initializeSwitchFields(){
	$('.switch-field').each(function(i, e) {
		var $input = $(this).find('.switch-element');

        $input.attr('data-default', $input.prop('checked'));
	});
}

function resetSwitchField($field){
    var $input = $field.find('.switch-element');

    $input.prop('checked', $input.attr('data-default') == 'true');
}