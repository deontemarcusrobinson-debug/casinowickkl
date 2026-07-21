var { pool } = require('@/lib/database.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');
var { escapeHTML } = require('@/utils/utils.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function claimRequest(user, socket, id, secret, cooldown){
	cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

	pool.query('SELECT `id` FROM `support_requests` WHERE `requestid` = ' + pool.escape(id) + ' AND `status` = 0', function(err1, row1){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while claiming support request (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid support request or already closed!'
            });

            return cooldown(false, true);
        }

        pool.query('INSERT `support_claims` SET `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `requestid` = ' + pool.escape(row1[0].id) + ', `time` = ' + pool.escape(time()), function(err2, row2){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while claiming support request (2)'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `support_requests` SET `status` = 1 WHERE `id` = ' + pool.escape(row1[0].id) + ' AND `status` = 0', function(err3, row3){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while claiming support request (3)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToRoom('admin/support/requests/' + id, 'admin', 'support_claim', {
                    closed: 0,
                    status: 1
                });

                emitSocketToUser(socket, 'message', 'success', {
                    message: 'You successfully claimed this support request!'
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function releaseRequest(user, socket, id, secret, cooldown){
	cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

	pool.query('SELECT support_requests.id FROM `support_requests` INNER JOIN `support_claims` ON support_requests.id = support_claims.requestid WHERE support_requests.requestid = ' + pool.escape(id) + ' AND (support_requests.status = 1 OR support_requests.status = 2) AND support_claims.ended = 0', function(err1, row1){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while releasing support request (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid support request or already closed!'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `support_claims` SET `ended` = 1 WHERE `requestid` = ' + pool.escape(row1[0].id) + ' AND `ended` = 0', function(err2, row2){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while releasing support request (2)'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `support_requests` SET `status` = 0 WHERE `id` = ' + pool.escape(row1[0].id) + ' AND (`status` = 1 OR `status` = 2)', function(err3, row3){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while releasing support request (3)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToRoom('admin/support/requests/' + id, 'admin', 'support_release', {
                    closed: 0,
                    status: 0
                });

                emitSocketToUser(socket, 'message', 'success', {
                    message: 'You successfully released this support request!'
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function changeRequestDepartment(user, socket, id, department, secret, cooldown){
	cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

    /* CHECK DATA */

    if(isNaN(Number(department))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid department!'
		});

		return cooldown(false, true);
	}

	department = parseInt(department);

	var allowed_departments = [ 0, 1, 2, 3, 4, 5 ];
	if(!allowed_departments.includes(department)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid department!'
		});

		return cooldown(false, true);
	}

    /* END CHECK DATA */

    pool.query('SELECT support_requests.id FROM `support_requests` INNER JOIN `support_claims` ON support_requests.id = support_claims.requestid WHERE support_requests.requestid = ' + pool.escape(id) + ' AND (support_requests.status = 1 OR support_requests.status = 2) AND support_claims.ended = 0', function(err1, row1){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while changing department support request (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid support request or already closed!'
            });

            return cooldown(false, true);
        }

        var update = time();

        pool.query('UPDATE `support_requests` SET `department` = ' + pool.escape(department) + ', `update` = ' + pool.escape(update) + ' WHERE `id` = ' + pool.escape(row1[0].id) + ' AND (`status` = 1 OR `status` = 2)', function(err3, row3){
            if(err3) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while changing department support request (3)'
                });

                return cooldown(false, true);
            }

            emitSocketToRoom('admin/support/requests/' + id, 'admin', 'support_department', {
                department: department,
                date: makeDate(new Date(update * 1000))
            });

            emitSocketToRoom('support/requests/' + id, 'support', 'department', {
                department: department,
                date: makeDate(new Date(update * 1000))
            });

            emitSocketToUser(socket, 'message', 'success', {
                message: 'You successfully released this support request!'
            });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function replyRequest(user, socket, id, message, secret, cooldown){
	cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

    /* CHECK DATA */

    message = message.trim();

    if(message.length < config.app.support.requirements.message_length.min || message.length > config.app.support.requirements.message_length.max){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid message length [' + config.app.support.requirements.message_length.min + '-' + config.app.support.requirements.message_length.max + ']!'
        });

        return cooldown(false, true);
    }

    message= escapeHTML(message);

    /* END CHECK DATA */

    pool.query('SELECT support_requests.id, support_requests.name FROM `support_requests` INNER JOIN `support_claims` ON support_requests.id = support_claims.requestid WHERE support_requests.requestid = ' + pool.escape(id) + ' AND (support_requests.status = 1 OR support_requests.status = 2) AND support_claims.ended = 0', function(err1, row1){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while replying support request (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid support request or already closed!'
            });

            return cooldown(false, true);
        }

        var update = time();

        pool.query('INSERT `support_messages` SET `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `message` = ' + pool.escape(message) + ', `requestid` = ' + pool.escape(row1[0].id) + ', `response` = 1, `time` = ' + pool.escape(update), function(err2, row2){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while replying support request (2)'
                });

                return cooldown(false, true);
            }

            pool.query('UPDATE `support_requests` SET `status` = 2, `update` = ' + pool.escape(update) + ' WHERE `id` = ' + pool.escape(row1[0].id) + ' AND (`status` = 1 OR `status` = 2)', function(err3, row3){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while replying support request (3)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToRoom('admin/support/requests/' + id, 'admin', 'support_reply', {
                    closed: 0,
                    status: 2,
                    user: getUserInfo({
                        userid: user.userid,
                        name: user.name,
                        avatar: user.avatar,
                        xp: user.xp,
                        anonymous: 0
                    }),
                    requester: row1[0].name,
                    response: 1,
                    message: message,
                    date: makeDate(new Date(update * 1000))
                });

                emitSocketToRoom('support/requests/' + id, 'support', 'reply', {
                    closed: 0,
                    status: 2,
                    user: getUserInfo({
                        userid: user.userid,
                        name: user.name,
                        avatar: user.avatar,
                        xp: user.xp,
                        anonymous: 0
                    }),
                    requester: row1[0].name,
                    response: 1,
                    message: message,
                    date: makeDate(new Date(update * 1000))
                });

                emitSocketToUser(socket, 'message', 'success', {
                    message: 'You successfully replied this support request!'
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function closeRequest(user, socket, id, secret, cooldown){
	cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

    pool.query('SELECT support_requests.id FROM `support_requests` INNER JOIN `support_claims` ON support_requests.id = support_claims.requestid WHERE support_requests.requestid = ' + pool.escape(id) + ' AND (support_requests.status = 1 OR support_requests.status = 2) AND support_claims.ended = 0', function(err1, row1){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while closing support request (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid support request or already closed!'
            });

            return cooldown(false, true);
        }

        var update = time();

        pool.query('UPDATE `support_requests` SET `closed` = 1, `update` = ' + pool.escape(update) + ' WHERE `id` = ' + pool.escape(row1[0].id) + ' AND (`status` = 1 OR `status` = 2)', function(err2, row2){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while closing support request (2)'
                });

                return cooldown(false, true);
            }

            emitSocketToRoom('admin/support/requests/' + id, 'admin', 'support_close', {
                closed: 1,
                date: makeDate(new Date(update * 1000))
            });

            emitSocketToRoom('support/requests/' + id, 'admin', 'close', {
                closed: 1,
                date: makeDate(new Date(update * 1000))
            });

            emitSocketToUser(socket, 'message', 'success', {
                message: 'You successfully closed this support request!'
            });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function getRequests(user, socket, page, status, department, search, cooldown){
    cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	/* CHECK DATA */

	var status_allowed = [ 0, 1, 2, 3, 4 ];
	if(!status_allowed.includes(status)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid status!'
		});

		return cooldown(false, true);
	}

    var department_allowed = [ 0, 1, 2, 3, 4, 5, 6 ];
	if(!department_allowed.includes(department)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid department!'
		});

		return cooldown(false, true);
	}

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

	/* END CHECK DATA */

    var status_query = {
        0: 'AND support_requests.status IN (0, 1, 2)',
        1: 'AND support_requests.status = 0 AND support_requests.closed = 0',
        2: 'AND support_requests.status = 1 AND support_requests.closed = 0',
        3: 'AND support_requests.status = 2 AND support_requests.closed = 0',
        4: 'AND support_requests.closed = 1'
    }[status];

    var department_query = {
        0: 'AND support_requests.department IN (0, 1, 2, 3, 4, 5)',
        1: 'AND support_requests.department = 0',
        2: 'AND support_requests.department = 1',
        3: 'AND support_requests.department = 2',
        4: 'AND support_requests.department = 3',
        5: 'AND support_requests.department = 4',
        6: 'AND support_requests.department = 6'
    }[department];

	pool.query('SELECT COUNT(*) AS `count` FROM `support_requests` WHERE (`requestid` LIKE ' + pool.escape('%' + search + '%') + ' OR `subject` LIKE ' + pool.escape('%' + search + '%') + ') ' + status_query + ' ' + department_query, function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting support requests (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'admin_support_requests', {
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

		pool.query('SELECT support_requests.subject, support_requests.department, support_requests.closed, support_requests.status, support_requests.requestid, support_requests.update, support_requests.time, support_claims.userid, support_claims.name, support_claims.avatar, support_claims.xp FROM `support_requests` LEFT JOIN `support_claims` ON support_requests.id = support_claims.requestid AND support_claims.ended = 0 WHERE (support_requests.requestid LIKE ' + pool.escape('%' + search + '%') + ' OR support_requests.subject LIKE ' + pool.escape('%' + search + '%') + ')' + ' ' + status_query + ' ' + department_query + ' ORDER BY support_requests.status ASC, support_requests.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting support requests (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(a => ({
				id: a.requestid,
                subject: a.subject,
                department: parseInt(a.department),
                closed: parseInt(a.closed),
                status: parseInt(a.status),
                assigned: parseInt(a.status) > 0 ? getUserInfo({
                    userid: a.userid,
                    name: a.name,
                    avatar: a.avatar,
                    xp: parseInt(a.xp),
                    anonymous: 0
                }) : null,
                created: makeDate(new Date(a.time * 1000)),
                updated: makeDate(new Date(a.update * 1000))
			}));

			emitSocketToUser(socket, 'pagination', 'admin_support_requests', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

module.exports = {
    claimRequest, releaseRequest,
    changeRequestDepartment, replyRequest, closeRequest,
    getRequests
};