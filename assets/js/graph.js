//GRAPH
var canvas, ctx;
var initialized = false;

var crash_settings = {
	start_time: new Date().getTime(),
	current_progress_time: 0,
	difference_time: 0,
	stage: 'starting'
}

var canvas_responsive = 0;

var XTimeBeg, XTimeEnd, YPayoutBeg, YPayoutEnd, XScale, YScale;

var line_weight = 4;

$(window).resize(function(){
	if(!initialized) return;

    crashGame_resize();
});

function crashGame_initializeGraph() {
	initialized = true;

	canvas = document.getElementById('crash_canvas');

	if(canvas !== null) {
		ctx = canvas.getContext('2d');

		crashGame_resize();

		setInterval(function(){
			var marks_size = 14;

			Object.assign(ctx, {
				fillStyle : '#ffffff',
				font: 'bold ' + marks_size + 'px Roboto,sans-serif',
				lineWidth: 2
			});

			var current_time = getTime();

			var currentGrowth = 100 * growthFunc(current_time);
			var currentPayout = 100 * calcPayout(current_time);

			var offset_bottom = canvas_responsive ? 60 : 30;
			var offset_left = 0;

			var offset_right = canvas_responsive ? 50 : 0;

			var text_bottom = canvas_responsive ? 40 : 20;
			var text_right = canvas_responsive ? 15 : 0;

			XTimeBeg = 0;
			XTimeEnd = Math.max(10000, current_time);
			YPayoutBeg = 100;
			YPayoutEnd = Math.max(180, currentGrowth);
			XScale = (canvas.width - offset_left - offset_right) / (XTimeEnd - XTimeBeg);
			YScale = (canvas.height - offset_bottom) / (YPayoutEnd - YPayoutBeg);

			ctx.beginPath();

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			//DRAW AXES
			var payoutSeparation = tickSeparation((canvas_responsive ? 60 : 30) / YScale);
			var timeSeparation = tickSeparation((canvas_responsive ? 80 : 40) / XScale);

			for (var payout = 100; payout < YPayoutEnd; payout += payoutSeparation) {
				var y = calcY(payout) - offset_bottom;

				if(canvas_responsive) ctx.fillText((payout / 100).toFixed(2) + 'X', canvas.width - offset_right, canvas.height + y);

				ctx.strokeStyle = "#ffffff";
				ctx.lineWidth = 1;

				ctx.moveTo(canvas.width - offset_right - 15 - text_right, canvas.height + y - 4);
				ctx.lineTo(canvas.width - offset_right - text_right, canvas.height + y - 4);

				for(var i = 1; i <= 3; i++){
					ctx.strokeStyle = "#A9ACBE";

					ctx.moveTo(canvas.width - offset_right - 10 - text_right, canvas.height + calcY(payout + i * payoutSeparation / 4) - offset_bottom - 4);
					ctx.lineTo(canvas.width - offset_right - text_right, canvas.height + calcY(payout + i * payoutSeparation / 4) - offset_bottom - 4);
				}

				ctx.stroke();
			}

			for (var time = 0; time < XTimeEnd; time += timeSeparation) {
				var x = calcX(time, 0);

				ctx.fillText((time / 1000).toFixed(0) + 's', x + offset_left, canvas.height);
			}

			for (var time = offset_left; time < canvas.width - offset_right - text_right; time += 20) {
				ctx.strokeStyle = "#ffffff";
				ctx.lineWidth = 1;

				ctx.moveTo(time, canvas.height - text_bottom);
				ctx.lineTo(time + 10, canvas.height - text_bottom);

				ctx.stroke();
			}

			if(crash_settings.stage != 'crashed') $('#crash_crash').text(calcPayout(current_time).toFixed(2));

			if(crash_settings.stage == 'progress' || crash_settings.stage == 'crashed'){
				ctx.beginPath();

				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = line_weight;

				ctx.moveTo(calcX(XTimeBeg, 1) + offset_left, calcY(100 * calcPayout(Math.floor(XTimeBeg / 1000) * 1000)) + canvas.height - offset_bottom);

				for (var t = XTimeBeg; t < current_time; t += Math.floor(1 / XScale)) {
					var t1 = Math.floor(t / 1000) * 1000;
					var x = calcX(t1, 1) + offset_left;
					var y = calcY(100 * calcPayout(t1)) + canvas.height - offset_bottom;

					ctx.lineTo(x, y);
				};

				var x_begin = calcX(XTimeBeg, 1) + offset_left;
				var y_begin = calcY(100 * calcPayout(XTimeBeg)) + canvas.height - offset_bottom;

				var x_current = calcX(current_time, 1) + offset_left;
				var y_current = calcY(100 * calcPayout(current_time)) + canvas.height - offset_bottom;

				ctx.lineTo(x_current, y_current);
				ctx.stroke();

				if(current_time > 0){
					ctx.fillStyle = '#ffffff';

					ctx.beginPath();
					ctx.arc(x_begin, y_begin, line_weight / 2 - 1, 0, 2 * Math.PI, false);
					ctx.arc(x_current, y_current, line_weight / 2 - 1, 0, 2 * Math.PI, false);
					ctx.fill();

					ctx.beginPath();
					ctx.arc(x_current, y_current, 5, 0, 2 * Math.PI, false);

					ctx.fill();
				}

				ctx.beginPath();
				for (var time = canvas.width - offset_right - 15; time >= x_current; time -= 20) {
					ctx.strokeStyle = "#ffffff";
					ctx.lineWidth = 1;

					ctx.moveTo(time, y_current);
					ctx.lineTo(Math.max(time - 10, x_current), y_current);

					ctx.stroke();
				}
			}

			ctx.closePath();
		}, 10);
	}
}

function calcX(time, g) {
	return (XScale - canvas.width * 0.15 / (XTimeEnd - XTimeBeg) * g) * (time - XTimeBeg);
};

function calcY(payout) {
	return -(YScale * (payout - YPayoutBeg));
};

function getTime(){
	if(crash_settings.stage == 'progress') {
		var time = new Date().getTime() - crash_settings.start_time + crash_settings.difference_time;
		crash_settings.current_progress_time = time;

		return time;
	}

	if(crash_settings.stage == 'crashed') return crash_settings.current_progress_time;
	return 0;
}

function calcPayout(ms) {
	var gamePayout = growthFunc(ms);
	return gamePayout;
}

function growthFunc(ms) {
	var r = 0.00006;
	return Math.pow(Math.E, r * ms);
}

function tickSeparation(s) {
	var r = 1;
	while (true) {
		if (r > s) return r;
		r *= 2;

		if (r > s) return r;
		r *= 5
	}
}