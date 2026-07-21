$(document).ready(function() {
	initializeInputGroups();
});

function initializeInputGroups(){
	$('.input-group').each(function(i, e) {
		var $input = $(this).find('.input-element');
		var text = $input.val().toString().trim();
		var type = $input.attr('type');

        $input.attr('data-default', text);
        $input.attr('data-type', type);

		if(text.length > 0) verifyErrorInputGroup($(this));
	});

	$(document).on('input', '.input-group .input-element', function() {
		var $group = $(this).closest('.input-group');

        verifyErrorInputGroup($group);
	});

	$(document).on('update', '.input-group .input-element', function() {
		var $group = $(this).closest('.input-group');

        verifyErrorInputGroup($group);
	});

	$(document).on('focusout', '.input-group .input-element', function() {
		var $group = $(this).closest('.input-group');

        verifyErrorInputGroup($group);
	});

	$(document).on('click', '.input-group .input-password-show', function() {
		var $group = $(this).closest('.input-group');
		var $input = $group.find('.input-element');

        $input.attr('type', 'text');
	});

	$(document).on('click', '.input-group .input-password-hide', function() {
		var $group = $(this).closest('.input-group');
		var $input = $group.find('.input-element');

        $input.attr('type', 'password');
	});
}

function resetInputGroup($group){
    var $input = $group.find('.input-element');
    $input.val($input.attr('data-default'));
	$input.attr('type', $input.attr('data-type'));

    clearErrorInputGroup($group);
}

function clearErrorInputGroup($group){
	$group.find('.input-subscript .error').removeClass('active');
}

function verifyErrorInputGroup($group){
	var text = $group.find('.input-element').val().toString().trim();

	var found = false;

	$group.find('.input-subscript .error').removeClass('active').filter(function(i, e) {
		if(found) return false;

		var error = $(this).data('error');
		var active = false;

		if(text.length <= 0) {
			if(error == 'required') active = true;
		} else {
			if(error == 'number' && isNaN(Number(text))) active = true;
			else if(error == 'positive_integer' && !isNaN(Number(text)) && (Math.floor(Number(text)) != Number(text) || Math.floor(Number(text)) <= 0)) active = true;
			else if(error == 'percentage' && !isNaN(Number(text)) && (Number(text) < 0 || Number(text) > 100)) active = true;
			else if(error == 'greater' && !isNaN(Number(text)) && games_intervalAmounts[$group.find('.input-element').attr('data-amount')] !== undefined && Number(text) < games_intervalAmounts[$group.find('.input-element').attr('data-amount')].min) active = true;
			else if(error == 'lesser' && !isNaN(Number(text)) && games_intervalAmounts[$group.find('.input-element').attr('data-amount')] !== undefined && Number(text) > games_intervalAmounts[$group.find('.input-element').attr('data-amount')].max) active = true;
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