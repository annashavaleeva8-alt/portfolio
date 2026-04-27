/**
 * Фон «искры» для секции контактов (аналог SparklesCore + demo).
 * Статический сайт: tsParticles 2.x с CDN, без React / npm.
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function tryLoad() {
    if (typeof tsParticles === "undefined") return false;

    var host = document.getElementById("contact-particles");
    var section = document.getElementById("contact");
    if (!host || !section) return true;

    var mobile = window.innerWidth < 768;
    var count = mobile ? 55 : 95;
    var area = mobile ? 600 : 900;

    tsParticles.load("contact-particles", {
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: mobile ? 45 : 60,
      background: {
        color: { value: "transparent" }
      },
      particles: {
        color: { value: "#dcc49a" },
        shape: { type: "circle" },
        number: {
          value: count,
          density: { enable: true, value_area: area }
        },
        opacity: {
          value: { min: 0.08, max: 0.55 },
          random: true,
          animation: {
            enable: true,
            speed: mobile ? 1.2 : 2,
            minimumValue: 0.06,
            sync: false
          }
        },
        size: {
          value: { min: 0.5, max: 2.2 },
          random: true
        },
        move: {
          enable: true,
          speed: { min: 0.08, max: 0.45 },
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out"
        },
        links: { enable: false }
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
          resize: true
        }
      }
    });

    return true;
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    if (!tryLoad()) started = false;
  }

  function waitAndStart() {
    if (typeof tsParticles !== "undefined") {
      start();
      return;
    }
    var n = 0;
    var t = setInterval(function () {
      n++;
      if (typeof tsParticles !== "undefined") {
        clearInterval(t);
        start();
      } else if (n > 80) {
        clearInterval(t);
      }
    }, 50);
  }

  var section = document.getElementById("contact");
  if (!section) return;

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          waitAndStart();
          io.disconnect();
        });
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );
    io.observe(section);
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", waitAndStart);
    } else {
      waitAndStart();
    }
  }
})();
