// ═══════════════════════════════════════════════
//  HONEYNET DASHBOARD — script.js
// ═══════════════════════════════════════════════


// ── CLOCK ──────────────────────────────────────
function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent =
        now.toTimeString().slice(0, 8);
}
setInterval(updateClock, 1000);
updateClock();

// ── MATRIX RAIN ────────────────────────────────
(function matrixRain() {
    const canvas = document.getElementById("matrix");
    const ctx = canvas.getContext("2d");
    let cols, drops;

    function init() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        cols  = Math.floor(canvas.width / 16);
        drops = Array(cols).fill(1);
    }

    function draw() {
        ctx.fillStyle = "rgba(2,8,16,0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ffe5";
        ctx.font = "14px 'Share Tech Mono', monospace";
        drops.forEach((y, i) => {
            const char = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillText(char, i * 16, y * 16);
            if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }

    init();
    window.addEventListener("resize", init);
    setInterval(draw, 50);
})();

// ── ANIMATED COUNTER ───────────────────────────
function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const step = Math.ceil(target / (duration / 30));
    const interval = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = start;
        if (start >= target) clearInterval(interval);
    }, 30);
}

// ── LOG FEED ───────────────────────────────────
function addLog(html, type = "") {
    const feed = document.getElementById("logFeed");
    const line = document.createElement("div");
    line.className = `log-line ${type}`;
    line.innerHTML = html;
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;
}

// ── ALERT BANNER ───────────────────────────────
// FIX 1: Initialize alerts array at module level so cycleAlerts() can access it
let alerts = ["SYSTEM ARMED — MONITORING ACTIVE"];
let alertIdx = 0;

function updateAlerts(data) {
    const alertText = document.getElementById("alertText");

    if (data.alerts && data.alerts.length > 0) {
        // FIX 2: Populate the module-level alerts array from loaded data
        alerts = data.alerts;
        alertText.textContent = alerts[0];
    } else {
        alerts = ["NO ACTIVE THREATS DETECTED"];
        alertText.textContent = alerts[0];
    }
}

function cycleAlerts() {
    const el = document.getElementById("alertText");
    el.style.opacity = 0;
    setTimeout(() => {
        alertIdx = (alertIdx + 1) % alerts.length;
        el.textContent = "⚠ " + alerts[alertIdx];
        el.style.transition = "opacity 0.5s";
        el.style.opacity = 1;
    }, 400);
}
setInterval(cycleAlerts, 4000);

// ── THREAT LEVEL ───────────────────────────────
function getThreatLevel(total) {
    if (total === 0) return { label: "NONE",     color: "#00ff88", pct: 5   };
    if (total < 3)   return { label: "LOW",      color: "#00ff88", pct: 25  };
    if (total < 7)   return { label: "MEDIUM",   color: "#ffaa00", pct: 55  };
    if (total < 15)  return { label: "HIGH",     color: "#ff6600", pct: 80  };
    return                  { label: "CRITICAL", color: "#ff003c", pct: 100 };
}

// ── MAIN DATA LOAD ─────────────────────────────
function loadData() {
    addLog("> FETCHING data.json...", "init");

    fetch("./data.json?v=" + Date.now())
        .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(data => {
            addLog("> DATA LOADED SUCCESSFULLY ✓", "init");
            updateAlerts(data);

            if (data.brute_force_ips && data.brute_force_ips.length > 0) {
                addLog(
                    "> BRUTE FORCE DETECTED FROM: " +
                    data.brute_force_ips.join(", "),
                    "danger"
                );
            }

            if (data.suspicious_usernames && data.suspicious_usernames.length > 0) {
                addLog(
                    "> SUSPICIOUS USERNAMES: " +
                    data.suspicious_usernames.join(", "),
                    "warn"
                );
            }

            const total     = data.total_attempts || 0;
            const uniqueIps = data.unique_ips      || 0;
            const usernames = data.username_data   || {};
            const ips       = data.ip_data         || {};

            // Counters
            setTimeout(() => {
                animateCounter(document.querySelector("#total .counter"), total);
                document.getElementById("bar-total").style.width = Math.min(total * 10, 100) + "%";
            }, 300);

            setTimeout(() => {
                animateCounter(document.querySelector("#uniqueIps .counter"), uniqueIps);
                document.getElementById("bar-ips").style.width = Math.min(uniqueIps * 20, 100) + "%";
            }, 500);

            // Top username
            let topUser = "—", topCount = 0;
            for (const [u, c] of Object.entries(usernames)) {
                if (c > topCount) { topCount = c; topUser = u; }
            }
            setTimeout(() => {
                document.getElementById("topUser").textContent = topUser.toUpperCase();
                document.getElementById("bar-user").style.width = "75%";
            }, 700);

            // Threat level
            const severity = data.severity || "LOW";

            const el = document.getElementById("threatLevel");
            el.textContent = severity;

            let threatColor = "#00ff88";
            if (severity === "MEDIUM") threatColor = "#ffaa00";
            if (severity === "HIGH")   threatColor = "#ff003c";

            el.style.color      = threatColor;
            el.style.textShadow = "0 0 20px " + threatColor;

            const bar = document.getElementById("bar-threat");
            bar.style.background  = threatColor;
            bar.style.boxShadow   = "0 0 8px " + threatColor;
            bar.style.width =
                severity === "LOW"    ? "30%"  :
                severity === "MEDIUM" ? "65%"  :
                "100%";

            document.getElementById("threatMeta").textContent =
                "↑ " + severity + " RISK DETECTED";

            // Username list
            const maxU = Math.max(...Object.values(usernames), 1);
            const userList = document.getElementById("userList");
            userList.innerHTML = "";
            Object.entries(usernames).sort((a,b) => b[1]-a[1]).forEach(([user, count], i) => {
                const pct = Math.round((count / maxU) * 100);
                const div = document.createElement("div");
                div.className = "user-entry";
                div.style.animationDelay = (i * 0.08) + "s";
                div.innerHTML =
                    '<div class="user-entry-header">' +
                        '<span class="user-name">' + user + '</span>' +
                        '<span class="user-count">' + count + '×</span>' +
                    '</div>' +
                    '<div class="user-bar-bg">' +
                        '<div class="user-bar-fill" data-pct="' + pct + '"></div>' +
                    '</div>';
                userList.appendChild(div);
                setTimeout(() => { div.querySelector(".user-bar-fill").style.width = pct + "%"; }, 200 + i * 80);
                addLog(
                    '<span class="ts">' + new Date().toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata', hour12:false}) + '</span>' +
                    '<span class="ip">USERNAME</span>' +
                    '<span class="user">' + user + '</span>— ' + count + ' attempt(s)',
                    count > 3 ? "danger" : "warn"
                );
            });

            // IP list
            const maxI = Math.max(...Object.values(ips), 1);
            const ipList = document.getElementById("ipList");
            ipList.innerHTML = "";
            Object.entries(ips).sort((a,b) => b[1]-a[1]).forEach(([ip, count], i) => {
                const pct = Math.round((count / maxI) * 100);
                const div = document.createElement("div");
                div.className = "user-entry";
                div.style.animationDelay = (i * 0.08) + "s";
                div.innerHTML =
                    '<div class="user-entry-header">' +
                        '<span class="user-name" style="color:var(--purple)">' + ip + '</span>' +
                        '<span class="user-count">' + count + '×</span>' +
                    '</div>' +
                    '<div class="user-bar-bg">' +
                        '<div class="user-bar-fill" data-pct="' + pct + '" style="background:linear-gradient(90deg,var(--purple),var(--red))"></div>' +
                    '</div>';
                ipList.appendChild(div);
                setTimeout(() => { div.querySelector(".user-bar-fill").style.width = pct + "%"; }, 200 + i * 80);
                addLog(
                    '<span class="ts">' + new Date().toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata', hour12:false}) + '</span>' +
                    '<span class="ip">' + ip + '</span>— ' + count + ' login attempt(s) recorded',
                    "warn"
                );
            });

            // FIX 3: Use severity directly instead of undefined threat.label
            document.getElementById("footerStats").textContent =
                "TOTAL: " + total + " | IPs: " + uniqueIps + " | TOP USER: " + topUser.toUpperCase() + " | THREAT: " + severity;

            // Log replay
            setTimeout(() => simulateLogReplay(total), 1500);
        })
        .catch(err => {
            addLog("> ERROR: " + err.message, "danger");
            addLog("> RUN: python -m http.server 8000  THEN OPEN http://localhost:8000/frontend/index.html", "warn");
            document.getElementById("alertText").textContent =
                "✗ FAILED TO LOAD data.json — USE HTTP SERVER, NOT file://";
        });
}

// ── SIMULATED LOG REPLAY ───────────────────────
function simulateLogReplay(total) {
    addLog("> REPLAYING INTRUSION LOG...", "init");
    const hashes = ["03ac6742...d7c846f4","5994471a...6da59b3c","1a8f53dc...173cacfc","80913379...dfab9756"];
    const users  = ["admin","root","user","test","a"];
    const count  = Math.max(total, 1);
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const ts   = new Date(Date.now() - (count - i) * 15000).toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata', hour12:false});
            const user = users[i % users.length];
            const hash = hashes[i % hashes.length];
            addLog(
                '<span class="ts">' + ts + '</span>' +
                '<span class="ip">127.0.0.1</span>' +
                '<span class="user">' + user + '</span>' +
                '<span class="hash">' + hash + '</span>',
                i % 3 === 0 ? "danger" : ""
            );
        }, i * 300);
    }
}

// ── BOOT SEQUENCE ──────────────────────────────
setTimeout(() => addLog("> MATRIX RENDERER ONLINE", "init"), 200);
setTimeout(() => addLog("> THREAT ENGINE ARMED", "init"), 500);
setTimeout(() => addLog("> CONNECTING TO HONEYPOT LOG...", "init"), 900);
setTimeout(loadData, 1200);
setTimeout(loadData, 1200);
