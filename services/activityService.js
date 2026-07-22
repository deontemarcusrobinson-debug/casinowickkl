/**
 * Soft social-proof activity: fake playing counts, live bets, and leaderboard fillers.
 * Real bets/leaderboard rows are kept and merged on top.
 */
var { roundedToFixed, getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { time } = require('@/utils/formatDate.js');
var { emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

var playingCounts = {}; // gameId -> number
var channelOnline = {}; // chat channel -> online count
var fakeBetPool = []; // recent synthetic bets for all_bets / big_bets
var fakeLeaderboard = [];
var catalogProvider = null;
var started = false;
var ONLINE_CAP = 8700;
var OTHER_CHANNEL_CAP = 179;
var EN_MIN = 800;
var EN_MAX = 8700;

// English online drift state (slow, realistic — never snaps)
var enOnline = null;
var enOnlineBootAt = 0;
var enLastDipAt = 0;
var enSoftTarget = 4200;

// Baseline activity by language (English/USA uses slow drift below)
var CHANNEL_SEEDS = {
    fr: [70, 150],
    de: [80, 160],
    es: [90, 165],
    pt: [55, 140],
    ru: [45, 130],
    jp: [40, 120],
    il: [25, 95],
    tr: [50, 145],
    ro: [30, 110],
    sv: [28, 100]
};

var FAKE_NAMES = [
    'NovaSpin', 'LuckyRex', 'JadeViper', 'CashOrbit', 'MintRush', 'GoldByte',
    'RubyDrift', 'AceHarbor', 'PixelPot', 'StormCoin', 'VelvetWin', 'ShadowBet',
    'CrystalFox', 'IronLotus', 'NeonHarbor', 'BlueComet', 'SilverFang', 'EchoKing',
    'RapidTide', 'PrimeVault', 'OnyxRoll', 'AmberJack', 'FrostBet', 'SolarChip',
    'QuinnSpin', 'MiloStake', 'ZaraLuck', 'KaiFortune', 'LenaRoll', 'DrewJackpot',
    'ApexCoin', 'BlitzPot', 'ChromeWin', 'DeltaRush', 'EmberStake', 'FlashTide',
    'GlintBet', 'HyperRoll', 'IvoryCash', 'JetFortune', 'KarmaSpin', 'LunarPot',
    'MirageWin', 'NitroChip', 'OrbitLuck', 'PulseStake', 'QuantumBet', 'RogueSpin',
    'StellarWin', 'TurboVault', 'UltraFang', 'VortexCoin', 'WaveJack', 'XenonRoll',
    'YellowAce', 'ZenHarbor', 'AlphaMint', 'BraveGold', 'CyberRex', 'DarkNova',
    'EliteByte', 'FireComet', 'GhostPot', 'HoloStake', 'IceKing', 'JazzChip',
    'KingRush', 'LiteViper', 'MegaOrbit', 'NightBet', 'OmegaWin', 'PhantomRoll',
    'QuickJade', 'RoyalTide', 'SkyFortune', 'TitanSpin', 'UrbanCash', 'VividAce',
    'WildEcho', 'AeroJack', 'BoltMint', 'CoinFox', 'DriftKing', 'EdgeVault'
];

var FAKE_NAME_SUFFIXES = [
    '', 'X', 'Pro', 'VIP', 'HQ', '88', '77', '21', '99', 'Prime', 'Max', 'Plus'
];

function setCatalogProvider(fn) {
    catalogProvider = fn;
}

function getCatalog() {
    try {
        return catalogProvider ? (catalogProvider() || []) : [];
    } catch (e) {
        return [];
    }
}

function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pick(arr) {
    if(!arr || !arr.length) return null;
    return arr[randInt(0, arr.length - 1)];
}

function fakeAvatar() {
    var base = String(config.app.url || '').replace(/\/$/, '');
    return base + '/img/avatar.jpg';
}

function fakeUser(forcedName) {
    var base = forcedName || pick(FAKE_NAMES) || 'Player';
    var suffix = pick(FAKE_NAME_SUFFIXES) || '';
    var name = suffix ? (base + suffix) : base;
    if(Math.random() < 0.35) name = base + randInt(2, 99);
    var xp = randInt(80, 5200);
    return getUserInfo({
        userid: 'bot-' + name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + randInt(1000, 9999),
        name: name,
        avatar: fakeAvatar(),
        xp: xp,
        anonymous: 0
    });
}

var PLAYING_MIN = 9;
var PLAYING_MAX = 350;
var playingReseeded = false;

function ensurePlayingFor(gameId) {
    if(playingCounts[gameId] == null || playingCounts[gameId] < PLAYING_MIN) {
        // Weighted so most games sit mid-range (looks real), a few hot/cold
        var roll = Math.random();
        var seed;
        if(roll < 0.15) seed = randInt(PLAYING_MIN, 40);          // quieter
        else if(roll < 0.75) seed = randInt(40, 160);             // normal (e.g. ~27–150)
        else if(roll < 0.95) seed = randInt(160, 260);            // busy
        else seed = randInt(260, PLAYING_MAX);                    // hottest
        playingCounts[gameId] = seed;
    }
    return playingCounts[gameId];
}

function getPlaying(gameId) {
    if(!gameId) return randInt(PLAYING_MIN, 80);
    return ensurePlayingFor(gameId);
}

function refreshPlayingCounts() {
    // One-time wipe of old 8–14 scaled counts so games reseed into 9–350
    if(!playingReseeded) {
        playingCounts = {};
        playingReseeded = true;
    }

    var catalog = getCatalog();
    var ids = catalog.map(function(g) { return g.id; });

    // Nudge each game up/down inside 9–350 (do NOT scale down to fit online cap)
    ids.forEach(function(id) {
        var cur = ensurePlayingFor(id);
        var delta = randInt(-22, 28);
        playingCounts[id] = Math.max(PLAYING_MIN, Math.min(PLAYING_MAX, cur + delta));
    });

    // Drop stale ids
    Object.keys(playingCounts).forEach(function(id) {
        if(ids.indexOf(id) === -1) delete playingCounts[id];
    });

    nudgeOtherChannels();
}

function getTotalPlaying() {
    var catalog = getCatalog();
    catalog.forEach(function(g) {
        if(g && g.id) ensurePlayingFor(g.id);
    });

    var sum = 0;
    Object.keys(playingCounts).forEach(function(id) {
        sum += playingCounts[id] || 0;
    });

    return Math.max(0, sum);
}

function getChatChannels() {
    return (config.app.chat && config.app.chat.channels) ? Object.keys(config.app.chat.channels) : ['en'];
}

function maxOtherOnline() {
    var max = 0;
    getChatChannels().forEach(function(ch) {
        if(ch === 'en') return;
        max = Math.max(max, channelOnline[ch] || 0);
    });
    return max;
}

function ensureChannelOnlineSeeded() {
    getChatChannels().forEach(function(ch) {
        if(ch === 'en') return;
        if(channelOnline[ch] != null) return;
        var range = CHANNEL_SEEDS[ch] || [30, 150];
        channelOnline[ch] = randInt(range[0], Math.min(OTHER_CHANNEL_CAP, range[1]));
    });
    seedEnglishOnline();
}

function seedEnglishOnline() {
    if(enOnline != null) return;
    // Start near the floor so it climbs naturally
    enOnline = randInt(EN_MIN, EN_MIN + 40);
    enOnlineBootAt = Date.now();
    enLastDipAt = Date.now();
    enSoftTarget = randInt(3200, 5600);
    channelOnline.en = enOnline;
}

function nudgeOtherChannels() {
    ensureChannelOnlineSeeded();
    getChatChannels().forEach(function(ch) {
        if(ch === 'en') return;
        var cur = channelOnline[ch] != null ? channelOnline[ch] : randInt(30, 150);
        var delta = randInt(-8, 10);
        channelOnline[ch] = Math.max(18, Math.min(OTHER_CHANNEL_CAP, cur + delta));
    });
}

function tickEnglishOnline() {
    seedEnglishOnline();

    var now = Date.now();
    var warmedUp = (now - enOnlineBootAt) >= (30 * 60 * 1000);

    // Every ~12 minutes: small dip to keep it balanced
    if((now - enLastDipAt) >= (12 * 60 * 1000)) {
        enOnline = Math.max(EN_MIN, enOnline - randInt(18, 48));
        enLastDipAt = now;
        enSoftTarget = Math.max(EN_MIN + 400, Math.min(EN_MAX - 400, enSoftTarget + randInt(-180, 180)));
    }

    var delta;
    if(!warmedUp) {
        // First 30 min: steady climb (~+8 to +15 each ~30s, e.g. 800 → 812)
        delta = randInt(8, 15);
    } else if(enOnline < enSoftTarget - 100) {
        // After 30 min: slower climb toward soft target
        delta = randInt(2, 6);
    } else if(enOnline > enSoftTarget + 100) {
        // Gently ease down toward balance
        delta = -randInt(2, 8);
    } else {
        // Hover near target with tiny noise
        delta = randInt(-4, 5);
    }

    enOnline = Math.max(EN_MIN, Math.min(EN_MAX, enOnline + delta));
    // Always stay clearly above other languages
    enOnline = Math.max(enOnline, maxOtherOnline() + 200);
    enOnline = Math.min(EN_MAX, enOnline);
    channelOnline.en = enOnline;
}

function refreshChannelOnline(broadcast) {
    nudgeOtherChannels();
    tickEnglishOnline();
    if(broadcast !== false) broadcastOnline();
}

function getOnlineByChannel() {
    ensureChannelOnlineSeeded();

    var out = {};
    getChatChannels().forEach(function(ch) {
        out[ch] = channelOnline[ch] != null ? channelOnline[ch] : 0;
    });
    if(out.en != null) {
        out.en = Math.max(EN_MIN, Math.min(EN_MAX, out.en));
        out.en = Math.max(out.en, maxOtherOnline() + 200);
        out.en = Math.min(EN_MAX, out.en);
    }
    return out;
}

function broadcastOnline() {
    try {
        var { emitSocketToAll } = require('@/utils/socket.js');
        emitSocketToAll('site', 'online', { online: getOnlineByChannel() });
    } catch (e) {}
}

function scheduleChannelOnlineTick() {
    refreshChannelOnline(true);
    // ~30s cadence so climbs feel gradual (800 → ~812), not sudden jumps
    var delay = randInt(28, 33) * 1000;
    setTimeout(scheduleChannelOnlineTick, delay);
}

function attachPlaying(list) {
    if(!Array.isArray(list)) return list;
    return list.map(function(item) {
        if(!item || !item.id) return item;
        return Object.assign({}, item, { playing: getPlaying(item.id) });
    });
}

function makeFakeBet(forceBig) {
    var catalog = getCatalog();
    var game = pick(catalog);
    if(!game) return null;

    var amount = forceBig
        ? roundedToFixed(randInt(100, 420) + Math.random(), 2)
        : roundedToFixed([0.2, 0.5, 1, 1.5, 2, 3, 5, 8, 10, 12, 15, 20, 25, 40, 55][randInt(0, 14)] + Math.random() * 0.4, 2);

    var hit = Math.random() < 0.42;
    var multiplier = hit
        ? roundedToFixed([0.5, 0.8, 1.1, 1.5, 2.1, 2.8, 3.5, 5, 8.2, 12, 18, 25][randInt(0, 11)], 2)
        : 0;
    var winning = hit ? getFormatAmount(amount * multiplier) : 0;

    if(forceBig && winning < (config.games.history.big_bets || 100)) {
        multiplier = roundedToFixed(randInt(3, 12) + Math.random(), 2);
        winning = getFormatAmount(amount * multiplier);
    }

    return {
        user: fakeUser(),
        category: 'casino',
        game: {
            id: game.id,
            name: game.name
        },
        amount: getFormatAmount(amount),
        multiplier: multiplier,
        winning: winning,
        time: time(),
        fake: true
    };
}

function pushFakeBet(history) {
    if(!history) return;
    fakeBetPool.push(history);
    if(fakeBetPool.length > 24) fakeBetPool.shift();
}

function emitFakeBet(history) {
    if(!history) return;

    emitSocketToRoom('history_all_bets', 'history', 'history', {
        history: { type: 'all_bets', page: 'casino', history: history }
    });

    if(history.winning >= (config.games.history.big_bets || 100)) {
        emitSocketToRoom('history_big_bets', 'history', 'history', {
            history: { type: 'big_bets', page: 'casino', history: history }
        });
    }

    emitSocketToRoom('history_game_bets', 'history', 'history', {
        history: { type: 'game_bets', page: 'casino', history: history }
    });
    emitSocketToRoom('history_game_bets_casino', 'history', 'history', {
        history: { type: 'game_bets', page: 'casino', history: history }
    });
}

function mergeWithFakeBets(realList, type) {
    var real = Array.isArray(realList) ? realList.slice() : [];
    var fakes = fakeBetPool.slice();

    if(type === 'big_bets') {
        fakes = fakes.filter(function(h) {
            return h.winning >= (config.games.history.big_bets || 100);
        });
    }

    var merged = real.concat(fakes).sort(function(a, b) {
        return (a.time || 0) - (b.time || 0);
    });

    // Keep a lively feed without burying real bets
    if(merged.length > 14) merged = merged.slice(merged.length - 14);
    return merged;
}

function rebuildLeaderboardFakes() {
    var rows = [];
    var usedNames = {};

    for(var i = 0; i < 100; i++) {
        var user = fakeUser();
        var guard = 0;
        while(usedNames[user.name] && guard < 20) {
            user = fakeUser();
            guard++;
        }
        usedNames[user.name] = true;

        // Bigger wagered near the top of the list
        var tier = i < 10 ? 'high' : (i < 40 ? 'mid' : 'low');
        var wageredNum;
        if(tier === 'high') wageredNum = randInt(1800, 9200) + Math.random();
        else if(tier === 'mid') wageredNum = randInt(400, 2800) + Math.random();
        else wageredNum = randInt(80, 900) + Math.random();

        // Always look profitable: won more than they played (about +8% to +90%)
        var profitMult = 1.08 + Math.random() * 0.82;
        var winningsNum = wageredNum * profitMult;

        rows.push({
            user: user,
            games: tier === 'high' ? randInt(700, 2400) : (tier === 'mid' ? randInt(200, 1600) : randInt(40, 600)),
            wagered: getFormatAmountString(wageredNum),
            winnings: getFormatAmountString(winningsNum),
            _wagered: wageredNum,
            fake: true
        });
    }

    fakeLeaderboard = rows.sort(function(a, b) {
        return (b._wagered || 0) - (a._wagered || 0);
    });
}

function mergeLeaderboard(realRows) {
    var real = (realRows || []).map(function(row) {
        return Object.assign({}, row, {
            _wagered: parseFloat(String(row.wagered).replace(/[^0-9.]/g, '')) || 0
        });
    });

    if(!fakeLeaderboard.length) rebuildLeaderboardFakes();

    return real.concat(fakeLeaderboard)
        .sort(function(a, b) { return (b._wagered || 0) - (a._wagered || 0); })
        .slice(0, 100)
        .map(function(row) {
            return {
                user: row.user,
                games: row.games,
                wagered: row.wagered,
                winnings: row.winnings
            };
        });
}

function seedFakeBets() {
    fakeBetPool = [];
    for(var i = 0; i < 10; i++) {
        var bet = makeFakeBet(i % 4 === 0);
        if(bet) {
            bet.time = time() - (10 - i) * randInt(20, 90);
            pushFakeBet(bet);
        }
    }
}

function scheduleNextFakeBet() {
    var delay = randInt(25, 95) * 1000; // 25s–95s for a live feel
    setTimeout(function() {
        var bet = makeFakeBet(Math.random() < 0.18);
        if(bet) {
            pushFakeBet(bet);
            emitFakeBet(bet);
        }
        scheduleNextFakeBet();
    }, delay);
}

function scheduleLeaderboardRefresh() {
    var delay = randInt(5, 20) * 60 * 1000; // 5–20 min
    setTimeout(function() {
        rebuildLeaderboardFakes();
        scheduleLeaderboardRefresh();
    }, delay);
}

function initialize() {
    if(started) return;
    started = true;

    refreshPlayingCounts();
    seedFakeBets();
    rebuildLeaderboardFakes();
    refreshChannelOnline(true);

    setInterval(refreshPlayingCounts, 5 * 60 * 1000);
    scheduleChannelOnlineTick();
    scheduleNextFakeBet();
    scheduleLeaderboardRefresh();
}

module.exports = {
    initialize,
    setCatalogProvider,
    getPlaying,
    getTotalPlaying,
    getOnlineByChannel,
    broadcastOnline,
    attachPlaying,
    mergeWithFakeBets,
    mergeLeaderboard,
    refreshPlayingCounts
};
