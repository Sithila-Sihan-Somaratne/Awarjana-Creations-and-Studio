"use strict";

// Set current year (if element exists)
const yearEl = document.querySelector(".year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Mobile nav and header selectors adjusted to match your HTML
const btnNavEl = document.getElementById("btn-mobile-nav"); // HTML uses id="btn-mobile-nav"
const headerEl = document.querySelector("header"); // header element exists in HTML

if (btnNavEl && headerEl) {
  btnNavEl.addEventListener("click", function () {
    headerEl.classList.toggle("nav-open");
  });
}

// Smooth scrolling animation
const allLinks = document.querySelectorAll("a");

allLinks.forEach(function (link) {
  link.addEventListener("click", function (e) {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    e.preventDefault();

    if (href === "#") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const sectionEl = document.querySelector(href);
    if (!sectionEl) return;

    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    window.scrollTo({
      top: sectionEl.offsetTop - headerHeight,
      behavior: "smooth",
    });

    if (link.classList.contains("main-nav-link") && headerEl) {
      headerEl.classList.toggle("nav-open");
    }
  });
});

// Sticky navigation: only set up if the referenced hero section exists
const sectionHeroEl =
  document.querySelector(".section-hero") || document.querySelector("section");
if (sectionHeroEl) {
  const obs = new IntersectionObserver(
    function (entries) {
      const ent = entries[0];
      if (ent.isIntersecting === false) {
        document.body.classList.add("sticky");
      } else {
        document.body.classList.remove("sticky");
      }
    },
    {
      root: null,
      threshold: 0,
      rootMargin: "-80px",
    }
  );
  obs.observe(sectionHeroEl);
}

// Flex gap check for older Safari
function checkFlexGap() {
  var flex = document.createElement("div");
  flex.style.display = "flex";
  flex.style.flexDirection = "column";
  flex.style.rowGap = "1px";

  flex.appendChild(document.createElement("div"));
  flex.appendChild(document.createElement("div"));

  document.body.appendChild(flex);
  var isSupported = flex.scrollHeight === 1;
  flex.parentNode.removeChild(flex);

  if (!isSupported) document.body.classList.add("no-flexbox-gap");
}
checkFlexGap();

// ---------- Sri Lanka time helpers ----------
function getSriLankaTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const dateTime = {};
  parts.forEach(({ type, value }) => {
    dateTime[type] = value;
  });

  return new Date(
    dateTime.year,
    dateTime.month - 1,
    dateTime.day,
    dateTime.hour,
    dateTime.minute,
    dateTime.second
  );
}

function slIsoDateFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- Open/close status logic ----------
function getOpenStatus(openTime, closeTime, referenceDate = null) {
  const slNow = referenceDate || getSriLankaTime();

  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  const openDate = new Date(slNow);
  openDate.setHours(openHour, openMinute, 0, 0);

  const closeDate = new Date(slNow);
  closeDate.setHours(closeHour, closeMinute, 0, 0);

  const timeToOpen = (openDate - slNow) / (60 * 1000);
  const timeToClose = (closeDate - slNow) / (60 * 1000);

  if (timeToOpen > 0 && timeToOpen <= 30) {
    return "Opens Soon";
  } else if (timeToClose > 0 && timeToClose <= 30) {
    return "Closes Soon";
  } else if (slNow >= openDate && slNow <= closeDate) {
    return "Open";
  } else {
    return "Closed";
  }
}

// Robust time formatter: accepts "8:30 A.M.", "8:30 AM", "08:30", etc. -> returns "HH:MM" 24-hour
function formatTimeTo24(timeStr) {
  if (!timeStr) return "00:00";
  const cleaned = timeStr.trim();
  const parts = cleaned.split(/\s+/);
  let timePart = parts[0];
  let periodPart = parts.slice(1).join(" ").replace(/\./g, "").trim();
  const ampmMatch = timePart.match(/([0-9:]+)(am|pm)$/i);
  if (ampmMatch) {
    timePart = ampmMatch[1];
    periodPart = ampmMatch[2].toUpperCase();
  }

  let [h, m] = timePart.split(":");
  h = parseInt(h || "0", 10);
  m = parseInt(m || "0", 10);

  if (periodPart) {
    periodPart = periodPart.toUpperCase();
    if (periodPart === "PM" || periodPart === "P.M" || periodPart === "PM") {
      if (h !== 12) h += 12;
    } else if (
      periodPart === "AM" ||
      periodPart === "A.M" ||
      periodPart === "AM"
    ) {
      if (h === 12) h = 0;
    }
  }

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------- Calendar & Holidays + Hours Status ----------
document.addEventListener("DOMContentLoaded", async () => {
  const calendarContainer = document.getElementById("holiday-calendar");
  const calendarMonthYear = document.getElementById("calendar-month-year");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");

  let currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // compute today's ISO date in Sri Lanka time
  const slTodayDate = getSriLankaTime();
  const slTodayIso = slIsoDateFromDate(slTodayDate);

  // Load holidays first (so we can use them both for calendar and status)
  async function fetchPublicHolidays() {
    const apiKey = "keh2tcFdOKOTzaXt81t2i7ozEbcxEP3D";
    const country = "LK";
    const url = `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=${country}&year=${currentYear}`;

    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data && data.response && data.response.holidays) {
        return data.response.holidays;
      }
    } catch (err) {
      console.error("Holiday fetch error:", err);
    }
    return [];
  }

  function filterNationalHolidays(holidays) {
    return holidays.filter(
      (h) => h.type && h.type.includes("National holiday")
    );
  }

  let nationalHolidays = [];
  try {
    const holidays = await fetchPublicHolidays();
    nationalHolidays = filterNationalHolidays(holidays);
  } catch (e) {
    nationalHolidays = [];
  }

  // determine if today (in SL) is a holiday and get its name if so
  const holidayToday = nationalHolidays.find(
    (h) => h.date && h.date.iso === slTodayIso
  );
  const isHolidayToday = Boolean(holidayToday);
  const holidayTodayName = holidayToday ? holidayToday.name : null;

  // Calendar block (safe guards)
  if (calendarContainer && calendarMonthYear && prevMonthBtn && nextMonthBtn) {
    // Replace current generateCalendar function with this version and add helper functions below

    // Helper: close all visible popups
    function closeHolidayPopups() {
      document.querySelectorAll(".holiday-popup").forEach((p) => p.remove());
      // remove global outside-click handler if set
      if (window._holidayOutsideClickHandler) {
        document.removeEventListener(
          "click",
          window._holidayOutsideClickHandler,
          true
        );
        window._holidayOutsideClickHandler = null;
      }
      if (window._holidayEscHandler) {
        document.removeEventListener(
          "keydown",
          window._holidayEscHandler,
          true
        );
        window._holidayEscHandler = null;
      }
    }

    // Helper: create popup inside a cell showing holiday name (toggles)
    function toggleHolidayPopup(cell, holidayName) {
      // If a popup already exists for this cell, remove it
      const existing = cell.querySelector(".holiday-popup");
      if (existing) {
        existing.remove();
        // if no other popups, remove global handlers
        if (!document.querySelector(".holiday-popup")) closeHolidayPopups();
        cell.setAttribute("aria-expanded", "false");
        return;
      }

      // Remove other popups first (only allow one open)
      closeHolidayPopups();

      // Create popup element
      const popup = document.createElement("div");
      popup.className =
        "holiday-popup absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-md z-50 pointer-events-auto";
      popup.style.minWidth = "max-content";
      popup.setAttribute("role", "status");
      popup.setAttribute("aria-live", "polite");
      popup.textContent = holidayName;

      // append to the cell (cell must be positioned relative)
      cell.style.position = cell.style.position || "relative";
      cell.appendChild(popup);
      cell.setAttribute("aria-expanded", "true");

      // Auto remove after 5s
      const timeoutId = setTimeout(() => {
        popup.remove();
        if (!document.querySelector(".holiday-popup")) closeHolidayPopups();
        cell.setAttribute("aria-expanded", "false");
      }, 5000);

      // Close when tapping/clicking outside: add a capture listener
      window._holidayOutsideClickHandler = (ev) => {
        if (!cell.contains(ev.target)) {
          clearTimeout(timeoutId);
          popup.remove();
          closeHolidayPopups();
          cell.setAttribute("aria-expanded", "false");
        }
      };
      document.addEventListener(
        "click",
        window._holidayOutsideClickHandler,
        true
      );

      // Close on ESC
      window._holidayEscHandler = (ev) => {
        if (ev.key === "Escape") {
          clearTimeout(timeoutId);
          popup.remove();
          closeHolidayPopups();
          cell.setAttribute("aria-expanded", "false");
        }
      };
      document.addEventListener("keydown", window._holidayEscHandler, true);
    }

    // New generateCalendar function (drop-in replacement)
    function generateCalendar(year, month) {
      calendarContainer.innerHTML = "";

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

      const daysDiv = document.createElement("div");
      daysDiv.className = "grid grid-cols-7 gap-3 text-center";

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Leading blanks
      for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement("div");
        blank.className = "h-12";
        daysDiv.appendChild(blank);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dayDiv = document.createElement("div");
        // make it relative to position the popup
        dayDiv.className =
          "calendar-day relative rounded border border-gray-700 bg-white text-gray-800 p-2 h-12 flex items-center justify-center shadow-sm transform transition-transform duration-150 hover:scale-105";
        dayDiv.textContent = d;

        // highlight SL today
        const slNow = getSriLankaTime();
        if (
          year === slNow.getFullYear() &&
          month === slNow.getMonth() &&
          d === slNow.getDate()
        ) {
          dayDiv.classList.remove("bg-white");
          dayDiv.classList.add("bg-yellow-300", "font-semibold");
        }

        const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          d
        ).padStart(2, "0")}`;
        const holiday = nationalHolidays.find(
          (h) => h.date && h.date.iso === iso
        );

        if (holiday) {
          // make the cell interactive (click/touch)
          dayDiv.classList.add("cursor-pointer", "hover:brightness-95");
          dayDiv.setAttribute("role", "button");
          dayDiv.setAttribute("tabindex", "0");
          dayDiv.setAttribute("aria-expanded", "false");
          dayDiv.setAttribute("data-holiday-name", holiday.name || "Holiday");

          if (holiday.date.iso !== slTodayIso) {
            // normal holiday styling for non-today holidays
            dayDiv.classList.remove("bg-white", "bg-yellow-300");
            dayDiv.classList.add("bg-red-200", "text-red-800", "font-semibold");
            dayDiv.setAttribute("data-tippy-content", `${holiday.name}`);
            dayDiv.setAttribute("aria-label", `Holiday: ${holiday.name}`);
          } else {
            // holiday is today: keep yellow highlight and add small red dot indicator
            dayDiv.setAttribute(
              "data-tippy-content",
              `${holiday.name} (Today)`
            );
            dayDiv.setAttribute("aria-label", `Holiday today: ${holiday.name}`);
            const dot = document.createElement("span");
            dot.className =
              "absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full ring-1 ring-white";
            dayDiv.appendChild(dot);
          }

          // click/tap handler to show holiday name popup
          dayDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            const name = dayDiv.getAttribute("data-holiday-name") || "Holiday";
            toggleHolidayPopup(dayDiv, name);
          });

          // keyboard support (Enter / Space)
          dayDiv.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              const name =
                dayDiv.getAttribute("data-holiday-name") || "Holiday";
              toggleHolidayPopup(dayDiv, name);
            }
          });
        }

        daysDiv.appendChild(dayDiv);
      }

      calendarContainer.appendChild(daysDiv);

      // initialize tippy only if available
      if (typeof tippy === "function") {
        tippy("[data-tippy-content]", {
          theme: "light",
          animation: "scale",
          arrow: true,
          touch: true,
        });
      }

      // prev/next disabled handling (use add/remove for each class)
      prevMonthBtn.disabled = month === 0;
      nextMonthBtn.disabled = month === 11;

      if (prevMonthBtn.disabled) {
        prevMonthBtn.classList.add("opacity-50");
        prevMonthBtn.classList.add("cursor-not-allowed");
      } else {
        prevMonthBtn.classList.remove("opacity-50");
        prevMonthBtn.classList.remove("cursor-not-allowed");
      }

      if (nextMonthBtn.disabled) {
        nextMonthBtn.classList.add("opacity-50");
        nextMonthBtn.classList.add("cursor-not-allowed");
      } else {
        nextMonthBtn.classList.remove("opacity-50");
        nextMonthBtn.classList.remove("cursor-not-allowed");
      }
    }

    generateCalendar(currentYear, currentMonth);
    prevMonthBtn.addEventListener("click", () => {
      if (currentMonth > 0) {
        currentMonth--;
        generateCalendar(currentYear, currentMonth);
      }
    });
    nextMonthBtn.addEventListener("click", () => {
      if (currentMonth < 11) {
        currentMonth++;
        generateCalendar(currentYear, currentMonth);
      }
    });
  } else {
    console.debug("Calendar not present, skipping calendar generation.");
  }

  // ---------- Hours status update ----------
  const tableBody = document.querySelector("#hours table tbody");
  if (!tableBody) {
    console.warn("Hours table not found — skipping status updates.");
    return;
  }

  function updateHoursStatusOnce() {
    const slNow = getSriLankaTime();
    const slWeekday = slNow.toLocaleDateString("en-US", { weekday: "long" });

    const rows = tableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const dayCell = row.querySelector("td:nth-child(1)");
      const openTimeTd = row.querySelector("td:nth-child(2)");
      const closeTimeTd = row.querySelector("td:nth-child(3)");
      const statusCell = row.querySelector("td:nth-child(4)");

      if (!dayCell || !openTimeTd || !closeTimeTd || !statusCell) return;

      const rowDay = dayCell.textContent.trim();

      if (rowDay.toLowerCase() === slWeekday.toLowerCase()) {
        // If today is a holiday (in SL), show Holiday/Closed regardless of hours
        if (isHolidayToday) {
          statusCell.textContent = `Holiday — Closed`;
          statusCell.classList.remove("text-gray-400");
          statusCell.classList.add("font-semibold", "text-red-400");
          // optionally add tooltip with holiday name
          if (holidayTodayName) {
            statusCell.setAttribute("title", holidayTodayName);
          }
        } else {
          const formattedOpen = formatTimeTo24(openTimeTd.textContent);
          const formattedClose = formatTimeTo24(closeTimeTd.textContent);
          const status = getOpenStatus(formattedOpen, formattedClose, slNow);
          statusCell.textContent = status;
          statusCell.classList.remove("text-gray-400");
          statusCell.classList.add(
            "font-semibold",
            status === "Open" ? "text-yellow-300" : "text-gray-300"
          );
          statusCell.removeAttribute("title");
        }
      } else {
        statusCell.textContent = "";
        statusCell.classList.remove(
          "font-semibold",
          "text-yellow-300",
          "text-red-400"
        );
        statusCell.removeAttribute("title");
      }
    });
  }

  // Run immediately and then periodically to keep status fresh
  updateHoursStatusOnce();
  setInterval(updateHoursStatusOnce, 30 * 1000);
});

// Translation System for Plain HTML
// Usage: Add data-translate="text" to any HTML element

(function() {
  let translations = {};
  let currentLanguage = 'en';

  // Load translations from JSON file
  async function loadTranslations() {
    try {
      const response = await fetch('translations.json');
      translations = await response.json();
      
      // Get saved language from localStorage or default to 'en'
      currentLanguage = localStorage.getItem('language') || 'en';
      
      // Apply translations immediately
      translatePage();
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  // Translate all elements with data-translate attribute
  function translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      
      if (translations[currentLanguage] && translations[currentLanguage][key]) {
        // Check if element is an input/textarea with placeholder
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translations[currentLanguage][key];
        } else {
          element.textContent = translations[currentLanguage][key];
        }
      }
    });
  }
})