$(document).ready(function() {
	initializeTextareaFields();
});

function initializeTextareaFields(){
	$('.textarea-field').each(function(i, e) {
		var $input = $(this).find('.textarea-element');
		var text = $input.val().toString().trim();

        $input.attr('data-default', text);

		if(text.length > 0) verifyErrorTextareaField($(this));
	});

	$(document).on('input', '.textarea-field .textarea-element', function() {
		var $group = $(this).closest('.textarea-field');

        verifyErrorTextareaField($group);
	});

	$(document).on('update', '.textarea-field .textarea-element', function() {
		var $group = $(this).closest('.textarea-field');

        verifyErrorTextareaField($group);
	});

	$(document).on('focusout', '.textarea-field .textarea-element', function() {
		var $group = $(this).closest('.textarea-field');

        verifyErrorTextareaField($group);
	});

	$(document).on('click', '.textarea-field .field_element_password', function() {
		var $input = $(this).closest('.textarea-field').find('.textarea-element');

        var type = $(this).attr('data-type');

        if(type == 'show') $input.attr('type', 'text');
        if(type == 'hide') $input.attr('type', 'password');
	});
}

function resetTextareaField($group){
    var $input = $group.find('.textarea-element');

    $input.val($input.attr('data-default'));

    verifyErrorTextareaField($input.closest('.textarea-field'));
}

function clearErrorTextareaField($group){
	$group.find('.textarea-subscript .error').removeClass('active');
}

function verifyErrorTextareaField($group){
	var text = $group.find('.textarea-element').val().toString().trim();

	var found = false;

	$group.find('.textarea-subscript .error').removeClass('active').filter(function(i, e) {
		if(found) return false;

		var error = $(this).data('error');
		var active = false;

		if(text.length <= 0) {
			if(error == 'required') active = true;
		} else {
			if(error == 'number' && isNaN(Number(text))) active = true;
			else if(error == 'positive_integer' && !isNaN(Number(text)) && (Math.floor(Number(text)) != Number(text) || Math.floor(Number(text)) <= 0)) active = true;
			else if(error == 'percentage' && !isNaN(Number(text)) && (Number(text) < 0 || Number(text) > 100)) active = true;
			else if(error == 'greater' && !isNaN(Number(text)) && games_intervalAmounts[$group.find('.input-element').attr('data-amount')] !== undefined && Number(text) < games_intervalAmounts[$group.find('.textarea-element').attr('data-amount')].min) active = true;
			else if(error == 'lesser' && !isNaN(Number(text)) && games_intervalAmounts[$group.find('.input-element').attr('data-amount')] !== undefined && Number(text) > games_intervalAmounts[$group.find('.textarea-element').attr('data-amount')].max) active = true;
			else if(error == 'name' && !/^.{2,64}$/.exec(text)) active = true;
			else if(error == 'email' && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w+$/.exec(text)) active = true;
			else if(error == 'password' && !/^((?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*\W).{8,64})$/.exec(text)) active = true;
			else if(error == 'minimum_6_characters' && text.length < 6) active = true;
			else if(error == 'minimum_10_characters' && text.length < 10) active = true;
			else if(error == 'only_letters_numbers' && !/(^[a-zA-Z0-9]*$)/.exec(text)) active = true;
		}

		found = active;

		return active;
	}).addClass('active');
}