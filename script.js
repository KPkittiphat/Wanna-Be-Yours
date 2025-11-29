window.requestAnimationFrame =
    window.__requestAnimationFrame ||
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (function () {
            return function (callback, element) {
                var lastTime = element.__lastTime;
                if (lastTime === undefined) {
                    lastTime = 0;
                }
                var currTime = Date.now();
                var timeToCall = Math.max(1, 33 - (currTime - lastTime));
                window.setTimeout(callback, timeToCall);
                element.__lastTime = currTime + timeToCall;
            };
        })();
window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;
    

    var mobile = window.isDevice;
    var koef = mobile ? 0.8 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        //return [Math.sin(rad), Math.cos(rad)];
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };
    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    });

    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.3 : 0.1;
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), mobile ? 130 : 210, mobile ? 8 : 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), mobile ? 95 : 150, mobile ? 6 : 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), mobile ? 60 : 90, mobile ? 3 : 5, 0, 0));
    var heartPointsCount = pointsOrigin.length;

    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    var e = [];
    var hold = false;
    var holdUntil = 0;
    // เก็บเวลาเริ่ม hold เพื่อคำนวณ fade-in ของข้อความ
    var holdStart = 0;
    var messageFade = 1300; // ระยะเวลา fade-in (มิลลิวินาที)
    var holdDuration = 21000; 

    // จัดการเสียงจาก <audio id="bgAudio"> (index.html)
    var audio = document.getElementById('bgAudio') || new Audio('sounds/wanna.mp3');
    audio.loop = true;
    audio.volume = 0.6;

    // อาเรย์เนื้อเพลง (แต่ละบรรทัด) — แก้ข้อความได้ตามต้องการ
    var lyricsLines = [
        "Wanna be your vacuum cleaner",
        "(Wanna be yours)",
        "Breathing in your dust",
        "(Wanna be yours)",
        "I wanna be your Ford Cortina",
        "(Wanna be yours)",
        "I'll never rust",
        "(Wanna be yours)",
        "I just wanna be yours",
        "(Wanna be yours)",
        "I just wanna be yours",
        "(Wanna be yours)",
        "I just wanna be yours",
        "(Wanna be yours)"
    ];

    // ข้อความที่จะขึ้นตรงกลางหัวใจ (จะถูกอัปเดตจากเพลง)
    var messageText = lyricsLines[0];
    var messageColor = "rgba(255,255,255,0.95)";
    var messageFontFamily = "Arial, sans-serif";

    // สีธีมหัวใจ (แก้ค่า hue ตามต้องการ)
    var heartHue = 200;
    
    // ฟังก์ชันช่วย: คืนข้อความตามเวลาของเพลง
    function updateMessageFromAudio() {
        if (!audio) return;
        var t = audio.currentTime || 0;
        
        var timestamps = [
            { time: 0,    text: "Wanna be your vacuum cleaner" },
            { time: 5,    text: "(Wanna be yours)" },
            { time: 6.5,    text: "Breathing in your dust" },
            { time: 8,  text: "(Wanna be yours)" },
            { time: 9.5,  text: "I wanna be your Ford Cortina" },
            { time: 11.5, text: "(Wanna be yours)" },
            { time: 13.5, text: "I'll never rust" },
            { time: 15,   text: "(Wanna be yours)" },
            { time: 16.5,   text: "I just wanna be yours" },
            { time: 18.5, text: "(Wanna be yours)" },
            { time: 20,   text: "I just wanna be yours" },
            { time: 22.5, text: "(Wanna be yours)" },
            { time: 23.5,   text: "I just wanna be yours" },
            { time: 25.5, text: "(Wanna be yours)" }
        ];
        
        var actualTime = t;
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            actualTime = t % audio.duration;
        }
        
        for (var j = timestamps.length - 1; j >= 0; j--) {
            if (actualTime >= timestamps[j].time) {
                 messageText = timestamps[j].text;
                 break;
             }
         }
     }

    var createParticles = function () {
        e.length = 0;
        for (i = 0; i < heartPointsCount; i++) {
            var x = rand() * width;
            var y = rand() * height;
            e[i] = {
                vx: 0,
                vy: 0,
                R: 2,
                speed: rand() + 5,
                q: ~~(rand() * heartPointsCount),
                D: 2 * (i % 2) - 1,
                force: 0.2 * rand() + 0.7,
                f: "hsla(" + heartHue + "," + ~~(40 * rand() + 40) + "%," + ~~(25 * rand() + 60) + "%,.35)",
                trace: []
            };
            for (var k = 0; k < traceCount; k++) e[i].trace[k] = {x: x, y: y};
        }
    };

    createParticles();

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        var now = Date.now();
        var pulseScale = (1 + n) * .5;

        pulse(pulseScale, pulseScale);

        // อัปเดตข้อความจากเสียงเพลงก่อนวาด
        updateMessageFromAudio();

        // เมื่อหัวใจแสดงเต็ม (pulseScale ใกล้ 1) ให้เริ่ม hold 20 วินาที
         if (!hold && pulseScale > 0.99) {
            hold = true;
            holdUntil = now + holdDuration;
            holdStart = now; // เริ่มเวลา fade-in ตั้งแต่เดี๋ยวนี้
         }

        // อย่าเพิ่ม time ขณะ hold เพื่อให้หัวใจคงรูปเดิม
        if (!hold) {
            time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
        } else if (now >= holdUntil) {
            // จบ hold: รีเซ็ตแล้วเริ่มใหม่ (ล้างพื้นหลังและสร้างอนุภาคใหม่)
            hold = false;
            holdStart = 0;
            time = 0;
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fillRect(0, 0, width, height);
            createParticles();
        }

        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);
        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                }
                else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }

        // วาดข้อความตรงกลางหัวใจเมื่ออยู่ในช่วง hold
        if (hold) {
            // คำนวณ alpha ของข้อความ (fade-in) ตามเวลาตั้งแต่ holdStart
            var elapsed = Math.max(0, now - (holdStart || now));
            var messageAlpha = Math.min(1, elapsed / messageFade);

            // สร้าง path ของหัวใจ (ใช้ขนาด outer ที่เดียวกับ pointsOrigin แถวแรก) และ clip
            ctx.save();
            ctx.globalAlpha = messageAlpha; // ใช้ globalAlpha เพื่อทำ fade-in ทั้งข้อความที่อยู่ใน clip
            ctx.beginPath();
            var sx = 210 * pulseScale;
            var sy = 13 * pulseScale;
            var first = true;
            for (var ang = 0; ang < Math.PI * 2; ang += dr) {
                var p = scaleAndTranslate(heartPosition(ang), sx, sy, width / 2, height / 2);
                if (first) {
                    ctx.moveTo(p[0], p[1]);
                    first = false;
                } else {
                    ctx.lineTo(p[0], p[1]);
                }
            }
            ctx.closePath();
            ctx.clip();

            // สร้าง gradient สีที่เข้ากับธีมหัวใจ
            var grad = ctx.createLinearGradient(width / 2, height / 2 - sy, width / 2, height / 2 + sy);
            grad.addColorStop(0, "hsla(" + heartHue + ",80%,95%,1)");
            grad.addColorStop(0.5, "hsla(" + heartHue + ",60%,85%,1)");
            grad.addColorStop(1, "hsla(" + (heartHue - 10) + ",60%,70%,1)");

            // ปรับขนาดฟอนต์: ลดขนาดบนเดสก์ท็อปให้เล็กลง (ปรับตัวหารตามต้องการ)
            var fontSize = Math.max(1, Math.min(width, height) / (mobile ? 24 : 29));
            ctx.font = fontSize + "px " + messageFontFamily;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = grad;
            ctx.shadowColor = "rgba(0,0,0,0.45)";
            ctx.shadowBlur = 8;

            // คำนวณความกว้างสูงสุดให้พอดีกับหัวใจ
            var maxTextWidth = sx * 1.6;

            // simple word-wrap
            var words = messageText.split(' ');
            var lines = [];
            var line = '';
            for (var wi = 0; wi < words.length; wi++) {
                var test = line ? (line + ' ' + words[wi]) : words[wi];
                var w = ctx.measureText(test).width;
                if (w <= maxTextWidth) {
                    line = test;
                } else {
                    if (line) lines.push(line);
                    line = words[wi];
                }
            }
            if (line) lines.push(line);

            // วาดแต่ละบรรทัดให้อยู่กึ่งกลางในกรอบหัวใจ
            var lineHeight = fontSize * 1.1;
            var startY = height / 2 - (lines.length - 1) * lineHeight / 2;
            for (var li = 0; li < lines.length; li++) {
                ctx.fillText(lines[li], width / 2, startY + li * lineHeight);
            }

            ctx.restore();
            // คืนค่า globalAlpha ให้เป็นปกติหลังวาดข้อความ
            ctx.globalAlpha = 1;
        }

        window.requestAnimationFrame(loop, canvas);
    };
    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);