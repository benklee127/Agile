/*
 * Site Header — mobile menu and dropdown behaviour (vanilla JS, no jQuery).
 *
 * Progressive enhancement: without this script the CSS still opens desktop
 * dropdowns on hover/focus and shows the mobile menu expanded (keyed on
 * html.agile-js, which base.html sets in <head>). With it:
 *   - the mobile toggle shows/hides the panel (aria-expanded on the button)
 *   - dropdown toggles are disclosure buttons (aria-expanded), opened by click
 *     or keyboard; desktop also opens on hover (CSS)
 *   - Escape closes the open dropdown (focus back to its toggle), then the
 *     mobile panel (focus back to the menu button); it also dismisses a
 *     hover-opened dropdown
 *   - a click outside, or focus leaving the header, closes everything
 *   - crossing the 767px breakpoint resets all state, keeping focus on the
 *     menu button or dropdown toggle if the reset hides the focused link
 *   - clicking a toggle to close a hover-opened dropdown dismisses it too
 *     (desktop hover only applies with a real pointer: @media (hover: hover))
 * No focus trap: the mobile menu is a disclosure, not a modal.
 */
(function () {
  'use strict';

  var MOBILE = window.matchMedia ? window.matchMedia('(max-width: 767px)') : null;

  function initHeader(header) {
    if (header.getAttribute('data-agile-header-ready')) return;
    header.setAttribute('data-agile-header-ready', 'true');

    var toggle = header.querySelector('.agile-site-header__toggle');
    var panel = toggle ? document.getElementById(toggle.getAttribute('aria-controls')) : null;
    var subToggles = Array.prototype.slice.call(header.querySelectorAll('.agile-nav__toggle'));

    function itemOf(btn) {
      return btn.closest('.agile-nav__item');
    }

    function setSub(btn, open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var item = itemOf(btn);
      if (item) item.classList.toggle('is-open', open);
    }

    function closeSubs(except) {
      subToggles.forEach(function (btn) {
        if (btn !== except && btn.getAttribute('aria-expanded') === 'true') setSub(btn, false);
      });
    }

    function panelOpen() {
      return !!toggle && toggle.getAttribute('aria-expanded') === 'true';
    }

    function setPanel(open) {
      if (!toggle || !panel) return;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      header.classList.toggle('is-open', open);
      if (!open) closeSubs();
    }

    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        setPanel(!panelOpen());
      });
    }

    subToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        closeSubs(btn);
        setSub(btn, open);
        // Closing a dropdown the pointer is still over: dismiss the hover
        // state too, or (hover: hover) CSS keeps it visible while
        // aria-expanded says "false". Opening clears any earlier dismissal.
        var item = itemOf(btn);
        if (item) {
          if (!open && item.matches(':hover')) item.classList.add('is-dismissed');
          else item.classList.remove('is-dismissed');
        }
      });
    });

    // A hover-opened dropdown dismissed with Escape stays closed until the
    // pointer leaves the item (WCAG 1.4.13).
    Array.prototype.forEach.call(header.querySelectorAll('.agile-nav__item--has-children'), function (item) {
      item.addEventListener('mouseleave', function () {
        item.classList.remove('is-dismissed');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;

      var openBtn = header.querySelector('.agile-nav__toggle[aria-expanded="true"]');
      if (openBtn) {
        setSub(openBtn, false);
        var item = itemOf(openBtn);
        if (item && item.matches(':hover')) item.classList.add('is-dismissed');
        openBtn.focus();
        return;
      }

      var hovered = header.querySelector('.agile-nav__item--has-children:hover');
      if (hovered && !hovered.classList.contains('is-dismissed')) {
        hovered.classList.add('is-dismissed');
        return;
      }

      if (panelOpen()) {
        setPanel(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (header.contains(e.target)) return;
      closeSubs();
      if (panelOpen()) setPanel(false);
    });

    header.addEventListener('focusout', function (e) {
      var next = e.relatedTarget;
      if (!next) return; // focus went nowhere focusable; the click handler covers it
      subToggles.forEach(function (btn) {
        var item = itemOf(btn);
        if (btn.getAttribute('aria-expanded') === 'true' && item && !item.contains(next)) setSub(btn, false);
      });
      if (!header.contains(next) && panelOpen()) setPanel(false);
    });

    if (MOBILE) {
      // Save focus first: if the reset hides the element that holds it (the
      // mobile panel, or a submenu), move focus to the control that reopens
      // it instead of letting it fall back to <body> (e.g. zooming to 200%).
      var reset = function () {
        var active = document.activeElement;
        var openBtn = header.querySelector('.agile-nav__toggle[aria-expanded="true"]');
        setPanel(false);
        closeSubs();
        if (!active || !header.contains(active)) return;
        if (MOBILE.matches) {
          if (toggle && panel && panel.contains(active)) toggle.focus();
        } else if (openBtn) {
          var item = itemOf(openBtn);
          if (item && item.contains(active) && active !== openBtn) openBtn.focus();
        }
      };
      if (MOBILE.addEventListener) MOBILE.addEventListener('change', reset);
      else if (MOBILE.addListener) MOBILE.addListener(reset);
    }
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-agile-header]'), initHeader);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
