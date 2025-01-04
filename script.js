"use strict";

///////////////////////////////////////////////////////////
// Set current year
const yearEl = document.querySelector(".year");
const currentYear = new Date().getFullYear();
yearEl.textContent = currentYear;

///////////////////////////////////////////////////////////
// Make mobile navigation work
const btnNavEl = document.querySelector(".btn-mobile-nav");
const headerEl = document.querySelector(".header");

btnNavEl.addEventListener("click", function () {
  headerEl.classList.toggle("nav-open");
});

///////////////////////////////////////////////////////////
// Smooth scrolling animation
const allLinks = document.querySelectorAll("a:link");

allLinks.forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const href = link.getAttribute("href");

    // Scroll back to top
    if (href === "#")
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    // Scroll to other links
    if (href !== "#" && href.startsWith("#")) {
      const sectionEl = document.querySelector(href);
      sectionEl.scrollIntoView({ behavior: "smooth" });
    }

    // Close mobile navigation
    if (link.classList.contains("main-nav-link"))
      headerEl.classList.toggle("nav-open");
  });
});

///////////////////////////////////////////////////////////
// Sticky navigation
const sectionHeroEl = document.querySelector(".section-hero");

const obs = new IntersectionObserver(
  function (entries) {
    const ent = entries[0];
    console.log(ent);

    if (ent.isIntersecting === false) {
      document.body.classList.add("sticky");
    }

    if (ent.isIntersecting === true) {
      document.body.classList.remove("sticky");
    }
  },
  {
    // In the viewport
    root: null,
    threshold: 0,
    rootMargin: "-55px",
  }
);
obs.observe(sectionHeroEl);

///////////////////////////////////////////////////////////
// Fixing flexbox gap property missing in some Safari versions
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
  console.log(isSupported);

  if (!isSupported) document.body.classList.add("no-flexbox-gap");
}
checkFlexGap();

///////////////////////////////////////////////////////////
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

  // Parse opening and closing times
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  const openDate = new Date(slTime);
  openDate.setHours(openHour, openMinute, 0);

  const closeDate = new Date(slTime);
  closeDate.setHours(closeHour, closeMinute, 0);

  // Calculate time differences
  const timeToOpen = (openDate - slTime) / (60 * 1000); // in minutes
  const timeToClose = (closeDate - slTime) / (60 * 1000); // in minutes

  // Determine the status
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
  // Fetching public holidays
  async function fetchPublicHolidays() {
    const apiKey = "TRu4g4S3lPRwy90yNWbiSShkuQ3O4hgn";
    const country = "LK";
    const currentYear = new Date().getFullYear();
    const url = `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=${country}&year=${currentYear}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check if the response contains the holidays data
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

  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const slTime = getSriLankaTime();
  const currentDay = slTime.getDay();
  const dayMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDayName = dayMap[currentDay];

  const openTime = "8:30";
  const closeTime = "18:30";

  // Update status for the current day
  const statusElement = document.getElementById(`${currentDayName}-status`);
  statusElement.textContent = getOpenStatus(openTime, closeTime);

  // Generate the holiday calendar
  function generateCalendar(year, holidays) {
    const calendar = document.getElementById("holiday-calendar");
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

    for (let month = 0; month < 12; month++) {
      const monthDiv = document.createElement("div");
      monthDiv.className = "calendar-month";

      const monthHeader = document.createElement("h4");
      monthHeader.textContent = monthNames[month];
      monthHeader.className = "text-center"; // Center align month names
      monthDiv.appendChild(monthHeader);

      const daysDiv = document.createElement("div");
      daysDiv.className = "calendar-days";

      // Get the first day of the month and the number of days in the month
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Fill in the blanks for days before the first of the month
      for (let i = 0; i < firstDay; i++) {
        const blankDay = document.createElement("div");
        blankDay.className = "calendar-day blank";
        daysDiv.appendChild(blankDay);
      }

      // Fill in the days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        dayDiv.textContent = day;

        // Check if this day is a holiday
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const holiday = holidays.find((holiday) => holiday.date.iso === dateStr);
        if (holiday) {
          dayDiv.classList.add("holiday");
          dayDiv.setAttribute("data-bs-toggle", "tooltip");
          dayDiv.setAttribute("data-bs-title", `${holiday.name}`);
        }

        daysDiv.appendChild(dayDiv);
      }

      monthDiv.appendChild(daysDiv);
      calendar.appendChild(monthDiv);
    }
  }

  // Generate the calendar for the current year
  generateCalendar(new Date().getFullYear(), nationalHolidays);

  // Initialize tooltips after calendar generation
  const calendar = document.getElementById("holiday-calendar");
  const tooltipTriggerList = calendar.querySelectorAll("[data-bs-toggle='tooltip']");
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
});