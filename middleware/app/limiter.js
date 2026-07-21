var limiter = require('express-rate-limit');

var config = require('@/config/config.js');

module.exports.global = limiter.rateLimit({
    windowMs: config.app.limiter.global.time * 1000,
    max: config.app.limiter.global.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).render('429', { layout: 'layouts/error' });
    }
});

module.exports.login = limiter.rateLimit({
    windowMs: config.app.limiter.login.time * 1000,
    max: config.app.limiter.login.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(409).json({ 'success': false, 'error': 'Too many login attempts! Please try again later.' });
    }
});

module.exports.register = limiter.rateLimit({
    windowMs: config.app.limiter.register.time * 1000,
    max: config.app.limiter.register.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(409).json({ 'success': false, 'error': 'Too many register attempts! Please try again later.' });
    }
});

module.exports.google = limiter.rateLimit({
    windowMs: config.app.limiter.google.time * 1000,
    max: config.app.limiter.google.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        res.status(409).render('409', { layout: 'layouts/error', error: 'Too many google requests attempts! Please try again later' });
    }
});

module.exports.discord = limiter.rateLimit({
    windowMs: config.app.limiter.discord.time * 1000,
    max: config.app.limiter.discord.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        res.status(409).render('409', { layout: 'layouts/error', error: 'Too many discord requests attempts! Please try again later' });
    }
});

module.exports.recover = limiter.rateLimit({
    windowMs: config.app.limiter.recover.time * 1000,
    max: config.app.limiter.recover.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(409).json({ 'success': false, 'error': 'Too many account recovery attempts! Please try again later.' });
    }
});

module.exports.twofa = limiter.rateLimit({
    windowMs: config.app.limiter.twofa.time * 1000,
    max: config.app.limiter.twofa.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(409).json({ 'success': false, 'error': 'Too many Two-Factory Authentication attempts! Please try again later.' });
    }
});