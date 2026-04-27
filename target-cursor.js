/**
 * Target-style cursor (GSAP), порт с React-компонента TargetCursor.
 * Параметры по умолчанию как в вашем примере: spinDuration 2s, hoverDuration 0.2, parallaxOn.
 */
(function () {
  if (typeof window === "undefined" || typeof gsap === "undefined") return;

  var targetSelector = ".cursor-target";
  var spinDuration = 2;
  var hoverDuration = 0.2;
  var parallaxOn = true;
  var hideDefaultCursor = true;

  var borderWidth = 3;
  var cornerSize = 12;

  function isMobileDevice() {
    var hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    var small = window.innerWidth <= 768;
    var ua = (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
    var mobileRe = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return (hasTouch && small) || mobileRe.test(ua);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  if (isMobileDevice() || prefersReducedMotion()) return;

  var cursor = document.getElementById("target-cursor-root");
  if (!cursor) return;

  var dot = cursor.querySelector(".target-cursor-dot");
  var corners = cursor.querySelectorAll(".target-cursor-corner");
  if (!dot || corners.length !== 4) return;

  document.documentElement.classList.add("cursor-gsap-on");

  var spinTl = null;
  var activeTarget = null;
  var currentLeaveHandler = null;
  var resumeTimeout = null;
  var targetCornerPositions = null;
  var tickerFn = null;
  var activeStrength = { current: 0 };

  function createSpinTimeline() {
    if (spinTl) spinTl.kill();
    spinTl = gsap.timeline({ repeat: -1 }).to(cursor, {
      rotation: "+=360",
      duration: spinDuration,
      ease: "none"
    });
  }

  function moveCursor(x, y) {
    gsap.to(cursor, { x: x, y: y, duration: 0.1, ease: "power3.out" });
  }

  function cleanupTarget(target) {
    if (currentLeaveHandler && target) {
      target.removeEventListener("mouseleave", currentLeaveHandler);
    }
    currentLeaveHandler = null;
  }

  var originalBodyCursor = document.body.style.cursor;
  if (hideDefaultCursor) {
    document.body.style.cursor = "none";
  }

  gsap.set(cursor, {
    xPercent: -50,
    yPercent: -50,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });

  createSpinTimeline();

  tickerFn = function () {
    if (!targetCornerPositions || !cursor) return;
    var strength = activeStrength.current;
    if (strength === 0) return;

    var cursorX = gsap.getProperty(cursor, "x");
    var cursorY = gsap.getProperty(cursor, "y");

    corners.forEach(function (corner, i) {
      var currentX = gsap.getProperty(corner, "x");
      var currentY = gsap.getProperty(corner, "y");
      var targetX = targetCornerPositions[i].x - cursorX;
      var targetY = targetCornerPositions[i].y - cursorY;
      var finalX = currentX + (targetX - currentX) * strength;
      var finalY = currentY + (targetY - currentY) * strength;
      var duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
      gsap.to(corner, {
        x: finalX,
        y: finalY,
        duration: duration,
        ease: duration === 0 ? "none" : "power1.out",
        overwrite: "auto"
      });
    });
  };

  function onMouseMove(e) {
    moveCursor(e.clientX, e.clientY);
  }

  function onScroll() {
    if (!activeTarget || !cursor) return;
    var mouseX = gsap.getProperty(cursor, "x");
    var mouseY = gsap.getProperty(cursor, "y");
    var under = document.elementFromPoint(mouseX, mouseY);
    var still =
      under &&
      (under === activeTarget || under.closest(targetSelector) === activeTarget);
    if (!still && currentLeaveHandler) {
      currentLeaveHandler();
    }
  }

  function onMouseDown() {
    if (!dot) return;
    gsap.to(dot, { scale: 0.7, duration: 0.3 });
    gsap.to(cursor, { scale: 0.9, duration: 0.2 });
  }

  function onMouseUp() {
    if (!dot) return;
    gsap.to(dot, { scale: 1, duration: 0.3 });
    gsap.to(cursor, { scale: 1, duration: 0.2 });
  }

  function onMouseOver(e) {
    var directTarget = e.target;
    var allTargets = [];
    var current = directTarget;
    while (current && current !== document.body) {
      if (current.matches && current.matches(targetSelector)) {
        allTargets.push(current);
      }
      current = current.parentElement;
    }
    var target = allTargets[0] || null;
    if (!target || !cursor) return;
    if (activeTarget === target) return;
    if (activeTarget) {
      cleanupTarget(activeTarget);
    }
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }

    activeTarget = target;
    var cornersArr = Array.from(corners);
    cornersArr.forEach(function (corner) {
      gsap.killTweensOf(corner);
    });

    gsap.killTweensOf(cursor, "rotation");
    if (spinTl) spinTl.pause();
    gsap.set(cursor, { rotation: 0 });

    var rect = target.getBoundingClientRect();
    var cursorX = gsap.getProperty(cursor, "x");
    var cursorY = gsap.getProperty(cursor, "y");

    targetCornerPositions = [
      { x: rect.left - borderWidth, y: rect.top - borderWidth },
      { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
      { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
      { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
    ];

    gsap.ticker.add(tickerFn);

    gsap.to(activeStrength, {
      current: 1,
      duration: hoverDuration,
      ease: "power2.out"
    });

    cornersArr.forEach(function (corner, i) {
      gsap.to(corner, {
        x: targetCornerPositions[i].x - cursorX,
        y: targetCornerPositions[i].y - cursorY,
        duration: 0.2,
        ease: "power2.out"
      });
    });

    var leaveHandler = function () {
      gsap.ticker.remove(tickerFn);
      targetCornerPositions = null;
      gsap.set(activeStrength, { current: 0, overwrite: true });
      activeTarget = null;

      var corners2 = Array.from(corners);
      gsap.killTweensOf(corners2);
      var positions = [
        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
        { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
      ];
      var tl = gsap.timeline();
      corners2.forEach(function (corner, index) {
        tl.to(
          corner,
          {
            x: positions[index].x,
            y: positions[index].y,
            duration: 0.3,
            ease: "power3.out"
          },
          0
        );
      });

      resumeTimeout = setTimeout(function () {
        if (!activeTarget && cursor && spinTl) {
          spinTl.kill();
          spinTl = gsap
            .timeline({ repeat: -1 })
            .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });
        }
        resumeTimeout = null;
      }, 50);

      cleanupTarget(target);
    };

    currentLeaveHandler = leaveHandler;
    target.addEventListener("mouseleave", leaveHandler);
  }

  document.querySelectorAll(
    ".logo, .nav a, .nav-toggle, .btn, .scroll-hint, .card, .project-card, .badge, .audience-list li, .contact-list a, .footer-top"
  ).forEach(function (el) {
    el.classList.add("cursor-target");
  });

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mouseover", onMouseOver, { passive: true });

  window.addEventListener(
    "blur",
    function () {
      gsap.set(cursor, { autoAlpha: 0 });
    },
    { passive: true }
  );
  window.addEventListener(
    "focus",
    function () {
      gsap.set(cursor, { autoAlpha: 1 });
    },
    { passive: true }
  );
})();
