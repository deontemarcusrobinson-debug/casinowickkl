var crypto = require('crypto');
var express = require('express');
var layouts = require('express-ejs-layouts');
var session = require('express-session');
var useragent = require('express-useragent');
var passport = require('passport');
var cors = require('cors');
var cookie = require('cookie-parser');
var helmet = require('helmet');

var { loggerError } = require('@/lib/logger.js');

var app = express();

app.set('trust proxy', 1);

// SERVER STATIC FILES
app.use(express.static('public'));
app.use('/audio', express.static('public/audio'));
app.use('/css', express.static('public/css'));
app.use('/fonts', express.static('public/fonts'));
app.use('/img', express.static('public/img'));
app.use('/js', express.static('public/js'));
app.use('/videos', express.static('public/videos'));

// VIEW ENGINE SETUP
app.use(layouts);
app.set('layout', 'layouts/default');
app.set('view engine', 'ejs');
app.set('env', process.env.APP_ENV);

// HELMET HEADERS MIDDLEWARE
app.use(helmet.hidePoweredBy());
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.xssFilter());
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
}));
app.use((req, res, next) => {
    var nonce = crypto.randomBytes(16).toString('base64');

    res.locals.nonce = nonce;

    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [ "'self'" ],
            scriptSrc: [ "'self'", "'nonce-" + nonce + "'", "'strict-dynamic'" ],
            styleSrc: [ "'self'", "'unsafe-inline'", "https:" ],
            imgSrc: [ "'self'", "blob:", "data:", "http:", "https:" ],
            connectSrc: [ "'self'", "http:", "https:" ],
            frameSrc: [ "'self'", "http:", "https:" ],
            objectSrc: [ "'none'" ],
            frameAncestors: [ "'none'" ],
            upgradeInsecureRequests: []
        }
    })(req, res, next);
});
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({
    policy: 'no-referrer'
}));
app.use(helmet.permittedCrossDomainPolicies());

// HEADERS MIDDLEWARE
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// PARSE URL-ENCODED BODIES (AS SEND BY HTML FORMS)
app.use(express.urlencoded({ extended: false }));

// JSON MIDDLEWARE
app.use(express.json());

// CORS CONFIGURATION MIDDLEWARE
app.use(cors());

// COOKIE MIDDLEWARE
app.use(cookie());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// SESSION MIDDLEWARE
var cookieSecure = process.env.APP_SECURE === 'true'
    || process.env.COOKIE_SECURE === 'true'
    || String(process.env.APP_URL || '').indexOf('https://') === 0;

app.use(session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: true,
    cookie: {
        // HTTPS frontends (Render / Railway / ngrok) need secure cookies even when Node itself is HTTP
        secure: cookieSecure,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// STRIPE CALLBACK
app.use('/stripe', require('@/routes/api/stripe.js'));

// NOWPAYMENTS CALLBACK
app.use('/nowpayments', require('@/routes/api/nowpayments.js'));

// PAYPAL WEBHOOK (server-side payment verification backup)
app.use('/paypal', require('@/routes/api/paypal.js'));

// DRAKON WEBHOOK
app.use('/drakon', require('@/routes/api/drakon.js'));

// BOT DETECTOR
app.use(useragent.express());
app.use((req, res, next) => {
    if(!req.headers['user-agent']) return res.status(500).render('500', { layout: 'layouts/error', error: 'Useragent is not defined' });

    if(!req.useragent) return res.status(500).render('500', { layout: 'layouts/error', error: 'Useragent is not defined' });

    var allowedBots = [
        'Googlebot',
        'Google-InspectionTool',
        'bingbot',
        'DuckDuckBot',
        'Twitterbot',
        'facebookexternalhit',
        'Facebot',
        'Instagram',
        'Discordbot',
        'Slackbot'
    ];

    if(allowedBots.some(bot => req.headers['user-agent'].toLowerCase().includes(bot.toLowerCase()))) return next();

    if(req.useragent.isBot) return res.status(403).render('403', { layout: 'layouts/error', error: 'Bot detected' });

    next();
});

// RATE LIMITER
app.use(require('@/middleware/app/limiter.js').global);

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// MANIFEST MIDDLEWARE
app.use(require('@/middleware/app/manifest.js'));

// GLOBAL MIDDLEWARES
app.use(require('@/middleware/app/authentication.js'));
app.use(require('@/middleware/app/user.js'));
app.use(require('@/middleware/app/banip.js'));
app.use(require('@/middleware/app/visitors.js'));
app.use(require('@/middleware/app/trackingLink.js'));
app.use(require('@/middleware/app/globals.js'));
app.use(require('@/middleware/app/maintenance.js'));
app.use(require('@/middleware/app/bansite.js'));

// REFERRAL MIDDLEWARE
app.use('/r/:referral', require('@/middleware/app/referral.js'));

// ROUTES
app.use('/auth', require('@/routes/api/auth.js'));
app.use('/twofa', require('@/routes/api/twofa.js'));
app.use('/', require('@/routes/auth.js'));

app.use(require('@/middleware/app/auth.js'));

app.use('/', require('@/routes/index.js'));

// ERROR HANDLER
app.use((err, req, res, next) => {
    loggerError(err);

    if(process.env.APP_ENV == 'production') {
        res.status(500).render('500', { layout: 'layouts/error', error: 'Internal Server Error' });
    } else if(process.env.APP_ENV == 'development') {
        var error = null;

        try{
            error = err.stack.toString();
        } catch(e) {
            error = err.toString();
        }

        res.status(500).render('500', { layout: 'layouts/error', error });
    }
});

// ROUTE FOR 404 PAGES
app.all('*', (req, res) => {
    res.status(404).render('404', { layout: 'layouts/error' });
});

module.exports = app;