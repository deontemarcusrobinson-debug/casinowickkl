var { resolveDatabaseConfig } = require('./databaseEnv.js');

const config = {
	settings: require('../settings.json'),

	app: {
		name: process.env.APP_NAME,
		abbreviation: process.env.APP_ABBREVIATION,

		url: process.env.APP_URL,

        keywords: [ 'jackpot', 'coinflip', 'csgo', 'cs', 'go', 'global', 'offensive', 'cs:go', 'vgo', 'csgocoinflip', 'csgocoinflip', 'csgosite', 'vgocoinflip', 'vgocoinflip', 'vgosite', 'site', 'vgokingdom', 'kingdom', 'bet', 'gambling', 'gamble', 'fair', 'best', 'great', 'csgoempire', 'csgoatse', 'csgo500', 'crypto', 'btc', 'eth', 'roulette', 'experience' ],
        autor: 'MrCHICK',
        description: process.env.APP_NAME + ' - The best crypto place to win money!',
        themecolor: '#9370db',

        social: {
            steam_group: process.env.STEAM_GROUP_URL,
            twitter_page: process.env.TWITTER_PAGE_URL,
            discord_server: process.env.DISCORD_SERVER_URL
        },

		// Render/Railway sets PORT; keep APP_PORT for local
		port: parseInt(process.env.PORT || process.env.APP_PORT || '3000', 10),
		secure: process.env.APP_SECURE === 'true',

        ssl: {
            cert: process.env.SSL_CRT_FILE,
            key: process.env.SSL_KEY_FILE
        },

		database: resolveDatabaseConfig(),

        ipinfo: {
            api_token: process.env.IPINFO_API_TOKEN
        },

        google: {
            active: false,

            client: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
            callback_url: process.env.GOOGLE_CALLBACK_URL
        },

        discord: {
            active: false,

            client: process.env.DISCORD_CLIENT_ID,
            secret: process.env.DISCORD_CLIENT_SECRET,
            callback_url: process.env.DISCORD_CALLBACK_URL
        },

		mailer: {
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: process.env.MAIL_SECURE === 'true',
			email: process.env.MAIL_EMAIL,
			password: process.env.MAIL_PASSWORD
		},

		recaptcha: {
			private_key: process.env.RECAPTCHA_PRIVATE_KEY,
			public_key: process.env.RECAPTCHA_PUBLIC_KEY
		},

        pages: {
            'roulette': 'Roulette',
            'crash': 'Crash',
            'coinflip': 'Coinflip',
            'jackpot': 'Jackpot',
            'dice': 'Dice',
            'minesweeper': 'Minesweeper',
            'tower': 'Tower',
            'plinko': 'Plinko',
            'casino': 'Casino',
            'account': 'Account',
            'user': 'User',
            'rewards': 'Rewards',
            'deposit': 'Deposit',
            'withdraw': 'Withdraw',
            'tos': 'Terms Of Service',
            'support': 'Support',
            'fair': 'Provably Fair',
            'faq': 'Frequently Asked Questions',
            'maintenance': 'Maintenance',
            'leaderboard': 'Leaderboard',
            'banned': 'Banned',
            'home': 'Home',
            'admin': 'Admin',
            'dashboard': 'Dashboard',
            'affiliates': 'Affiliates',
            'login': 'Sign In',
            'register': 'Create Account',
            'setPassword': 'Set Your Password',
            'setEmail': 'Set Your Email',
            'forgotPassword': 'Forgot Password',
            'resetPassword': 'Reset Your Password',
            'twofa': 'Two-Factory Authentication',
            'authorize': 'Verification Authentication'
        },

		access_secrets: [ 'admin1' ],

        permissions: {
            exclude_ban_ip: [ 'owner' ],
            exclude_ban_site: [ 'owner' ],
            exclude_ban_play: [ 'owner' ],
            exclude_ban_trade: [ 'owner' ],
            exclude_mute: [ 'owner' ],
            exclude_chat_pause: [ 'owner', 'admin', 'moderator' ],
            access_maintenance: [ 'owner', 'developer', 'admin', 'moderator', 'helper' ],
            play_offline: [ 'owner' ],
            play_disabled: [ 'owner' ],
            play_casino_real: [ 'owner' ],
            trade_offline: [ 'owner' ],
            trade_disabled: [ 'owner' ],
            withdraw: [ 'owner' ],
            view_user: [ 'owner', 'admin' ],
            call_gamebots: [ 'owner' ],
            extended_session: [ 'owner', 'admin', 'moderator' ]
        },

        ranks: {
            0: 'member', 1: 'admin', 2: 'moderator', 3: 'helper', 4: 'veteran', 5: 'pro', 6: 'youtuber', 7: 'streamer', 8: 'developer', 100: 'owner',
            'member': 0, 'admin': 1, 'moderator': 2, 'helper': 3, 'veteran': 4, 'pro': 5, 'youtuber': 6, 'streamer': 7, 'developer': 8, 'owner': 100
        },

		limiter: {
			socket: {
				max: 100,
				time: 10
			},
			global: {
				max: 100,
				time: 1 * 60
			},
			login: {
				max: 10,
				time: 1 * 60 * 60
			},
			register: {
				max: 10,
				time: 1 * 60 * 60
			},
            google: {
				max: 10,
				time: 1 * 60 * 60
			},
            discord: {
				max: 10,
				time: 1 * 60 * 60
			},
			recover: {
				max: 10,
				time: 1 * 60 * 60
			},
			twofa: {
				max: 10,
				time: 1 * 60 * 60
			}
		},

		level: {
			base: 500,
			ratio: 2.2
		},

        tip: {
            level_send: 5,
            level_receive: 5
        },

		rain: {
			start: 1.00,
			cooldown_start: 5 * 60,
			timeout_interval: { min: 10 * 60, max: 30 * 60 }
		},

        intervals: {
            amounts: {
                roulette: { min: 0.01, max: 1000.00 },
                crash: { min: 0.01, max: 1000.00 },
                jackpot: { min: 0.01, max: 1000.00 },
                coinflip: { min: 0.01, max: 1000.00 },
                dice: { min: 0.01, max: 1000.00 },
                minesweeper: { min: 0.01, max: 1000.00 },
                tower: { min: 0.01, max: 1000.00 },
                plinko: { min: 0.01, max: 1000.00 },

                tip_player: { min: 0.01, max: 100.00 },
                tip_rain: { min: 0.01, max: 1000.00 },

                deposit_manual: { min: 0.01, max: 10000.00 },
                withdraw_manual: { min: 0.01, max: 10000.00 },

                deposit_cash: { min: 10.00, max: 1000.00 },

                deposit_crypto: { min: 20.00, max: 500.00 },
                withdraw_crypto: { min: 20.00, max: 500.00 }

            }

        },

		rewards: {
            amounts: {
                google: 0.50,
                discord: 0.50,

                refferal_code: 1.00
            },

            requirements: {
                code_length: { min: 6, max: 20 }
            }
		},

        affiliates: {
            requirements: [ 0.00, 100.00, 500.00, 2000.00, 10000.00 ],
            earnings: {
                deposit: [ 1.50, 2.00, 3.00, 5.00, 7.50 ],
                wager: [ 2.50, 5.00, 7.50, 10.00, 15.00 ]
            }
        },

		admin: {

            gamebots: {
                requirements: {
				    name_length: { min: 4, max: 20 }
                }
			},

            tracking_links: {
				requirements: {
                    code_length: 64,
                    name_length: { min: 4, max: 20 }
                }
            },

            deposit_bonuses: {
				requirements: {
                    code_length: { min: 6, max: 12 }
                }
            },

			bonus_codes: {
				requirements: {
					code_length: { min: 6, max: 20 }
				}
			}
		},

        support: {
            requirements: {
                subject_length: { min: 6, max: 100 },
                message_length: { min: 10, max: 2000 }
            }
        },

		fair: {
			requirements: {
				client_seed_length: { min: 6, max: 32 }
			}
		},

		chat: {
			max_messages: 40,

			cooldown_massage: 1,

			channels: {
				en: 'English',
				fr: 'Français',
				de: 'Deutsch',
				es: 'Español',
				pt: 'Português',
				ru: 'Русский',
				jp: '日本語',
				il: 'עברית',
				tr: 'Türkçe',
				ro: 'Română',
				sv: 'Svenska'
			},

			support: {
				active: false,
				message: 'If you find bugs contact us as soon as possible to solve them! With all due respect, the ' + process.env.APP_ABBREVIATION + ' team.',
				cooldown: 24 * 60 * 60
			},

			greeting: {
				active: true,
				message: 'Please contact us if you need help. We don\'t resolve issues in the chat. Type /help for chat commands. With all due respect, the ' + process.env.APP_ABBREVIATION + ' team.'
			},

			message_double_xp: 'Weekly Double XP! Get double XP betting on our games until Sunday at 23:59PM GTM.'
		},

        auth: {
            expire: {
                token: {
                    authentication: 2 * 60 * 60,
                    recover: 2 * 60 * 60,
                    email_validation: 10 * 60
                },
                code: {
                    twofa: 10 * 60,
                    email_verification: 10 * 60
                },
                sessions: {
                    security: 15 * 60
                }
            },
            session: {
                expire: {
                    normal: 1 * 24 * 60 * 60,
                    extended: 30 * 24 * 60 * 60
                }
            }
        },

		pagination: {
			items: {
                casino_all_games: 40,
				casino_slots_games: 40,
				casino_live_games: 40,
				casino_recent_games: 40,
				casino_favorites_games: 40,
				casino_providers: 10,
				casino_providers_games: 40

			}
		}
	},

	trading: {
		deposit_bonus: 5,

		withdraw_requirements: {
            deposit: {
                amount: 1.00,
                time: -1 // time in seconds or -1 for all-time
            }
        },

        cash: {
			// TEST MODE: when true, card/paypal deposits are credited instantly
			// without contacting Stripe or charging any real money.
			test_mode: process.env.CASH_TEST_MODE === 'true',

			stripe: {
				public_key: process.env.STRIPE_PUBLIC_KEY,
				secret_key: process.env.STRIPE_SECRET_KEY,
				webhook_secret_key: process.env.STRIPE_WEBHOOK_SECRET_KEY,
				currency: process.env.STRIPE_CURRENCY
			},

            time_cancel_transaction: 1 * 60 * 60
		},

		paypal: {
			mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
			client_id: process.env.PAYPAL_CLIENT_ID || '',
			client_secret: process.env.PAYPAL_CLIENT_SECRET || '',
			callback_url: process.env.PAYPAL_CALLBACK_URL || '/admin/paypal/callback'
		},

        crypto: {
			nowpayments: {
				api_key: process.env.NOWPAYMENTS_API_KEY,
				public_key: process.env.NOWPAYMENTS_PUBLIC_KEY,

                email: process.env.NOWPAYMENTS_EMAIL,
                password: process.env.NOWPAYMENTS_PASSWORD,

                ipn_secret_key: process.env.NOWPAYMENTS_IPN_SECRET_KEY,
                twofa_secret_key: process.env.NOWPAYMENTS_TWOFA_SECRET_KEY,

                callback_url: process.env.NOWPAYMENTS_CALLBACK_URL
			},

			currencies: {
				cooldown_load: 1
			}
		}

	},

	games: {
		history: {
			big_bets: 100.00
		},

		winning_to_chat: 50000.00,

		eos_future: 10,

		games: {
            roulette: {
				multiplayer: true,
				timer: 20,
				cooldown_rolling: 10,
				total_bets: 3,

                multipliers: {
                    red: 2,
                    black: 2,
                    bait: 7,
                    green: 14
                },

				jackpot_commission: 1
			},

            crash: {
				multiplayer: true,
				timer: 5,
				max_profit: 5000.00,
				instant_chance: 5
			},

            jackpot: {
				multiplayer: true,
				timer: 30,
				total_bets: 3,
				bets_start: 2,
				users_start: 2,
				colors: [
					'#FF0000','#FF9D00','#FFF700','#1AFF00','#147AFF',
					'#C414FF','#14FFE4','#99FF14','#D55AED','#CC3798',
					'#965821','#A8A142','#A1ED8E','#37DBB5','#C45F41',
					'#F3408B','#05668D','#4CE0B3','#5D2E8C','#2CA58D',
					'#E9D758','#F68F71','#2B4570','#297373','#5B507A',
					'#1B2238','#C1A88D','#7880B5','#6987C9','#6C99B5',
					'#2B013B','#570C43','#8F065A','#F1EEFD','#AB90F0',
					'#23113A','#F9CC72','#791E94','#DE6449','#D8D4F2'
				]
			},

            coinflip: {
				multiplayer: true,
				cancel: false,
				timer_cancel: 1 * 60 * 60,
				timer_wait_start: 3,
				timer_delete: 1 * 60
			},

            dice: {
				multiplayer: false
			},

            minesweeper: {
				multiplayer: false
			},

            tower: {
				multiplayer: false,
				multipliers: {
					easy: [1.31, 1.74, 2.32, 3.10, 4.13, 5.51, 7.34, 9.79, 13.05],
					medium: [1.47, 2.21, 3.31, 4.96, 7.44, 11.16, 16.74, 25.11, 37.67],
					hard: [1.96, 3.92, 7.84, 15.68, 31.36, 62.72, 125.44, 250.88, 501.76],
					expert: [2.94, 8.82, 26.46, 79.38, 238,14, 714.42, 2143.26, 6429.78, 19289.34],
					master: [3.92, 15.68, 62.72, 250.88, 1003.52, 4014.08, 16056.32, 64225.28, 256901.12]
				},
				tiles: {
					easy: {
                        total: 4,
                        correct: 3
                    },
					medium: {
                        total: 3,
                        correct: 2
                    },
					hard: {
                        total: 2,
                        correct: 1
                    },
					expert: {
                        total: 3,
                        correct: 1
                    },
					master: {
                        total: 4,
                        correct: 1
                    }
				}
			},

            plinko: {
				multiplayer: false,
				results: {
					easy: {
						8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
						9: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
						10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
						11: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
						12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
						13: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
						14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
						15: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
						16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
					},
					medium: {
						8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
						9: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
						10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
						11: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
						12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
						13: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
						14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
						15: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
						16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
					},
					hard: {
						8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
						9: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
						10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
						11: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
						12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
						13: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
						14: [420, 56, 17, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
						15: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
						16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
					}
				}
			},

            casino: {
                multiplayer: false,

                drakon: {
                    agent: {
                        code: process.env.DRAKON_AGENT_CODE,
                        token: process.env.DRAKON_AGENT_TOKEN,
                        secret_key: process.env.DRAKON_AGENT_SECRET_KEY,
                        currency: process.env.DRAKON_AGENT_CURRENCY
                    },
                    language: process.env.DRAKON_LANGUAGE
                },

                // CASINO_MARKET=all|us|ohio
                // CASINO_ALLOWED_PROVIDERS=pragmatic,hacksaw,bgaming  (optional override)
                // CASINO_REAL_MONEY_ONLY=true  (hide demo-only titles)
                // CASINO_ONE_PER_PROVIDER=true (show 1 game from each provider)
                market: (process.env.CASINO_MARKET || 'all').toLowerCase(),
                real_money_only: String(process.env.CASINO_REAL_MONEY_ONLY || 'false').toLowerCase() === 'true',
                one_per_provider: true,
                allowed_providers: (process.env.CASINO_ALLOWED_PROVIDERS || '')
                    .split(',')
                    .map(function(s) { return s.trim(); })
                    .filter(Boolean),

                access_token: {
                    cooldown_load: 10 * 60
                },

                games: {
                    cooldown_load: 1 * 60 * 60
                }
            }
		}
	}
}

module.exports = config;