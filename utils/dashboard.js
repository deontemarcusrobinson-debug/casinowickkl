function getFetchDate(type){
	var date = new Date();

	if(type == 'day'){
		var year = date.getFullYear();
		var month = date.getMonth();
		var day = date.getDate();

		var new_date = new Date(year + '-' + (month + 1) + '-' + day);

		return Math.floor(new_date.getTime() / 1000);
	} else if(type == 'week'){
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth();
		var day = date.getDate();
		var week = (date.getDay() + 6) % 7;

		if(week >= day){
			var last_date = new Date(year, (month + 11) % 12, 0);

			month--;
			day += last_date.getDate();

			if(month < 0) {
				month = 11;
				year--;
			}
		}

		var new_date = new Date(year + '-' + (month + 1) + '-' + (day - week));

		return Math.floor(new_date.getTime() / 1000);
	} else if(type == 'month'){
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth();

		var new_date = new Date(year + '-' + (month + 1) + '-01');

		return Math.floor(new_date.getTime() / 1000);
	} else if(type == 'year'){
		var date = new Date();
		var year = date.getFullYear();

		var new_date = new Date(year + '-01-01');

		return Math.floor(new_date.getTime() / 1000);
	}
}
module.exports = {
    getFetchDate
};