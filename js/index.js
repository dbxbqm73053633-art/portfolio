(() => {
  // year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = document.querySelector(".nav__toggle");
  const navList = document.getElementById("navList");

  if (toggle && navList) {
    toggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navList.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      navList.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (e) => {
      if (window.innerWidth > 720) return;
      if (e.target.closest(".nav")) return;
      navList.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  // Reveal on scroll
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            ent.target.classList.add("is-in");
            io.unobserve(ent.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // Tabs (Skills)
  const tabsRoot = document.querySelector("[data-tabs]");
  if (tabsRoot) {
    const btns = Array.from(tabsRoot.querySelectorAll("[data-tab]"));
    const panels = Array.from(tabsRoot.querySelectorAll("[data-panel]"));

    const activate = (key) => {
      btns.forEach((b) => {
        const on = b.dataset.tab === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === key));
    };

    btns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tab)));
  }

  // Skill bar animation (when visible)
  const barsWrap = document.querySelector("[data-skill-bars]");
  const animateBars = () => {
    if (!barsWrap) return;
    const bars = Array.from(barsWrap.querySelectorAll(".bar"));
    bars.forEach((bar) => {
      const level = Number(bar.dataset.level || 0);
      const fill = bar.querySelector(".bar__fill");
      const countEl = bar.querySelector("[data-count]");
      if (fill) fill.style.width = `${level}%`;

      // count up
      if (countEl) {
        const duration = 900;
        const start = performance.now();
        const from = 0;
        const to = level;

        const step = (t) => {
          const p = Math.min(1, (t - start) / duration);
          const v = Math.round(from + (to - from) * p);
          countEl.textContent = String(v);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    });
  };

  if (barsWrap) {
    const ioBars = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            animateBars();
            ioBars.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    ioBars.observe(barsWrap);
  }

  // Modal (Design: 이미지 크게 보기 + 키보드 네비게이션/포커스 트랩)
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalTools = document.getElementById("modalTools");
  const modalCaption = document.getElementById("modalCaption");
  const modalOpeners = Array.from(document.querySelectorAll("[data-modal]"));
  const closeTargets = modal ? Array.from(modal.querySelectorAll("[data-close]")) : [];
  const btnPrev = modal ? modal.querySelector(".modal__nav--prev") : null;
  const btnNext = modal ? modal.querySelector(".modal__nav--next") : null;

  let lastFocus = null;
  let currentIndex = -1;

  const getFocusable = () => {
    if (!modal) return [];
    return Array.from(
      modal.querySelectorAll(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
  };

  const setNavDisabled = () => {
    if (!btnPrev || !btnNext) return;
    const len = modalOpeners.length;
    btnPrev.disabled = len <= 1;
    btnNext.disabled = len <= 1;
  };

  const openModalByIndex = (idx) => {
    if (!modal || !modalImg || !modalTitle || !modalTools) return;
    const card = modalOpeners[idx];
    if (!card) return;

    const img = card.querySelector("img");
    if (!img) return;

    lastFocus = document.activeElement;
    currentIndex = idx;

    const title = card.dataset.title || "Project";
    const tools = card.dataset.tools ? `Tools: ${card.dataset.tools}` : "";

    modalImg.src = img.getAttribute("src");
    modalImg.alt = img.getAttribute("alt") || "Project image";
    modalTitle.textContent = title;
    modalTools.textContent = tools;
    if (modalCaption) modalCaption.textContent = img.getAttribute("alt") || "";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    document.body.style.overflow = "hidden";

    setNavDisabled();
    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
    document.body.style.overflow = "";

    if (modalImg) modalImg.src = "";
    if (modalCaption) modalCaption.textContent = "";
    currentIndex = -1;

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  const prev = () => {
    if (!modalOpeners.length) return;
    const nextIndex = (currentIndex - 1 + modalOpeners.length) % modalOpeners.length;
    openModalByIndex(nextIndex);
  };

  const next = () => {
    if (!modalOpeners.length) return;
    const nextIndex = (currentIndex + 1) % modalOpeners.length;
    openModalByIndex(nextIndex);
  };

  modalOpeners.forEach((card, idx) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "프로젝트 크게 보기");

    card.addEventListener("click", () => openModalByIndex(idx));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModalByIndex(idx);
      }
    });
  });

  closeTargets.forEach((el) => el.addEventListener("click", closeModal));
  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    const isOpen = modal && modal.classList.contains("is-open");
    if (!isOpen) return;

    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();

    // Focus trap
    if (e.key === "Tab") {
      const focusables = getFocusable();
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

})();
