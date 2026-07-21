$(document).ready(function() {
	jQuery.fn.extend({
		resizeObserver: function(callback) {
			return this.each(function() {
				var observer = new ResizeObserver(function(entries) {
					entries.forEach(function(entry) {
						callback.call(entry.target);
					});
				});

				observer.observe(this);
			});
		},

		countToBalance: function(x) {
			var $this = $(this);

			var start = parseFloat($this.text());
			start = Math.floor(start * 100);

			var delta = Math.floor(x * 100 - start);

			if(delta >= 0) $this.addClass('text-success');
			else $this.addClass('text-danger');

			$({
				count: start
			}).animate({
				count: Math.floor(x * 100)
			}, {
				duration: 800,
				step: function(val) {
					var vts = Math.floor(val);

					$this.text(getFormatAmountString(vts / 100));
				},
				complete: function(){
					setTimeout(function(){
						$this.removeClass('text-success').removeClass('text-danger');
					}, 400);

					$this.text(getFormatAmountString(x));
				}
			});
		},

		countToFloat: function(x) {
			var $this = $(this);

			var start = parseFloat($this.text());
			start = Math.floor(start * 100);

			var delta = Math.floor(x * 100 - start);

			var dur = Math.min(400, Math.round(Math.abs(delta) / 500 * 400));

			$({
				count: start
			}).animate({
				count: Math.floor(x * 100)
			}, {
				duration: dur,
				step: function(val) {
					var vts = Math.floor(val);

					$this.text(roundedToFixed(vts / 100, 2).toFixed(2));
				},
				complete: function(){
					$this.text(roundedToFixed(x, 2).toFixed(2));
				}
			});
		},

		countToProfit: function(x) {
			var $this = $(this);

			var start = parseFloat($this.text());
			start = Math.floor(start * 100);

			var delta = Math.floor(x * 100 - start);

			var dur = Math.min(400, Math.round(Math.abs(delta) / 500 * 400));

			$({
				count: start
			}).animate({
				count: Math.floor(x * 100)
			}, {
				duration: dur,
				step: function(val) {
					var vts = Math.floor(val);

					$this.removeClass('positive').removeClass('negative');

					if(vts < 0) $this.addClass('negative');
					else $this.addClass('positive');

					$this.text(roundedToFixed(Math.abs(vts) / 100, 2).toFixed(2));
				},
				complete: function(){
					$this.text(roundedToFixed(Math.abs(x), 2).toFixed(2));
				}
			});
		},

		countToInt: function(x) {
			var $this = $(this);

			var start = parseInt($this.text());
			var delta = x - start;

			var durd = delta;
			var dur = Math.min(400, Math.round(Math.abs(durd) / 500 * 400));

			$({
				count: start
			}).animate({
				count: x
			}, {
				duration: dur,
				step: function(val) {
					var vts = Math.floor(val);

					$this.text(vts);
				},
				complete: function(){
					$this.text(parseInt(x));
				}
			});
		}
	});
});