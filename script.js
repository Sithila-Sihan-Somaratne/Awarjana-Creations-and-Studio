"use strict";

// Set current year (this part remains as it is)
const yearEl = document.querySelector(".year");
const currentYear = new Date().getFullYear();
yearEl.textContent = currentYear;

// Make mobile navigation work (this part remains as it is)
const btnNavEl = document.querySelector(".btn-mobile-nav");
const headerEl = document.querySelector(".header");

btnNavEl.addEventListener("click", function () {
  headerEl.classList.toggle("nav-open");
});

// Smooth scrolling animation (this part remains as it is)
const allLinks = document.querySelectorAll("a:link");

allLinks.forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const href = link.getAttribute("href");

    if (href === "#")
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    if (href !== "#" && href.startsWith("#")) {
      const sectionEl = document.querySelector(href);
      const headerHeight = document.querySelector(".header").offsetHeight;

      window.scrollTo({
        top: sectionEl.offsetTop - headerHeight,
        behavior: "smooth",
      });
    }

    if (link.classList.contains("main-nav-link"))
      headerEl.classList.toggle("nav-open");
  });
});

// Sticky navigation (this part remains as it is)
const sectionHeroEl = document.querySelector(".section-hero");

const obs = new IntersectionObserver(
  function (entries) {
    const ent = entries[0];

    if (ent.isIntersecting === false) {
      document.body.classList.add("sticky");
    }

    if (ent.isIntersecting === true) {
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

// Fixing flexbox gap property missing in some Safari versions (this part remains as it is)
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

// Public holidays calendar + status hours
// Function to get current time in Sri Lanka time zone
function getSriLankaTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
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

// Function to check if currently open, opens soon, or closes soon in Sri Lankan time
function getOpenStatus(openTime, closeTime) {
  const slTime = getSriLankaTime();
  const currentHour = slTime.getHours();
  const currentMinute = slTime.getMinutes();

  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  const openDate = new Date(slTime);
  openDate.setHours(openHour, openMinute, 0);

  const closeDate = new Date(slTime);
  closeDate.setHours(closeHour, closeMinute, 0);

  const timeToOpen = (openDate - slTime) / (60 * 1000);
  const timeToClose = (closeDate - slTime) / (60 * 1000);

  if (timeToOpen > 0 && timeToOpen <= 30) {
    return "Opens Soon";
  } else if (timeToClose > 0 && timeToClose <= 30) {
    return "Closes Soon";
  } else if (slTime >= openDate && slTime <= closeDate) {
    return "Open";
  } else {
    return "Closed";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const calendarContainer = document.getElementById("holiday-calendar");
  const calendarMonthYear = document.getElementById("calendar-month-year");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");

  let currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Fetching public holidays
  async function fetchPublicHolidays() {
    const apiKey = "TRu4g4S3lPRwy90yNWbiSShkuQ3O4hgn";
    const country = "LK";
    const url = `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=${country}&year=${currentYear}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.response && data.response.holidays) {
        return data.response.holidays;
      } else {
        console.error("Invalid API response:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching public holidays:", error);
      return [];
    }
  }

  // Function to filter holidays by type "National holiday"
  function filterNationalHolidays(holidays) {
    return holidays.filter(
      (holiday) => holiday.type && holiday.type.includes("National holiday")
    );
  }

  // Fetch public holidays and update the list
  const holidays = await fetchPublicHolidays();
  const nationalHolidays = filterNationalHolidays(holidays);

  // Generate the holiday calendar
  function generateCalendar(year, month) {
    calendarContainer.innerHTML = ""; // Clear previous calendar

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthYearText = `${monthNames[month]} ${year}`;
    calendarMonthYear.textContent = monthYearText;

    const monthDiv = document.createElement("div");
    monthDiv.className = "calendar-month";

    const daysDiv = document.createElement("div");
    daysDiv.className = "calendar-days";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const blankDay = document.createElement("div");
      blankDay.className = "calendar-day blank";
      daysDiv.appendChild(blankDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "calendar-day";
      dayDiv.textContent = day;

      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayDiv.classList.add("current-day");
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const holiday = nationalHolidays.find((holiday) => holiday.date.iso === dateStr);
      if (holiday) {
        dayDiv.classList.add("holiday");
        dayDiv.setAttribute("data-bs-toggle", "tooltip");
        dayDiv.setAttribute("data-bs-title", `${holiday.name}`);
      }

      daysDiv.appendChild(dayDiv);
    }

    monthDiv.appendChild(daysDiv);
    calendarContainer.appendChild(monthDiv);

    const tooltipTriggerList = calendarContainer.querySelectorAll("[data-bs-toggle='tooltip']");
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });

    prevMonthBtn.disabled = (month === 0);
    nextMonthBtn.disabled = (month === 11);
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

  // --- Code to update the status in your table ---
  const table = document.querySelector(".styled-table tbody");
  const rows = table.querySelectorAll("tr");
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  rows.forEach(row => {
    const dayCell = row.querySelector("td:nth-child(1)");
    const openTimeRaw = row.querySelector("td:nth-child(2)").textContent;
    const closeTimeRaw = row.querySelector("td:nth-child(3)").textContent;
    const statusCell = row.querySelector("td:nth-child(4)");

    // Check if the current row's day matches today's day
    if (dayCell.textContent.toLowerCase() === today.toLowerCase()) {
      function formatTime(timeStr) {
        let [time, period] = timeStr.split(" ");
        let [hours, minutes] = time.split(":");
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);

        if (period && period.toUpperCase() === "P.M." && hours !== 12) {
          hours += 12;
        } else if (period && period.toUpperCase() === "A.M." && hours === 12) {
          hours = 0;
        } else if (hours < 10) {
          hours = parseInt(hours, 10);
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }

      const formattedOpenTime = formatTime(openTimeRaw);
      const formattedCloseTime = formatTime(closeTimeRaw);

      const currentStatus = getOpenStatus(formattedOpenTime, formattedCloseTime);
      statusCell.textContent = currentStatus;
    } else {
      // Optionally clear the status for other days or leave it empty
      statusCell.textContent = ""; // Or you could set it to "N/A" or similar
    }
  });
  // --- End of code to update table status ---
});