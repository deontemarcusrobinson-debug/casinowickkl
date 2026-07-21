var { pool } = require('@/lib/database.js');
var { totp } = require('@/lib/totp.js');

var chatService = require('@/lib/chat.js');

var userService = require('@/services/userService.js');

var mailerService = require('@/services/mailerService.js');

var { roundedToFixed, getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { makeDate, time } = require('@/utils/formatDate.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { verifyRecaptcha, calculateLevel, parseItemName, generateHexCode, generateSecurityCode } = require('@/utils/utils.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function saveEmail(user, socket, email, recaptcha, cooldown){
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		var reg1 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w+$/;

		if(!reg1.test(email)){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid email!'
			});

			return cooldown(false, true);
		}

        pool.query('SELECT `id` FROM `users` WHERE `email` = ' + pool.escape(email) + ' AND `userid` != ' + pool.escape(user.userid), function(err1, row1) {
            if(err1) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while saving email (2)'
                });

                return cooldown(false, true);
            }

            if(row1.length > 0){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Invalid email! Email already taken!'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `users_email_change_requests` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `used` = 0 AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err2) {
                if(err2) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while saving email (3)'
                    });

                    return cooldown(false, true);
                }

                var token = generateHexCode(32);

                pool.query('INSERT INTO `users_email_change_requests` SET `userid` = ' + pool.escape(user.userid) + ', `email` = ' + pool.escape(email) + ', `token` = ' + pool.escape(token) + ', `expire` = ' + pool.escape(time() + config.app.auth.expire.token.email_validation) + ', `time` = ' + pool.escape(time()), function(err3, row3) {
                    if(err3) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while saving email (4)'
                        });

                        return cooldown(false, true);
                    }

                    if(row3.affectedRows <= 0) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while saving email (5)'
                        });

                        return cooldown(false, true);
                    }

                    var subject = 'Change Email';
                    var message = 'Change Email Confirmation (expire in ' + Math.floor(config.app.auth.expire.token.email_validation / 60) + ' minutes): ' + config.app.url + '/auth/change-email?returnUrl=/account/settings&token=' + token;

                    mailerService.sendMail(email, subject, message, function(err4) {
                        if(err4) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: err4.message
                            });

                            return cooldown(false, true);
                        }

                        pool.query('INSERT INTO `email_history` SET `email` = ' + pool.escape(email) + ', `subject` = ' + pool.escape(subject) + ', `message` = ' + pool.escape(message) + ', `time` = ' + pool.escape(time()), function(err5, row5) {
                            if(err5) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while saving email (6)'
                                });

                                return cooldown(false, true);
                            }

                            if(row5.affectedRows <= 0) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while saving email (7)'
                                });

                                return cooldown(false, true);
                            }

                            emitSocketToUser(socket, 'message', 'success', {
                                message: 'An email with a confirmation link has successfully sent!'
                            });

                            cooldown(false, false);
                        });
                    });
                });
            });
        });
	});
}

/* ----- CLIENT USAGE ----- */
function sendTip(user, socket, userid, amount, recaptcha, cooldown){
	cooldown(true, true);

	if(user.exclusion > time()) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Your exclusion expires ' + makeDate(new Date(user.exclusion * 1000)) + '.'
		});

		return cooldown(false, true);
	}

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		if(user.userid == userid){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'You can\'t send coins to yourself!'
			});

			return cooldown(false, true);
		}

		if(calculateLevel(user.xp).level < config.app.tip.level_send){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'You need to have level ' + config.app.tip.level_send + ' to send coins!'
			});

			return cooldown(false, true);
		}

		verifyFormatAmount(amount, function(err1, amount){
			if(err1){
				emitSocketToUser(socket, 'message', 'error', {
					message: err1.message
				});

				return cooldown(false, true);
			}

			if(amount < config.app.intervals.amounts.tip_player.min || amount > config.app.intervals.amounts.tip_player.max) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Invalid send amount [' + getFormatAmountString(config.app.intervals.amounts.tip_player.min) + '-' + getFormatAmountString(config.app.intervals.amounts.tip_player.max) + ']!'
				});

				return cooldown(false, true);
			}

			//CHECK BALANCE
			userService.getBalance(user.userid, function(err2, balance){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: err2.message
                    });

					return cooldown(false, true);
				}

				if(getFormatAmount(balance) < amount) {
					emitSocketToUser(socket, 'message', 'error', {
						message: 'You don\'t have enough money!'
					});

					emitSocketToUser(socket, 'modal', 'insufficient_balance', {
						amount: getFormatAmount(amount - balance)
					});

					return cooldown(false, true);
				}

				pool.query('SELECT `name`, `exclusion`, `xp` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err3, row3) {
					if(err3){
						emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while sending tip (1)'
                        });

						return cooldown(false, true);
					}

					if(row3.length == 0) {
						emitSocketToUser(socket, 'message', 'error', {
							message: 'Unknown user!'
						});

						return cooldown(false, true);
					}

					if(row3[0].exclusion > time()) {
						emitSocketToUser(socket, 'message', 'error', {
							message: 'The recipient can\'t receive coins. The recipient is excluded.'
						});

						return cooldown(false, true);
					}

					if(calculateLevel(row3[0].xp).level < config.app.tip.level_receive){
						emitSocketToUser(socket, 'message', 'error', {
							message: 'The recipient can\'t receive coins. The recipient need to have level ' + config.app.tip.level_receive + ' to receive coins.'
						});

						return cooldown(false, true);
					}

					pool.query('INSERT INTO `users_tips` SET `userid` = ' + pool.escape(user.userid) + ', `receiverid` = ' + pool.escape(userid) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err4){
						if(err4) {
							emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while sending tip (2)'
                            });

							return cooldown(false, true);
						}

						//EDIT BALANCE
						userService.editBalance(user.userid, -amount, 'sent_coins', function(err5, newbalance1){
							if(err5) {
								emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while sending tip (3)'
                                });

								return cooldown(false, true);
							}

							emitSocketToUser(socket, 'message', 'info', {
								message: 'You sent ' + getFormatAmountString(amount) + ' coins to ' + row3[0].name + '.'
							});

							userService.updateBalance(user.userid, 'main', newbalance1);

							//EDIT BALANCE
							userService.editBalance(userid, amount, 'received_coins', function(err6, newbalance2){
								if(err6) {
									emitSocketToUser(socket, 'message', 'error', {
                                        message: 'An error occurred while sending tip (4)'
                                    });

									return cooldown(false, true);
								}

								emitSocketToRoom(userid, 'message', 'info', {
									message: 'You received ' + getFormatAmountString(amount) + ' coins from ' + user.name + '!'
								});

								userService.updateBalance(userid, 'main', newbalance2);

								cooldown(false, false);
							});
						});
					});
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function mutePlayer(user, socket, userid, reason, expire, cooldown){
	cooldown(true, true);

	if(!chatService.commands['mute'].allowed.map(a => chatService.ranks[a]).reduce((acc, cur) => ([ ...acc, ...cur ]), []).includes(user.rank)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	userService.setRestrictionAccount(user, socket, {
		userid: userid,
		restriction: 'mute',
		reason: reason,
		expire: expire
	}, true, function(err1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

		emitSocketToUser(socket, 'message', 'success', {
			message: 'The user was successfully restricted!'
		});

		cooldown(false, false);
	});
}

/* ----- CLIENT USAGE ----- */
function applyDepositBonus(user, socket, code, recaptcha, cooldown){
	cooldown(true, true);

    /* CHECK DATA */

	if(!(/(^[a-zA-Z0-9]*$)/.exec(code))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid code!'
		});

		return cooldown(false, true);
	}

	code = code.trim().toLowerCase();

	/* END CHECK DATA */

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `deposit_codes` WHERE `code` = ' + pool.escape(code) + ' AND `removed` = 0', function(err1, row1){
			if(err1){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while applying deposit bonus (1)'
                });

                return cooldown(false, true);
			}

			if(row1.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Unknown deposit bonus code!'
				});

				return cooldown(false, true);
			}

			pool.query('UPDATE `deposit_uses` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err2, row2){
				if(err2){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while applying deposit bonus (2)'
                    });

					return cooldown(false, true);
				}

				pool.query('INSERT INTO `deposit_uses` SET `userid` = ' + pool.escape(user.userid) + ', `bonusid` = ' + pool.escape(row1[0].id) + ', `time` = ' + pool.escape(time()), function(err3, row3){
					if(err3){
						emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while applying deposit bonus (3)'
                        });

						return cooldown(false, true);
					}

					emitSocketToUser(socket, 'message', 'success', {
						message: 'Deposit bonus code applied successfully!'
					});

					cooldown(false, false);
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function applyBonusCode(user, socket, code, recaptcha, cooldown){
	cooldown(true, true);

    /* CHECK DATA */

	if(!(/(^[a-zA-Z0-9]*$)/.exec(code))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid code!'
		});

		return cooldown(false, true);
	}

	code = code.trim().toLowerCase();

	/* END CHECK DATA */

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT bonus_codes.id, bonus_codes.amount, bonus_codes.uses AS `max`, COUNT(bonus_uses.id) AS `total`, `expire` FROM `bonus_codes` LEFT JOIN `bonus_uses` ON bonus_codes.id = bonus_uses.bonusid WHERE bonus_codes.code = ' + pool.escape(code) + ' AND bonus_codes.removed = 0 GROUP BY bonus_codes.id', function(err1, row1){
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while applying bonus code (1)'
                });

				return cooldown(false, true);
			}

			if(row1.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Invalid bonus code!'
				});

				return cooldown(false, true);
			}

			if(parseInt(row1[0].total) >= parseInt(row1[0].max)){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'The bonus code is no longer valid!'
				});

				return cooldown(false, true);
			}

			if(parseInt(row1[0].expire) <= time() && parseInt(row1[0].expire) != -1){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'The bonus code is no longer valid!'
				});

				return cooldown(false, true);
			}

			pool.query('SELECT `id` FROM `bonus_uses` WHERE `bonusid` = ' + pool.escape(row1[0].id) + ' AND `userid` = ' + pool.escape(user.userid), function(err2, row2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while applying bonus code (2)'
                    });

					return cooldown(false, true);
				}

				if(row2.length > 0) {
					emitSocketToUser(socket, 'message', 'error', {
						message: 'You already claimed the bonus code!'
					});

					return cooldown(false, true);
				}

				var amount = getFormatAmount(row1[0].amount);

                pool.query('INSERT INTO `bonus_uses` SET `userid` = ' + pool.escape(user.userid) + ', `bonusid` = ' + pool.escape(row1[0].id) + ', `time` = ' + pool.escape(time()), function(err3){
                    if(err3) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while applying bonus code (3)'
                        });

                        return cooldown(false, true);
                    }

                    //EDIT BALANCE
                    userService.editBalance(user.userid, amount, 'bonus_code', function(err4, newbalance){
                        if(err4) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: err4.message
                            });

                            return cooldown(false, true);
                        }

                        pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(user.userid), function(err5){
                            if(err5) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while applying bonus code (4)'
                                });

                                return cooldown(false, true);
                            }

                            emitSocketToUser(socket, 'message', 'success', {
                                message: 'You claimed ' + getFormatAmountString(amount) + ' coins!'
                            });

                            userService.updateBalance(user.userid, 'main', newbalance);

                            cooldown(false, false);
                        });
                    });
                });
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function saveProfileSettings(user, socket, data, cooldown){
	cooldown(true, true);

	var allowed_settings = [ 'anonymous', 'private', 'security' ];

	if(!allowed_settings.includes(data.setting)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid setting!'
		});

		return cooldown(false, true);
	}

	pool.query('INSERT INTO `users_history` SET `userid` = ' + pool.escape(user.userid) + ', `change` = ' + pool.escape(data.setting) + ', `value` = ' + pool.escape(data.value) + ', `time` = ' + pool.escape(time()), function(err1) {
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while saving profile settings (1)'
            });

			return cooldown(false, true);
		}

		pool.query('UPDATE `users` SET `' + data.setting + '` = ' + pool.escape(data.value) + ' WHERE `userid` = ' + pool.escape(user.userid), function(err2){
			if(err2) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while saving profile settings (2)'
                });

				return cooldown(false, true);
			}

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function setSelfExclusionDay(user, socket, recaptcha, cooldown) {
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		if(user.exclusion > time()) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'You have already a exclusion. Please wait to end the currently exclusion!'
			});

			return cooldown(false, true);
		}

		var exclusion = time() + 24 * 60 * 60;

		pool.query('INSERT INTO `users_history` SET `userid` = ' + pool.escape(user.userid) + ', `change` = ' + pool.escape("exclusion") + ', `value` = ' + pool.escape(exclusion) + ', `time` = ' + pool.escape(time()), function(err1) {
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting exclusion account (1)'
                });

				return cooldown(false, true);
			}

			pool.query('UPDATE `users` SET `exclusion` = ' + pool.escape(exclusion) + ' WHERE `userid` = ' + pool.escape(user.userid), function(err2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while setting exclusion account (2)'
                    });

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Exclusion successfully setted. The exclusion will expire ' + makeDate(new Date(exclusion * 1000)) + '.'
				});

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function setSelfExclusionWeek(user, socket, recaptcha, cooldown) {
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		if(user.exclusion > time()) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'You have already a exclusion. Please wait to end the currently exclusion!'
			});

			return cooldown(false, true);
		}

		var exclusion = time() + 7 * 24 * 60 * 60;

		pool.query('INSERT INTO `users_history` SET `userid` = ' + pool.escape(user.userid) + ', `change` = ' + pool.escape("exclusion") + ', `value` = ' + pool.escape(exclusion) + ', `time` = ' + pool.escape(time()), function(err1) {
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting exclusion account (1)'
                });

				return cooldown(false, true);
			}

			pool.query('UPDATE `users` SET `exclusion` = ' + pool.escape(exclusion) + ' WHERE `userid` = ' + pool.escape(user.userid), function(err2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while setting exclusion account (2)'
                    });

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Exclusion successfully setted. The exclusion will expire ' + makeDate(new Date(exclusion * 1000)) + '.'
				});

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function setSelfExclusionMonth(user, socket, recaptcha, cooldown) {
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		if(user.exclusion > time()) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'You have already a exclusion. Please wait to end the currently exclusion!'
			});

			return cooldown(false, true);
		}

		var exclusion = time() + 30 * 24 * 60 * 60;

		pool.query('INSERT INTO `users_history` SET `userid` = ' + pool.escape(user.userid) + ', `change` = ' + pool.escape("exclusion") + ', `value` = ' + pool.escape(exclusion) + ', `time` = ' + pool.escape(time()), function(err1) {
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting exclusion account (1)'
                });

				return cooldown(false, true);
			}

			pool.query('UPDATE `users` SET `exclusion` = ' + pool.escape(exclusion) + ' WHERE `userid` = ' + pool.escape(user.userid), function(err2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while setting exclusion account (2)'
                    });

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Exclusion successfully setted. The exclusion will expire ' + makeDate(new Date(exclusion * 1000)) + '.'
				});

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function removeSessionAccount(user, socket, session, cooldown) {
	cooldown(true, true);

    pool.query('SELECT `device` FROM `users_sessions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `id` = ' + pool.escape(session) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing session account (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid session or session expired!'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `users_sessions` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `id` = ' + pool.escape(session) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err2){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing session account (3)'
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'message', 'success', {
                message: 'Session successfully removed. The device connected with that session is disconnected!'
            });

            emitSocketToUser(socket, 'account', 'remove_session', {
                session: session
            });

            emitSocketToRoom(row1[0].device, 'site', 'reload');

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function removeAllSessionsAccount(user, socket, cooldown) {
	cooldown(true, true);

    pool.query('UPDATE `users_sessions` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err1){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing all sessions account (2)'
            });

            return cooldown(false, true);
        }

        emitSocketToUser(socket, 'message', 'success', {
            message: 'Sessions successfully removed. All device are disconnected!'
        });

        emitSocketToRoom(user.userid, 'site', 'reload');

        cooldown(false, false);
    });
}

/* ----- CLIENT USAGE ----- */
function enableEmailVerification(user, socket, cooldown){
    cooldown(true, true);

    if(!user.email){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Firstly, you must set your valid Email address from settings.'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `email_verification` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while enabling email verification (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length > 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You have already enabled email verification method'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `email_verification_requests` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `used` = 0 AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while enabling email verification (3)'
                });

                return cooldown(false, true);
            }

            var code = generateSecurityCode(6);

            pool.query('INSERT INTO `email_verification_requests` SET `userid` = ' + pool.escape(user.userid) + ', `code` = ' + pool.escape(code) + ', `expire` = ' + pool.escape(time() + config.app.auth.expire.code.email_verification) + ', `time` = ' + pool.escape(time()), function(err3, row3) {
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while enabling email verification (4)'
                    });

                    return cooldown(false, true);
                }

                if(row3.affectedRows <= 0) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while enabling email verification (5)'
                    });

                    return cooldown(false, true);
                }

                var subject = 'Security Code';
                var message = 'Security Code (expire in ' + Math.floor(config.app.auth.expire.code.email_verification / 60) + ' minutes): ' + code;

                mailerService.sendMail(user.email, subject, message, function(err4) {
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: err4.message
                        });

                        return cooldown(false, true);
                    }

                    pool.query('INSERT INTO `email_history` SET `email` = ' + pool.escape(user.email) + ', `subject` = ' + pool.escape(subject) + ', `message` = ' + pool.escape(message) + ', `time` = ' + pool.escape(time()), function(err5, row5) {
                        if(err5) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while enabling email verification (6)'
                            });

                            return cooldown(false, true);
                        }

                        if(row5.affectedRows <= 0) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while enabling email verification (7)'
                            });

                            return cooldown(false, true);
                        }

                        emitSocketToUser(socket, 'message', 'success', {
                            message: 'An email with a security code has been successfully sent!'
                        });

                        emitSocketToUser(socket, 'account', 'email_verification');

                        cooldown(false, false);
                    });
                });
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function activateEmailVerification(user, socket, code, cooldown){
    cooldown(true, true);

    if(!(/(^[0-9]{6}$)/.exec(code))){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'The security code is invalid or has expired. Please try again!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `email_verification` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while activating email verification (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length > 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You have already enabled email verification method'
            });

            return cooldown(false, true);
        }

        pool.query('SELECT `id` FROM `email_verification_requests` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `code` = ' + pool.escape(code) + ' AND `used` = 0 AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err2, row2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while activating email verification (3)'
                });

                return cooldown(false, true);
            }

            if(row2.length <= 0){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'The security code is invalid or has expired. Please try again!'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `email_verification_requests` SET `used` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `code` = ' + pool.escape(code) + ' AND `used` = 0 AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err3, row3) {
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while activating email verification (4)'
                    });

                    return cooldown(false, true);
                }

                if(row3.affectedRows <= 0) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while activating email verification (5)'
                    });

                    return cooldown(false, true);
                }

                pool.query('INSERT INTO `email_verification` SET `userid` = ' + pool.escape(user.userid) + ', `time` = ' + pool.escape(time()), function(err4, row4) {
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while activating email verification (6)'
                        });

                        return cooldown(false, true);
                    }

                    if(row4.affectedRows <= 0) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while activating email verification (7)'
                        });

                        return cooldown(false, true);
                    }

                    pool.query('SELECT `id` FROM `twofactor_authentication` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err5, row5) {
                        if(err5){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while activating email verification (8)'
                            });

                            return cooldown(false, true);
                        }

                        if(row5.length > 0) {
                            emitSocketToUser(socket, 'account', 'enable_twofa_method', {
                                method: 'email_verification'
                            });

                            return cooldown(false, false);
                        }

                        pool.query('INSERT INTO `twofactor_authentication` SET `userid` = ' + pool.escape(user.userid) + ', `method` = ' + pool.escape("email_verification") + ', `time` = ' + pool.escape(time()), function(err6, row6) {
                            if(err6){
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while activating email verification (9)'
                                });

                                return cooldown(false, true);
                            }

                            if(row6.affectedRows <= 0) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while activating email verification (10)'
                                });

                                return cooldown(false, true);
                            }

                            emitSocketToUser(socket, 'account', 'enable_twofa_method', {
                                method: 'email_verification'
                            });

                            emitSocketToUser(socket, 'account', 'primary_twofa_method', {
                                method: 'email_verification'
                            });

                            cooldown(false, false);
                        });
                    });
                });
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function disableEmailVerification(user, socket, cooldown){
    cooldown(true, true);

    pool.query('SELECT `id` FROM `email_verification` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while disabling email verification (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You have already disabled email verification method'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `email_verification` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err2, row2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while disabling email verification (3)'
                });

                return cooldown(false, true);
            }

            if(row2.affectedRows <= 0) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while disabling email verification (4)'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `twofactor_authentication` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `method` = ' + pool.escape("email_verification") + ' AND `removed` = 0', function(err3) {
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while disabling email verification (5)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'account', 'disable_twofa_method', {
                    method: 'email_verification'
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function enableAuthenticatorApp(user, socket, cooldown){
    cooldown(true, true);

    pool.query('SELECT `id` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 1', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while enabling authenticator app (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length > 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You have already enabled authentication app method'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `authenticator_app` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 0', function(err2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while enabling authenticator app (3)'
                });

                return cooldown(false, true);
            }

            var secret = totp.generateSecret(32);

            pool.query('INSERT INTO `authenticator_app` SET `userid` = ' + pool.escape(user.userid) + ', `secret` = ' + pool.escape(secret) + ', `time` = ' + pool.escape(time()), function(err3, row3) {
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while enabling authenticator app (4)'
                    });

                    return cooldown(false, true);
                }

                if(row3.affectedRows <= 0) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while enabling authenticator app (5)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'account', 'authenticator_app', {
                    url: totp.generateUrl(user.userid, secret, config.app.abbreviation),
                    secret: secret
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function activateAuthenticatorApp(user, socket, token, cooldown){
    cooldown(true, true);

    if(!(/(^[0-9]{6}$)/.exec(token))){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'The token is invalid or has expired. Please try again!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 1', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while activating authenticator app (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length > 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You have already enabled authentication app method'
            });

            return cooldown(false, true);
        }

        pool.query('SELECT `id`, `secret` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 0', function(err2, row2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while activating authenticator app (3)'
                });

                return cooldown(false, true);
            }

            if(row2.length <= 0){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while activating authenticator app (4)'
                });

                return cooldown(false, true);
            }

            var verification = totp.verifyToken(row2[0].secret, token);

            if(!verification) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'The token is invalid or has expired. Please try again!'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `authenticator_app` SET `activated` = 1 WHERE `id` = ' + pool.escape(row2[0].id) + ' AND `removed` = 0 AND `activated` = 0', function(err3, row3) {
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while activating authenticator app (5)'
                    });

                    return cooldown(false, true);
                }

                if(row3.affectedRows <= 0) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while activating authenticator app (6)'
                    });

                    return cooldown(false, true);
                }

                var codes = Array.from(Array(10), function(){
                    return generateHexCode(10).toUpperCase();
                }).map(a => ({
                    code: a,
                    used: 0
                }));

                registerCodeAuthenticatorApp(row2[0].id, codes, 0, function(err4){
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: err4.message
                        });

                        return cooldown(false, true);
                    }

                    pool.query('SELECT `id` FROM `twofactor_authentication` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0', function(err5, row5) {
                        if(err5){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while activating authenticator app (7)'
                            });

                            return cooldown(false, true);
                        }

                        if(row5.length > 0) {
                            emitSocketToUser(socket, 'account', 'enable_twofa_method', {
                                method: 'authenticator_app'
                            });

                            emitSocketToUser(socket, 'account', 'authenticator_app_codes', { codes });

                            return cooldown(false, false);
                        }

                        pool.query('INSERT INTO `twofactor_authentication` SET `userid` = ' + pool.escape(user.userid) + ', `method` = ' + pool.escape("authenticator_app") + ', `time` = ' + pool.escape(time()), function(err6, row6) {
                            if(err6){
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while activating authenticator app (8)'
                                });

                                return cooldown(false, true);
                            }

                            if(row6.affectedRows <= 0) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while activating authenticator app (9)'
                                });

                                return cooldown(false, true);
                            }

                            emitSocketToUser(socket, 'account', 'enable_twofa_method', {
                                method: 'authenticator_app'
                            });

                            emitSocketToUser(socket, 'account', 'authenticator_app_codes', { codes });

                            emitSocketToUser(socket, 'account', 'primary_twofa_method', {
                                method: 'authenticator_app'
                            });

                            cooldown(false, false);
                        });
                    });
                });
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function disableAuthenticatorApp(user, socket, cooldown){
    cooldown(true, true);

    pool.query('SELECT `id` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 1', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while disabling authenticator app (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You have already disabled authentication app method'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `authenticator_app` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 1', function(err2, row2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while disabling authenticator app (3)'
                });

                return cooldown(false, true);
            }

            if(row2.affectedRows <= 0) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while disabling authenticator app (4)'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `twofactor_authentication` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `method` = ' + pool.escape("authenticator_app") + ' AND `removed` = 0', function(err3) {
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while disabling authenticator app (5)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'account', 'disable_twofa_method', {
                    method: 'authenticator_app'
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function manageAuthenticatorApp(user, socket, cooldown){
    cooldown(true, true);

    pool.query('SELECT `id` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 1', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while managing authenticator app (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Authentication app method is not enabled'
            });

            return cooldown(false, true);
        }

        pool.query('SELECT `code`, `used` FROM `authenticator_app_recovery_codes` WHERE `appid` = ' + pool.escape(row1[0].id) + ' AND `removed` = 0', function(err2, row2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while managing authenticator app (3)'
                });

                return cooldown(false, true);
            }

            var codes = row2.map(a => ({
                code: a.code,
                used: parseInt(a.used)
            }));

            emitSocketToUser(socket, 'account', 'authenticator_app_codes', { codes });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function generateCodesAuthenticatorApp(user, socket, cooldown){
    cooldown(true, true);

    pool.query('SELECT `id` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `removed` = 0 AND `activated` = 1', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while generating codes authenticator app (2)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Authentication app method is not enabled'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `authenticator_app_recovery_codes` SET `removed` = 1 WHERE `appid` = ' + pool.escape(row1[0].id) + ' AND `removed` = 0', function(err2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while generating codes authenticator app (3)'
                });

                return cooldown(false, true);
            }

            var codes = Array.from(Array(10), function(){
                return generateHexCode(10).toUpperCase();
            });

            registerCodeAuthenticatorApp(row1[0].id, codes, 0, function(err3){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
                    });

                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'account', 'authenticator_app_codes', { codes: codes.map(a => ({
                    code: a,
                    used: 0
                })) });

                cooldown(false, false);
            });
        });
    });
}

/* ----- INTERNAL USAGE ----- */
function registerCodeAuthenticatorApp(appid, codes, codeid, callback){
    if(codeid >= codes.length) return callback(null);

    pool.query('INSERT INTO `authenticator_app_recovery_codes` SET `code` = ' + pool.escape(codes[codeid]) + ', `appid` = ' + pool.escape(appid) + ', `time` = ' + pool.escape(time()), function(err1, row1) {
        if(err1) return callback(new Error('An error occurred while registering code authenticator app (1)'));

        if(row1.affectedRows <= 0) return callback(new Error('An error occurred while registering code authenticator app (2)'));

        registerCodeAuthenticatorApp(appid, codes, codeid + 1, callback);
    });
}

/* ----- CLIENT USAGE ----- */
function setTwofaPrimaryMethod(user, socket, method, cooldown){
    var method_allowed = [ 'email_verification', 'authenticator_app' ];
	if(!method_allowed.includes(method)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid primary method!'
        });

        return cooldown(false, true);
    }

    pool.query('UPDATE `twofactor_authentication` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `method` != ' + pool.escape(method) + ' AND `removed` = 0', function(err1, row1) {
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while setting twofa primary method (2)'
            });

            return cooldown(false, true);
        }

        if(row1.affectedRows <= 0) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Primary 2FA method already set!'
            });

            return cooldown(false, true);
        }

        pool.query('INSERT INTO `twofactor_authentication` SET `userid` = ' + pool.escape(user.userid) + ', `method` = ' + pool.escape(method) + ', `time` = ' + pool.escape(time()), function(err2, row2) {
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting twofa primary method (3)'
                });

                return cooldown(false, true);
            }

            if(row2.affectedRows <= 0) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting twofa primary method (4)'
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'account', 'primary_twofa_method', { method });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function getAccountTransactions(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `users_transactions` WHERE `userid` = ' + pool.escape(user.userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account transactions (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_transactions', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id`, `transaction`, `amount`, `time` FROM `users_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account transactions (2)'
                });

				return cooldown(false, true);
			}

			row2.reverse();

            var list = row2.map(a => ({
                id: a.id,
                transaction: a.transaction,
                amount: getFormatAmountString(a.amount),
                date: makeDate(new Date(a.time * 1000))
            }));

            list.reverse();

            emitSocketToUser(socket, 'pagination', 'account_transactions', {
                list: list,
                pages: pages,
                page: page
            });

            cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountDeposits(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query([
            'SELECT COUNT(*) AS `count` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "deposit"',
            'SELECT COUNT(*) AS `count` FROM `cash_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "deposit"',
            'SELECT COUNT(*) AS `count` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "deposit"'
        ].join(' UNION ALL '), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account deposits (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1.reduce((acc, cur) => acc + cur.count, 0) / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_deposits', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query([
                'SELECT `id`, 0 AS `status`, `amount`, `amount` AS `paid`, "manual" AS `method`, "manual" AS `game`, `time` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "deposit"',
                'SELECT `transactionid` AS `id`, `status`, `amount`, `paid`, "cash" AS `method`, `currency` AS `game`, `time` FROM `cash_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "deposit"',
                'SELECT `transactionid` AS `id`, `status`, `amount`, `paid` * `exchange` AS `paid`, "crypto" AS `method`, `currency` AS `game`, `time` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "deposit"'
            ].join(' UNION ALL ') + ' ORDER BY `time` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account deposits (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var status = {
                    'manual': 'completed',
                    'cash': item.status == 5 ? 'completed' : item.status < 0 ? 'declined' : 'pending',
                    'crypto': item.status == 5 ? 'completed' : item.status == 4 ? 'partially_paid' : item.status < 0 ? 'declined' : 'pending'
                }[item.method];

                return {
                    id: item.id || '-',
                    amount: getFormatAmountString(item.amount),
                    paid: getFormatAmountString(item.paid),
                    method: item.game,
                    status: status,
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_deposits', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountWithdrawals(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query([
            'SELECT COUNT(*) AS `count` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "withdraw"',
            'SELECT COUNT(*) AS `count` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "withdraw"'
        ].join(' UNION ALL '), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account withdrawals (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1.reduce((acc, cur) => acc + cur.count, 0) / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_withdrawals', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query([
                'SELECT `id`, 0 AS `status`, `amount`, "manual" AS `method`, "manual" AS `game`, `time` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "withdraw"',
                'SELECT `transactionid` AS `id`, `status`, `amount`, "crypto" AS `method`, `currency` AS `game`, `time` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = "withdraw"'
            ].join(' UNION ALL ') + ' ORDER BY `time` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account withdrawals (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var status = {
                    'crypto': item.status == 4 ? 'completed' : item.status < 0 ? 'declined' : 'pending'
                }[item.method];

                return {
                    id: item.id || '-',
                    amount: getFormatAmountString(item.amount),
                    method: item.game,
                    status: status,
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_withdrawals', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountRouletteHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `roulette_bets` INNER JOIN `roulette_rolls` ON roulette_bets.gameid = roulette_rolls.id WHERE roulette_bets.userid = ' + pool.escape(user.userid) + ' AND roulette_rolls.ended = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account roulette history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_roulette_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT roulette_bets.id, roulette_bets.amount, roulette_bets.color, roulette_rolls.roll, roulette_bets.time FROM `roulette_bets` INNER JOIN `roulette_rolls` ON roulette_bets.gameid = roulette_rolls.id WHERE roulette_bets.userid = ' + pool.escape(user.userid) + ' AND roulette_rolls.ended = 1 ORDER BY roulette_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account roulette history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var colors = [];

                if(item.roll == 0) colors.push('green');
                else if(item.roll >= 1 && item.roll <= 7) colors.push('red');
                else if(item.roll >= 8 && item.roll <= 14) colors.push('black');

                if(item.roll == 4 || item.roll == 11) colors.push('bait');

                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(colors.includes(item.color)) winnings = getFormatAmount(amount * config.games.games.roulette.multipliers[item.color]);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    option: item.color,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: colors.includes(item.color) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_roulette_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountCrashHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `crash_bets` INNER JOIN `crash_rolls` ON crash_bets.gameid = crash_rolls.id WHERE crash_bets.userid = ' + pool.escape(user.userid) + ' AND crash_rolls.ended = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account crash history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_crash_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT crash_bets.id, crash_bets.amount, crash_bets.cashedout, crash_bets.point, crash_bets.time FROM `crash_bets` INNER JOIN `crash_rolls` ON crash_bets.gameid = crash_rolls.id WHERE crash_bets.userid = ' + pool.escape(user.userid) + ' AND crash_rolls.ended = 1 ORDER BY crash_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account crash history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(parseInt(item.cashedout)) winnings = getFormatAmount(amount * roundedToFixed(item.point, 2));

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    multiplier: roundedToFixed(item.point, 2).toFixed(2),
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: parseInt(item.cashedout) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_crash_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountJackpotHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `jackpot_bets` INNER JOIN `jackpot_games` ON jackpot_bets.gameid = jackpot_games.id INNER JOIN `jackpot_rolls` ON jackpot_games.id = jackpot_rolls.gameid WHERE jackpot_bets.userid = ' + pool.escape(user.userid) + ' AND jackpot_games.ended = 1 AND jackpot_rolls.removed = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account jackpot history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_jackpot_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT jackpot_bets.id, IF(jackpot_bets.id = jackpot_rolls.betid, 1, 0) AS `status`, jackpot_bets.amount, jackpot_rolls.amount AS `winnings`, jackpot_rolls.roll, jackpot_bets.time FROM `jackpot_bets` INNER JOIN `jackpot_games` ON jackpot_bets.gameid = jackpot_games.id INNER JOIN `jackpot_rolls` ON jackpot_games.id = jackpot_rolls.gameid WHERE jackpot_bets.userid = ' + pool.escape(user.userid) + ' AND jackpot_games.ended = 1 AND jackpot_rolls.removed = 0 ORDER BY jackpot_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account jackpot history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(parseInt(item.status)) winnings = getFormatAmount(item.winnings);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    roll: item.roll,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: parseInt(item.status) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_jackpot_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountCoinflipHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `coinflip_bets` INNER JOIN `coinflip_games` ON coinflip_bets.gameid = coinflip_games.id INNER JOIN `coinflip_rolls` ON coinflip_games.id = coinflip_rolls.gameid INNER JOIN `coinflip_winnings` ON coinflip_games.id = coinflip_winnings.gameid WHERE coinflip_bets.userid = ' + pool.escape(user.userid) + ' AND coinflip_games.canceled = 0 AND coinflip_games.ended = 1 AND coinflip_rolls.removed = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account coinflip history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_coinflip_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT coinflip_bets.id, IF(coinflip_bets.position = coinflip_winnings.position, 1, 0) AS `status`, coinflip_games.amount, coinflip_winnings.amount AS `winnings`, coinflip_bets.time FROM `coinflip_bets` INNER JOIN `coinflip_games` ON coinflip_bets.gameid = coinflip_games.id INNER JOIN `coinflip_rolls` ON coinflip_games.id = coinflip_rolls.gameid INNER JOIN `coinflip_winnings` ON coinflip_games.id = coinflip_winnings.gameid WHERE coinflip_bets.userid = ' + pool.escape(user.userid) + ' AND coinflip_games.canceled = 0 AND coinflip_games.ended = 1 AND coinflip_rolls.removed = 0 ORDER BY coinflip_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account coinflip history (1)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(parseInt(item.status)) winnings = getFormatAmount(item.winnings);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: parseInt(item.status) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_coinflip_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountDiceHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `dice_bets` WHERE `userid` = ' + pool.escape(user.userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account dice history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_dice_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id`, `amount`, `multiplier`, `roll`, `mode`, `chance`, `time` FROM `dice_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account dice history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var roll = roundedToFixed(item.roll, 2);
                var chance = roundedToFixed(item.chance, 2);

                var win = false;

                if(item.mode == 'under' && roll < chance) win = true;
                if(item.mode == 'over' && roll >= roundedToFixed(100 - chance, 2)) win = true;

                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(win) winnings = getFormatAmount(amount * roundedToFixed(item.multiplier, 2));

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    roll: roll.toFixed(2),
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: win ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_dice_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountTowerHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `tower_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `ended` = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account tower history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_tower_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id`, `amount`, `winning`, `difficulty`, `time` FROM `tower_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `ended` = 1 ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account tower history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(item.winning);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    difficulty: item.difficulty,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_tower_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountMinesweeperHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `minesweeper_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `ended` = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account minesweeper history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_minesweeper_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id`, `amount`, `winning`, `bombs`, `time` FROM `minesweeper_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `ended` = 1 ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account minesweeper history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(item.winning);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    bombs: item.bombs,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_minesweeper_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountPlinkoHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `plinko_bets` WHERE `userid` = ' + pool.escape(user.userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account plinko history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_plinko_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id`, `amount`, `multiplier`, `difficulty`, `rows`, `time` FROM `plinko_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account plinko history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(amount * roundedToFixed(item.multiplier, 2));

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    difficulty: item.difficulty,
                    rows: item.rows,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_plinko_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getAccountCasinoHistory(user, socket, page, cooldown){
	cooldown(true, true);

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);

	pool.query('SELECT COUNT(*) AS `count` FROM `casino_bets` LEFT JOIN `casino_winnings` ON casino_bets.id = casino_winnings.betid WHERE casino_bets.userid = ' + pool.escape(user.userid) + ' AND casino_bets.refunded = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting account casino history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'account_casino_history', {
				list: [],
				pages: 1,
				page: 1
			});

			return cooldown(false, false);
		}

		if(page <= 0 || page > pages) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid page!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT casino_bets.id, casino_bets.amount, COALESCE(casino_winnings.amount, 0) AS `winnings`, casino_bets.game, casino_bets.time FROM `casino_bets` LEFT JOIN `casino_winnings` ON casino_bets.id = casino_winnings.betid WHERE casino_bets.userid = ' + pool.escape(user.userid) + ' AND casino_bets.refunded = 0 ORDER BY casino_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting account casino history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(item.winnings);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    game: item.game,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'account_casino_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

module.exports = {
    saveEmail,
    mutePlayer, sendTip,
    saveProfileSettings,
    applyDepositBonus,
    applyBonusCode,
    setSelfExclusionDay, setSelfExclusionWeek, setSelfExclusionMonth, removeSessionAccount, removeAllSessionsAccount,
    enableEmailVerification, activateEmailVerification, disableEmailVerification, enableAuthenticatorApp, activateAuthenticatorApp, disableAuthenticatorApp, manageAuthenticatorApp, generateCodesAuthenticatorApp, setTwofaPrimaryMethod,
    getAccountTransactions,
    getAccountDeposits,
    getAccountWithdrawals,
    getAccountRouletteHistory,
    getAccountCrashHistory,
    getAccountJackpotHistory,
    getAccountCoinflipHistory,
    getAccountDiceHistory,
    getAccountTowerHistory,
    getAccountMinesweeperHistory,
    getAccountPlinkoHistory,
    getAccountCasinoHistory
};