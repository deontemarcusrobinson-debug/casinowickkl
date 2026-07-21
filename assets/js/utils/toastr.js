$(document).ready(function() {
	toastr.options = {
		'closeButton': true,
		'debug': false,
		'newestOnTop': false,
		'progressBar': true,
		'positionClass': 'toast-top-right',
		'preventDuplicates': false,
		'onclick': null,
		'showDuration': '500',
		'hideDuration': '500',
		'timeOut': '10000',
		'extendedTimeOut': '2000',
		'showEasing': 'swing',
		'hideEasing': 'linear',
		'showMethod': 'fadeIn',
		'hideMethod': 'slideUp'
	}
});

function notify(type, notify){
	toastr[type](notify);
}