/*
           ______________________________________
  ________|                                      |_______
  \       |        Developed by MrCHICK          |      /
   \      |            VGOWitch.com              |     /
   /      |______________________________________|     \
  /__________)                                (_________\

*/

"use strict";

var INITIALIZED = false;

var USERID = null;
var SOCKET = null;

var RECAPTCHA = null;

var BALANCES = {
	'main': 0
};

var games_intervalAmounts = {};
var games_houseEdges = {};

//AUDIO
var audio_volume = 0.75;

var audio_names = {
	error: [ 'error' ],
	play: [ 'play' ],
	cashout: [ 'cashout' ],
	select: [ 'select' ],
    roulette_rolling: [ 'roulette_rolling' ],
	roulette_end: [ 'roulette_end' ],
    crash_stop: [ 'crash_stop' ],
    jackpot_rolling: [ 'jackpot_rolling' ],
    coinflip_start: [ 'coinflip_start' ],
	coinflip_stop: [ 'coinflip_stop' ],
    dice_stop: [ 'dice_stop' ],
	dice_win: [ 'dice_win' ],
	dice_loss: [ 'dice_loss' ],
    tower_win: [ 'tower_win' ],
	tower_loss: [ 'tower_loss' ],
    minesweeper_win: [ 'minesweeper_win' ],
	minesweeper_loss: [ 'minesweeper_loss' ],
    plinko_hit: [ 'plinko_hit1', 'plinko_hit2', 'plinko_hit3', 'plinko_hit4' ],
	plinko_win: [ 'plinko_win' ]
};

var audio_sounds = {};

//PROFILE SETTINGS

var profile_settings = {
	'sounds': {
		'type': 'cookie',
		'value': '1'
	},
	'channel': {
		'type': 'cookie',
		'value': 'en'
	},
	'chat': {
		'type': 'cookie',
		'value': '0'
	},
	'anonymous': {
		'type': 'save',
		'value': '0'
	},
	'private': {
		'type': 'save',
		'value': '0'
	},
	'balance': {
		'type': 'cookie',
		'value': 'main'
	},
	'history': {
		'type': 'cookie',
		'value': 'all_bets'
	}
};

function sounds_initialize(){
	Object.keys(audio_names).forEach(function(item){
		audio_sounds[item] = [];

		audio_names[item].forEach(function(name){
			var sound = new Audio('/audio/' + name + '.wav');
			sound.load();

			audio_sounds[item].push(sound);
		})
	});
}

function sounds_play(name){
	var sounds = audio_sounds[name];

	var sound = sounds[getRandomInt(0, sounds.length - 1)].cloneNode();
	sound.volume = audio_volume;

	var play_promise = sound.play();

	if (play_promise !== undefined) {
		play_promise.then(function(){
			setTimeout(function(){
				sound = null;
			}, sound.duration * 1000);
		}).catch(function(err){
			sound.pause();
		});
	}
}

function profile_settingsChange(setting, value){
	if(profile_settings[setting] === undefined) return;

	profile_settings[setting].value = value;

	profile_settingsSave();
	profile_settingsAssign(setting, value, false);
}

function profile_settingsLoad(){
	var settings = JSON.parse(getCookie('settings'));

	if(!settings) {
		profile_settingsSave();
		profile_settingsLoad();
		return
	}

	Object.keys(settings).forEach(function(item){
		if(profile_settings[item] !== undefined){
			profile_settings[item].value = settings[item];
		}
	});

	var new_settings = false;

	Object.keys(profile_settings).forEach(function(item){
		profile_settingsAssign(item, profile_settings[item].value, true);

		if(settings[item] === undefined && profile_settings[item].type == 'cookie') new_settings = true;
	});

	if(new_settings) return profile_settingsSave();
}

function profile_settingsAssign(setting, value, first){
	if(setting == 'sounds' || setting == 'anonymous' || setting == 'private') $('.change-setting[data-setting="' + setting + '"]').prop('checked', (value == '1'));

	switch(setting) {
		case 'sounds':
			$('#profile_setting_sounds').prop('checked', value == 1);

			audio_volume = value == 1 ? 0.75 : 0;

			break;

		case 'channel':
			$('#chat_channel').val(value).trigger('update');

			break;

		case 'chat':
			if(isOnMobile() && first) resize_pullout('chat', true);
			else resize_pullout('chat', value == 1);

			break;

		case 'anonymous':
			break;

		case 'private':
			break;

		case 'balance':
			$('.balances .balance[data-type="total"] .amount').countToFloat(roundedToFixed($('.balances .list .balance[data-type="' + value + '"]').attr('data-balance'), 2));

			break;

		case 'history':
			$('.bet-select .history-load').removeClass('active');
			$('.bet-select .history-load[data-type="' + value + '"]').addClass('active');

			break;
	}
}

function profile_settingsSave(){
	var settings = {};

	Object.keys(profile_settings).forEach(function(item){
		if(profile_settings[item].type == 'cookie') {
			settings[item] = profile_settings[item].value;
		}
	});

	setCookie('settings', JSON.stringify(settings));
}

function profile_settingsGet(setting){
	if(profile_settings[setting] === undefined) return '';

	return profile_settings[setting].value;
}

$(document).ready(function() {
	profile_settingsLoad();
	sounds_initialize();

	socket_connect();

	//BONUS CODES
	$('#apply_bonus_code').on('click', function(){
		var code = $('#bonus_code').val();

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'account',
				'command': 'bonus_code',
				'code': code,
				'recaptcha': render
			});
		});
	});

	//DEPOSIT BONUSES
	$(document).on('click', '#apply_deposit_bonus', function() {
		var code = $('#deposit_bonus_code').val();

		requestRecaptcha(function(render){
			socket_emit({
				type: 'account',
				command: 'deposit_bonus',
				code: code,
				recaptcha: render
			});
		});
	});

	//EXCLUSION
	$('#self_exclusion_day').on('click', function(){
		confirm_action(function(confirmed){
			if(!confirmed) return;

			requestRecaptcha(function(render){
				socket_emit({
					'type': 'account',
					'command': 'self_exclusion_day',
					'recaptcha': render
				});
			});
		});
	});

	$('#self_exclusion_week').on('click', function(){
		confirm_action(function(confirmed){
			if(!confirmed) return;

			requestRecaptcha(function(render){
				socket_emit({
					'type': 'account',
					'command': 'self_exclusion_week',
					'recaptcha': render
				});
			});
		});
	});

	$('#self_exclusion_month').on('click', function(){
		confirm_action(function(confirmed){
			if(!confirmed) return;

			requestRecaptcha(function(render){
				socket_emit({
					'type': 'account',
					'command': 'self_exclusion_month',
					'recaptcha': render
				});
			});
		});
	});

	//REMOVE SESSIONS
	$('.remove_session').on('click', function(){
		var session = $(this).data('session');

		confirm_action(function(confirmed){
			if(!confirmed) return;

			socket_emit({
				'type': 'account',
				'command': 'remove_session',
				'session': session
			});
		});
	});

    $('#remove_sessions').on('click', function(){
		confirm_action(function(confirmed){
			if(!confirmed) return;

			socket_emit({
				'type': 'account',
				'command': 'remove_sessions'
			});
		});
	});

	//ENABLE EMAIL VERIFICATION
	$('#enable_email_verification').on('click', function(){
		socket_emit({
            'type': 'account',
            'command': 'enable_email_verification'
        });
	});

    //ACTIVATE EMAIL VERIFICATION
    $('#activate_email_verification').on('click', function(){
        var code = $('#email_verification_code').val();

		socket_emit({
            'type': 'account',
            'command': 'activate_email_verification',
            'code': code
        });
	});

	//DISABLE EMAIL VERIFICATION
	$('#disable_email_verification').on('click', function(){
		confirm_action(function(confirmed){
			if(!confirmed) return;

            socket_emit({
                'type': 'account',
                'command': 'disable_email_verification'
            });
        });
	});

    //ENABLE AUTHENTICATOR APP
	$('#enable_authenticator_app').on('click', function(){
		socket_emit({
            'type': 'account',
            'command': 'enable_authenticator_app'
        });
	});

    //ACTIVATE AUTHENTICATOR APP
    $('#activate_authenticator_app').on('click', function(){
        var token = $('#authenticator_app_token').val();

		socket_emit({
            'type': 'account',
            'command': 'activate_authenticator_app',
            'token': token
        });
	});

	//DISABLE AUTHENTICATOR APP
	$('#disable_authenticator_app').on('click', function(){
		confirm_action(function(confirmed){
			if(!confirmed) return;

            socket_emit({
                'type': 'account',
                'command': 'disable_authenticator_app'
            });
        });
	});

	//MANAGE AUTHENTICATOR APP
	$('#manage_authenticator_app').on('click', function(){
		socket_emit({
            'type': 'account',
            'command': 'manage_authenticator_app'
        });
	});

	//GENERATE CODES AUTHENTICATOR APP
	$('#generate_codes_authenticator_app').on('click', function(){
		socket_emit({
            'type': 'account',
            'command': 'generate_codes_authenticator_app'
        });
	});

	//TWOFA PRIMARY METHOD
	$('.twofa_primary_method').on('click', function(){
		var method = $(this).attr('data-method');

        socket_emit({
            'type': 'account',
            'command': 'twofa_primary_method',
            'method': method
        });
	});

	//PULLOUT
	$('[data-pullout]').on('click', function(){
		var pullout = $(this).data('pullout');

		var hide = $('#page').hasClass(pullout + '-active');

		if(pullout == 'menu' || pullout == 'admin') {
			if(isOnMobile() && $('#page').hasClass('chat-active')) profile_settingsChange('chat', '1');

			resize_pullout(pullout, hide);
		} else {
			if(isOnMobile() && $('#page').hasClass('menu-active')) resize_pullout('menu', true);

			profile_settingsChange(pullout, hide ? '1' : '0');
		}
	});

	$('.pullout').on('click', function(e){
		if(e.target !== this) return;

		var pullout = $(this).data('id');

		if(pullout == 'menu' || pullout == 'admin') resize_pullout(pullout, true);
		else profile_settingsChange(pullout, '1');
	});

	var last_width = $(window).width();
	$(window).resize(function(){
		if(last_width != $(window).width()){
			last_width = $(window).width();

			resize_pullout('chat', profile_settings['chat'].value == '1');
		}
	});

	//PROFILE SETTINGS
	$('.change-setting').on('change', function(){
		var setting = $(this).data('setting');

		if(profile_settings[setting].type == 'cookie') {
			profile_settingsChange(setting, (profile_settings[setting].value == '1') ? '0' : '1');
		} else {
			profile_settings[setting].value = (profile_settings[setting].value == '1') ? '0' : '1';

			socket_emit({
				'type': 'account',
				'command': 'profile_settings',
				'data': {
					'setting': setting,
					'value': profile_settings[setting].value
				}
			});

			profile_settingsAssign(setting, profile_settings[setting].value, false);
		}
	});

	//SWITCH PANELS
	$(document).on('click', '.switch_panel', function() {
		var id = $(this).data('id');
		var panel = $(this).data('panel');

		$('.switch_panel[data-id="' + id + '"]').removeClass('active');
		$(this).addClass('active');

		$('.switch_content[data-id="' + id + '"]').addClass('hidden');
		$('.switch_content[data-id="' + id + '"][data-panel="' + panel + '"]').removeClass('hidden');
	});

	//SAVE EMAIL
	$(document).on('click', '#save_account_email', function() {
		var email = $(this).closest('.input_field').find('.account_email').val();

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'account',
				'command': 'save_email',
				'email': email,
				'recaptcha': render
			});
		});
	});

	$(document).on('click', '.betshort_action', function() {
		var game = $(this).data('game');
		var $input = $('#betamount_' + game);

		var amount = $input.val();

		amount = getNumberFromString(amount);

		var bet_amount = getFormatAmount(amount);
		var action = $(this).data('action');

		if (action == 'clear') {
			bet_amount = 0;
		} else if (action == 'double') {
			bet_amount *= 2;
		} else if (action == 'half') {
			bet_amount /= 2;
		} else if (action == 'max') {
			bet_amount = BALANCES.main;
		} else {
			action = getNumberFromString(action);
			bet_amount += getFormatAmount(action);
		}

		$input.val(getFormatAmountString(bet_amount)).trigger('input').trigger('update').focus();
	});

	$(document).on('click', '.changeshort_action', function() {
		var fixed = $(this).data('fixed');

		var $input = $($(this).data('id'));

		var value = $input.val();
		value = getNumberFromString(value);

		if(fixed) var new_value = roundedToFixed(value, 2);
		else var new_value = parseInt(value);

		var action = $(this).data('action');

		if (action == 'clear') {
			new_value = 0;
		} else {
			action = getNumberFromString(action);

			if(fixed) new_value += roundedToFixed(action, 2);
			else new_value += parseInt(action);
		}

		if(fixed) $input.val(roundedToFixed(new_value, 2).toFixed(2)).trigger('input').trigger('update').focus();
		else $input.val(Math.floor(new_value)).trigger('input').trigger('update').focus();
	});

	$(document).on('hide', '#modal_recaptcha', function(){
		grecaptcha.reset(RECAPTCHA);
		$('#modal_recaptcha .modal-body').html('<div class="flex justify-center" id="g-recaptcha"></div>');
	});
});

function requestRecaptcha(callback){
	$('#modal_recaptcha').modal('show');

	var id = 'g-recaptcha-' + Math.floor(Math.random() * 100000);
	$('#g-recaptcha').html('<div id="' + id + '"></div>');

	RECAPTCHA = grecaptcha.render(id, {
		'sitekey': app.recaptcha.public_key,
		'callback': function() {
			var render = grecaptcha.getResponse(RECAPTCHA);

			callback(render);

			setTimeout(function(){
				$('#modal_recaptcha').modal('hide');

				grecaptcha.reset(RECAPTCHA);
				$('#modal_recaptcha .modal-body').html('<div class="flex justify-center" id="g-recaptcha"></div>');
			}, 1000);
		},
		'theme' : 'dark'
	});
}

function resize_pullout(pullout, hide) {
    if(app.paths[0] == 'admin' && pullout != 'admin') return;

    if(hide) $('#page').removeClass(pullout + '-active');
    else $('#page').addClass(pullout + '-active');
}

/* SOCKET */

var disconnected = false;

function socket_connect() {
	if(!SOCKET) {
		var session = getCookie('session');

		SOCKET = io({
			transports: ['polling'],
			withCredentials: true,
			extraHeaders: {
				'ngrok-skip-browser-warning': 'true'
			},
			auth: {
				paths: app.paths,
				history: profile_settingsGet('history'),
				channel: profile_settingsGet('channel')
			}
		});

		$('.status-server *').addClass('hidden');
		$('.status-server *[data-status="connecting"]').removeClass('hidden');

		SOCKET.on('connect', function(message) {
			SOCKET.emit('join', {}, function(res){
				if(!res.success) {
					notify('error', res.error);

                	sounds_play('error');

					return;
				}

				socket_connected(res.data);
			});

			$('.status-server *').addClass('hidden');
			$('.status-server *[data-status="running"]').removeClass('hidden');

			$('#toast-container .toast').remove();

			if(disconnected) disconnected = false;
		});
		SOCKET.on('message', function(message) {
			if(message.data === undefined) socket_handler(message.type, message.method);
			else socket_handler(message.type, message.method, message.data);
		});
		SOCKET.on('connect_error', function(message) {
			if(disconnected) return;

			toastr['warning']('Reconnecting!', '', {
				timeOut: 0,
				extendedTimeOut: 0
			});

			$('.status-server *').addClass('hidden');
			$('.status-server *[data-status="connection_lost"]').removeClass('hidden');

			disconnected = true;
		});
	}
}

function socket_emit(request) {
	if (SOCKET) {
		SOCKET.emit('request', request);
	}
}

function socket_connected(data){
	if(!INITIALIZED && !data.maintenance){
		INITIALIZED = true;

		USERID = data.user.userid;

		$('#level_count').text(data.user.level.level);
		$('#level_bar').css('width', roundedToFixed((data.user.level.have - data.user.level.start) / (data.user.level.next - data.user.level.start) * 100, 2).toFixed(2) + '%');

		Object.keys(data.user.settings).forEach(function(item){
			if(profile_settings[item] !== undefined){
				profile_settings[item].value = data.user.settings[item];

				profile_settingsAssign(item, data.user.settings[item], true);
			}
		});

		data.user.balances.forEach(function(item){
			if(item.balance != BALANCES[item.type]){
				$('.balances .list > .balance[data-type="' + item.type + '"]').attr('data-balance', getFormatAmountString(item.balance));
				$('.balances .list > .balance[data-type="' + item.type + '"] .amount').countToBalance(item.balance);

				if(item.type == profile_settingsGet('balance')) $('.balances > .balance[data-type="total"] .amount').countToBalance(item.balance);

				BALANCES[item.type] = item.balance;
			}
		});

		chat_ignoreList = data.chat.listignore;

		$('#chat-area').empty();

		data.chat.messages.forEach(function(message){
			chat_message(message);
		});

		games_intervalAmounts = data.amounts;
		Object.keys(games_intervalAmounts).forEach(function(item){
			if($('.input-group .input-element[data-amount="' + item + '"]').length > 0) $('.input-group .input-element[data-amount="' + item + '"]').trigger('update');
		});

		games_houseEdges = data.house_edges;

		if(!data.banned) {
			/* FIRST REQUESTS */

			if((app.paths[0] == 'deposit' || app.paths[0] == 'withdraw') && app.paths.length > 1){
			}

			if(app.paths[0] == 'admin'){
				if(data.user.authorized.admin) {
					if(app.paths[0] == 'admin'){
						dashboard_initialize();
					}
				}
			}

			if(app.paths[0] == 'rewards'){
			}

			if(app.paths[0] == 'affiliates'){
				var date = $('.affiliates-chart-date .button.active').attr('data-date');

				socket_emit({
					'type': 'affiliates',
					'command': 'overview',
					'date': date
				});
			}

			/* END FIRST REQUESTS */

			if(app.page == 'roulette' && data.roulette !== undefined){
				if(data.roulette.fair.id !== undefined) {
					$('#roulette_fair_id').val(data.roulette.fair.id);
					$('#roulette_fair_id').attr('data-default', data.roulette.fair.id);
				}

				if(data.roulette.fair.public_seed !== undefined) {
					$('#roulette_fair_public_seed').val(data.roulette.fair.public_seed);
					$('#roulette_fair_public_seed').attr('data-default', data.roulette.fair.public_seed);
				}

				$('#roulette_hundred_box_red').replaceWith(rouletteHundredHistory({ color: 'red', count: data.roulette.hundred.red }));
				$('#roulette_hundred_box_green').replaceWith(rouletteHundredHistory({ color: 'green', count: data.roulette.hundred.green }));
				$('#roulette_hundred_box_black').replaceWith(rouletteHundredHistory({ color: 'black', count: data.roulette.hundred.black }));
				$('#roulette_hundred_box_bait').replaceWith(rouletteHundredHistory({ color: 'bait', count: data.roulette.hundred.bait }));

				$('#roulette_rolls').empty();
				data.roulette.history.forEach(function(item){
					rouletteGame_addHistory(item);
				});

				$('#roulette_case').replaceWith(rouletteSpinner());
				initializingSpinner_Roulette(data.roulette.last);

				$('#roulette_case').resizeObserver(function() {
					initializingSpinner_Roulette();
				});

				$('.roulette-betslist').empty();
				data.roulette.bets.forEach(function(item){
					rouletteGame_addBet(item);
				});

				[ 'red', 'green', 'black', 'bait' ].forEach(function(item){
					$('#roulette_panel_' + item + ' .roulette-betstotal').replaceWith(rouletteTotalBets({ count: data.roulette.totals[item].count, amount: getFormatAmountString(data.roulette.totals[item].amount) }));
				});

				$('#roulette_jackpot').replaceWith(rouletteJackpot({ greens: data.roulette.jackpot.greens, amount: getFormatAmountString(data.roulette.jackpot.total) }));
			}

			if(app.page == 'crash' && data.crash !== undefined){
				$('#crash_graph').replaceWith(crashGraph());

				crashGame_initializeGraph();

				if(data.crash.fair.id !== undefined) {
					$('#crash_fair_id').val(data.crash.fair.id);
					$('#crash_fair_id').attr('data-default', data.crash.fair.id);
				}

				if(data.crash.fair.public_seed !== undefined) {
					$('#crash_fair_public_seed').val(data.crash.fair.public_seed);
					$('#crash_fair_public_seed').attr('data-default', data.crash.fair.public_seed);
				}

				$('#crash_history').empty();

				data.crash.history.forEach(function(crash){
					crashGame_addHistory(crash);
				});

				if(data.crash.bets.length > 0){
					$('#crash_betlist').empty();

					data.crash.bets.forEach(function(bet){
						crashGame_addGame(bet);
					});
				} else {
					$('#crash_betlist').html(emptyTable({
						title: 'No active bets'
					}));
				}

			}

			if(app.page == 'jackpot' && data.jackpot !== undefined){
				$('#jackpot_case').replaceWith(jackpotCase());

				idleAnimationSpinner_Jackpot();

				$('#jackpot_case').resizeObserver(function() {
					initializingSpinner_Jackpot();
				});

				$('#jackpot_field').empty();

				if(data.jackpot.avatars.length > 0){
					for(var i = 0; i < 2; i++){
						data.jackpot.avatars.forEach(function(item){
							var DIV = '<div class="reel-item flex justify-center items-center"><img class="size-full" src="' + item + '"></div>';

							$('#jackpot_field').append(DIV);
						});
					}
				} else {
					for(var i = 0; i < 50; i++){
						var DIV = '<div class="reel-item flex justify-center items-center"><img class="size-full" src="/img/jackpot/avatar.jpg"></div>';

						$('#jackpot_field').append(DIV);
					}
				}

				idleSpinner_Jackpot = true;

				if(data.jackpot.bets.length > 0){
					$('#jackpot_betlist').empty();

					data.jackpot.bets.forEach(function(bet){
						jackpotGame_addBet(bet);
					});
				} else {
					$('#jackpot_betlist').html(emptyState({
						title: 'No active bets'
					}));
				}

				$('#jackpot_total').countToFloat(data.jackpot.total);
				$('#jackpot_mychange').countToFloat(data.jackpot.chance);

				$('#jackpot_histories').empty();

				data.jackpot.history.forEach(function(history){
					jackpotGame_addHistory(history);
				});

				$('#fair_jackpot_results').attr('data-fair', JSON.stringify(data.jackpot.fair));
			}

			if(app.page == 'coinflip' && data.coinflip !== undefined){
				$('#coinflip_betlist').empty();
				for(var i = 0; i < 5; i++){
					$('#coinflip_betlist').append('<div class="coinflip-game bg-secondary rounded-2 border-2 border-card"></div>');
				}

				data.coinflip.bets.forEach(function(bet){
					coinflipGame_addCoinFlip(bet);
					if(bet.status > 0) coinflipGame_editCoinFlip(bet);
				});
			}

			if(app.page == 'dice' && data.dice !== undefined){
				$('#dice_chanceslider').val(((100 - games_houseEdges.dice) / 2).toFixed(2));
				diceGame_checkChanceSlider();
			}

			if(app.page == 'minesweeper' && data.minesweeper !== undefined){
				$('#minesweeper_bombs .item').removeClass('danger').removeClass('success').addClass('disabled');
				$('#minesweeper_bombs .item .multiplier').text('');

				$('#minesweeper_bet').removeClass('hidden').removeClass('disabled');
				$('#minesweeper_cashout').addClass('hidden');

				$('.bet-cashout').addClass('disabled');

				if(data.minesweeper.game){
					$('#minesweeper_bombs .item').removeClass('disabled');

					$('#minesweeper_bet').addClass('hidden');
					$('#minesweeper_cashout').removeClass('hidden').removeClass('disabled');

					$('#bombsamount_minesweeper').closest('.input_field').addClass('disabled');
					$('.minesweeper-bombsamount').addClass('disabled');

					$('.bet-cashout').removeClass('disabled');

					$('#minesweeper_cashout_amount').countToFloat(data.minesweeper.game.total);
					$('#minesweeper_cashout_profit').countToProfit(data.minesweeper.game.profit);

					data.minesweeper.game.route.forEach(function(button, stage){
						$('#minesweeper_bombs .item[data-bomb="' + button + '"]').addClass('success');
						$('#minesweeper_bombs .item[data-bomb="' + button + '"] .multiplier').text('x' + data.minesweeper.game.multipliers[stage].toFixed(2));
					});
				}
			}

			if(app.page == 'tower' && data.tower !== undefined){
				$('#tower_grid .item').removeClass('danger').removeClass('success').removeClass('checked');
				$('#tower_grid .item').addClass('disabled');

				$('#tower_bet').removeClass('hidden');
				$('#tower_cashout').addClass('hidden');

				$('.bet-cashout').addClass('disabled');

				towerGame_multipliers = data.tower.multipliers;

				if(data.tower.game){
					towerGame_difficulty = data.tower.game.difficulty;

					$('#tower_difficulty').closest('.dropdown_field').addClass('disabled');
				}

				towerGame_generateTiles();

				if(data.tower.game){
					$('#tower_bet').addClass('hidden');
					$('#tower_cashout').removeClass('hidden').removeClass('disabled');

					$('#tower_difficulty').closest('.dropdown_field').addClass('disabled');

					$('.bet-cashout').removeClass('disabled');

					$('#tower_cashout_amount').countToFloat(data.tower.game.total);
					$('#tower_cashout_profit').countToProfit(data.tower.game.profit);

					data.tower.game.route.forEach(function(button, stage){
						$('#tower_grid .item[data-stage="' + stage + '"][data-button="' + button + '"]').addClass('success').removeClass('disabled');
						$('#tower_grid .item[data-stage="' + stage + '"]:not(.success)').addClass('checked').removeClass('disabled');
					});

					$('#tower_grid .item[data-stage="' + data.tower.game.route.length + '"]').removeClass('disabled');

					towerGame_generateAmounts(data.tower.game.amount);
				} else towerGame_generateAmounts(0.01);
			}

			if(app.page == 'plinko' && data.plinko !== undefined){
				plinkoGame_multipliers = data.plinko.multipliers;

				plinkoGame_generateRows();
				plinkoGame_generateMultipliers();
			}

			if(app.page == 'casino' && data.casino !== undefined){

			}

			if(app.page == 'deposit' || app.page == 'withdraw'){
				if(app.paths[1] == 'crypto'){
					offers_currencyAmounts = data.offers.crypto.amounts;
					offers_currencyFees = data.offers.crypto.fees;

					if(app.paths.length > 1) $('.crypto-panel [data-conversion="from"]').trigger('input');
				}

			}
		}
	}
}

function socket_handler(type, method, data) {
	if(type == 'site'){
		if(method == 'online'){
			Object.keys(data.online).forEach(function(item){
				$('.online[data-channel="' + item + '"]').text(data.online[item]);
			});
		} else if(method == 'notify'){

		} else if(method == 'reload'){
			location.reload();
		} else if(method == 'refresh'){
			//site_refresh();
		}
	} else

	if(type == 'message'){
		if(method == 'info'){
			notify('info', data.message);
		} else if(method == 'success'){
			notify('success', data.message);
		} else if(method == 'error'){

            if(app.page == 'casino' && app.paths.length > 2){
				$('#casino_game').addClass('active');
				$('#casino_game_frame').html('<div class="flex flex-1 items-center justify-center size-full text-center text-xl p-4">' + data.message + '</div>');
			} else

            notify('error', data.message);

            switch(app.page){
                case 'roulette':
				    $('.roulette-bet.disabled').removeClass('disabled');

                    break;

                case 'crash':
                    $('#crash_bet.disabled').removeClass('disabled');
                    $('#crash_cashout.disabled').removeClass('disabled');

                    break;

                case 'jackpot':
				    $('#jackpot_bet.disabled').removeClass('disabled');

                    break;

                case 'coinflip':
                    $('#coinflip_create.disabled').removeClass('disabled');
                    $('.coinflip-join.disabled').removeClass('disabled');

                    break;

                case 'dice':
                    $('#dice_bet.disabled').removeClass('disabled');
                    $('#dice_chanceslider').removeClass('disabled');
                    $('.dice-mode').removeClass('disabled');

                    break;

                case 'minesweeper':
                    $('#minesweeper_bet.disabled').removeClass('disabled');
                    $('#minesweeper_cashout.disabled').removeClass('disabled');

                    break;

                case 'tower':
                    $('#tower_bet.disabled').removeClass('disabled');
                    $('#tower_cashout.disabled').removeClass('disabled');

                    break;

                case 'plinko':
				    $('#plinko_bet.disabled').removeClass('disabled');

                    break;
            }

			sounds_play('error');
		}
	} else

	if(type == 'user'){
		if(method == 'balance'){
            if(data.balance.balance != BALANCES[data.balance.type]){
                $('.balances .list > .balance[data-type="' + data.balance.type + '"]').attr('data-balance', getFormatAmountString(data.balance.balance));
                $('.balances .list > .balance[data-type="' + data.balance.type + '"] .amount').countToBalance(data.balance.balance);

                if(data.balance.type == profile_settingsGet('balance')) $('.balances > .balance[data-type="total"] .amount').countToBalance(data.balance.balance);

                BALANCES[data.balance.type] = data.balance.balance;
            }
		} else if(method == 'level'){
			$('#level_count').text(data.level.level);
			$('#level_bar').css('width', roundedToFixed((data.level.have - data.level.start) / (data.level.next - data.level.start) * 100, 2).toFixed(2) + '%');
		}
	} else

	if(type == 'account' && app.page == 'account'){
		if(method == 'remove_session'){
			$('#my_devices > .table-row[data-session="' + data.session + '"]').remove();

			if($('#my_devices > .table-row').length <= 0) {
				$('#my_devices').html(emptyTable({
					title: 'No data found'
				}));
			}
		} else if(method == 'email_verification'){
            $('#modal_twofa_email_verification').modal('show');
        } else if(method == 'authenticator_app'){
            $('#authenticator_app_secret').text(data.secret);
            $('#authenticator_app_secret_copy').attr('data-text', data.secret);

            $('#authenticator_app_qrcode').empty();

            var qrcode = new QRCode($('#authenticator_app_qrcode')[0], {
                text: data.url,
                width: 192,
                height: 192
            });

            $('#modal_twofa_authenticator_app').modal('show');
        } else if(method == 'authenticator_app_codes'){
            $('#authenticator_app_codes').empty();
            data.codes.forEach(function(item){
                if(item.used) $('#authenticator_app_codes').append('<div class="bg-card bg-opacity-50 rounded-2 p-2 text-center disabled">' + item.code + '</div>');
                else $('#authenticator_app_codes').append('<div class="bg-card bg-opacity-50 rounded-2 p-2 text-center">' + item.code + '</div>');
            });

            $('#authenticator_app_codes_copy').attr('data-text', data.codes.map(a => a.code).join('\n'));
            $('#authenticator_app_codes_download').attr('data-text', data.codes.map(a => a.code).join('\n'));

            $('#modal_twofa_authenticator_app_codes').modal('show');
        } else if(method == 'enable_twofa_method'){
            $('.account-security .security-method[data-method="' + data.method + '"]').addClass('enabled');

            $('#modal_twofa_email_verification').modal('hide');
            $('#modal_twofa_authenticator_app').modal('hide');
        } else if(method == 'disable_twofa_method'){
            $('.account-security .security-method[data-method="' + data.method + '"]').removeClass('enabled').removeClass('primary');
        } else if(method == 'primary_twofa_method'){
            $('.account-security .security-method').removeClass('primary');
            $('.account-security .security-method[data-method="' + data.method + '"]').addClass('primary');
        }
	} else

	if(type == 'modal'){
		if(method == 'insufficient_balance'){
			$('#modal_error_insufficient_balance .amount').text(getFormatAmountString(data.amount));

			$('#modal_error_insufficient_balance').modal('show');
		} else if(method == 'withdraw_rollover'){
            $('#modal_error_withdraw_rollover .amount').text(getFormatAmountString(data.amount));

			$('#modal_error_withdraw_rollover').modal('show');
		} else if(method == 'auth'){
			$('#modal_error_auth').modal('show');
		} else

        if(method == 'command_online'){
			if(data.list.length > 0){
				$('#online_list').empty();

				data.list.sort((a, b) => (a.user.level - b.user.level) || (a.user.rank - b.user.rank)).forEach(function(item){
					var DIV = '<div class="flex justify-center items-center size-full">';
						DIV += '<a href="/user/' + item.user.userid + '" target="_blank">' + createAvatarField(item.user, 'size-10', '', '') + '</a>';
					DIV += '</div>';

					$('#online_list').prepend(DIV);
				});
			} else {
				$('#online_list').html(emptyState({
					title: 'No players online'
				}));
			}

			$('#modal_command_online').modal('show');
		} else if(method == 'command_help'){
			if(data.commands.length > 0) {
				$('#chat_commands').empty();

				data.commands.forEach(function(item){
					var name = item.command;
					if(item.arguments.length > 0) name += ' ' + item.arguments.join(' ').replaceAll('<', '&lt').replaceAll('>', '&gt');

					var DIV = '<div class="acordeon-item transition duration-200">';
						DIV += '<div class="acordeon-trigger text-base tracking-wider p-4 pointer">/' + name + '</div>';

						DIV += '<div class="acordeon-content transition duration-200 overflow-hidden px-4">';
							DIV += '<div class="flex flex-col gap-2 pb-4">';
								item.help.forEach(function(help){
									DIV += '<div>' + help.replaceAll('<', '&lt').replaceAll('>', '&gt') + '</div>';
								});
							DIV += '</div>';
						DIV += '</div>';
					DIV += '</div>';

					$('#chat_commands').append(DIV);
				});
			} else {
				$('#chat_commands').html(emptyState({
					title: 'No commands available'
				}));
			}

			$('#modal_command_help').modal('show');
		} else if(method == 'command_tip'){
			$('#tip_player_avatar').html(createAvatarField(data.user, 'size-8', '', ''));
			$('#tip_player_name').text(data.user.name);
			$('#send_tip_player').attr('data-userid', data.user.userid);

			$('#modal_command_tip').modal('show');
		} else if(method == 'command_mute'){
			$('#mute_player_avatar').html(createAvatarField(data.user, 'size-8', '', ''));
			$('#mute_player_name').text(data.user.name);
			$('#mute_player_set').attr('data-userid', data.user.userid);
			$('#mute_player_permanently').attr('data-userid', data.user.userid);

			$('#modal_command_mute').modal('show');
		} else if(method == 'command_ignore_list'){
			if(data.list.length > 0){
				$('#chat_ignore_list').empty();

				data.list.forEach(function(item){
					$('#chat_ignore_list').append(chatIgnoreUser(item));
				});
			} else {
				$('#chat_ignore_list').html(emptyState({
					title: 'No ignored players'
				}));
			}

			$('#modal_command_ignore_list').modal('show');
		}
	} else

	if(type == 'chat'){
		if(method == 'message'){
			chat_message(data.message);
		} else if(method == 'messages'){
			$('#chat-area').empty();

			data.messages.forEach(function(message){
				chat_message(message);
			});
		} else if(method == 'delete'){
			$('.chat-message[data-message="' + data.id + '"]').remove();
		} else if(method == 'ignorelist'){
			chat_ignoreList = data.list;

			$('#chat_ignore_list .item').each(function(i, e){
				if(!chat_ignoreList.includes($(this).attr('data-userid'))) $(this).remove();
			});

			if($('#chat_ignore_list .item').length <= 0) {
				$('#chat_ignore_list').html(emptyState({
					title: 'No ignored players'
				}));
			}
		} else if(method == 'clean'){
			$('#chat-area').empty();
		} else if(method == 'channel'){
			$('#chat-area').empty();

			profile_settingsChange('channel', data.channel);

			data.messages.forEach(function(message){
				chat_message(message);
			});
		} else if(method == 'commands'){
			$('#chat-area .chat-message[data-message="' + data.id + '"] .overflow-menu .overflow-menu-select .overflow-menu-popover').replaceWith(overflowMenuPopover({
				items: [
					...!data.status.private ? [
						{
							link: true,
							destructive: false,
							label: 'View Profile',
							icon: 'user',
							href: '/user/' + data.user.userid
						}
					] : [],
					{
                        link: false,
                        destructive: false,
                        label: 'Mention',
                        icon: 'bell',
                        className: 'chat_write_command',
                        attributes: [
                            { name: 'data-command', value: '@' + data.user.userid }
                        ]
                    },
					{
                        link: false,
                        destructive: false,
                        label: 'Reply Message',
                        icon: 'reply',
                        className: 'chat_reply_message',
                        attributes: [
                            { name: 'data-reply', value: JSON.stringify({ id: data.id, message: data.message, user: data.user }) }
                        ]
                    },
					...data.commands.some(a => a == 'tip') ? [
						{
							link: false,
							destructive: false,
							label: 'Tip Player',
							icon: 'gift',
							className: 'chat_send_command',
							attributes: [
								{ name: 'data-command', value: '/tip ' + data.user.userid }
							]
						}
					] : [],
					...data.commands.some(a => a == 'ignore') ? [
						{
							link: false,
							destructive: false,
							label: data.status.ignored ? 'Unignore Player' : 'Ignore Player',
							icon: data.status.ignored ? 'eye' : 'eye-off',
							className: 'chat_send_command',
							attributes: [
								{ name: 'data-command', value: (data.status.ignored ? '/unignore ' : '/ignore ') + data.user.userid }
							]
						}
					] : [],
					...data.commands.some(a => a == 'mute') ? [
						{
							link: false,
							destructive: false,
							label: data.status.muted ? 'Unute Player' : 'Mute Player',
							icon: data.status.muted ? 'volume-up' : 'volume-off',
							className: 'chat_send_command',
							attributes: [
								{ name: 'data-command', value: (data.status.muted ? '/unmute ' : '/mute ') + data.user.userid }
							]
						}
					] : [],
					...data.commands.some(a => a == 'pinmessage') ? [
						{
							link: false,
							destructive: false,
							label: 'Pin Message',
							icon: 'flag',
							className: 'chat_send_command',
							attributes: [
								{ name: 'data-command', value: '/pinmessage ' + data.id }
							]
						}
					] : [],
					...data.commands.some(a => a == 'deletemessage') ? [
						{
							link: false,
							destructive: true,
							label: 'Delete Message',
							icon: 'trash',
							className: 'chat_send_command',
							attributes: [
								{ name: 'data-command', value: '/deletemessage ' + data.id }
							]
						}
					] : []
				]
			}));
		}
	} else

	if(type == 'rain'){
		if(method == 'started'){
			$('#chat_rain').removeClass('waiting').addClass('started');

			$('#chat_rain .started .amount').text(getFormatAmountString(data.amount));

			if(data.joined) {
				$('#chat_rain_join').addClass('hidden');
				$('#chat_rain_joined').removeClass('hidden');
			} else {
				$('#chat_rain_joined').addClass('hidden');
				$('#chat_rain_join').removeClass('hidden');
			}

			if(chat_rainLastElapsed != null) {
				clearInterval(chat_rainLastElapsed);

				chat_rainLastElapsed = null;
			}

			$('#chat_rain_progress').animate({
				'width': '0'
			}, {
				'duration': data.time * 1000,
				'easing': 'linear',
				'progress': function(animation, progress, remaining) {
					var las = remaining / 1000 * 100 / data.cooldown;

					$('#chat_rain_progress').css('width', las + '%');
				}
			});

			$('#chat_rain_tip').addClass('disabled');
		} else if(method == 'waiting'){
			$('#chat_rain').removeClass('started').addClass('waiting');

			if(chat_rainLastElapsed != null) {
				clearInterval(chat_rainLastElapsed);

				chat_rainLastElapsed = null;
			}

			if(data.last != null) {
				$('#chat_rain .waiting .description').removeClass('hidden');
				$('#chat_rain_first').addClass('hidden');

				$('#chat_rain_last').text(Math.floor((time() - data.last) / 60) + ' minutes ago');

				var elapsed = data.last + 1;

				chat_rainLastElapsed = setInterval(function(){
					$('#chat_rain_last').text(Math.floor((time() - elapsed) / 60) + ' minutes ago');

					elapsed++;
				}, 1000);
			} else {
				$('#chat_rain .waiting .description').addClass('hidden');
				$('#chat_rain_first').removeClass('hidden');
			}

			$('#chat_rain .waiting .amount').countToFloat(data.amount);

			$('#chat_rain_progress').finish();

			$('#chat_rain_tip').removeClass('disabled');
		} else if(method == 'joined'){
			$('#chat_rain_join').addClass('hidden');
			$('#chat_rain_joined').removeClass('hidden');
		} else if(method == 'amount'){
			$('#chat_rain .waiting .amount').countToFloat(data.amount);
		}
	} else

	if(type == 'affiliates' && app.page == 'affiliates'){
		if(method == 'overview'){
            $('.affiliates-chart .affiliates-loader').addClass('hidden');

            affiliates_updateGraph(data);
		}
	} else

	if(type == 'pagination'){
		if(method == 'admin_users'){
			pagination_addUsers(data.list);

			$('#pagination_admin_users').replaceWith(pageNavigator({
				id: 'pagination_admin_users',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'admin_crypto_confirmations'){
			pagination_addCryptoConfirmations(data.list);

			$('#pagination_admin_crypto_confirmations').replaceWith(pageNavigator({
				id: 'pagination_admin_crypto_confirmations',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'admin_tracking_links'){
			pagination_addTrackingLinks(data.list);

			$('#pagination_admin_tracking_links').replaceWith(pageNavigator({
				id: 'pagination_admin_tracking_links',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'admin_deposit_bonuses'){
			pagination_addDepositBonuses(data.list);

			$('#pagination_admin_deposit_bonuses').replaceWith(pageNavigator({
				id: 'pagination_admin_deposit_bonuses',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'account_transactions'){
			pagination_addAccountTransactions(data.list);

			$('#pagination_account_transactions').replaceWith(pageNavigator({
				id: 'pagination_account_transactions',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'account_deposits'){
			pagination_addAccountDeposits(data.list);

			$('#pagination_account_deposits').replaceWith(pageNavigator({
				id: 'pagination_account_deposits',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'account_withdrawals'){
			pagination_addAccountWithdrawals(data.list);

			$('#pagination_account_withdrawals').replaceWith(pageNavigator({
				id: 'pagination_account_withdrawals',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_roulette_history'){
			pagination_addAccountRouletteHistory(data.list);

			$('#pagination_account_roulette_history').replaceWith(pageNavigator({
				id: 'pagination_account_roulette_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_crash_history'){
			pagination_addAccountCrashHistory(data.list);

			$('#pagination_account_crash_history').replaceWith(pageNavigator({
				id: 'pagination_account_crash_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_jackpot_history'){
			pagination_addAccountJackpotHistory(data.list);

			$('#pagination_account_jackpot_history').replaceWith(pageNavigator({
				id: 'pagination_account_jackpot_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_coinflip_history'){
			pagination_addAccountCoinflipHistory(data.list);

			$('#pagination_account_coinflip_history').replaceWith(pageNavigator({
				id: 'pagination_account_coinflip_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_dice_history'){
			pagination_addAccountDiceHistory(data.list);

			$('#pagination_account_dice_history').replaceWith(pageNavigator({
				id: 'pagination_account_dice_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_tower_history'){
			pagination_addAccountTowerHistory(data.list);

			$('#pagination_account_tower_history').replaceWith(pageNavigator({
				id: 'pagination_account_tower_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_minesweeper_history'){
			pagination_addAccountMinesweeperHistory(data.list);

			$('#pagination_account_minesweeper_history').replaceWith(pageNavigator({
				id: 'pagination_account_minesweeper_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_plinko_history'){
			pagination_addAccountPlinkoHistory(data.list);

			$('#pagination_account_plinko_history').replaceWith(pageNavigator({
				id: 'pagination_account_plinko_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'account_casino_history'){
			pagination_addAccountCasinoHistory(data.list);

			$('#pagination_account_casino_history').replaceWith(pageNavigator({
				id: 'pagination_account_casino_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_transactions'){
			pagination_addUserTransactions(data.list);

			$('#pagination_user_transactions').replaceWith(pageNavigator({
				id: 'pagination_user_transactions',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'user_deposits'){
			pagination_addUserDeposits(data.list);

			$('#pagination_user_deposits').replaceWith(pageNavigator({
				id: 'pagination_user_deposits',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'user_withdrawals'){
			pagination_addUserWithdrawals(data.list);

			$('#pagination_user_withdrawals').replaceWith(pageNavigator({
				id: 'pagination_user_withdrawals',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_roulette_history'){
			pagination_addUserRouletteHistory(data.list);

			$('#pagination_user_roulette_history').replaceWith(pageNavigator({
				id: 'pagination_user_roulette_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_crash_history'){
			pagination_addUserCrashHistory(data.list);

			$('#pagination_user_crash_history').replaceWith(pageNavigator({
				id: 'pagination_user_crash_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_jackpot_history'){
			pagination_addUserJackpotHistory(data.list);

			$('#pagination_user_jackpot_history').replaceWith(pageNavigator({
				id: 'pagination_user_jackpot_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_coinflip_history'){
			pagination_addUserCoinflipHistory(data.list);

			$('#pagination_user_coinflip_history').replaceWith(pageNavigator({
				id: 'pagination_user_coinflip_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_dice_history'){
			pagination_addUserDiceHistory(data.list);

			$('#pagination_user_dice_history').replaceWith(pageNavigator({
				id: 'pagination_user_dice_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_tower_history'){
			pagination_addUserTowerHistory(data.list);

			$('#pagination_user_tower_history').replaceWith(pageNavigator({
				id: 'pagination_user_tower_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_minesweeper_history'){
			pagination_addUserMinesweeperHistory(data.list);

			$('#pagination_user_minesweeper_history').replaceWith(pageNavigator({
				id: 'pagination_user_minesweeper_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_plinko_history'){
			pagination_addUserPlinkoHistory(data.list);

			$('#pagination_user_plinko_history').replaceWith(pageNavigator({
				id: 'pagination_user_plinko_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'user_casino_history'){
			pagination_addUserCasinoHistory(data.list);

			$('#pagination_user_casino_history').replaceWith(pageNavigator({
				id: 'pagination_user_casino_history',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'affiliates_referred_users'){
			pagination_addAffiliatesReferredUsers(data.list);

			$('#pagination_affiliates_referred_users').replaceWith(pageNavigator({
				id: 'pagination_affiliates_referred_users',
				page: data.page,
				pages: data.pages
			}));
		} else

		if(method == 'admin_items'){
			pagination_addAdminItems(data.list);

			$('#pagination_admin_items').replaceWith(pageStepper({
				id: 'pagination_admin_items',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'admin_gamebots'){
			pagination_addGamebots(data.list);

			$('#pagination_admin_gamebots').replaceWith(pageNavigator({
				id: 'pagination_admin_gamebots',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'casino_slots_games'){
			pagination_addCasinoSlotsGames(data.list);

            $('#casino_slots_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').html('<div class="field_element_dropdown active" value="all" data-index="0">All Providers</div>');

            data.providers.forEach(function(item, index){
                $('#casino_slots_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').append('<div class="field_element_dropdown" value="' + item.id + '" data-index="' + (index + 1) + '">' + item.name + '</div>');
            });

			$('#pagination_casino_slots_games').replaceWith(pageStepper({
				id: 'pagination_casino_slots_games',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'casino_live_games'){
			pagination_addCasinoLiveGames(data.list);

            $('#casino_live_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').html('<div class="field_element_dropdown active" value="all" data-index="0">All Providers</div>');

            data.providers.forEach(function(item, index){
                $('#casino_live_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').append('<div class="field_element_dropdown" value="' + item.id + '" data-index="' + (index + 1) + '">' + item.name + '</div>');
            });

			$('#pagination_casino_live_games').replaceWith(pageStepper({
				id: 'pagination_casino_live_games',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'casino_recent_games'){
			pagination_addCasinoRecentGames(data.list);

            $('#casino_recent_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').html('<div class="field_element_dropdown active" value="all" data-index="0">All Providers</div>');
            data.providers.forEach(function(item, index){
                $('#casino_recent_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').append('<div class="field_element_dropdown" value="' + item.id + '" data-index="' + (index + 1) + '">' + item.name + '</div>');
            });

			$('#pagination_casino_recent_games').replaceWith(pageStepper({
				id: 'pagination_casino_recent_games',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'casino_favorites_games'){
			pagination_addCasinoFavoritesGames(data.list);

            $('#casino_favorites_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').html('<div class="field_element_dropdown active" value="all" data-index="0">All Providers</div>');
            data.providers.forEach(function(item, index){
                $('#casino_favorites_games_provider').closest('.dropdown_field').find('.field_element_dropdowns').append('<div class="field_element_dropdown" value="' + item.id + '" data-index="' + (index + 1) + '">' + item.name + '</div>');
            });

			$('#pagination_casino_favorites_games').replaceWith(pageStepper({
				id: 'pagination_casino_favorites_games',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'casino_all_games'){
			pagination_addCasinoAllGames(data.list);

			$('#pagination_casino_all_games').replaceWith(pageStepper({
				id: 'pagination_casino_all_games',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'casino_providers'){
			pagination_addCasinoProviders(data.list);

			$('#pagination_casino_providers').replaceWith(pageStepper({
				id: 'pagination_casino_providers',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'casino_providers_provider_games'){
			pagination_addCasinoProvidersProviderGames(data.list);

			$('#pagination_casino_providers_provider_games').replaceWith(pageStepper({
				id: 'pagination_casino_providers_provider_games',
				page: data.page,
				pages: data.pages
			}));
		} else

        if(method == 'admin_bonus_codes'){
			pagination_addAdminBonusCodes(data.list);

			$('#pagination_admin_bonus_codes').replaceWith(pageNavigator({
				id: 'pagination_admin_bonus_codes',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'admin_referrals'){
			pagination_addAdminReferrals(data.list);

			$('#pagination_admin_referrals').replaceWith(pageNavigator({
				id: 'pagination_admin_referrals',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'admin_referred_users'){
			pagination_addAdminReferredUsers(data.list);

			$('#pagination_admin_referred_users').replaceWith(pageNavigator({
				id: 'pagination_admin_referred_users',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'support_requests'){
			pagination_addSupportRequests(data.list);

			$('#pagination_support_requests').replaceWith(pageNavigator({
				id: 'pagination_support_requests',
				page: data.page,
				pages: data.pages
			}));
		} else if(method == 'admin_support_requests'){
			pagination_addAdminSupportRequests(data.list);

			$('#pagination_admin_support_requests').replaceWith(pageNavigator({
				id: 'pagination_admin_support_requests',
				page: data.page,
				pages: data.pages
			}));
		}
	} else

	if(type == 'dashboard'){
		if(method == 'graph'){
            var graph = data.graph.split('.')[0];

            $('#dashboard_chart_' + graph).closest('.dashboard-chart').find('.dashboard-loader').addClass('hidden');

            dashboard_updateGraph(data.data, graph);
		} else if(method == 'stats'){
			$('.dashboard-stats[data-stats="' + data.stats + '"] .stats').text(data.data);
		}
	} else

	if(type == 'admin'){
        if(method == 'support_claim'){
            admin_supportSetStatus(data.closed, data.status);

            $('#admin_support_request_actions').removeClass('opened').addClass('claimed');
        } else if(method == 'support_release'){
            admin_supportSetStatus(data.closed, data.status);

            $('#admin_support_request_actions').removeClass('claimed').addClass('opened');
        } else if(method == 'support_close'){
            admin_supportSetStatus(data.closed, data.status);

            $('#admin_support_request_actions').removeClass('opened').removeClass('claimed').addClass('closed');

            $('#admin_support_request_updated').text(data.date);
        } else if(method == 'support_department'){
            $('#admin_support_request_department').text({ 0: 'General / Others', 1: 'Bug report', 2: 'Trade offer issue', 3: 'Improvements / Ideas', 4: 'Marketing / Partnership', 5: 'Ranking up' }[data.department]);

            $('#admin_support_request_updated').text(data.date);
        } else if(method == 'support_reply'){
            admin_supportAddReply(data);
            admin_supportSetStatus(data.closed, data.status);

            $('#admin_support_request_updated').text(data.date);
        } else if(method == 'settings_apply'){
			var $input = $('.admin_switch_settings[data-settings="' + data.settings + '"]');

			var status = $input.prop('checked');

			$input.prop('checked', !status);
		}

    } else

    if(type == 'support'){
        if(method == 'redirect'){
			window.location.href = '/support/requests/' + data.id;
		} else if(method == 'department'){
            $('#support_request_department').text({ 0: 'General / Others', 1: 'Bug report', 2: 'Trade offer issue', 3: 'Improvements / Ideas', 4: 'Marketing / Partnership', 5: 'Ranking up' }[data.department]);

            $('#support_request_updated').text(data.date);
        } else if(method == 'reply'){
            support_addReply(data);
            support_setStatus(data.closed, data.status);

            $('#support_request_updated').text(data.date);
        } else if(method == 'close'){
            support_setStatus(data.closed, data.status);

            $('#support_request_actions').removeClass('opened').addClass('closed');

            $('#support_request_updated').text(data.date);
        }
    } else

    if(type == 'roulette' && app.page == 'roulette'){
		if(method == 'timer'){
			rouletteGame_timer(data.time, data.cooldown);
		} else if(method == 'bet'){
			rouletteGame_addBet(data.bet);
		} else if(method == 'total'){
			$('#roulette_panel_' + data.color + ' .roulette-betstotal .amount').text(getFormatAmountString(data.total.amount));
		    $('#roulette_panel_' + data.color + ' .roulette-betstotal .count').text(data.total.count);
		} else if(method == 'hundred'){
			$('#roulette_hundred_red').text(data.red);
            $('#roulette_hundred_green').text(data.green);
            $('#roulette_hundred_black').text(data.black);
            $('#roulette_hundred_bait').text(data.bait);
		} else if(method == 'bet_confirmed'){
			notify('success', 'Your bet has been placed!');

			$('.roulette-bet').removeClass('disabled');

			sounds_play('play');
		} else if(method == 'roll'){
			$('.roulette-bet').addClass('disabled');

			$('#roulette_counter').finish();

			sounds_play('roulette_rolling');
			startSpinner_Roulette(data.roll, data.greens, data.cooldown);
		} else if(method == 'fair'){
			if(data.id !== undefined) {
                $('#roulette_fair_id').val(data.id);
                $('#roulette_fair_id').attr('data-default', data.id);
            }

			if(data.public_seed !== undefined) {
                $('#roulette_fair_public_seed').val(data.public_seed);
                $('#roulette_fair_public_seed').attr('data-default', data.public_seed);
            }

			$('#roulette_counter').finish().css('width', '100%');
		} else if(method == 'jackpot'){
			if(data.method == 'total'){
				$('#roulette_jackpot_total').countToFloat(data.total);
			} else if(data.method == 'greens'){
				$('#roulette_jackpot_greens .item').removeClass('active');
				for(var i = 1; i <= data.greens; i++) $('#roulette_jackpot_greens .item[data-green="' + i + '"]').addClass('active');
			} else if(data.method == 'history'){
				if(data.history.length > 0) {
					$('#roulette_jackpot_history').empty();

					data.history.forEach(function(item){
						$('#roulette_jackpot_history').append(tableRouletteJackpotHistoryRow(item));
					});
				} else {
					$('#roulette_jackpot_history').html(emptyTable({
						title: 'No data found'
					}));
				}

				$('#modal_roulette_jackpot').modal('show');
			} else if(data.method == 'winners'){
				if(data.winners.length > 0) {
					$('#roulette_jackpot_winners').empty();

					data.winners.forEach(function(item){
						$('#roulette_jackpot_winners').append(tableRouletteJackpotWinnersRow(item));
					});
				} else {
					$('#roulette_jackpot_winners').html(emptyTable({
						title: 'No data found'
					}));
				}

				$('#modal_roulette_jackpot_winners').modal('show');
			}
		}
	} else

    if(type == 'crash' && app.page == 'crash'){
		if(method == 'starting'){
			$('.crash-graph').removeClass('crashed');
			$('.crash-graph').removeClass('progress');
			$('.crash-graph').addClass('starting');

			crash_settings.stage = 'starting';

			var time_crash = data.time;
			var int_crash = setInterval(function(){
				if(time_crash < 0){
					clearInterval(int_crash);
				} else {
					$('#crash_timer').text(roundedToFixed(time_crash / 1000, 2).toFixed(2));

					time_crash -= 10;
				}
			}, 10);

			$('#crash_bet').removeClass('hidden').removeClass('disabled');
			$('#crash_cashout').addClass('hidden');

			$('.bet-cashout').addClass('disabled');

			$('#crash_cashout_amount').countToFloat(data.total);
			$('#crash_cashout_profit').countToProfit(data.profit);
		} else if(method == 'started'){
			$('.crash-graph').removeClass('starting');
			$('.crash-graph').removeClass('progress');
			$('.crash-graph').addClass('progress');

			crash_settings.stage = 'progress';
			crash_settings.start_time = new Date().getTime();
			crash_settings.difference_time = data.difference;

			$('#crash_bet').removeClass('hidden').addClass('disabled');
			$('#crash_cashout').addClass('hidden');

			$('.bet-cashout').addClass('disabled');
		} else if(method == 'crashed'){
			$('.crash-graph').removeClass('progress');
			$('.crash-graph').removeClass('starting');
			$('.crash-graph').addClass('crashed');

			crash_settings.current_progress_time = data.time;
			crash_settings.stage = 'crashed';

			$('#crash_crash').text(roundedToFixed(data.number / 100, 2).toFixed(2))

			if(!data.loaded) crashGame_addHistory(roundedToFixed(data.number / 100, 2).toFixed(2));

			$('#crash_bet').removeClass('hidden').addClass('disabled');
			$('#crash_cashout').addClass('hidden');

			$('.bet-cashout').addClass('disabled');

			if(!data.winners.includes(USERID)){
				$('#crash_cashout_amount').countToFloat(0);
				$('#crash_cashout_profit').countToProfit(0);
			}

			sounds_play('crash_stop');
		} else if(method == 'reset'){
			$('#crash_betlist').html(emptyTable({
				title: 'No active bets'
			}));

			$('#crash_bet').removeClass('hidden').removeClass('disabled');
			$('#crash_cashout').addClass('hidden');

			$('.bet-cashout').addClass('disabled');

			$('#crash_cashout_amount').countToFloat(0);
			$('#crash_cashout_profit').countToProfit(0);
		} else if(method == 'bet'){
			crashGame_addGame(data.bet);
		} else if(method == 'win'){
			crashGame_editBet(data.bet);
		} else if(method == 'loss'){
			data.ids.forEach(function(id){
				$('#crash_betlist > .item[data-id="' + id + '"]').removeClass('text-primary').addClass('text-danger');
			});
		} else if(method == 'bet_confirmed'){
			notify('success', 'Your bet has been placed!');

			$('#crash_bet').removeClass('hidden').addClass('disabled');
			$('#crash_cashout').addClass('hidden');

			$('.bet-cashout').addClass('disabled');

			$('#crash_cashout_amount').countToFloat(data.total);
			$('#crash_cashout_profit').countToProfit(data.profit);

			sounds_play('play');
		} else if(method == 'cashed_out'){
			$('#crash_bet').addClass('hidden');
			$('#crash_cashout').removeClass('hidden').addClass('disabled');

			$('.bet-cashout').addClass('disabled');

			$('#crash_cashout_amount').countToFloat(data.total);
			$('#crash_cashout_profit').countToProfit(data.profit);

			if(!data.loaded) sounds_play('cashout');
		} else if(method == 'cashout'){
			$('#crash_bet').addClass('hidden');
			$('#crash_cashout').removeClass('hidden').removeClass('disabled');

			$('.bet-cashout').removeClass('disabled');

			$('#crash_cashout_amount').text(roundedToFixed(data.total, 2).toFixed(2));
			$('#crash_cashout_profit').text(roundedToFixed(data.profit, 2).toFixed(2));
		} else if(method == 'fair'){
			if(data.id !== undefined) {
                $('#crash_fair_id').val(data.id);
                $('#crash_fair_id').attr('data-default', data.id);
            }

			if(data.public_seed !== undefined) {
                $('#crash_fair_public_seed').val(data.public_seed);
                $('#crash_fair_public_seed').attr('data-default', data.public_seed);
            }
		}
	} else

    if(type == 'jackpot' && app.page == 'jackpot'){
		if(method == 'bet_confirmed'){
			notify('success', 'Your bet has been placed!');

			$('#jackpot_bet').removeClass('disabled');

			sounds_play('play');
		} else if(method == 'avatars'){
			$('#jackpot_field').empty();

			for(var i = 0; i < 2; i++){
				data.avatars.forEach(function(item){
					var DIV = '<div class="reel-item flex justify-center items-center"><img class="size-full" src="' + item + '"></div>';

					$('#jackpot_field').append(DIV);
				});
			}
		} else if(method == 'fair'){
			$('#fair_jackpot_results').attr('data-fair', JSON.stringify(data.fair));
		} else if(method == 'chance'){
			$('#jackpot_mychange').countToFloat(data.chance);
		} else if(method == 'bet'){
			jackpotGame_addBet(data.bet);
			$('#jackpot_total').countToFloat(data.total);
		} else if(method == 'timer'){
			$('#jackpot_timer').text('Rolling in ' + parseInt(data.time) + 's');
			$('#jackpot_counter').css('width', (data.time * 100 / data.total).toFixed(2) + '%');
		} else if(method == 'picking'){
			$('#jackpot_timer').text('Waiting for EOS block...');
		} else if(method == 'reset'){
			$('#jackpot_betlist').html(emptyState({
				title: 'No active bets'
			}));

			$('#jackpot_total').countToFloat(0);

			$('#jackpot_mychange').countToFloat(0);

			$('#jackpot_timer').text('Waiting for players...');
			$('#jackpot_counter').css('width', '100%');

			$('#jackpot_field').empty();

			for(var i = 0; i < 50; i++){
				var DIV = '<div class="reel-item flex justify-center items-center"><img class="size-full" data-id="' + i + '" src="/img/jackpot/avatar.jpg"></div>';

				$('#jackpot_field').append(DIV);
			}

			idleSpinner_Jackpot = true;
		} else if(method == 'history'){
			jackpotGame_addHistory(data.history);
		} else if(method == 'roll'){
			idleSpinner_Jackpot = false;

			$('#jackpot_field').empty();

			data.avatars.forEach(function(item, index){
				var DIV = '<div class="reel-item flex justify-center items-center"><img class="size-full" data-id="' + index + '" src="' + item + '"></div>';

				$('#jackpot_field').append(DIV);
			});

			$('#jackpot_timer').text('Rolling winner!');

			startSpinner_Jackpot(data.cooldown);
			sounds_play('jackpot_rolling');
		}
	} else

    if(type == 'coinflip' && app.page == 'coinflip'){
		if(method == 'add'){
			coinflipGame_addCoinFlip(data);
		} else if(method == 'bet_confirmed'){
			notify('success', 'Your bet has been placed!');

			$('#coinflip_create').removeClass('disabled');

			sounds_play('play');
		} else if(method == 'edit'){
			coinflipGame_editCoinFlip(data);
		} else if(method == 'remove'){
			var $field = $('#coinflip_betlist .coinflip-game .item[data-id="' + data.id + '"]').parent();
			$field.removeClass('active').empty();

			var last_game = $('#coinflip_betlist .coinflip-game.active').last().index() + 1;
			var count_games = $('#coinflip_betlist .coinflip-game').length;
			for(var i = 0; (i < (count_games - (last_game > 5 ? 1 : 0)) * Math.floor((count_games - last_game) / 5) * 5) && $('#coinflip_betlist .coinflip-game').length > 5; i++){
				var $last = $('#coinflip_betlist .coinflip-game').last();

				$last.remove();
			}
		}
	} else

    if(type == 'dice' && app.page == 'dice'){
		if(method == 'bet'){
			notify('success', 'Your bet has been placed!');

			diceGame_roll(data.roll);

			$('#dice_bet').addClass('disabled');

			$('#dice_chanceslider').addClass('disabled');
			$('.dice-mode').addClass('disabled');

			$('.bet-cashout').removeClass('disabled');

			$('#dice_cashout_amount').countToFloat(data.total);
			$('#dice_cashout_profit').countToProfit(data.profit);
		} else if(method == 'result'){
			$('#dice_pointer').removeClass('hidden');
			$('#dice_pointer .item').css('left', roundedToFixed(data.roll, 2) + '%');
			$('#dice_pointer .content').text(roundedToFixed(data.roll, 2).toFixed(2) + '%');

			$('#dice_bet').removeClass('disabled');

			$('#dice_chanceslider').removeClass('disabled');
			$('.dice-mode').removeClass('disabled');

			$('.bet-cashout').addClass('disabled');

			$('#dice_cashout_amount').countToFloat(data.total);
			$('#dice_cashout_profit').countToProfit(data.profit);

			if(data.win) sounds_play('dice_win');
			else sounds_play('dice_loss');
		}
	} else

    if(type == 'minesweeper' && app.page == 'minesweeper'){
		if(method == 'bet_confirmed'){
			notify('success', 'Your bet has been placed!');

			if(minesweeperGame_interval != null) {
				clearInterval(minesweeperGame_interval);

				minesweeperGame_interval = null;
			}

			$('#minesweeper_bombs .item').removeClass('danger').removeClass('success').removeClass('disabled');
			$('#minesweeper_bombs .item .multiplier').text('');

			$('#minesweeper_bet').addClass('hidden');
			$('#minesweeper_cashout').removeClass('hidden').removeClass('disabled');

			$('#bombsamount_minesweeper').closest('.input_field').addClass('disabled');
			$('.minesweeper-bombsamount').addClass('disabled');

			$('.bet-cashout').removeClass('disabled');

			$('#minesweeper_cashout_amount').countToFloat(data.total);
			$('#minesweeper_cashout_profit').countToProfit(data.profit);

			sounds_play('play');
		} else if(method == 'result_bomb'){
			if(data.result == 'lose'){
				$('#minesweeper_bombs .item').addClass('disabled');

				var index = 0;

				minesweeperGame_interval = setInterval(function(){
					if(index >= data.data.mines.length) {
						clearInterval(minesweeperGame_interval);

						minesweeperGame_interval = null;
					}

					$('#minesweeper_bombs .item[data-bomb="' + data.data.mines[index] + '"]').addClass('danger');

					index++;
				}, 100);

				$('#minesweeper_bet').removeClass('hidden').removeClass('disabled');
				$('#minesweeper_cashout').addClass('hidden');

				$('#bombsamount_minesweeper').closest('.input_field').removeClass('disabled');
				$('.minesweeper-bombsamount').removeClass('disabled');

				$('.bet-cashout').addClass('disabled');

				if(!data.data.win){
					$('#minesweeper_cashout_amount').countToFloat(0);
					$('#minesweeper_cashout_profit').countToProfit(0);

					sounds_play('minesweeper_loss');
				} else sounds_play('cashout');
			} else if(data.result == 'win'){
				$('#minesweeper_bombs .item[data-bomb="' + data.data.bomb + '"]').addClass('success');
				$('#minesweeper_bombs .item[data-bomb="' + data.data.bomb + '"] .multiplier').text('x' + data.data.multiplier.toFixed(2));

				$('#minesweeper_cashout').removeClass('hidden').removeClass('disabled');

				$('.bet-cashout').removeClass('disabled');

				$('#minesweeper_cashout_amount').countToFloat(data.data.total);
				$('#minesweeper_cashout_profit').countToProfit(data.data.profit);

				sounds_play('minesweeper_win');
			}
		}
	} else

    if(type == 'tower' && app.page == 'tower'){
		if(method == 'bet_confirmed'){
			notify('success', 'Your bet has been placed!');

			$('#tower_grid .item').removeClass('danger').removeClass('success').removeClass('checked');
			$('#tower_grid .item').addClass('disabled');

			$('#tower_grid .item[data-stage="' + data.stage + '"]').removeClass('disabled');

			$('#tower_bet').addClass('hidden');
			$('#tower_cashout').removeClass('hidden').removeClass('disabled');

			$('#tower_difficulty').closest('.dropdown_field').addClass('disabled');

			$('.bet-cashout').removeClass('disabled');

			$('#tower_cashout_amount').countToFloat(data.total);
			$('#tower_cashout_profit').countToProfit(data.profit);

			$('#tower_difficulty').closest('.dropdown_field').addClass('disabled');

			sounds_play('play');
		} else if(method == 'result_stage'){
			if(data.result == 'lose'){
				data.data.tower.forEach(function(button, i){
					if([ 'expert', 'master' ].includes(data.data.difficulty)){
						for(var j = 0; j < towerGame_tiles[data.data.difficulty]; j++){
							if(j != button) $('#tower_grid .item[data-stage="' + i + '"][data-button="' + j + '"]').removeClass('success').removeClass('checked').addClass('danger');
						}
					} else $('#tower_grid .item[data-stage="' + i + '"][data-button="' + button + '"]').removeClass('success').removeClass('checked').addClass('danger');
				});

				$('#tower_grid .item').addClass('disabled');

				$('#tower_bet').removeClass('hidden').removeClass('disabled');
				$('#tower_cashout').addClass('hidden');

				$('#tower_difficulty').closest('.dropdown_field').removeClass('disabled');

				$('.bet-cashout').addClass('disabled');

				if(!data.data.win){
					$('#tower_cashout_amount').countToFloat(0);
					$('#tower_cashout_profit').countToProfit(0);

					sounds_play('tower_loss');
				} else sounds_play('cashout');

				$('#tower_difficulty').closest('.dropdown_field').removeClass('disabled');
			} else if(data.result == 'win'){
				$('#tower_grid .item[data-stage="' + data.data.stage + '"][data-button="' + data.data.button + '"]').addClass('success');
				$('#tower_grid .item[data-stage="' + data.data.stage + '"]:not(.success)').addClass('checked');

				$('#tower_grid .item[data-stage="' + (data.data.stage + 1) + '"]').removeClass('disabled');

				$('#tower_cashout').removeClass('hidden').removeClass('disabled');

				$('.bet-cashout').removeClass('disabled');

				$('#tower_cashout_amount').countToFloat(data.data.total);
				$('#tower_cashout_profit').countToProfit(data.data.profit);

				sounds_play('tower_win');
			}
		}
	} else

    if(type == 'plinko' && app.page == 'plinko'){
		if(method == 'bet'){
			notify('success', 'Your bet has been placed!');

			$('#plinko_bet').addClass('disabled');

			$('#plinko_difficulty').closest('.dropdown_field').addClass('disabled');
			$('#plinko_rows_amount').closest('.dropdown_field').addClass('disabled');

			$('.bet-cashout').removeClass('disabled');

			$('#plinko_cashout_amount').countToFloat(data.total);
			$('#plinko_cashout_profit').countToProfit(data.profit);

			plinkoGame_play(data.id, data.roll);

			sounds_play('play');
		} else if(method == 'result'){
			$('#plinko_bet').removeClass('disabled');

			$('.bet-cashout').addClass('disabled');

			$('#plinko_cashout_amount').countToFloat(data.total);
			$('#plinko_cashout_profit').countToProfit(data.profit);

			if($('#plinko_balls .item:not(.active)').length <= 0){
				$('#plinko_difficulty').closest('.dropdown_field').removeClass('disabled');
				$('#plinko_rows_amount').closest('.dropdown_field').removeClass('disabled');
			}
		}
	} else

    if(type == 'casino'){
        if(app.page == 'casino'){
            if(method == 'launch'){
                $('#casino_game').addClass('active');
                $('#casino_game_frame').empty();

                var iframe = document.createElement('iframe');
                iframe.src = data.url;
                iframe.style.width = '100%';
                iframe.style.height = '600px';
                iframe.style.border = 'none';

                var container = document.getElementById('casino_game_frame');
                container.appendChild(iframe);

                if(data.favorite) $('#casino_favorite.button').addClass('active');
            } else if(method == 'add_favorite'){
                $('.casino-games .item[data-id="' + data.id + '"] .favorite').addClass('active');

                $('#casino_favorite.button').addClass('active');
            } else if(method == 'remove_favorite'){
                $('.casino-games .item[data-id="' + data.id + '"] .favorite').removeClass('active');

                $('#casino_favorite.button').removeClass('active');
            }
        }
    } else

	if(type == 'offers'){
		if(app.page == 'deposit' || app.page == 'withdraw'){

            if(method == 'crypto_payment'){
                $('#crypto_deposit_qrcode').empty();

				var qrcode = new QRCode($('#crypto_deposit_qrcode')[0], {
					text: data.payment.address,
					width: 192,
					height: 192
				});

                $('#crypto_deposit_payment_value').text(data.payment.value);
                $('#crypto_deposit_payment_amount').text(getFormatAmountString(data.payment.amount));

				$('#crypto_deposit_payment_address').val(data.payment.address).trigger('update');

                $('#crypto_deposit_panel').addClass('active');
			}

            if(method == 'cash_payment'){
                if(data.payment && data.payment.approve_url){
                    window.location.href = data.payment.approve_url;
                    return;
                }

                toastr['error']('PayPal payment could not be started. Please try again.');
            }
		}

	} else if(type == 'history'){
		if(method == 'list'){
			if(data.list.length > 0){
				$('#history_list').empty();

				data.list.forEach(function(history){
					history_addHistory(history);
				});
			} else {
				$('#history_list').html(emptyTable({
					title: 'No data found'
				}));
			}
		} else if(method == 'history'){
			var allowed = true;

			if((data.history.type == 'game_bets' || data.history.type == 'my_bets') && data.history.page != app.paths[0]) allowed = false;

            //app.paths[0] == 'home'
			if(data.history.type == 'my_bets' && app.paths[0] == '') allowed = true;

			if(data.history.type == profile_settingsGet('history') && allowed) history_addHistory(data.history.history);
		}
	}
}

/* END SOCKET */

/* PAGINATION */

$(document).ready(function() {
	$(document).on('click', '#pagination_account_transactions .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_transactions',
			'page': page
		});
	});

	$(document).on('click', '#pagination_account_deposits .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_deposits',
			'page': page
		});
	});

	$(document).on('click', '#pagination_account_withdrawals .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_withdrawals',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_roulette_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_roulette_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_crash_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_crash_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_jackpot_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_jackpot_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_coinflip_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_coinflip_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_dice_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_dice_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_tower_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_tower_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_minesweeper_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_minesweeper_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_plinko_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_plinko_history',
			'page': page
		});
	});

    $(document).on('click', '#pagination_account_casino_history .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'account_casino_history',
			'page': page
		});
	});

	$(document).on('click', '#pagination_user_transactions .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_transactions',
			'page': page,
            'userid': app.paths[1]
		});
	});

	$(document).on('click', '#pagination_user_deposits .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_deposits',
			'page': page,
            'userid': app.paths[1]
		});
	});

	$(document).on('click', '#pagination_user_withdrawals .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_withdrawals',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_roulette_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_roulette_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_crash_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_crash_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_jackpot_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_jackpot_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_coinflip_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_coinflip_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_dice_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_dice_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_tower_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_tower_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_minesweeper_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_minesweeper_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_plinko_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_plinko_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

    $(document).on('click', '#pagination_user_casino_history .pagination-item', function() {
		if(app.paths[1] === undefined) return;

        var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'user_casino_history',
			'page': page,
            'userid': app.paths[1]
		});
	});

	$(document).on('click', '#pagination_affiliates_referred_users .pagination-item', function() {
		var page = $(this).attr('data-page');

		var order = parseInt($('#affiliates_referred_users_order').val());
		var search = $('#affiliates_referred_users_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'affiliates_referred_users',
			'page': page,
			'order': order,
			'search': search
		});
	});

	var timeout_affiliates_referred_users = null;
	$('#affiliates_referred_users_search').on('input', function() {
		if(timeout_affiliates_referred_users) clearTimeout(timeout_affiliates_referred_users);

		timeout_affiliates_referred_users = setTimeout(function(){
			var order = parseInt($('#affiliates_referred_users_order').val());
			var search = $('#affiliates_referred_users_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'affiliates_referred_users',
				'page': 1,
				'order': order,
				'search': search
			});
		}, 1000);
	});

	$(document).on('change', '#affiliates_referred_users_order', function() {
		var order = parseInt($('#affiliates_referred_users_order').val());
		var search = $('#affiliates_referred_users_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'affiliates_referred_users',
			'page': 1,
			'order': order,
			'search': search
		});
	});

    $(document).on('click', '#pagination_support_requests .pagination-item', function() {
		var page = $(this).attr('data-page');

		var search = $('#support_search').val();
		var status = parseInt($('#support_filter_status').val());

		socket_emit({
			'type': 'pagination',
			'command': 'support_requests',
			'page': page,
			'status': status,
			'search': search
		});
	});

	$(document).on('change', '#support_filter_status', function() {
		var search = $('#support_search').val();
		var status = parseInt($('#support_filter_status').val());

		socket_emit({
			'type': 'pagination',
			'command': 'support_requests',
			'page': 1,
			'status': status,
			'search': search
		});
	});

	var timeout_support_requests = null;
	$('#support_search').on('input', function() {
		if(timeout_support_requests) clearTimeout(timeout_support_requests);

		timeout_support_requests = setTimeout(function(){
			var search = $('#support_search').val();
			var status = parseInt($('#support_filter_status').val());

			socket_emit({
				'type': 'pagination',
				'command': 'support_requests',
				'page': 1,
				'status': status,
				'search': search
			});
		}, 1000);
	});
});

function pagination_addAccountTransactions(list){
	if(list.length > 0) {
		$('#account_transactions').empty();

		list.forEach(function(item){
			$('#account_transactions').append(tableAccountTransactionsRow(item));
		});
	} else {
		$('#account_transactions').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountDeposits(list){
	if(list.length > 0) {
		$('#account_deposits').empty();

		list.forEach(function(item){
			$('#account_deposits').append(tableAccountDepositsRow(item));
		});
	} else {
		$('#account_deposits').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountWithdrawals(list){
	if(list.length > 0) {
		$('#account_withdrawals').empty();

		list.forEach(function(item){
			$('#account_withdrawals').append(tableAccountWithdrawalsRow(item));
		});
	} else {
		$('#account_withdrawals').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountRouletteHistory(list){
	if(list.length > 0) {
		$('#account_roulette_history').empty();

		list.forEach(function(item){
			$('#account_roulette_history').append(tableAccountRouletteHistoryRow(item));
		});
	} else {
		$('#account_roulette_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountCrashHistory(list){
	if(list.length > 0) {
		$('#account_crash_history').empty();

		list.forEach(function(item){
			$('#account_crash_history').append(tableAccountCrashHistoryRow(item));
		});
	} else {
		$('#account_crash_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountJackpotHistory(list){
	if(list.length > 0) {
		$('#account_jackpot_history').empty();

		list.forEach(function(item){
			$('#account_jackpot_history').append(tableAccountJackpotHistoryRow(item));
		});
	} else {
		$('#account_jackpot_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountCoinflipHistory(list){
	if(list.length > 0) {
		$('#account_coinflip_history').empty();

		list.forEach(function(item){
			$('#account_coinflip_history').append(tableAccountCoinflipHistoryRow(item));
		});
	} else {
		$('#account_coinflip_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountDiceHistory(list){
	if(list.length > 0) {
		$('#account_dice_history').empty();

		list.forEach(function(item){
			$('#account_dice_history').append(tableAccountDiceHistoryRow(item));
		});
	} else {
		$('#account_dice_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountTowerHistory(list){
	if(list.length > 0) {
		$('#account_tower_history').empty();

		list.forEach(function(item){
			$('#account_tower_history').append(tableAccountTowerHistoryRow(item));
		});
	} else {
		$('#account_tower_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountMinesweeperHistory(list){
	if(list.length > 0) {
		$('#account_minesweeper_history').empty();

		list.forEach(function(item){
			$('#account_minesweeper_history').append(tableAccountMinesweeperHistoryRow(item));
		});
	} else {
		$('#account_minesweeper_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountPlinkoHistory(list){
	if(list.length > 0) {
		$('#account_plinko_history').empty();

		list.forEach(function(item){
			$('#account_plinko_history').append(tableAccountPlinkoHistoryRow(item));
		});
	} else {
		$('#account_plinko_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAccountCasinoHistory(list){
	if(list.length > 0) {
		$('#account_casino_history').empty();

		list.forEach(function(item){
			$('#account_casino_history').append(tableAccountCasinoHistoryRow(item));
		});
	} else {
		$('#account_casino_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserTransactions(list){
	if(list.length > 0) {
		$('#user_transactions').empty();

		list.forEach(function(item){
			$('#user_transactions').append(tableUserTransactionsRow(item));
		});
	} else {
		$('#user_transactions').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserDeposits(list){
	if(list.length > 0) {
		$('#user_deposits').empty();

		list.forEach(function(item){
			$('#user_deposits').append(tableUserDepositsRow(item));
		});
	} else {
		$('#user_deposits').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserWithdrawals(list){
	if(list.length > 0) {
		$('#user_withdrawals').empty();

		list.forEach(function(item){
			$('#user_withdrawals').append(tableUserWithdrawalsRow(item));
		});
	} else {
		$('#user_withdrawals').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserRouletteHistory(list){
	if(list.length > 0) {
		$('#user_roulette_history').empty();

		list.forEach(function(item){
			$('#user_roulette_history').append(tableUserRouletteHistoryRow(item));
		});
	} else {
		$('#user_roulette_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserCrashHistory(list){
	if(list.length > 0) {
		$('#user_crash_history').empty();

		list.forEach(function(item){
			$('#user_crash_history').append(tableUserCrashHistoryRow(item));
		});
	} else {
		$('#user_crash_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserJackpotHistory(list){
	if(list.length > 0) {
		$('#user_jackpot_history').empty();

		list.forEach(function(item){
			$('#user_jackpot_history').append(tableUserJackpotHistoryRow(item));
		});
	} else {
		$('#user_jackpot_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserCoinflipHistory(list){
	if(list.length > 0) {
		$('#user_coinflip_history').empty();

		list.forEach(function(item){
			$('#user_coinflip_history').append(tableUserCoinflipHistoryRow(item));
		});
	} else {
		$('#user_coinflip_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserDiceHistory(list){
	if(list.length > 0) {
		$('#user_dice_history').empty();

		list.forEach(function(item){
			$('#user_dice_history').append(tableUserDiceHistoryRow(item));
		});
	} else {
		$('#user_dice_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserTowerHistory(list){
	if(list.length > 0) {
		$('#user_tower_history').empty();

		list.forEach(function(item){
			$('#user_tower_history').append(tableUserTowerHistoryRow(item));
		});
	} else {
		$('#user_tower_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserMinesweeperHistory(list){
	if(list.length > 0) {
		$('#user_minesweeper_history').empty();

		list.forEach(function(item){
			$('#user_minesweeper_history').append(tableUserMinesweeperHistoryRow(item));
		});
	} else {
		$('#user_minesweeper_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserPlinkoHistory(list){
	if(list.length > 0) {
		$('#user_plinko_history').empty();

		list.forEach(function(item){
			$('#user_plinko_history').append(tableUserPlinkoHistoryRow(item));
		});
	} else {
		$('#user_plinko_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addUserCasinoHistory(list){
	if(list.length > 0) {
		$('#user_casino_history').empty();

		list.forEach(function(item){
			$('#user_casino_history').append(tableUserCasinoHistoryRow(item));
		});
	} else {
		$('#user_casino_history').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAffiliatesReferredUsers(list){
	if(list.length > 0) {
		$('#affiliates_referred_users').empty();

		list.forEach(function(item){
			$('#affiliates_referred_users').append(tableAffiliatesReferredUsersRow(item));
		});
	} else {
		$('#affiliates_referred_users').html(emptyTable({
			title: 'No data found'
		}));
	}
}

/* END PAGINATION */

/* ADMIN DASHBOARD */

var dashboard_charts = {};

$(document).ready(function() {
	$('.dashboard-chart').each(function(i, e) {
        $(this).find('.dashboard-loader').removeClass('hidden');

        dashboard_startGraph({
			labels: [],
			data: [ [] ]
		}, $(this).attr('data-graph'));
    });

    $('.dropdown_field .dashboard-graph').on('change', function() {
		var date = $(this).val();
		var graph = $(this).closest('.dashboard-chart').attr('data-graph');
		var id = $(this).closest('.dashboard-chart').attr('data-id');

		dashboard_loadGraph({ date, graph: id ? graph + '.' + id : graph });
	});

    $('.dashboard-graph .button').on('click', function() {
		$('.dashboard-graph .button').removeClass('active');
		$(this).addClass('active');

		var date = $(this).attr('data-date');
		var graph = $(this).closest('.dashboard-chart').attr('data-graph');
		var id = $(this).closest('.dashboard-chart').attr('data-id');

		dashboard_loadGraph({ date, graph: id ? graph + '.' + id : graph });
	});
});

function dashboard_initialize(){
    var graphs = [];

    $('.dashboard-chart:not(.modal .dashboard-chart)').each(function(i, e) {
        $(this).find('.dashboard-loader').removeClass('hidden');

        dashboard_updateGraph({
			labels: [],
			data: [ [] ]
		}, $(this).attr('data-graph'));

        graphs.push({
            date: $(this).find('.dropdown_field .dashboard-graph').length > 0 ? $(this).find('.dropdown_field .dashboard-graph').val() : $(this).find('.dashboard-graph .button.active').attr('data-date'),
            graph: ($(this).attr('data-id')) ? $(this).attr('data-graph') + '.' + $(this).attr('data-id') : $(this).attr('data-graph')
        });
    });

	if(graphs.length > 0) {
		socket_emit({
			'type': 'admin',
			'command': 'dashboard_graphs',
			'graphs': graphs
		});
	}

    var stats = [];
    $('.dashboard-stats').each(function(i, e) { stats.push($(this).attr('data-stats')); });

	if(stats.length > 0){
		socket_emit({
			'type': 'admin',
			'command': 'dashboard_stats',
			'stats': stats
		});
	}
}

function dashboard_loadGraph(graph){
	$('#dashboard_chart_' + graph.graph.split('.')[0]).closest('.dashboard-chart').find('.dashboard-loader').removeClass('hidden');

	dashboard_updateGraph({
		labels: [],
		data: [ [] ]
	}, graph.graph.split('.')[0]);

	socket_emit({
		'type': 'admin',
		'command': 'dashboard_graph',
		'graph': graph
	});
}

function dashboard_startGraph(data, graph){
	$('#dashboard_chart_' + graph.graph).closest('.dashboard-chart').find('.dashboard-loader').removeClass('hidden');

    var ctx = document.getElementById('dashboard_chart_' + graph).getContext('2d');

	var chart = new Chart(ctx, dashboard_generateCtx(data, graph));

    dashboard_charts[graph] = chart;
}

function dashboard_updateGraph(data, graph){
	if(dashboard_charts[graph] !== undefined){
        dashboard_charts[graph].data.labels = dashboard_generateCtx(data, graph).data.labels;
        dashboard_charts[graph].data.datasets = dashboard_generateCtx(data, graph).data.datasets;

        dashboard_charts[graph].update();
    }
}

function dashboard_generateCtx(stats, graph){
	if(graph == 'referrals_overview') return {
		type: 'bar',
		data: {
			labels: stats.labels,
			datasets: [{
      			label: 'Clicks',
				data: stats.data[0],
				borderColor: '#ffdf5e',
                backgroundColor: '#ffdf5e',
				borderWidth: 2,
				fill: true,
				spanGaps: true,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                hoverPointBackgroundColor: 'transparent',
                hoverPointBorderColor: 'transparent'
			}, {
      			label: 'Joins',
				data: stats.data[1],
				borderColor: '#00e454',
                backgroundColor: '#00e454',
				borderWidth: 2,
				fill: true,
				spanGaps: true,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                hoverPointBackgroundColor: 'transparent',
                hoverPointBorderColor: 'transparent'
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						stepSize: 1
					}
				}],
				xAxes: [{
					categoryPercentage: 0.6,
					barPercentage: 0.8,
					ticks: {
						display: false
					}
				}]
			},

			elements: {
				line: {
					tension: 0.5
				},
                point: {
                    radius: 30,
                    hoverRadius: 30
                }
			},

			legend: {
				display: true
			},

            maintainAspectRatio: false
		}
	};

	return {
		type: 'line',
		data: {
			labels: stats.labels,
			datasets: [{
				data: stats.data[0],
				borderColor: '#9370db',
                backgroundColor: '#42395c',
				borderWidth: 2,
				fill: true,
				spanGaps: true,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                hoverPointBackgroundColor: 'transparent',
                hoverPointBorderColor: 'transparent'
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						//beginAtZero: true
					}
				}],
				xAxes: [{
					ticks: {
						display: false
					}
				}]
			},

			elements: {
				line: {
					tension: 0.5
				},
                point: {
                    radius: 30,
                    hoverRadius: 30
                }
			},

			legend: {
				display: false
			},

            maintainAspectRatio: false
		}
	};
}

/* END ADMIN DASHBOARD */

/* ADMIN USERS */

$(document).ready(function() {
	$(document).on('click', '.admin_user_remove_link', function() {
		var provider = $(this).attr('data-provider');

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_remove_link',
				'userid': app.paths[2],
				'provider': provider,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_remove_exclusion', function() {
		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_remove_exclusion',
				'userid': app.paths[2],
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_remove_sessions', function() {
		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_remove_sessions',
				'userid': app.paths[2],
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_ip_ban', function() {
		var ip = $('#admin_user_ip_value').val();

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_ban_ip',
				'userid': app.paths[2],
				'ip': ip,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_ip_unban', function() {
		var ip = $('#admin_user_ip_value').val();

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_unban_ip',
				'userid': app.paths[2],
				'ip': ip,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_rank_set', function() {
		var rank = parseInt($('#admin_user_rank_value').val());

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_set_rank',
				'userid': app.paths[2],
				'rank': rank,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_balance_edit', function() {
		var amount = $('#admin_user_balance_amount').val();

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_edit_balance',
				'userid': app.paths[2],
				'amount': amount,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_restriction_site_set', function() {
		var reason = $('#admin_user_restriction_site_reason').val();

		var permanent = $('#admin_user_restriction_site_permanent').prop('checked');
		var expire = permanent ? -1 : parseInt($('#admin_user_restriction_site_expire').val());

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_set_restriction',
				'userid': app.paths[2],
				'restriction': 'site',
				'reason': reason,
				'expire': expire,
				'secret': secret
			});
		});
	});

	$(document).on('change', '#admin_user_restriction_site_permanent', function() {
		var checked = $(this).prop('checked');

		var $field = $('#admin_user_restriction_site_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	$(document).on('click', '#admin_user_restriction_site_unset', function() {
		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_unset_restriction',
				'userid': app.paths[2],
				'restriction': 'site',
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_restriction_play_set', function() {
		var reason = $('#admin_user_restriction_play_reason').val();

		var permanent = $('#admin_user_restriction_play_permanent').prop('checked');
		var expire = permanent ? -1 : parseInt($('#admin_user_restriction_play_expire').val());

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_set_restriction',
				'userid': app.paths[2],
				'restriction': 'play',
				'reason': reason,
				'expire': expire,
				'secret': secret
			});
		});
	});

	$(document).on('change', '#admin_user_restriction_play_permanent', function() {
		var checked = $(this).prop('checked');

		var $field = $('#admin_user_restriction_play_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	$(document).on('click', '#admin_user_restriction_play_unset', function() {
		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_unset_restriction',
				'userid': app.paths[2],
				'restriction': 'play',
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_restriction_trade_set', function() {
		var reason = $('#admin_user_restriction_trade_reason').val();

		var permanent = $('#admin_user_restriction_trade_permanent').prop('checked');
		var expire = permanent ? -1 : parseInt($('#admin_user_restriction_trade_expire').val());

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_set_restriction',
				'userid': app.paths[2],
				'restriction': 'trade',
				'reason': reason,
				'expire': expire,
				'secret': secret
			});
		});
	});

	$(document).on('change', '#admin_user_restriction_trade_permanent', function() {
		var checked = $(this).prop('checked');

		var $field = $('#admin_user_restriction_trade_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	$(document).on('click', '#admin_user_restriction_trade_unset', function() {
		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_unset_restriction',
				'userid': app.paths[2],
				'restriction': 'trade',
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_user_restriction_mute_set', function() {
		var reason = $('#admin_user_restriction_mute_reason').val();

		var permanent = $('#admin_user_restriction_mute_permanent').prop('checked');
		var expire = permanent ? -1 : parseInt($('#admin_user_restriction_mute_expire').val());

		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_set_restriction',
				'userid': app.paths[2],
				'restriction': 'mute',
				'reason': reason,
				'expire': expire,
				'secret': secret
			});
		});
	});

	$(document).on('change', '#admin_user_restriction_mute_permanent', function() {
		var checked = $(this).prop('checked');

		var $field = $('#admin_user_restriction_mute_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	$(document).on('click', '#admin_user_restriction_mute_unset', function() {
		if(app.paths[2] === undefined) return;

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_unset_restriction',
				'userid': app.paths[2],
				'restriction': 'mute',
				'secret': secret
			});
		});
	});

	$(document).on('click', '#pagination_admin_users .pagination-item', function() {
		var page = $(this).attr('data-page');
		var order = parseInt($('#admin_users_order').val());
		var search = $('#admin_users_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_users',
			'page': page,
			'order': order,
			'search': search
		});
	});

	$(document).on('change', '#admin_users_order', function() {
		var order = parseInt($('#admin_users_order').val());
		var search = $('#admin_users_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_users',
			'page': 1,
			'order': order,
			'search': search
		});
	});

	var timeout_admin_users = null;
	$('#admin_users_search').on('input', function() {
		if(timeout_admin_users) clearTimeout(timeout_admin_users);

		timeout_admin_users = setTimeout(function(){
			var order = parseInt($('#admin_users_order').val());
			var search = $('#admin_users_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'admin_users',
				'page': 1,
				'order': order,
				'search': search
			});
		}, 1000);
	});
});

function pagination_addUsers(list){
	if(list.length > 0) {
		$('#admin_users_list').empty();

		list.forEach(function(item){
			$('#admin_users_list').append(tableAdminUsersRow(item));
		});
	} else {
		$('#admin_users_list').html(emptyTable({
			title: 'No data found'
		}));
	}
}

/* END ADMIN USERS */

/* ADMIN PAYMENTS */

$(document).ready(function() {
	$(document).on('click', '#admin_manual_deposit_create', function() {
		var userid = $('#admin_manual_deposit_userid').val();
		var amount = $('#admin_manual_deposit_amount').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_create_manual_deposit',
				'userid': userid,
				'amount': amount,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_manual_withdrawal_create', function() {
		var userid = $('#admin_manual_withdrawal_userid').val();
		var amount = $('#admin_manual_withdrawal_amount').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_create_manual_withdrawal',
				'userid': userid,
				'amount': amount,
				'secret': secret
			});
		});
	});

    $(document).on('click', '.admin_trades_confirm', function() {
		var method = $(this).attr('data-method');
		var trade = $(this).attr('data-trade');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_confirm_listing',
				'method': method,
				'trade': trade,
				'secret': secret
			});
		});
	});

	$(document).on('click', '.admin_trades_cancel', function() {
		var method = $(this).attr('data-method');
		var trade = $(this).attr('data-trade');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_cancel_listing',
				'method': method,
				'trade': trade,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_payments_manually_amount_set', function() {
		var amount = $('#admin_payments_manually_amount_value').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_manually_amount',
				'amount': amount,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_deposit_bonuses_create', function() {
		var referral = $('#admin_deposit_bonuses_referral').val();
		var code = $('#admin_deposit_bonuses_code').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_create_deposit_bonus',
				'referral': referral,
				'code': code,
				'secret': secret
			});
		});
	});

	$(document).on('click', '.admin_deposit_bonuses_remove', function() {
		var id = $(this).attr('data-id');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'payments_remove_deposit_bonus',
				'id': id,
				'secret': secret
			});
		});
	});

    $(document).on('click', '#pagination_admin_crypto_confirmations .pagination-item', function() {
		var page = $(this).attr('data-page');

		socket_emit({
			'type': 'pagination',
			'command': 'admin_crypto_confirmations',
			'page': page
		});
	});

	$(document).on('click', '#pagination_admin_deposit_bonuses .pagination-item', function() {
		var page = $(this).attr('data-page');
		var search = $('#admin_deposit_bonuses_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_deposit_bonuses',
			'page': page,
			'search': search
		});
	});

	var timeout_admin_deposit_bonuses = null;
	$('#admin_deposit_bonuses_search').on('input', function() {
		if(timeout_admin_deposit_bonuses) clearTimeout(timeout_admin_deposit_bonuses);

		timeout_admin_deposit_bonuses = setTimeout(function(){
			var search = $('#admin_deposit_bonuses_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'admin_deposit_bonuses',
				'page': 1,
				'search': search
			});
		}, 1000);
	});
});

function pagination_addDepositBonuses(list){
	if(list.length > 0) {
		$('#admin_deposit_bonuses').empty();

		list.forEach(function(item){
			$('#admin_deposit_bonuses').append(tableAdminDepositBonusesRow(item));
		});
	} else {
		$('#admin_deposit_bonuses').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addCryptoConfirmations(list){
	if(list.length > 0) {
		$('#admin_crypto_confirmations').empty();

		list.forEach(function(item){
			$('#admin_crypto_confirmations').append(tableAdminCryptoConfirmationsRow(item));
		});
	} else {
		$('#admin_crypto_confirmations').html(emptyTable({
			title: 'No data found'
		}));
	}
}

/* END ADMIN PAYMENTS */

/* ADMIN GAMES */

$(document).ready(function() {
	$(document).on('click', '#admin_games_house_edge_set', function() {
		var house_edges = [
            { game: 'roulette', value: $('#admin_games_house_edge_roulette_value').val() },
            { game: 'crash', value: $('#admin_games_house_edge_crash_value').val() },
            { game: 'jackpot', value: $('#admin_games_house_edge_jackpot_value').val() },
            { game: 'coinflip', value: $('#admin_games_house_edge_coinflip_value').val() },
            { game: 'dice', value: $('#admin_games_house_edge_dice_value').val() },
            { game: 'minesweeper', value: $('#admin_games_house_edge_minesweeper_value').val() },
            { game: 'tower', value: $('#admin_games_house_edge_tower_value').val() },
            { game: 'plinko', value: $('#admin_games_house_edge_plinko_value').val() }
        ];

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'games_set_house_edges',
				'house_edges': house_edges,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_gamebots_create', function() {
		var name = $('#admin_gamebots_name').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'games_create_gamebot',
				'name': name,
				'secret': secret
			});
		});
	});

	$(document).on('click', '.admin_gamebot_moderate', function() {
		var userid = $(this).attr('data-userid');

		$('#admin_gamebots_balance_edit').attr('data-userid', userid);

		$('#modal_gamebots_moderate').modal('show');
	});

	$(document).on('click', '#admin_gamebots_balance_edit', function() {
		var amount = $('#admin_gamebots_balance_amount').val();
		var userid = $(this).attr('data-userid');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'users_edit_balance',
				'userid': userid,
				'amount': amount,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#pagination_admin_gamebots .pagination-item', function() {
		var page = $(this).attr('data-page');
		var order = parseInt($('#admin_gamebots_order').val());
		var search = $('#admin_gamebots_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_gamebots',
			'page': page,
			'order': order,
			'search': search
		});
	});

	$(document).on('change', '#admin_gamebots_order', function() {
		var order = parseInt($('#admin_gamebots_order').val());
		var search = $('#admin_gamebots_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_gamebots',
			'page': 1,
			'order': order,
			'search': search
		});
	});

	var timeout_admin_users = null;
	$('#admin_gamebots_search').on('input', function() {
		if(timeout_admin_users) clearTimeout(timeout_admin_users);

		timeout_admin_users = setTimeout(function(){
			var order = parseInt($('#admin_gamebots_order').val());
			var search = $('#admin_gamebots_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'admin_gamebots',
				'page': 1,
				'order': order,
				'search': search
			});
		}, 1000);
	});
});

function pagination_addGamebots(list){
	if(list.length > 0) {
		$('#admin_gamebots').empty();

		list.forEach(function(item){
			$('#admin_gamebots').append(tableAdminGamebotsRow(item));
		});
	} else {
		$('#admin_gamebots').html(emptyTable({
			title: 'No data found'
		}));
	}
}

/* END ADMIN GAMES */

/* ADMIN REWARDS */

$(document).ready(function() {
	$(document).on('change', '#admin_bonus_codes_never', function() {
		var checked = $(this).prop('checked');

		var $field = $('#admin_bonus_codes_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	$(document).on('click', '#admin_bonus_codes_create', function() {
		var code = $('#admin_bonus_codes_code').val();
		var amount = $('#admin_bonus_codes_amount').val();
		var uses = $('#admin_bonus_codes_uses').val();

		var never = $('#admin_bonus_codes_never').prop('checked');
		var expire = never ? -1 : parseInt($('#admin_bonus_codes_expire').val());

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'rewards_create_bonus_code',
				'code': code,
				'amount': amount,
				'uses': uses,
				'expire': expire,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_bonus_codes_generate', function() {
		$('#admin_bonus_codes_code').val(generateBonusCode(6));
	});

	$(document).on('click', '.admin_bonus_codes_remove', function() {
		var id = $(this).attr('data-id');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'rewards_remove_bonus_code',
				'id': id,
				'secret': secret
			});
		});
	});$(document).on('click', '#pagination_admin_bonus_codes .pagination-item', function() {
		var page = $(this).attr('data-page');

		var search = $('#admin_bonus_codes_search').val();
		var status = parseInt($('#admin_bonus_codes_status').val());

		socket_emit({
			'type': 'pagination',
			'command': 'admin_bonus_codes',
			'page': page,
			'status': status,
			'search': search
		});
	});

	$(document).on('change', '#admin_bonus_codes_status', function() {
		var search = $('#admin_bonus_codes_search').val();
		var status = parseInt($('#admin_bonus_codes_status').val());

		socket_emit({
			'type': 'pagination',
			'command': 'admin_bonus_codes',
			'page': 1,
			'status': status,
			'search': search
		});
	});

	var timeout_admin_bonus_codes = null;
	$('#admin_bonus_codes_search').on('input', function() {
		if(timeout_admin_bonus_codes) clearTimeout(timeout_admin_bonus_codes);

		timeout_admin_bonus_codes = setTimeout(function(){
			var search = $('#admin_bonus_codes_search').val();
            var status = parseInt($('#admin_bonus_codes_status').val());

			socket_emit({
				'type': 'pagination',
				'command': 'admin_bonus_codes',
				'page': 1,
				'status': status,
				'search': search
			});
		}, 1000);
	});
});

function pagination_addAdminBonusCodes(list){
	if(list.length > 0) {
		$('#admin_bonus_codes').empty();

		list.forEach(function(item){
			$('#admin_bonus_codes').append(tableAdminBonusCodesRow(item));
		});
	} else {
		$('#admin_bonus_codes').html(emptyTable({
			title: 'No data found'
		}));
	}
}

/* END ADMIN REWARDS */

/* ADMIN AFFILIATES */

$(document).ready(function() {
	$(document).on('click', '#pagination_admin_referrals .pagination-item', function() {
		var page = $(this).attr('data-page');

		var order = parseInt($('#admin_referrals_order').val());
		var search = $('#admin_referrals_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_referrals',
			'page': page,
			'order': order,
			'search': search
		});
	});

	var timeout_admin_referrals = null;
	$('#admin_referrals_search').on('input', function() {
		if(timeout_admin_referrals) clearTimeout(timeout_admin_referrals);

		timeout_admin_referrals = setTimeout(function(){
			var order = parseInt($('#admin_referrals_order').val());
			var search = $('#admin_referrals_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'admin_referrals',
				'page': 1,
				'order': order,
				'search': search
			});
		}, 1000);
	});

	$(document).on('change', '#admin_referrals_order', function() {
		var order = parseInt($('#admin_referrals_order').val());
		var search = $('#admin_referrals_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_referrals',
			'page': 1,
			'order': order,
			'search': search
		});
	});

	$(document).on('click', '#pagination_admin_referred_users .pagination-item', function() {
		var page = $(this).attr('data-page');

		var order = parseInt($('#admin_referred_users_order').val());
		var search = $('#admin_referred_users_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_referred_users',
			'page': page,
			'userid': app.paths[2],
			'order': order,
			'search': search
		});
	});
});

function pagination_addAdminReferrals(list){
	if(list.length > 0) {
		$('#admin_referrals').empty();

		list.forEach(function(item){
			$('#admin_referrals').append(tableAdminReferralsRow(item));
		});
	} else {
		$('#admin_referrals').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function pagination_addAdminReferredUsers(list){
	if(list.length > 0) {
		$('#admin_referred_users').empty();

		list.forEach(function(item){
			$('#admin_referred_users').append(tableAdminReferredUsersRow(item));
		});
	} else {
		$('#admin_referred_users').html(emptyTable({
			title: 'No data found'
		}));
	}
}

/* END ADMIN AFFILIATES */

/* ADMIN SUPPORT */

$(document).ready(function() {
	$(document).on('click', '#admin_support_claim', function() {
		var id = $(this).attr('data-id');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'support_claim_request',
				'id': id,
				'secret': secret
			});
		});
	});

    $(document).on('click', '#admin_support_release', function() {
		var id = $(this).attr('data-id');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'support_release_request',
				'id': id,
				'secret': secret
			});
		});
	});

    $(document).on('click', '#admin_support_change_department', function() {
		var id = $(this).attr('data-id');
        var department = $('#admin_support_department').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'support_change_request_department',
				'id': id,
				'department': department,
				'secret': secret
			});
		});
	});

    $(document).on('click', '#admin_support_reply', function() {
		var id = $(this).attr('data-id');
        var message = $('#admin_support_reply_message').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'support_reply_request',
				'id': id,
				'message': message,
				'secret': secret
			});

            $('#admin_support_reply_message').val('');
		});
	});

    $(document).on('click', '#admin_support_close', function() {
		var id = $(this).attr('data-id');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'support_close_request',
				'id': id,
				'secret': secret
			});
		});
	});

	var timeout_admin_referred_users = null;
	$('#admin_referred_users_search').on('input', function() {
		if(timeout_admin_referred_users) clearTimeout(timeout_admin_referred_users);

		timeout_admin_referred_users = setTimeout(function(){
			var order = parseInt($('#admin_referred_users_order').val());
			var search = $('#admin_referred_users_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'admin_referred_users',
				'page': 1,
				'userid': app.paths[2],
				'order': order,
				'search': search
			});
		}, 1000);
	});

	$(document).on('change', '#admin_referred_users_order', function() {
		var order = parseInt($('#admin_referred_users_order').val());
		var search = $('#admin_referred_users_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_referred_users',
			'page': 1,
			'userid': app.paths[2],
			'order': order,
			'search': search
		});
	});

    $(document).on('click', '#pagination_admin_support_requests .pagination-item', function() {
		var page = $(this).attr('data-page');

		var search = $('#admin_support_search').val();
		var status = parseInt($('#admin_support_filter_status').val());
		var department = parseInt($('#admin_support_filter_department').val());

		socket_emit({
			'type': 'pagination',
			'command': 'admin_support_requests',
			'page': page,
			'status': status,
			'department': department,
			'search': search
		});
	});

	$(document).on('change', '#admin_support_filter_status', function() {
		var search = $('#admin_support_search').val();
		var status = parseInt($('#admin_support_filter_status').val());
		var department = parseInt($('#admin_support_filter_department').val());

		socket_emit({
			'type': 'pagination',
			'command': 'admin_support_requests',
			'page': 1,
			'status': status,
			'department': department,
			'search': search
		});
	});

	$(document).on('change', '#admin_support_filter_department', function() {
		var search = $('#admin_support_search').val();
		var status = parseInt($('#admin_support_filter_status').val());
		var department = parseInt($('#admin_support_filter_department').val());

		socket_emit({
			'type': 'pagination',
			'command': 'admin_support_requests',
			'page': 1,
			'status': status,
			'department': department,
			'search': search
		});
	});

	var timeout_admin_support_requests = null;
	$('#admin_support_search').on('input', function() {
		if(timeout_admin_support_requests) clearTimeout(timeout_admin_support_requests);

		timeout_admin_support_requests = setTimeout(function(){
			var search = $('#admin_support_search').val();
            var status = parseInt($('#admin_support_filter_status').val());
            var department = parseInt($('#admin_support_filter_department').val());

			socket_emit({
				'type': 'pagination',
				'command': 'admin_support_requests',
				'page': 1,
				'status': status,
				'department': department,
				'search': search
			});
		}, 1000);
	});
});

function admin_supportAddReply(reply){
    var DIV = '<div class="flex flex-col gap-2">';
        DIV += '<div class="flex justify-between items-center gap-2 px-2">';
            DIV += '<div class="flex items-center gap-1 overflow-hidden">';
                DIV += createAvatarField(reply.user, 'size-8', '', '');

                DIV += '<div class="flex flex-col text-left overflow-hidden">';
                    DIV += '<div class="text-base truncate">' + reply.user.name + '</div>';

                    if(reply.response) {
                        DIV += '<div class="text-success text-xs">Support Staff</div>';
                    } else {
                        DIV += '<div class="text-danger text-xs">He</div>';
                    }
                DIV += '</div>';
            DIV += '</div>';

            DIV += '<div class="text-muted-foreground text-xs">' + reply.date + '</div>';
        DIV += '</div>';

        if(reply.response) {
            DIV += '<div class="message response bg-card p-4 text-left ml-6">';
                DIV += '<div class="flex flex-col gap-4 text-left mt-2">';
                    DIV += '<div class="text-muted-foreground">Greetings ' + reply.requester + ',</div>';

                    DIV += '<div>' + reply.message + '</div>';

                    DIV += '<div class="text-muted-foreground">';
                        DIV += '<div>All the best,</div>';
                        DIV += '<div>' + reply.user.name + '</div>';
                    DIV += '</div>';
                DIV += '</div>';
            DIV += '</div>';
        } else {
            DIV += '<div class="message bg-card p-4 text-left ml-6">' + reply.message + '</div>';
        }
    DIV += '</div>';

    $('#admin_support_messages').append(DIV);
}

function admin_supportSetStatus(closed, status){
    $('#admin_support_request_status').removeClass('bg-danger bg-opacity-50').removeClass('bg-warning bg-opacity-50').removeClass('bg-success bg-opacity-50').removeClass('bg-info bg-opacity-50');

    $('#admin_support_request_status').addClass([ { 0: 'bg-danger bg-opacity-50', 1: 'bg-warning bg-opacity-50', 2: 'bg-success bg-opacity-50' }[status], 'bg-info bg-opacity-50' ][closed]);
    $('#admin_support_request_status').text([ { 0: 'Opened', 1: 'Unsolved', 2: 'Answered' }[status], 'Solved' ][closed]);
}

function pagination_addAdminSupportRequests(list){
	if(list.length > 0) {
		$('#admin_support_requests').empty();

		list.forEach(function(item){
			$('#admin_support_requests').append(tableAdminSupportRequestsRow(item));
		});
	} else {
		$('#admin_support_requests').html(emptyTable({
			title: 'No requests found'
		}));
	}
}

/* END ADMIN SUPPORT */

/* ADMIN SYSTEM */

var admin_lastSetting = null;

$(document).ready(function() {
	$(document).on('click', '#admin_maintenance_set', function() {
		var status = parseInt($('#admin_maintenance_status').val()) == 1;
		var reason = $('#admin_maintenance_reason').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_set_maintenance',
				'status': status,
				'reason': reason,
				'secret': secret
			});
		});
	});

	$(document).on('click', '.admin_dropdown_settings', function() {
		var settings = $(this).attr('data-settings');
		var status = parseInt($('.admin_control_settings[data-settings="' + settings + '"]').val()) == 1;

		confirm_action(function(confirmed){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_set_settings',
				'settings': settings,
				'status': status
			});
		});
	});

	$(document).on('change', '.admin_switch_settings', function() {
		var settings = $(this).attr('data-settings');
		var status = $(this).prop('checked');

		$(this).prop('checked', !status);

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_set_settings',
				'settings': settings,
				'status': status,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_admin_access_set', function() {
		var userid = $('#admin_admin_access_userid').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_set_admin_access',
				'userid': userid,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_admin_access_unset', function() {
		var userid = $('#admin_admin_access_userid').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_unset_admin_access',
				'userid': userid,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_dashboard_access_set', function() {
		var userid = $('#admin_dashboard_access_userid').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'dashboard_access_set',
				'userid': userid,
				'secret': secret
			});
		});
	});

	$(document).on('click', '#admin_dashboard_access_unset', function() {
		var userid = $('#admin_dashboard_access_userid').val();

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'dashboard_access_unset',
				'userid': userid,
				'secret': secret
			});
		});
	});

	$(document).on('change', '#admin_tracking_links_never', function() {
		var checked = $(this).prop('checked');

		var $field = $('#admin_tracking_links_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	$(document).on('click', '#admin_tracking_links_create', function() {
		var name = $('#admin_tracking_links_name').val();

		var never = $('#admin_tracking_links_never').prop('checked');
		var expire = never ? -1 : parseInt($('#admin_tracking_links_expire').val());

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_create_tracking_link',
				'name': name,
				'expire': expire,
				'secret': secret
			});
		});
	});

	$(document).on('click', '.admin_tracking_links_remove', function() {
		var id = $(this).attr('data-id');

		confirm_identity(function(confirmed, secret){
			if(!confirmed) return;

			socket_emit({
				'type': 'admin',
				'command': 'settings_remove_tracking_link',
				'id': id,
				'secret': secret
			});
		});
	});

	$(document).on('click', '.admin_tracking_joins_dashboard', function() {
		var id = $(this).attr('data-id');

		var $dashboard = $('#modal_tracking_joins_dashboard .dashboard-chart');

		$dashboard.attr('data-id', id);

		$('#modal_tracking_joins_dashboard').modal('show');
	});

    $(document).on('show', '#modal_tracking_joins_dashboard', function() {
        var $dashboard = $('#modal_tracking_joins_dashboard .dashboard-chart');

		dashboard_loadGraph({ date: $dashboard.find('.dashboard-graph').val(), graph: $dashboard.attr('data-graph') + '.' + $dashboard.attr('data-id') });
    });

	$(document).on('click', '#pagination_admin_tracking_links .pagination-item', function() {
		var page = $(this).attr('data-page');
		var search = $('#admin_tracking_links_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'admin_tracking_links',
			'page': page,
			'search': search
		});
	});

	var timeout_admin_tracking_links = null;
	$('#admin_tracking_links_search').on('input', function() {
		if(timeout_admin_tracking_links) clearTimeout(timeout_admin_tracking_links);

		timeout_admin_tracking_links = setTimeout(function(){
			var search = $('#admin_tracking_links_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'admin_tracking_links',
				'page': 1,
				'search': search
			});
		}, 1000);
	});
});

function pagination_addTrackingLinks(list){
	if(list.length > 0) {
		$('#admin_tracking_links').empty();

		list.forEach(function(item){
			$('#admin_tracking_links').append(tableAdminTrackingLinksRow(item));
		});
	} else {
		$('#admin_tracking_links').html(emptyTable({
			title: 'No data found'
		}));
	}
}

function confirm_action(callback){
	$('#modal_confirm_action').modal('show');

	$(document).off('click', '#confirm_action_no');
	$(document).off('click', '#confirm_action_yes');

	$(document).on('click', '#confirm_action_no', function() { return callback(false); });

	$(document).on('click', '#confirm_action_yes', function() { return callback(true); });
}

function confirm_identity(callback){
	$('#modal_confirm_identity').modal('show');

	$(document).off('click', '#confirm_identity_no');
	$(document).off('click', '#confirm_identity_yes');

	$(document).on('click', '#confirm_identity_no', function() { return callback(false); });

	$(document).on('click', '#confirm_identity_yes', function() {
		var secret = $('#confirm_identity_secret').val();

		return callback(true, secret);
	});
}

/* END ADMIN SYSTEM */

/* HISTORY */

$(document).ready(function() {
	//app.paths[0] == 'home'
    if(profile_settingsGet('history') == 'game_bets' && app.paths[0] == '') {
		profile_settingsChange('history', 'all_bets');

		$('.bet-select .history-load').removeClass('active');
		$('.bet-select .history-load[data-type="all_bets"]').addClass('active');
	}

	$(document).on('click', '.history-load', function() {
		var history = $(this).attr('data-type');
		var game = app.paths[0];

		profile_settingsChange('history', history);

		$('.bet-select .history-load').removeClass('active');
		$('.bet-select .history-load[data-type="' + history + '"]').addClass('active');

		socket_emit({
			'type': 'history',
			'command': 'get',
			'history': history
		});
	});
});

function history_addHistory(history){
	$('#history_list > :not(.item)').remove();

	$('#history_list').prepend(tableLiveHistoryRow({
		...history,
		...{
			amount: getFormatAmountString(history.amount),
			multiplier: history.multiplier.toFixed(2),
			winning: getFormatAmountString(history.winning)
		}
	}));

	$('#history_list > .item:first-child').slideUp(0).slideDown('fast');

	while($('#history_list > .item').length > 10) $('#history_list > .item').last().remove();
}

/* END HISTORY */

/* FAQ */

$(document).ready(function() {
	$(document).on('click', '.faq-open', function() {
		if($(this).parent().parent().hasClass('active')){
			$(this).parent().parent().removeClass('active');
		} else {
			$(this).parent().parent().addClass('active');
		}
	});
});

/* END FAQ */

/* FAIR */

$(document).ready(function() {
	$(document).on('click', '#save_clientseed', function() {
		var client_seed = $('#client_seed').val();

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'fair',
				'command': 'save_clientseed',
				'seed': client_seed,
				'recaptcha': render
			});
		});
	});

	$(document).on('click', '#regenerate_serverseed', function() {
		requestRecaptcha(function(render){
			socket_emit({
				'type': 'fair',
				'command': 'regenerate_serverseed',
				'recaptcha': render
			});
		});
	});

	$(document).on('click', '.fair-results', function() {
		var fair = JSON.parse($(this).attr('data-fair').toString());

		$('#fair_server_seed_hashed').text('-');
		$('#fair_server_seed').text('-');
		$('#fair_public_seed').text('-');
		$('#fair_nonce').text('-');
		$('#fair_block').text('-');
		$('#fair_block_link').attr('href', '');

		$('#fair_server_seed_hashed').attr('data-text', '');
		$('#fair_server_seed').attr('data-text', '');
		$('#fair_public_seed').attr('data-text', '');
		$('#fair_nonce').attr('data-text', '');

		if(fair.server_seed_hashed) $('#fair_server_seed_hashed').text(fair.server_seed_hashed);
		if(fair.server_seed) $('#fair_server_seed').text(fair.server_seed);
		if(fair.public_seed) $('#fair_public_seed').text(fair.public_seed);
		if(fair.nonce) $('#fair_nonce').text(fair.nonce);
		if(fair.block) {
			$('#fair_block').text(fair.block);
			$('#fair_block_link').attr('href', 'https://eosflare.io/block/' + fair.block);
		}

		$('#fair_server_seed_hashed').attr('data-text', fair.server_seed_hashed);
		$('#fair_server_seed').attr('data-text', fair.server_seed);
		$('#fair_public_seed').attr('data-text', fair.public_seed);
		$('#fair_nonce').attr('data-text', fair.nonce);

		if(fair.draw){
			$('#fair_draw').removeClass('hidden');

			$('#fair_draw_public_seed').text('-');
			$('#fair_draw_block').text('-');
			$('#fair_draw_block_link').attr('href', '');

			if(fair.draw.public_seed) $('#fair_draw_public_seed').text(fair.draw.public_seed);

			if(fair.draw.block) {
				$('#fair_draw_block').text(fair.draw.block);
				$('#fair_draw_block_link').attr('href', 'https://eosflare.io/block/' + fair.draw.block);
			}
		} else {
			$('#fair_draw').addClass('hidden');
		}

		$('#modal_fair_round').modal('show');
	});
});

/* END FAIR */

/* SUPPORT */

$(document).ready(function() {
	$(document).on('click', '#support_create', function() {
		var subject = $('#support_subject').val();
		var department = $('#support_department').val();
		var message = $('#support_message').val();

		socket_emit({
            'type': 'support',
            'command': 'create',
            'subject': subject,
            'department': department,
            'message': message
        });
	});

    $(document).on('click', '#support_reply', function() {
		var id = $(this).attr('data-id');
		var message = $('#support_reply_message').val();

		socket_emit({
            'type': 'support',
            'command': 'reply',
            'id': id,
            'message': message
        });

        $('#support_reply_message').val('');
	});

    $(document).on('click', '#support_close', function() {
		var id = $(this).attr('data-id');

		socket_emit({
            'type': 'support',
            'command': 'close',
            'id': id
        });
	});
});

function support_addReply(reply){
    var DIV = '<div class="flex flex-col gap-2">';
        DIV += '<div class="flex justify-between items-center gap-2 px-2">';
            DIV += '<div class="flex items-center gap-1 overflow-hidden">';
                DIV += createAvatarField(reply.user, 'size-8', '', '');

                DIV += '<div class="flex flex-col text-left overflow-hidden">';
                    DIV += '<div class="text-base truncate">' + reply.user.name + '</div>';

                    if(reply.response) {
                        DIV += '<div class="text-success text-xs">Support Staff</div>';
                    } else {
                        DIV += '<div class="text-danger text-xs">Me</div>';
                    }
                DIV += '</div>';
            DIV += '</div>';

            DIV += '<div class="text-muted-foreground text-xs">' + reply.date + '</div>';
        DIV += '</div>';

        if(reply.response) {
            DIV += '<div class="message response bg-card p-4 text-left ml-6">';
                DIV += '<div class="flex flex-col gap-4 text-left mt-2">';
                    DIV += '<div class="text-muted-foreground">Greetings ' + reply.requester + ',</div>';

                    DIV += '<div>' + reply.message + '</div>';

                    DIV += '<div class="text-muted-foreground">';
                        DIV += '<div>All the best,</div>';
                        DIV += '<div>' + reply.user.name + '</div>';
                    DIV += '</div>';
                DIV += '</div>';
            DIV += '</div>';
        } else {
            DIV += '<div class="message bg-card p-4 text-left ml-6">' + reply.message + '</div>';
        }
    DIV += '</div>';

    $('#support_messages').append(DIV);
}

function support_setStatus(closed, status){
    $('#support_request_status').removeClass('bg-success bg-opacity-50').removeClass('bg-warning bg-opacity-50').removeClass('bg-info bg-opacity-50');

    $('#support_request_status').addClass([ { 0: 'bg-success bg-opacity-50', 1: 'bg-success bg-opacity-50', 2: 'bg-warning bg-opacity-50' }[status], 'bg-info bg-opacity-50' ][closed]);
    $('#support_request_status').text([ { 0: 'Opened', 1: 'Opened', 2: 'Awaiting your reply' }[status], 'Solved' ][closed]);
}

function pagination_addSupportRequests(list){
	if(list.length > 0) {
		$('#support_requests').empty();

		list.forEach(function(item){
			$('#support_requests').append(tableSupportRequestsRow(item));
		});
	} else {
		$('#support_requests').html(emptyTable({
			title: 'No requests found'
		}));
	}
}

/* END SUPPORT */

/* CHAT */

var chat_ignoreList = [];
var chat_isPaused = false;
var chat_maxMessages = 40;
var chat_messagesElapsed = {};

var chat_replyMessage = null;
var chat_rainLastElapsed = null;

function chat_message(message) {
	if(message.type == 'system'){
        var messageid = Math.floor(Math.random() * 100000);

		$('#chat-area').append(chatSystemMessage({
            id: messageid,
            message: message.message,
            time: getFormatTime(message.time * 1000, 'ago')
        }));

		if(chat_messagesElapsed[messageid] != null) {
			clearInterval(chat_messagesElapsed[messageid]);

			chat_messagesElapsed[messageid] = null;
		}

		var elapsed = message.time + 1;

		chat_messagesElapsed[messageid] = setInterval(function(){
			$('#chat-area .chat-message[data-message=' + messageid + '] .chat-message-time').text(getFormatTime(elapsed * 1000, 'ago'));

			elapsed++;
		}, 1000);
	} else if(message.type == 'player'){
		if(chat_ignoreList.includes(message.user.userid)) return;

	    $('#chat-area').append(chatUserMessage({
            id: message.id,
            user: message.user,
            rank: message.rank,
            message: chat_checkEmotes(chat_checkMention(message.message, message.mentions)),
            reply: message.reply ? {
                user: message.reply.user,
                message: chat_checkEmotes(chat_checkMention(message.reply.message, message.reply.mentions))
            } : null,
            time: getFormatTime(message.time * 1000, 'ago')
        }));

		if(chat_messagesElapsed[message.id] != null) {
			clearInterval(chat_messagesElapsed[message.id]);

			chat_messagesElapsed[message.id] = null;
		}

		var elapsed = message.time + 1;

		chat_messagesElapsed[message.id] = setInterval(function(){
			$('#chat-area .chat-message[data-message=' + message.id + '] .chat-message-time').text(getFormatTime(elapsed * 1000, 'ago'));

			elapsed++;
		}, 1000);
	}

	if(!chat_isPaused){
		while($('#chat-area .chat-message').length > chat_maxMessages) $('#chat-area .chat-message').first().remove();

		$('#chat-area').scrollTop(5000);

		setTimeout(function(){
			$('#chat-area').scrollTop(5000);
			$('#chat_paused').addClass('hidden');

			chat_isPaused = false;
		}, 200);
	}
}

function chat_checkEmotes(message) {
	var emotes = {
		'smile': 'png', 'smiley': 'png', 'grin': 'png', 'pensive': 'png', 'weary': 'png', 'astonished': 'png', 'rolling_eyes': 'png', 'relaxed': 'png', 'wink': 'png', 'woozy_face': 'png', 'zany_face': 'png', 'hugging': 'png', 'joy': 'png', 'sob': 'png', 'grimacing': 'png', 'rofl': 'png', 'face_monocle': 'png', 'thinking': 'png', 'pleading_face': 'png', 'sleeping': 'png', 'sunglasses': 'png', 'heart_eyes': 'png', 'smiling_hearts': 'png', 'kissing_heart': 'png', 'star_struck': 'png', 'nerd': 'png', 'innocent': 'png', 'face_vomiting': 'png', 'money_mouth': 'png', 'cold_sweat': 'png', 'partying_face': 'png', 'exploding_head': 'png', 'rage': 'png', 'hot_face': 'png', 'cold_face': 'png', 'smiling_imp': 'png', 'alien': 'png', 'clown': 'png', 'scream_cat': 'png', 'smiley_cat': 'png', 'robot': 'png', 'ghost': 'png', 'skull': 'png', 'poop': 'png', 'jack_o_lantern': 'png', '100': 'png', 'bell': 'png', 'birthday': 'png', 'gift': 'png', 'first_place': 'png', 'trophy': 'png', 'tada': 'png', 'crown': 'png', 'fire': 'png', 'heart': 'png', 'broken_heart': 'png', 'wave': 'png', 'clap': 'png', 'raised_hands': 'png', 'thumbsup': 'png', 'peace': 'png', 'ok_hand': 'png', 'muscle': 'png', 'punch': 'png', 'moneybag': 'png',
		'crypepe': 'png', 'firinpepe': 'png', 'happepe': 'png', 'monkachrist': 'png', 'okpepe': 'png', 'sadpepe': 'png',
		'gaben': 'png', 'kappa': 'png', 'kappapride': 'png', 'kim': 'png', 'pogchamp': 'png', 'shaq': 'png',
		'alert': 'gif', 'awp': 'gif', 'bananadance': 'gif', 'carlton': 'gif', 'fortdance': 'gif', 'grenade': 'gif', 'lolizard': 'gif', 'partyblob': 'gif', 'saxguy': 'gif', 'squidab': 'gif', 'turtle': 'gif', 'zombie': 'gif',
		'bet': 'png', 'cant': 'png', 'cashout': 'png', 'doit': 'png', 'dont': 'png', 'feelsbad': 'png', 'feelsgood': 'png', 'gg': 'png', 'gl': 'png', 'highroller': 'png', 'joinme': 'png', 'letsgo': 'png', 'win': 'png', 'lose': 'png', 'nice': 'png', 'sniped': 'png', 'midtick': 'png', 'lowtick': 'png'
	};

	Object.keys(emotes).forEach(function(item){
        message = message.replace(new RegExp(":" + item + ":( |$)", "g"), "<img class='size-4 pointer' src='/img/emojis/" + item + "." + emotes[item] + "'> ");
    });

	return message;
}

function chat_checkMention(message, mentions){
	mentions.forEach(function(mention){
		while(message.indexOf(mention.mention) != -1){
			if(mention.mention.replace('@', '') == USERID) {
				message = message.replace(mention.mention, '<div class="chat-mention inline-block bg-info rounded-1 px-1">' + mention.name + '</div>');
			} else {
				message = message.replace(mention.mention, mention.name);
			}
		}
	});

	return message;
}

function chat_checkScroll(){
	var scroll_chat = $('#chat-area').scrollTop() + $('#chat-area').innerHeight();
	var scroll_first_message = $('#chat-area')[0].scrollHeight;

	if(Math.ceil(scroll_chat) >= Math.floor(scroll_first_message)) return true;
	return false;
}

$(document).ready(function() {
	$(window).resize(function() {
		if(isOnMobile()) $('.pullout.active').css('width', $(window).width() + 'px');
	});

    if(isOnMobile()) resize_pullout('admin', true);

    setTimeout(function(){
        $('.pullout .pullout-content').addClass('transition duration-500');
        $('.slider').addClass('transition duration-500');

        $('.main-panel').addClass('transition duration-500');
    }, 10);
});

$(document).ready(function() {
	//FETCH CHAT COMMANDS
	$(document).on('click', '#chat-area .chat-message .overflow-menu:not(.active)', function(e) {
		$(this).closest('.chat-message').find('.overflow-menu .overflow-menu-select .overflow-menu-popover').replaceWith(overflowMenuPopover({
			items: [
				{
					link: false,
					destructive: false,
					label: 'Loading...'
				}
			]
		}));

		var message = parseInt($(this).closest('.chat-message').attr('data-message'));

		socket_emit({
			type: 'chat',
			command: 'commands',
			message: message
		});
	});

	//SELLECT LANGUAGE
	$('#chat_channel').on('change', function() {
		socket_emit({
			type: 'chat',
			command: 'channel',
			channel: $(this).val()
		});
	});

	//CHAT PAUSED
	$('#chat-area').bind('scroll', function() {
		if(chat_checkScroll()) {
			$('#chat_paused').addClass('hidden');

			chat_isPaused = false;
		} else {
			$('#chat_paused').removeClass('hidden');

			chat_isPaused = true;
		}
	});

	$('#chat_paused').on('click', function(){
		$('#chat_paused').addClass('hidden');

		chat_isPaused = false;

		$('#chat-area').animate({
			scrollTop: 5000
		},{
			duration: 500
		});
	});

	//SHOW / HIDE EMOGIES
	$(document).on('click', '.emojis-menu:not(.active)', function(e) {
		$(this).addClass('active');
	});

	$(document).on('click', '*', function(e) {
		if(e.target !== this) return;

        $('.emojis-menu.active').removeClass('active');
	});

	//WRITE EMOGIES
	$(document).on('click', '.emojis-menu .emojis-menu-select .emojis-menu-popover .item', function() {
		var emoji = $(this).data('emoji');

		$('#chat_message').val($('#chat_message').val() + emoji + ' ').focus();
	});

	//WRITE COMMAND
	$(document).on('click', '.chat_write_command', function(){
		var command = $(this).data('command');

		if($('#chat_message').val().toString().trim().length > 0) $('#chat_message').val($('#chat_message').val().toString().trim() + ' ' + command).focus();
		else $('#chat_message').val(command).focus();
	});

	//SEND COMMAND
	$(document).on('click', '.chat_send_command', function(){
		var command = $(this).data('command');

		socket_emit({
			type: 'chat',
			command: 'message',
			message: command,
			channel: profile_settingsGet('channel')
		});
	});

	//SEND COINS
	$(document).on('click', '#send_tip_player', function(){
		var amount = $('#tip_player_amount').val();
		var userid = $(this).attr('data-userid');

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'account',
				'command': 'tip',
				'userid': userid,
				'amount': amount,
				'recaptcha': render
			});
		});
	});

	//MUTE PLAYER
	$(document).on('click', '#mute_player_set', function() {
		var reason = $('#mute_player_reason').val();

		var permanent = $('#mute_player_permanent').prop('checked');
		var expire = permanent ? -1 : parseInt($('#mute_player_expire').val());

		var userid = $(this).attr('data-userid');

		socket_emit({
			'type': 'account',
			'command': 'mute',
			'userid': userid,
			'reason': reason,
			'expire': expire
		});
	});

	$(document).on('change', '#mute_player_permanent', function() {
		var checked = $(this).prop('checked');

		var $field = $('#mute_player_expire').closest('.date-picker');

		if(checked) {
			$field.addClass('disabled');

			clearErrorDatePicker($field)
		} else $field.removeClass('disabled');
	});

	//SUBMIT MESSAGE
	$('#chat_form').on('submit', function() {
		var message = $('#chat_message').val();

		if (message.toString().trim().length > 0) {
			socket_emit({
				type: 'chat',
				command: 'message',
				message: message,
				channel: profile_settingsGet('channel'),
				reply: chat_replyMessage
			});

			$('#chat_message').val('');

			$('#chat_reply').addClass('hidden');

			chat_replyMessage = null;
		}

		return false;
	});

	//REPLY MESSAGE
	$(document).on('click', '.chat_reply_message', function(){
		var reply = JSON.parse($(this).attr('data-reply'));

		chat_replyMessage = reply.id;

		$('#chat_reply').find('.avatar').attr('src', reply.user.avatar);
		$('#chat_reply').find('.name').text(reply.user.name);

		$('#chat_reply').find('.message').html(reply.message);

		$('#chat_reply').removeClass('hidden');

		if(chat_checkScroll()) {
			$('#chat_paused').addClass('hidden');

			chat_isPaused = false;
		} else {
			$('#chat_paused').removeClass('hidden');

			chat_isPaused = true;
		}

		$('#chat_message').focus();
	});

	$(document).on('click', '#chat_reply_close', function(){
		$('#chat_reply').addClass('hidden');

		chat_replyMessage = null;
	});

	//RAIN
	$(document).on('click', '#chat_rain_join', function(){
		requestRecaptcha(function(render){
			socket_emit({
				'type': 'rain',
				'command': 'join',
				'recaptcha': render
			});
		});
	});

	$(document).on('click', '#chat_rain_tip', function(){
		var amount = getFormatAmount($('#chat_rain_tip_amount').val());

		socket_emit({
			'type': 'rain',
			'command': 'tip',
			'amount': amount
		});
	});
});

/* END CHAT */

/* ROULETTE */

var spinnerSize_Roulette = 0;
var lastSpinner_Roulette = 0;
var timeSpinner_Roulette = 0;
var viewSpinner_Roulette = 0;
var beginTimeSpinner_Roulette = 0;
var movingSpinner_Roulette = false;
var durationSpinner_Roulette = 9;

var partSpinnerSize_Roulette = 90;

function rouletteGame_finish(roll, greens) {
	sounds_play('roulette_end');

	$('#roulette_jackpot_greens .item').removeClass('active');
	for(var i = 1; i <= greens; i++) $('#roulette_jackpot_greens .item[data-green="' + i + '"]').addClass('active');

	rouletteGame_addHistory({ roll: roll.roll, colors: roll.colors });

	var cats = [
		[ 'green', 14 ],
		[ 'red', 2 ],
		[ 'black', 2 ],
		[ 'bait', 7 ]
	];

	var winbet = false;
	if(winbet) sounds_play('cashout');

	var order = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8];
	var index = order.indexOf(roll.roll);

	var distance = index * partSpinnerSize_Roulette;

	var distance1 = distance + Math.floor(roll.progress * partSpinnerSize_Roulette);
	var distance2 = distance + Math.floor(partSpinnerSize_Roulette / 2);

	rotateSpinner_Roulette(distance1, false);

	setTimeout(function(){
		$('#roulette_spinner').addClass('transition duration-500');
		rotateSpinner_Roulette(distance2, false);

		setTimeout(function(){
			$('#roulette_spinner').removeClass('transition duration-500');

			$('#roulette_spinner .reel-item:not(:nth-child(' + (index + 1) + '))').addClass('loss');
			$('#roulette_spinner .reel-item:nth-child(' + (index + 1) + ')').addClass('won');
		}, 500);
	}, 100);

	setTimeout(function(){
		$('#roulette_spinner .reel-item').removeClass('loss').removeClass('won');
	}, 3000);

	setTimeout(function(){
		initializingSpinner_Roulette(roll);
	}, 1000);

	setTimeout(function() {
		$('.roulette-betstotal .amount').text(getFormatAmountString(0));
		$('.roulette-betstotal .count').text(0);
		$('.roulette-betslist').empty();
	}, 2000);
}

function rouletteGame_addHistory(roll) {
	$('#roulette_rolls').prepend(rouletteHistory(roll));

	while($('#roulette_rolls .item').length > 10) $('#roulette_rolls .item').last().remove();
}

function rouletteGame_addBet(bet) {
    $('#roulette_panel_' + bet.color + ' .roulette-betslist').prepend(rouletteBet({
		...bet,
		...{
			amount: getFormatAmountString(bet.amount)
		}
	}));

	$('#roulette_panel_' + bet.color + ' .roulette-betslist .roulette-betitem[data-id="' + bet.id + '"]').slideUp(0).slideDown('fast');

	try {
		tinysort('#roulette_panel_red > .roulette-betslist > .roulette-betitem', {
			data: 'amount',
			order: 'desc'
		});
	} catch (e) {}

    try {
		tinysort('#roulette_panel_green > .roulette-betslist > .roulette-betitem', {
			data: 'amount',
			order: 'desc'
		});
	} catch (e) {}

	try {
		tinysort('#roulette_panel_black > .roulette-betslist > .roulette-betitem', {
			data: 'amount',
			order: 'desc'
		});
	} catch (e) {}
}

function renderSpinner_Roulette() {
	var time = new Date().getTime() - beginTimeSpinner_Roulette;
	if (time > timeSpinner_Roulette) time = timeSpinner_Roulette;

	var deg = viewSpinner_Roulette * (Math.pow((0.99 + 0.001 * durationSpinner_Roulette), time) - 1) / Math.log((0.99 + 0.001 * durationSpinner_Roulette));

	rotateSpinner_Roulette(deg, true);

	if(time < timeSpinner_Roulette) {
		setTimeout(function(){
			renderSpinner_Roulette();
		}, 1);
	} else {
		lastSpinner_Roulette = deg;
		movingSpinner_Roulette = false;
	}
}

function rotateSpinner_Roulette(offset, truncate) {
	if(truncate) offset = -((offset - spinnerSize_Roulette / 2) % (partSpinnerSize_Roulette * 15)) - (partSpinnerSize_Roulette * 15);
	else offset = -(offset - spinnerSize_Roulette / 2) - (partSpinnerSize_Roulette * 15);

	$('#roulette_spinner').css('transform', 'translate3d(' + offset + 'px, 0px, 0px)');
}

function initializingSpinner_Roulette(roll) {
	spinnerSize_Roulette = $('#roulette_case').width();

	if(!movingSpinner_Roulette){
		if (roll === undefined) {
			rotateSpinner_Roulette(lastSpinner_Roulette, true);
		} else {
			var order = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8];
			var index = order.indexOf(roll.roll);

			var distance = index * partSpinnerSize_Roulette;
			distance += Math.floor(partSpinnerSize_Roulette / 2);

			lastSpinner_Roulette = distance;

			rotateSpinner_Roulette(lastSpinner_Roulette, false);
		}
	}
}

function startSpinner_Roulette(roll, greens, cooldown) {
	initializingSpinner_Roulette();

	var order = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8];
	var index = order.indexOf(roll.roll);

	var distance = index * partSpinnerSize_Roulette;
	distance += (partSpinnerSize_Roulette * 15) * 5;
	distance += Math.floor(roll.progress * partSpinnerSize_Roulette);

	beginTimeSpinner_Roulette = new Date().getTime() - cooldown * 1000;
	viewSpinner_Roulette = 0.01 - distance * Math.log((0.99 + 0.001 * durationSpinner_Roulette));
	timeSpinner_Roulette = (Math.log(0.01) - Math.log(viewSpinner_Roulette)) / Math.log((0.99 + 0.001 * durationSpinner_Roulette));
	movingSpinner_Roulette = true;

	renderSpinner_Roulette();

	setTimeout(function() {
		rouletteGame_finish(roll, greens);
	}, timeSpinner_Roulette - cooldown * 1000);
}

function rouletteGame_timer(time, cooldown) {
	$('.roulette-bet').removeClass('disabled');

	$('#roulette_counter').animate({
		'width': '0'
	}, {
		'duration': time * 1000,
		'easing': 'linear',
		'progress': function(animation, progress, remaining) {
			var las = remaining / 1000 * 100 / cooldown;
			$('#roulette_counter').css('width', las + '%');
		}
	});
}

$(document).ready(function() {
	$('.roulette-bet').on('click', function() {
		$(this).addClass('disabled');

		var amount = $('#betamount_roulette').val();
		var color = $(this).data('color');

		socket_emit({
			'type': 'roulette',
			'command': 'bet',
			'amount': amount,
			'color': color
		});
	});

    $(document).on('click', '#roulette_jackpot_history', function() {
		socket_emit({
			'type': 'roulette',
			'command': 'jackpot_history'
		});
	});

	$(document).on('click', '.roulette-jackpot-winners', function() {
		var id = $(this).attr('data-id');

		socket_emit({
			'type': 'roulette',
			'command': 'jackpot_winners',
			'id': id
		});
	});

	$(document).on('click', '.betshort_action[data-game="roulette"]', function() {
		sounds_play('select');
	});
});

/* END ROULETTE */

/* CRASH */

var crashGame_timeout = null;

function crashGame_resize(){
    if(crashGame_timeout) {
        clearTimeout(crashGame_timeout);

        crashGame_timeout = null;
    }

    crashGame_timeout = setTimeout(function(){
        $('#crash_canvas').addClass('hidden');

        var width = $('#crash_canvas').parent().width();
        var height = $('#crash_canvas').parent().height();

        if(width <= 0) width = 100;
        if(height <= 0) height = 100;

        canvas.width = width;
        canvas_responsive = 0;

        if(width > 750) {
            width = 750;

            canvas_responsive = 1;
        }

        canvas.height = height;

        $('#crash_canvas').removeClass('hidden');
    }, 10);
}

function crashGame_addGame(bet) {
	$('#crash_betlist > :not(.item)').remove();

	$('#crash_betlist').prepend(crashBet({
		...bet,
		...{
			amount: getFormatAmountString(bet.amount),
			profit: bet.profit ? getFormatAmountString(bet.profit) : null
		}
	}));

	$('#crash_betlist > .item[data-id="' + bet.id + '"]').slideUp(0).slideDown('fast');
}

function crashGame_addHistory(crash){
	$('#crash_history').prepend(crashHistory({ value: crash }));

	while($('#crash_history .item').length > 20) $('#crash_history .item').last().remove();
}

function crashGame_editBet(bet){
	$('#crash_betlist > .item[data-id="' + bet.id + '"] .at').text(roundedToFixed(bet.cashout, 2).toFixed(2));
	$('#crash_betlist > .item[data-id="' + bet.id + '"] .profit').text(getFormatAmountString(bet.profit));
	$('#crash_betlist > .item[data-id="' + bet.id + '"]').removeClass('text-primary').addClass('text-success');
}

$(document).ready(function() {
	$('#crash_bet').on('click', function() {
		$(this).addClass('disabled');

		var amount = $('#betamount_crash').val();
		var auto = Math.floor($('#betauto_crash').val() * 100);

		socket_emit({
			'type': 'crash',
			'command': 'bet',
			'amount': amount,
			'auto': auto
		});
	});

	$('#crash_cashout').on('click', function() {
		$(this).addClass('disabled');

		socket_emit({
			'type': 'crash',
			'command': 'cashout'
		});
	});

	$(document).on('click', '.betshort_action[data-game="crash"]', function() {
		sounds_play('select');
	});

	$(document).on('click', '.changeshort_action[data-id="#betauto_crash"]', function() {
		sounds_play('select');
	});
});

/* END CRASH */

/* JACKPOT */

var spinnerSize_Jackpot = 0;
var lastSpinner_Jackpot = 0;
var timeSpinner_Jackpot = 0;
var viewSpinner_Jackpot = 0;
var beginTimeSpinner_Jackpot = 0;
var movingSpinner_Jackpot = false;
var durationSpinner_Jackpot = 9;

var idleTimeSpinner_Jackpot = 0;
var idleSpinner_Jackpot = false;

var partSpinnerSize_Jackpot = 90;

function jackpotGame_addBet(bet){
	$('#jackpot_betlist > :not(.item)').remove();

	$('#jackpot_betlist').prepend(jackpotBet({
		...bet, ...{
			amount: getFormatAmountString(bet.amount)
		}
	}));
}

function renderSpinner_Jackpot() {
	var time = new Date().getTime() - beginTimeSpinner_Jackpot;
	if (time > timeSpinner_Jackpot) time = timeSpinner_Jackpot;

	var deg = viewSpinner_Jackpot * (Math.pow((0.99 + 0.001 * durationSpinner_Jackpot), time) - 1) / Math.log((0.99 + 0.001 * durationSpinner_Jackpot));

	rotateSpinner_Jackpot(deg);

	if(time < timeSpinner_Jackpot) {
		setTimeout(function(){
			renderSpinner_Jackpot();
		}, 1);
	} else {
		lastSpinner_Jackpot = deg;
		movingSpinner_Jackpot = false;
	}
}

function rotateSpinner_Jackpot(offset) {
	offset = -(offset - spinnerSize_Jackpot / 2);
	$('#jackpot_spinner').css('transform', 'translate3d(' + offset + 'px, 0px, 0px)');
}

function initializingSpinner_Jackpot() {
	spinnerSize_Jackpot = $('#jackpot_case').width();

	if(!movingSpinner_Jackpot) rotateSpinner_Jackpot(lastSpinner_Jackpot);
}

function startSpinner_Jackpot() {
	initializingSpinner_Jackpot();

	var distance = partSpinnerSize_Jackpot * 99;
	distance += Math.floor(partSpinnerSize_Jackpot / 2);

	beginTimeSpinner_Jackpot = new Date().getTime();
	viewSpinner_Jackpot = 0.01 - distance * Math.log((0.99 + 0.001 * durationSpinner_Jackpot));
	timeSpinner_Jackpot = (Math.log(0.01) - Math.log(viewSpinner_Jackpot)) / Math.log((0.99 + 0.001 * durationSpinner_Jackpot));
	movingSpinner_Jackpot = true;

	renderSpinner_Jackpot();
}

function idleAnimationSpinner_Jackpot(){
	idleTimeSpinner_Jackpot = new Date().getTime();

	setInterval(function(){
		if(idleSpinner_Jackpot){
			var distance = partSpinnerSize_Jackpot * 12;
			distance += Math.floor(partSpinnerSize_Jackpot / 2);

			distance += (0.1 * (new Date().getTime() - idleTimeSpinner_Jackpot)) % (partSpinnerSize_Jackpot * 25);

			lastSpinner_Jackpot = distance;
			initializingSpinner_Jackpot();
		}
	}, 1);
}

function jackpotGame_addHistory(history){
    $('#jackpot_histories').prepend(jackpotHistory({
		...history,
		...{
			amount: getFormatAmountString(history.amount),
			chance: history.chance.toFixed(2),
			bets: history.bets.map(a => ({
				...a,
				...{
					amount: getFormatAmountString(a.amount)
				}
			}))
		}
	}));

	while($('#jackpot_histories .jackpot_historyitem').length > 5) $('#jackpot_histories .jackpot_historyitem').last().remove();
}

$(document).ready(function() {
	$(document).on('click', '#jackpot_bet', function(){
		$(this).addClass('disabled');

		var amount = $('#betamount_jackpot').val();

		socket_emit({
			'type': 'jackpot',
			'command': 'bet',
			'amount': amount
		});
	});

	$(document).on('click', '.betshort_action[data-game="jackpot"]', function() {
		sounds_play('select');
	});
});

/* END JACKPOT */

/* COINFLIP */

var coinflipGame_countdowns = {};

function coinflipGame_addCoinFlip(coinflip){
	$('#coinflip_betlist .coinflip-game:not(.active)').first().html(coinflipBet({
        id: coinflip.id,
        status: 0,
        players: coinflip.players,
        amount: getFormatAmountString(coinflip.amount),
        joined: coinflip.players.some(a => a.user.userid == USERID),
		creator: coinflip.players.some(a => a.user.userid == coinflip.creator && a.user.userid == USERID),
        data: coinflip.data
    })).addClass('active');

	if(coinflip.status == 1) {
		if(coinflipGame_countdowns[coinflip.id] != null) {
			clearInterval(coinflipGame_countdowns[coinflip.id]);

			coinflipGame_countdowns[coinflip.id] = null;
		}

		var countdown = coinflip.data.time - 1;

		coinflipGame_countdowns[coinflip.id] = setInterval(function(){
			$('#coinflip_betlist .coinflip-game .item[data-id="' + coinflip.id + '"] .countdown').text(countdown);

			if(countdown <= 0) {
				clearInterval(coinflipGame_countdowns[coinflip.id]);

				delete coinflipGame_countdowns[coinflip.id];

				return;
			}

			countdown--;
		}, 1000);
	}

	var last_game = $('#coinflip_betlist .coinflip-game.active').last().index() + 1;
	for(var i = 0; i < (last_game % 5 == 0 ? 1 : 0) * 5; i++) {
		$('#coinflip_betlist').append('<div class="coinflip-game bg-secondary rounded-2 border-2 border-card"></div>');
	}
}

function coinflipGame_editCoinFlip(coinflip){
	$('#coinflip_betlist .coinflip-game .item[data-id="' + coinflip.id + '"]').replaceWith(coinflipBet({
        id: coinflip.id,
        status: coinflip.status,
        players: coinflip.players,
        amount: getFormatAmountString(coinflip.amount),
        joined: coinflip.players.some(a => a.user.userid == USERID),
		creator: coinflip.players.some(a => a.user.userid == coinflip.creator && a.user.userid == USERID),
        data: coinflip.data
    }));

	if(coinflip.status == 1) {
		if(coinflipGame_countdowns[coinflip.id] != null) {
			clearInterval(coinflipGame_countdowns[coinflip.id]);

			coinflipGame_countdowns[coinflip.id] = null;
		}

		var countdown = coinflip.data.time - 1;

		coinflipGame_countdowns[coinflip.id] = setInterval(function(){
			$('#coinflip_betlist .coinflip-game .item[data-id="' + coinflip.id + '"] .countdown').text(countdown);

			if(countdown <= 0) {
				clearInterval(coinflipGame_countdowns[coinflip.id]);

				delete coinflipGame_countdowns[coinflip.id];

				return;
			}

			countdown--;
		}, 1000);
	}

    if(coinflip.status == 3){
        setTimeout(function(){
            sounds_play('coinflip_start');
        }, 2000);
    }
}

$(document).ready(function() {
	$(document).on('click', '.coinflip-join', function() {
		$(this).addClass('disabled');

		var id = $(this).attr('data-id');

		socket_emit({
			type: 'coinflip',
			command: 'join',
			id: id
		});
	});

	$(document).on('click', '.coinflip-callbot', function() {
		$(this).addClass('disabled');

		var id = $(this).attr('data-id');

		socket_emit({
			'type': 'gamebots',
			'command': 'confirm',
			'game': 'coinflip',
			'data': {
				'id': id
			}
		});
	});

	$(document).on('click', '.coinflip-select', function(){
		$('.coinflip-select').removeClass('active');
		$(this).addClass('active');

		sounds_play('select');
	});

	$('#coinflip_create').click(function() {
		$(this).addClass('disabled');

		var amount = $('#betamount_coinflip').val();
		var position = parseInt($('.coinflip-select.active').attr('data-position'));

		socket_emit({
			type: 'coinflip',
			command: 'create',
			amount: amount,
			position: position
		});
	});

	$(document).on('click', '.betshort_action[data-game="coinflip"]', function() {
		sounds_play('select');
	});
});

/* END COINFLIP */

/* DICE */

var spinnerSize_Dice = 0;
var lastSpinner_Dice = [ 0, 0, 0, 0 ];
var timeSpinner_Dice = [ 0, 0, 0, 0 ];
var viewSpinner_Dice = [ 0, 0, 0, 0 ];
var beginTimeSpinner_Dice = [ 0, 0, 0, 0 ];
var movingSpinner_Dice = [ false, false, false, false ];

var durationSpinner_Dice = 6;
var partSpinnerSize_Dice = 110;

$(document).ready(function() {
    diceGame_initializeSpinner();

	$(window).resize(function() {
		diceGame_initializeSpinner();
	});

	$('#dice_chanceslider').on('input', function(){
		diceGame_checkChanceSlider();
	});

	$('#dice_chanceinput').on('input', function(){
		diceGame_checkChanceInput();
	});

	$(document).on('click', '.dice-mode', function(){
		$('.dice-mode').removeClass('active');
		$(this).addClass('active');

		diceGame_assign();

		sounds_play('select');
	});

	$(document).on('click', '#dice_bet', function(){
		$(this).addClass('disabled');

		var amount = $('#betamount_dice').val();
		var chance = $('#dice_chanceslider').val();

		var mode = $('.dice-mode.active').attr('data-mode');

		socket_emit({
			type: 'dice',
			command: 'bet',
			amount: amount,
			chance: chance,
			mode: mode
		});
	});

	diceGame_updateSlider();

	$(document).on('input', '.dice-slider .chance input:not(.disabled)', function() {
		diceGame_updateSlider();
	});

	$(document).on('change', '.dice-slider .chance input:not(.disabled)', function() {
		diceGame_updateSlider();
	});

	$(document).on('click', '.betshort_action[data-game="dice"]', function() {
		diceGame_assign();

		sounds_play('select');
	});
});

function renderSpinner_Dice(index) {
	var time = new Date().getTime() - beginTimeSpinner_Dice[index];
	if (time > timeSpinner_Dice[index]) time = timeSpinner_Dice[index];

	var deg = viewSpinner_Dice[index] * (Math.pow((0.99 + 0.001 * durationSpinner_Dice), time) - 1) / Math.log((0.99 + 0.001 * durationSpinner_Dice));

	rotateSpinner_Dice(deg, index);

	if(time < timeSpinner_Dice[index]) {
		setTimeout(function(){
			renderSpinner_Dice(index);
		}, 1);
	} else {
		lastSpinner_Dice[index] = deg;
		movingSpinner_Dice[index] = false;
	}
}

function initializingSpinner_Dice() {
	spinnerSize_Dice = $('#dice_case').height();

	for(var i = 0; i < 4; i++){
		lastSpinner_Dice[i] = 9 * partSpinnerSize_Dice + partSpinnerSize_Dice / 2

		if(!movingSpinner_Dice[i]) rotateSpinner_Dice(lastSpinner_Dice[i], i);
	}
}

function rotateSpinner_Dice(offset, index) {
	offset = -((partSpinnerSize_Dice * 10 * 5 - offset - spinnerSize_Dice / 2) % (partSpinnerSize_Dice * 10)) - (partSpinnerSize_Dice * 10);

	$('#dice_spinner[data-id="' + index + '"]').css('transform', 'translate3d(0px, ' + offset + 'px, 0px)');
}

function startSpinner_Dice(roll, index) {
	initializingSpinner_Dice();

	var distance = (9 - roll) * partSpinnerSize_Dice;
	distance += partSpinnerSize_Dice * 10 * 5;
	distance += Math.floor(0.5 * partSpinnerSize_Dice);

	beginTimeSpinner_Dice[index] = new Date().getTime();
	viewSpinner_Dice[index] = 0.01 - distance * Math.log((0.99 + 0.001 * durationSpinner_Dice));
	timeSpinner_Dice[index] = (Math.log(0.01) - Math.log(viewSpinner_Dice[index])) / Math.log((0.99 + 0.001 * durationSpinner_Dice));
	movingSpinner_Dice[index] = true;

	renderSpinner_Dice(index);
}

function diceGame_initializeSpinner(){
    if(isOnMobile()) partSpinnerSize_Dice = 80;
    else partSpinnerSize_Dice = 110;

    initializingSpinner_Dice();
}

function diceGame_updateSlider(){
	var $slider = $('#dice_chanceslider');

	var min = parseInt($slider.prop('min') || 0);
	var max = parseInt($slider.prop('max') || 0);

	var percentage = (parseFloat($slider.val()) - min) / (max - min) * 100;

	$slider.css('backgroundSize', percentage + '% 100%');

	var mode = $('.dice-mode.active').attr('data-mode');

	if(mode == 'under') $slider.css('transform', 'rotateY(0deg)');
	else if(mode == 'over') $slider.css('transform', 'rotateY(180deg)');
}

function diceGame_checkChanceSlider() {
	var chance = $('#dice_chanceslider').val();

	chance = getNumberFromString(chance);
	chance = roundedToFixed(chance, 2);

	if(chance > 100 - games_houseEdges.dice || 0) chance = 100 - games_houseEdges.dice || 0;
	if(chance < 0.01) chance = 0.01;

	$('#dice_chanceslider').val(chance.toFixed(2));
	$('#dice_chanceinput').val(chance.toFixed(2));

	diceGame_assign();
}

function diceGame_checkChanceInput() {
	var chance = $('#dice_chanceinput').val();

	chance = getNumberFromString(chance);
	chance = roundedToFixed(chance, 2);

	if(chance > 100 - games_houseEdges.dice || 0) chance = 100 - games_houseEdges.dice || 0;
	if(chance < 0.01) chance = 0.01;

	$('#dice_chanceslider').val(chance.toFixed(2));
	$('#dice_chanceinput').val(chance);

	diceGame_assign();
}

function diceGame_assign() {
	var chance = $('#dice_chanceslider').val();
	chance = getNumberFromString(chance);
	chance = roundedToFixed(chance, 2);

	var multiplier = roundedToFixed((100 - games_houseEdges.dice || 0) / chance, 2);
	$('#dice_multiplier').val(multiplier.toFixed(2));

	$('#dice_chanceslider').trigger('change');
}

function diceGame_roll(roll){
	for(let i = 0; i < 4; i++){
		setTimeout(function(){
			var number = Math.floor(Math.floor(roll * 100) / Math.pow(10, 3 - i)) % 10;

			startSpinner_Dice(number, i);

			setTimeout(function(){
				sounds_play('dice_stop');
			}, 1700);
		}, i * 200);
	}
}

/* END DICE */

/* MINESWEEPER */

var minesweeperGame_interval = null;

$(document).ready(function() {
	$(document).on('click', '#minesweeper_bet', function() {
		$(this).addClass('disabled');

		var amount = $('#betamount_minesweeper').val();
		var bombs = $('#bombsamount_minesweeper').val();

		socket_emit({
			'type': 'minesweeper',
			'command': 'bet',
			'bombs': bombs,
			'amount': amount
		});
	});

	$(document).on('click', '#minesweeper_bombs .item', function() {
		var bomb = $(this).data('bomb');

		socket_emit({
			'type': 'minesweeper',
			'command': 'bomb',
			'bomb': bomb
		});
	});

	$(document).on('click', '#minesweeper_cashout', function() {
		$(this).addClass('disabled');

		socket_emit({
			'type': 'minesweeper',
			'command': 'cashout'
		});
	});

	$(document).on('click', '.minesweeper-bombsamount', function() {
		var amount = parseInt($(this).attr('data-amount'));

		$('.minesweeper-bombsamount').removeClass('active');
		$(this).addClass('active');

		$('#bombsamount_minesweeper').val(amount);

		sounds_play('select');
	});

	$(document).on('input', '#bombsamount_minesweeper', function() {
		var amount = parseInt($(this).val());

		$('.minesweeper-bombsamount').removeClass('active');
		$('.minesweeper-bombsamount[data-amount="' + amount + '"]').addClass('active');
	});

	$(document).on('click', '.changeshort_action[data-id="#bombsamount_minesweeper"]', function() {
		sounds_play('select');
	});

	$(document).on('click', '.betshort_action[data-game="minesweeper"]', function() {
		sounds_play('select');
	});
});

/* END MINESWEEPER */

/* TOWER */

var towerGame_multipliers = {};
var towerGame_difficulty = 'medium';

var towerGame_tiles = {
	'easy': 4,
	'medium': 3,
	'hard': 2,
	'expert': 3,
	'master': 4
};

function towerGame_generateTiles(){
	$('#tower_grid').removeClass('easy').removeClass('medium').removeClass('hard').removeClass('expert').removeClass('master')
	$('#tower_grid').addClass(towerGame_difficulty);

	var DIV = '';

	for(var i = 8; i >= 0; i--){
		for(var j = 0; j < towerGame_tiles[towerGame_difficulty]; j++){
			DIV += '<div class="item flex justify-center items-center rounded-2 relative transition duration-200 disabled" data-stage="' + i + '" data-button="' + j + '">0.00</div>';
		}
	}

	$('#tower_grid').html(DIV);

	var amount = $('#betamount_tower').val();

	amount = getNumberFromString(amount);
	amount = getFormatAmount(amount);

	towerGame_generateAmounts(amount);
}

function towerGame_generateAmounts(amount){
	for(var i = 0; i < towerGame_multipliers[towerGame_difficulty].length; i++){
		$('#tower_grid .item[data-stage="' + i + '"]').text((amount * towerGame_multipliers[towerGame_difficulty][i]).toFixed(2));
	}
}

$(document).ready(function() {
	$(document).on('input', '#betamount_tower', function() {
		var amount = $(this).val();

		amount = getNumberFromString(amount);
		amount = getFormatAmount(amount);

        towerGame_generateAmounts(amount);
	});

	$(document).on('click', '#tower_bet', function(){
		$(this).addClass('disabled');

		var amount = $('#betamount_tower').val();

		socket_emit({
			'type': 'tower',
			'command': 'bet',
			'amount': amount,
			'difficulty': towerGame_difficulty
		});
	});

	$(document).on('click', '#tower_grid .item', function(){
		var stage = $(this).data('stage');
		var button = $(this).data('button');

		socket_emit({
			'type': 'tower',
			'command': 'stage',
			'stage': stage,
			'button': button
		});
	});

	$(document).on('click', '#tower_cashout', function(){
		$(this).addClass('disabled');

		socket_emit({
			'type': 'tower',
			'command': 'cashout'
		});
	});

	$(document).on('change', '#tower_difficulty', function(){
		towerGame_difficulty = $(this).val();

		towerGame_generateTiles();

		sounds_play('select');
	});

	$(document).on('click', '.betshort_action[data-game="tower"]', function() {
		towerGame_generateAmounts(bet_amount);

		sounds_play('select');
	});
});

/* END TOWER */

/* PLINKO */

var plinkoGame_multipliers = {};
var plinkoGame_betsRoll = {};

function plinkoGame_play(id, roll){
	$('#plinko_balls').append(plinkoBall({ id }));

	if(plinkoGame_betsRoll[id] != null) {
		clearInterval(plinkoGame_betsRoll[id]);

		plinkoGame_betsRoll[id] = null;
	}

	var deepY = 0;
	var deepX = 0;

	var deeps = 0;
	var length = 1;

	plinkoGame_betsRoll[id] = setInterval(function(){
		var copyDeeps = deeps;
		var copyLength = length;

		$('#plinko_rows .line').eq(copyDeeps).find('.bar').eq(copyLength).addClass('hit');

		setTimeout(function(){
			$('#plinko_rows .line').eq(copyDeeps).find('.bar').eq(copyLength).removeClass('hit');
		}, 500);

		var rows_arena = $('#plinko_rows > .line').length;

		var height_hole = $('#plinko_rows').height() / (rows_arena - 1);
		var width_hole = $('#plinko_rows').width() / ((rows_arena + 1) * 2);

		if(deeps >= rows_arena) {
			clearInterval(plinkoGame_betsRoll[id]);

			delete plinkoGame_betsRoll[id];

			$('#plinko_balls .item[data-id=' + id + ']').css('top', (deepY * height_hole + (isOnMobile() ? 20 + 10 : 40 + 30)) + 'px').addClass('active');
			$('#plinko_balls .item[data-id=' + id + ']').css('opacity', '0');

			$('#plinko_balls .item[data-id=' + id + ']').removeClass('bounce');

			setTimeout(function(){
				$('#plinko_balls .item[data-id=' + id + ']').remove()
			}, 500);

			sounds_play('plinko_win');

			return;
		}

		if(deeps < rows_arena - 1) deepY++;

		if(roll[deeps] == 1) deepX++;
		else deepX--;

		$('#plinko_balls .item[data-id=' + id + ']').css('top', (deepY * height_hole - 20 + ((deeps == rows_arena - 1) ? (isOnMobile() ? 10 : 20) : 0)) + 'px');
		$('#plinko_balls .item[data-id=' + id + ']').css('left', (deepX * width_hole) + 'px');

		$('#plinko_balls .item[data-id=' + id + ']').addClass('bounce');

		sounds_play('plinko_hit');

		length += roll[deeps];

		deeps++;
	}, 300);
}

function plinkoGame_generateRows(){
	var rows = parseInt($('#plinko_rows_amount').val());

	var DIV = '';

	for(var i = 2; i < rows + 2; i++){
		DIV += '<div class="line flex flex-row justify-center">';
		for(var j = 0; j <= i; j++){
			DIV += '<div class="bar"></div>';
		}
		DIV += '</div>';
	}

	$('#plinko_rows').html(DIV);

	$('#plinko_balls').empty();
}

function plinkoGame_generateMultipliers(){
	var difficulty = $('#plinko_difficulty').val();
	var rows = parseInt($('#plinko_rows_amount').val());

	var DIV = '';

	var j = 0;

	for(var i = Math.floor(rows / 2); i >= 1; i--){
		DIV += '<div class="item flex justify-center items-center" data-rarity="' + i + '">' + plinkoGame_multipliers[difficulty][rows][j++] + 'x</div>';
	}

	DIV += '<div class="item flex justify-center items-center" data-rarity="0">' + plinkoGame_multipliers[difficulty][rows][j++] + 'x</div>';

	if(rows % 2 != 0) DIV += '<div class="item flex justify-center items-center" data-rarity="0">' + plinkoGame_multipliers[difficulty][rows][j++] + 'x</div>';

	for(var i = 1; i <= Math.floor(rows / 2); i++){
		DIV += '<div class="item flex justify-center items-center" data-rarity="' + i + '">' + plinkoGame_multipliers[difficulty][rows][j++] + 'x</div>';
	}

	$('#plinko_multipliers').html(DIV);
}

$(document).ready(function() {
	$(document).on('click', '#plinko_bet', function() {
		$(this).addClass('disabled');

		var amount = $('#betamount_plinko').val();

		var difficulty = $('#plinko_difficulty').val();
		var rows = parseInt($('#plinko_rows_amount').val());

		socket_emit({
			'type': 'plinko',
			'command': 'bet',
			'amount': amount,
			'difficulty': difficulty,
			'rows': rows
		});
	});

	$(document).on('change', '#plinko_difficulty', function(){
		plinkoGame_generateMultipliers();

		sounds_play('select');
	});

	$(document).on('change', '#plinko_rows_amount', function(){
		for(var i = 8; i <= 16; i++) $('#plinko_container').removeClass('rows-' + i);
		$('#plinko_container').addClass('rows-' + $(this).val());

		plinkoGame_generateRows();
		plinkoGame_generateMultipliers();

		sounds_play('select');
	});

	$(document).on('click', '.betshort_action[data-game="plinko"]', function() {
		sounds_play('select');
	});
});

/* END PLINKO */

/* CASINO */

function pagination_addCasinoSlotsGames(list){
    if(list.length > 0) {
        $('#casino_slots_games').empty();

		list.forEach(function(item){
            $('#casino_slots_games').append(casinoGame(item));
        });
    } else {
		$('#casino_slots_games').html(emptyState({
			title: 'No games found'
		}));
	}
}

function pagination_addCasinoLiveGames(list){
    if(list.length > 0) {
        $('#casino_live_games').empty();

		list.forEach(function(item){
            $('#casino_live_games').append(casinoGame(item));
        });
    } else {
		$('#casino_live_games').html(emptyState({
			title: 'No games found'
		}));
	}
}

function pagination_addCasinoRecentGames(list){
    if(list.length > 0) {
        $('#casino_recent_games').empty();

		list.forEach(function(item){
            $('#casino_recent_games').append(casinoGame(item));
        });
    } else {
		$('#casino_recent_games').html(emptyState({
			title: 'No games found'
		}));
	}
}

function pagination_addCasinoFavoritesGames(list){
    if(list.length > 0) {
        $('#casino_favorites_games').empty();

		list.forEach(function(item){
            $('#casino_favorites_games').append(casinoGame(item));
        });
    } else {
		$('#casino_favorites_games').html(emptyState({
			title: 'No games found'
		}));
	}
}

function pagination_addCasinoAllGames(list){
    if(list.length > 0) {
        $('#casino_all_games').empty();

		list.forEach(function(item){
            $('#casino_all_games').append(casinoGame(item));
        });
    } else {
		$('#casino_all_games').html(emptyState({
			title: 'No games found'
		}));
	}
}

function pagination_addCasinoProviders(list){
    if(list.length > 0) {
        $('#casino_providers').empty();

		list.forEach(function(item){
            $('#casino_providers').append(casinoProvidersProvider(item));
        });

		initializeSwiper();
    } else {
		$('#casino_providers').html(emptyState({
			title: 'No providers found'
		}));
	}
}

function pagination_addCasinoProvidersProviderGames(list){
    if(list.length > 0) {
        $('#casino_providers_provider_games').empty();

		list.forEach(function(item){
            $('#casino_providers_provider_games').append(casinoGame(item));
        });
    } else {
		$('#casino_providers_provider_games').html(emptyState({
			title: 'No providers found'
		}));
	}
}

$(document).ready(function() {
	$(document).on('click', '#casino_game_launch_demo', function() {
		$('#casino_game_mode').prop('checked', false);

		socket_emit({
			'type': 'casino',
			'command': 'launch_demo',
			'id': app.paths[2],
			'device': isOnMobile() ? 'mobile' : 'desktop'
		});
	});

	$(document).on('click', '#casino_game_launch_real', function() {
		$('#casino_game_mode').prop('checked', true);

		socket_emit({
			'type': 'casino',
			'command': 'launch_real',
			'id': app.paths[2],
			'device': isOnMobile() ? 'mobile' : 'desktop'
		});
	});

    $(document).on('change', '#casino_game_mode', function() {
        var real = $(this).prop('checked');

        if(real) {
			socket_emit({
				'type': 'casino',
				'command': 'launch_real',
				'id': app.paths[2],
				'device': isOnMobile() ? 'mobile' : 'desktop'
			});
		} else {
			socket_emit({
				'type': 'casino',
				'command': 'launch_demo',
				'id': app.paths[2],
				'device': isOnMobile() ? 'mobile' : 'desktop'
			});
		}
    });

    $(document).on('click', '.casino-games .item .favorite', function(e) {
		e.preventDefault();
        e.stopPropagation();

        var id = $(this).closest('.item').attr('data-id');

		if($(this).hasClass('active')){
            socket_emit({
                'type': 'casino',
                'command': 'unset_favorite',
                'id': id
            });
        } else {
            socket_emit({
                'type': 'casino',
                'command': 'set_favorite',
                'id': id
            });
        }
	});

    $(document).on('click', '#casino_favorite', function() {
        if($(this).hasClass('active')){
            socket_emit({
                'type': 'casino',
                'command': 'unset_favorite',
                'id': app.paths[2]
            });
        } else {
            socket_emit({
                'type': 'casino',
                'command': 'set_favorite',
                'id': app.paths[2]
            });
        }
	});

    $(document).on('click', '#casino_game_fullscreen', function() {
        var element = document.documentElement;

		var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

		if (ios) {
			if ($('#page').hasClass('fullscreen')) {
				$('#page').removeClass('fullscreen');
			} else {
				$('#page').addClass('fullscreen');
			}

			return;
		}

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    });

    $(document).on("fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange", function () {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
           $('#page').addClass('fullscreen');
        } else {
            $('#page').removeClass('fullscreen');
        }
    });

    $(document).on('click', '#pagination_casino_slots_games .pagination-item', function() {
		$('#casino_slots_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var order = parseInt($('#casino_slots_games_order').val());
		var provider = $('#casino_slots_games_provider').val();
		var search = $('#casino_slots_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_slots_games',
			'page': page,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	var timeout_casino_slots_games = null;
	$('#casino_slots_games_search').on('input', function() {
		if(timeout_casino_slots_games) clearTimeout(timeout_casino_slots_games);

		timeout_casino_slots_games = setTimeout(function(){
			$('#casino_slots_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

            var order = parseInt($('#casino_slots_games_order').val());
		    var provider = $('#casino_slots_games_provider').val();
			var search = $('#casino_slots_games_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'casino_slots_games',
				'page': 1,
				'order': order,
				'provider': provider,
				'search': search
			});
		}, 1000);
	});

	$('#casino_slots_games_order').on('change', function() {
		$('#casino_slots_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_slots_games_order').val());
		var provider = $('#casino_slots_games_provider').val();
		var search = $('#casino_slots_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_slots_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	$('#casino_slots_games_provider').on('change', function() {
		$('#casino_slots_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_slots_games_order').val());
		var provider = $('#casino_slots_games_provider').val();
		var search = $('#casino_slots_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_slots_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

    $(document).on('click', '#pagination_casino_live_games .pagination-item', function() {
		$('#casino_live_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var order = parseInt($('#casino_live_games_order').val());
		var provider = $('#casino_live_games_provider').val();
		var search = $('#casino_live_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_live_games',
			'page': page,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	var timeout_casino_live_games = null;
	$('#casino_live_games_search').on('input', function() {
		if(timeout_casino_live_games) clearTimeout(timeout_casino_live_games);

		timeout_casino_live_games = setTimeout(function(){
			$('#casino_live_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

            var order = parseInt($('#casino_live_games_order').val());
		    var provider = $('#casino_live_games_provider').val();
			var search = $('#casino_live_games_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'casino_live_games',
				'page': 1,
				'order': order,
				'provider': provider,
				'search': search
			});
		}, 1000);
	});

	$('#casino_live_games_order').on('change', function() {
		$('#casino_live_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_live_games_order').val());
		var provider = $('#casino_live_games_provider').val();
		var search = $('#casino_live_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_live_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	$('#casino_live_games_provider').on('change', function() {
		$('#casino_live_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_live_games_order').val());
		var provider = $('#casino_live_games_provider').val();
		var search = $('#casino_live_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_live_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

    $(document).on('click', '#pagination_casino_recent_games .pagination-item', function() {
		$('#casino_recent_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var order = parseInt($('#casino_recent_games_order').val());
		var provider = $('#casino_recent_games_provider').val();
		var search = $('#casino_recent_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_recent_games',
			'page': page,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	var timeout_casino_recent_games = null;
	$('#casino_recent_games_search').on('input', function() {
		if(timeout_casino_recent_games) clearTimeout(timeout_casino_recent_games);

		timeout_casino_recent_games = setTimeout(function(){
			$('#casino_recent_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

            var order = parseInt($('#casino_recent_games_order').val());
		    var provider = $('#casino_recent_games_provider').val();
			var search = $('#casino_recent_games_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'casino_recent_games',
				'page': 1,
				'order': order,
				'provider': provider,
				'search': search
			});
		}, 1000);
	});

	$('#casino_recent_games_order').on('change', function() {
		$('#casino_recent_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_recent_games_order').val());
		var provider = $('#casino_recent_games_provider').val();
		var search = $('#casino_recent_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_recent_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	$('#casino_recent_games_provider').on('change', function() {
		$('#casino_recent_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_recent_games_order').val());
		var provider = $('#casino_recent_games_provider').val();
		var search = $('#casino_recent_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_recent_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

    $(document).on('click', '#pagination_casino_favorites_games .pagination-item', function() {
		$('#casino_favorites_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var order = parseInt($('#casino_favorites_games_order').val());
		var provider = $('#casino_favorites_games_provider').val();
		var search = $('#casino_favorites_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_favorites_games',
			'page': page,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	var timeout_casino_favorites_games = null;
	$('#casino_favorites_games_search').on('input', function() {
		if(timeout_casino_favorites_games) clearTimeout(timeout_casino_favorites_games);

		timeout_casino_favorites_games = setTimeout(function(){
			$('#casino_favorites_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

            var order = parseInt($('#casino_favorites_games_order').val());
		    var provider = $('#casino_favorites_games_provider').val();
			var search = $('#casino_favorites_games_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'casino_favorites_games',
				'page': 1,
				'order': order,
				'provider': provider,
				'search': search
			});
		}, 1000);
	});

	$('#casino_favorites_games_order').on('change', function() {
		$('#casino_favorites_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_favorites_games_order').val());
		var provider = $('#casino_favorites_games_provider').val();
		var search = $('#casino_favorites_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_favorites_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

	$('#casino_favorites_games_provider').on('change', function() {
		$('#casino_favorites_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_favorites_games_order').val());
		var provider = $('#casino_favorites_games_provider').val();
		var search = $('#casino_favorites_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_favorites_games',
			'page': 1,
			'order': order,
			'provider': provider,
			'search': search
		});
	});

    $(document).on('click', '#pagination_casino_all_games .pagination-item', function() {
		$('#casino_all_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var search = $('#casino_all_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_all_games',
			'page': page,
			'search': search
		});
	});

	var timeout_casino_all_games = null;
	$('#casino_all_games_search').on('input', function() {
        if(timeout_casino_all_games) clearTimeout(timeout_casino_all_games);

		var search = $('#casino_all_games_search').val().toString();

        if(search.length > 0){
            var first = $('#casino_lobby_games').hasClass('hidden');

		    if(first) $('#casino_all_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

            timeout_casino_all_games = setTimeout(function(){
                if(!first) $('#casino_all_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

                socket_emit({
                    'type': 'pagination',
                    'command': 'casino_all_games',
                    'page': 1,
                    'search': search
                });
            }, 1000);

            $('#casino_lobby_games').removeClass('hidden');
            $('#casino_lobby_lists').addClass('hidden');
        } else {
            $('#casino_lobby_games').addClass('hidden');
            $('#casino_lobby_lists').removeClass('hidden');
        }
	});

	$(document).on('click', '#pagination_casino_providers .pagination-item', function() {
		$('#casino_providers').html(Array.from(Array(10), e => casinoProviderGamesSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var order = parseInt($('#casino_providers_order').val());
		var search = $('#casino_providers_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_providers',
			'page': page,
			'order': order,
			'search': search
		});
	});

	var timeout_casino_providers = null;
	$('#casino_providers_search').on('input', function() {
		if(timeout_casino_providers) clearTimeout(timeout_casino_providers);

		timeout_casino_providers = setTimeout(function(){
			$('#casino_providers').html(Array.from(Array(10), e => casinoProviderGamesSkeleton()).join(''));

            var order = parseInt($('#casino_providers_order').val());
			var search = $('#casino_providers_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'casino_providers',
				'page': 1,
				'order': order,
				'search': search
			});
		}, 1000);
	});

	$('#casino_providers_order').on('change', function() {
		$('#casino_providers').html(Array.from(Array(10), e => casinoProviderGamesSkeleton()).join(''));

		var order = parseInt($('#casino_providers_order').val());
		var search = $('#casino_providers_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_providers',
			'page': 1,
			'order': order,
			'search': search
		});
	});

	$(document).on('click', '#pagination_casino_providers_provider_games .pagination-item', function() {
		$('#casino_providers_provider_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var page = $(this).attr('data-page');

		var order = parseInt($('#casino_providers_provider_games_order').val());
		var search = $('#casino_providers_provider_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_providers_provider_games',
			'page': page,
			'id': app.paths[2],
			'order': order,
			'search': search
		});
	});

	var timeout_casino_providers_provider_games = null;
	$('#casino_providers_provider_games_search').on('input', function() {
		if(timeout_casino_providers_provider_games) clearTimeout(timeout_casino_providers_provider_games);

		timeout_casino_providers_provider_games = setTimeout(function(){
			$('#casino_providers_provider_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

            var order = parseInt($('#casino_providers_provider_games_order').val());
			var search = $('#casino_providers_provider_games_search').val();

			socket_emit({
				'type': 'pagination',
				'command': 'casino_providers_provider_games',
				'page': 1,
				'id': app.paths[2],
				'order': order,
				'search': search
			});
		}, 1000);
	});

	$('#casino_providers_provider_games_order').on('change', function() {
		$('#casino_providers_provider_games').html(Array.from(Array(40), e => casinoGameSkeleton()).join(''));

		var order = parseInt($('#casino_providers_provider_games_order').val());
		var search = $('#casino_providers_provider_games_search').val();

		socket_emit({
			'type': 'pagination',
			'command': 'casino_providers_provider_games',
			'page': 1,
			'id': app.paths[2],
			'order': order,
			'search': search
		});
	});
});

/* END CASINO */

/* REWARDS*/

$(document).ready(function () {

	$(document).on('click', '#rewards_redeem_referral', function() {
		var code = $('#rewards_referral_code').val();

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'rewards',
				'command': 'redeem_referral',
				'code': code,
				'recaptcha': render
			});
		});
	});

	$(document).on('click', '#rewards_claim_task', function() {
		var task = $(this).attr('data-task');

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'rewards',
				'command': 'claim_task',
				'task': task,
				'recaptcha': render
			});
		});
	});
});

/* END REWARDS */

/* AFFILIATES */

var affiliates_chart = null;

$(document).ready(function() {
	if(app.page == 'affiliates'){
		var ctx = document.getElementById('affiliates_chart_overview').getContext('2d');

		var chart = new Chart(ctx, affiliates_generateCtx({
			labels: [],
			data: [ [], [] ]
		}));

		affiliates_chart = chart;
	}

    $('.affiliates-chart-date .button').on('click', function() {
		$('.affiliates-chart-date .button').removeClass('active');
		$(this).addClass('active');

		var date = $(this).attr('data-date');

		$('.affiliates-chart .affiliates-loader').removeClass('hidden');

		affiliates_updateGraph({
			labels: [],
			data: [ [], [] ]
		});

		socket_emit({
			'type': 'affiliates',
			'command': 'overview',
			'date': date
		});
	});

	$(document).on('click', '#affiliates_claim_earnings', function() {
		requestRecaptcha(function(render){
			socket_emit({
				'type': 'affiliates',
				'command': 'claim_earnings',
				'recaptcha': render
			});
		});
	});

	$(document).on('click', '#affiliates_create_referral', function() {
		var code = $('#affiliates_referral_code').val();

		requestRecaptcha(function(render){
			socket_emit({
				'type': 'affiliates',
				'command': 'create_referral',
				'code': code,
				'recaptcha': render
			});
		});
	});
});

function affiliates_updateGraph(data){
	if(affiliates_chart !== null){
        affiliates_chart.data.labels = affiliates_generateCtx(data).data.labels;
        affiliates_chart.data.datasets = affiliates_generateCtx(data).data.datasets;

        affiliates_chart.update();
    }
}

function affiliates_generateCtx(stats){
	return {
		type: 'bar',
		data: {
			labels: stats.labels,
			datasets: [{
      			label: 'Clicks',
				data: stats.data[0],
				borderColor: '#ffdf5e',
                backgroundColor: '#ffdf5e',
				borderWidth: 2,
				fill: true,
				spanGaps: true,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                hoverPointBackgroundColor: 'transparent',
                hoverPointBorderColor: 'transparent'
			}, {
      			label: 'Joins',
				data: stats.data[1],
				borderColor: '#00e454',
                backgroundColor: '#00e454',
				borderWidth: 2,
				fill: true,
				spanGaps: true,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                hoverPointBackgroundColor: 'transparent',
                hoverPointBorderColor: 'transparent'
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						stepSize: 1
					}
				}],
				xAxes: [{
					categoryPercentage: 0.6,
					barPercentage: 0.8,
					ticks: {
						display: false
					}
				}]
			},

			elements: {
				line: {
					tension: 0.5
				},
                point: {
                    radius: 30,
                    hoverRadius: 30
                }
			},

			legend: {
				display: true
			},

            maintainAspectRatio: false
		}
	};
}

/* END AFFILIATES */

/* CRYPTO TRADES */

var offers_currencyAmounts = {};
var offers_currencyFees = {};

$(document).ready(function() {
	$(document).on('input', '.crypto-panel [data-conversion="from"]', function() {
		var currency = $(this).attr('data-currency');

		var value = $('.crypto-panel [data-conversion="from"]').val();
		var amount = getNumberFromString(value);

		$('.crypto-panel [data-conversion="from"]').val(value);

		if(offers_currencyAmounts[currency] === undefined) $('.crypto-panel [data-conversion="to"]').val('0.00000000').trigger('update');
        else $('.crypto-panel [data-conversion="to"]').val((getFormatAmount(amount) / offers_currencyAmounts[currency]).toFixed(8)).trigger('update');

        if(app.page == 'withdraw'){
            if(offers_currencyFees[currency] === undefined) $('.crypto-panel [data-conversion="estimated"]').val('0.00000000').trigger('update');
            else $('.crypto-panel [data-conversion="estimated"]').val((getFormatAmount(amount) / offers_currencyAmounts[currency] - offers_currencyFees[currency]).toFixed(8)).trigger('update');
        }
	});

	$(document).on('input', '.crypto-panel [data-conversion="to"]', function() {
		var currency = $(this).attr('data-currency');

		var value = $('.crypto-panel [data-conversion="to"]').val();
		var amount = getNumberFromString(value);

		if(offers_currencyAmounts[currency] === undefined) $('.crypto-panel [data-conversion="from"]').val('0.00').trigger('update');
		else $('.crypto-panel [data-conversion="from"]').val(getFormatAmountString(offers_currencyAmounts[currency] * amount)).trigger('update');

		$('.crypto-panel [data-conversion="to"]').val(value);
		if(app.page == 'withdraw') $('.crypto-panel [data-conversion="estimated"]').val(amount - offers_currencyFees[currency]);
	});

	$(document).on('input', '.crypto-panel [data-conversion="estimated"]', function() {
		var currency = $(this).attr('data-currency');

		var value = $('.crypto-panel [data-conversion="estimated"]').val();
		var amount = getNumberFromString(value);

		if(offers_currencyAmounts[currency] === undefined || offers_currencyFees[currency] === undefined) $('.crypto-panel [data-conversion="from"]').val('0.00').trigger('update');
		else $('.crypto-panel [data-conversion="from"]').val(getFormatAmountString(offers_currencyAmounts[currency] * (amount + offers_currencyFees[currency]))).trigger('update');

		$('.crypto-panel [data-conversion="estimated"]').val(value);
		$('.crypto-panel [data-conversion="to"]').val(amount + offers_currencyFees[currency]);
	});

	$(document).on('click', '#crypto_deposit', function() {
		var currency = $(this).attr('data-currency');
        var value = $('#crypto_deposit_value').val();

		socket_emit({
            type: 'crypto',
            command: 'deposit',
            currency: currency,
            value: value
        });
	});

	$(document).on('click', '#crypto_deposit_back', function() {
		$('#crypto_deposit_panel').removeClass('active');
	});

	$(document).on('click', '#crypto_withdraw', function() {
		var currency = $(this).attr('data-currency');
		var address = $('#currency_withdraw_address').val();
		var amount = $('#currency_withdraw_amount').val();

		requestRecaptcha(function(render){
			socket_emit({
				type: 'crypto',
				command: 'withdraw',
				currency: currency,
				amount: amount,
				address: address,
				recaptcha: render
			});
		});
	});
});

/* END CRYPTO TRADES */

$(document).ready(function() {
	$(document).on('click', '#cash_deposit_continue', function() {
        // Advanced Checkout (Card Fields) handles pay on-page — skip redirect flow
        if($('#cash_deposit_panel').attr('data-advanced-checkout') === '1') return;

		var method = $(this).attr('data-method');
		var amount = $('#cash_deposit_amount').val();

        socket_emit({
            type: 'cash',
            command: 'deposit',
            method: method,
            amount: amount
        });
	});

    $(document).on('click', '.cash-deposit-select-amount', function() {
        $('.cash-deposit-select-amount').removeClass('active');
        $(this).addClass('active');

		var amount = $(this).attr('data-amount');

        $('#cash_deposit_amount').val(getFormatAmountString(amount));
        $('#cash_deposit_receive').text(getFormatAmountString(amount));
	});

    $(document).on('input', '#cash_deposit_amount', function() {
        var amount = $(this).val();

        $('.cash-deposit-select-amount').removeClass('active');
        $('.cash-deposit-select-amount[data-amount="' + getFormatAmountString(amount) + '"]').addClass('active');

        $('#cash_deposit_receive').text(getFormatAmountString(amount));
	});
});

function isOnMobile(){
	return ($(window).width() <= 768);
}

function getFormatTime(time, type){
	var timeFormats = [
		{time: 1, time_format: 1, ago: 'seconds ago', next: 'seconds from now', count: true},
		{time: 60, time_format: 60, ago: 'minute ago', next: 'minute from now', count: true},
		{time: 120, time_format: 60, ago: 'minutes ago', next: 'minutes from now', count: true},
		{time: 3600, time_format: 3600, ago: 'hour ago', next: 'hour from now', count: true},
		{time: 7200, time_format: 3600, ago: 'hours ago', next: 'hours from now', count: true},
		{time: 86400, time_format: 86400, ago: 'Yesterday', next: 'Tomorrow', count: false},
		{time: 172800, time_format: 86400, ago: 'days ago', next: 'days from now', count: true},
		{time: 604800, time_format: 604800, ago: 'Last week', next: 'Next week', count: false},
		{time: 1209600, time_format: 604800, ago: 'weeks ago', next: 'weeks from now', count: true},
		{time: 2419200, time_format: 2419200, ago: 'Last month', next: 'Next month', count: false},
		{time: 4838400, time_format: 2419200, ago: 'months ago', next: 'months from now', count: true},
		{time: 29030400, time_format: 29030400, ago: 'Last year', next: 'Next year', count: false},
		{time: 58060800, time_format: 29030400, ago: 'years ago', next: 'years from now', count: true},
		{time: 2903040000, time_format: 2903040000, ago: 'Last century', next: 'Next century', count: false},
		{time: 5806080000, time_format: 2903040000, ago: 'centuries ago', next: 'centuries from now', count: true}
	]

	var seconds = Math.floor((new Date().getTime() - time) / 1000);

	var text = 'Now';
	var count = false;
	var time_format = 1;

	for(var i = 0; i < timeFormats.length; i++){
		if(seconds >= timeFormats[i]['time']){
			text = timeFormats[i][type];
			count = timeFormats[i]['count'];
			time_format = timeFormats[i]['time_format'];
		}
	}

	if(count){
		return Math.floor(seconds / time_format) + ' ' + text;
	} else {
		return text;
	}
}

function createLoader(){
	var DIV = '<div class="flex col-span-full justify-center items-center size-full history_message">';
		DIV += '<div class="loader">';
			DIV += '<div class="loader-part loader-part-1">';
				DIV += '<div class="loader-dot loader-dot-1"></div>';
				DIV += '<div class="loader-dot loader-dot-2"></div>';
			DIV += '</div>';

			DIV += '<div class="loader-part loader-part-2">';
				DIV += '<div class="loader-dot loader-dot-1"></div>';
				DIV += '<div class="loader-dot loader-dot-2"></div>';
			DIV += '</div>';
		DIV += '</div>';
	DIV += '</div>';

	return DIV;
}

function createAvatarField(user, size, more, classes){
	var level_class = ['tier-steel', 'tier-bronze', 'tier-silver', 'tier-gold', 'tier-diamond'][Math.floor(user.level / 25)];

	var DIV = '<div class="avatar-field rounded-full ' + classes + ' ' + level_class + ' relative">';
		DIV += '<img class="avatar ' + size + ' rounded-full" src="' + user.avatar + '">';
		DIV += '<div class="level sup sup-left flex justify-center items-center border-2 border-secondary rounded-full">' + user.level + '</div>';
		DIV += more;
	DIV += '</div>';

	return DIV;
}

function roundedToFixed(number, decimals){
	if(isNaN(Number(number))) return 0;

	number = Number((Number(number).toFixed(5)));

	var number_string = number.toString();
	var decimals_string = 0;

	if(number_string.split('.')[1] !== undefined) decimals_string = number_string.split('.')[1].length;

	while(decimals_string - decimals > 0) {
		number_string = number_string.slice(0, -1);

		decimals_string --;
	}

	return Number(number_string);
}

function roundToNeighbor(number, decimals){
	var value = roundedToFixed(number, decimals + 1);

	if((value * Math.pow(10, decimals)) % Math.pow(10, decimals) < 0.5) return value;

	return value + 0.01;
}

function countDecimals(value) {
    if (Math.floor(value) != value) return value.toString().split('.')[1].length || 0;

	return 0;
}

function getFormatAmount(amount){
	return roundedToFixed(amount, 2);
}

function getFormatAmountString(amount){
	return getFormatAmount(amount).toFixed(2);
}

function splitAmountCumulative(amount, parts) {
	var result = [];
	var prev = 0;

	for (var i = 1; i <= parts; i++) {
		var curr = getFormatAmount(amount * i / parts);
		result.push(getFormatAmount(curr - prev));

		prev = curr;
	}

	return result;
}

function getNumberFromString(amount){
	if(amount.toString().trim().length <= 0) return 0;
	if(isNaN(Number(amount.toString().trim()))) return 0;

	return Number(amount.toString().trim());
}

function generateBonusCode(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

	for(var i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function getFormatSeconds(time){
	var days = Math.floor(time / (24 * 60 * 60));
	var hours = Math.floor((time % (24 * 60 * 60)) / (60 * 60));
	var minutes = Math.floor((time % (60 * 60)) / 60);
	var seconds = Math.floor(time % 60);

	return {
		days: pad(days, 2),
		hours: pad(hours, 2),
		minutes: pad(minutes, 2),
		seconds: pad(seconds, 2)
	};
}

function pad(s, n) {
	return String(s).padStart(n, '0');
}

function toISO(d) {
	return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2);
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalizeText(text){
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function time(){
	return Math.floor(new Date().getTime() / 1000);
}