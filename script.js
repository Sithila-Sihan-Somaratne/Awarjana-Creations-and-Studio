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
    const apiKey = "keh2tcFdOKOTzaXt81t2i7ozEbcxEP3D";
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
      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
      ) {
        dayDiv.classList.add("current-day");
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const holiday = nationalHolidays.find(
        (holiday) => holiday.date.iso === dateStr
      );
      if (holiday) {
        dayDiv.classList.add("holiday");
        dayDiv.setAttribute("data-bs-toggle", "tooltip");
        dayDiv.setAttribute("data-bs-title", `${holiday.name}`);
      }

      daysDiv.appendChild(dayDiv);
    }

    monthDiv.appendChild(daysDiv);
    calendarContainer.appendChild(monthDiv);

    const tooltipTriggerList = calendarContainer.querySelectorAll(
      "[data-bs-toggle='tooltip']"
    );
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });

    prevMonthBtn.disabled = month === 0;
    nextMonthBtn.disabled = month === 11;
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
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  rows.forEach((row) => {
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

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}`;
      }

      const formattedOpenTime = formatTime(openTimeRaw);
      const formattedCloseTime = formatTime(closeTimeRaw);

      const currentStatus = getOpenStatus(
        formattedOpenTime,
        formattedCloseTime
      );
      statusCell.textContent = currentStatus;
    } else {
      // Optionally clear the status for other days or leave it empty
      statusCell.textContent = ""; // Or you could set it to "N/A" or similar
    }
  });
  // --- End of code to update table status ---
});

// --TRANSLATION-- //
$(document).ready(function () {
  // Define your translations object
  const translations = {
    en: {
      "ABOUT US": "ABOUT US",
      PRODUCTS: "PRODUCTS",
      "WHY US": "WHY US",
      HOURS: "HOURS",
      CONTACTS: "CONTACTS",
      "Get what you need with Awarjana!": "Get what you need with Awarjana!",
      "At Awarjana Creations and Studio, we believe in the power of creativity and innovation. Our mission is to bring your ideas to life through exceptional design and craftsmanship. Whether you're looking for bespoke artwork, custom designs, or professional studio services, we are here to exceed your expectations.":
        "At Awarjana Creations and Studio, we believe in the power of creativity and innovation. Our mission is to bring your ideas to life through exceptional design and craftsmanship. Whether you're looking for bespoke artwork, custom designs, or professional studio services, we are here to exceed your expectations.",
      "Contact us right now!": "Contact us right now!",
      "Learn more ↓": "Learn more ↓",
      "Trusted by": "Trusted by",
      "About us": "About us",
      "Our Story": "Our Story",
      "Welcome to Awarjana Creations and Studio, where creativity meets commitment. Established on October 22, 2011, we have been proudly serving our clients with passion, integrity, and efficiency for over a decade.":
        "Welcome to Awarjana Creations and Studio, where creativity meets commitment. Established on October 22, 2011, we have been proudly serving our clients with passion, integrity, and efficiency for over a decade.",
      "Our Mission & Client Focus": "Our Mission & Client Focus",
      "Since our inception, our mission has remained clear: to deliver legal, customer-friendly, and fast services that not only meet but exceed expectations. Our dedication to quality and our customer-first approach have earned us the trust and love of our growing client base.":
        "Since our inception, our mission has remained clear: to deliver legal, customer-friendly, and fast services that not only meet but exceed expectations. Our dedication to quality and our customer-first approach have earned us the trust and love of our growing client base.",
      "Our Values & Approach": "Our Values & Approach",
      "At Awarjana, we believe in building relationships that last—powered by transparency, professionalism, and a relentless pursuit of excellence. Whether you're a returning client or visiting us for the first time, we're here to provide solutions tailored to your needs with a touch of creativity and a heart full of care.\nExperience the Awarjana difference—where service is not just a promise, but a tradition.":
        "At Awarjana, we believe in building relationships that last—powered by transparency, professionalism, and a relentless pursuit of excellence. Whether you're a returning client or visiting us for the first time, we're here to provide solutions tailored to your needs with a touch of creativity and a heart full of care.\nExperience the Awarjana difference—where service is not just a promise, but a tradition.",
      "Our products": "Our products",
      "Your satisfaction is our top priority. Let us help you create something special.":
        "Your satisfaction is our top priority. Let us help you create something special.",
      "Explore our wide range of products designed to meet all your needs:":
        "Explore our wide range of products designed to meet all your needs:",
      "Digital printing": "Digital printing",
      "Photo printing": "Photo printing",
      "Mug printing": "Mug printing",
      "Visiting cards": "Visiting cards",
      "Wedding cards": "Wedding cards",
      "Rubber/Flash Seals": "Rubber/Flash Seals",
      "Why us and benefits": "Why us and benefits",
      "Why Choose Awarjana Creations and Studio?":
        "Why Choose Awarjana Creations and Studio?",
      "At Awarjana Creations and Studio, we don't just offer services—we deliver trust, quality, and a seamless experience. Here's why so many customers continue to choose us:":
        "At Awarjana Creations and Studio, we don't just offer services—we deliver trust, quality, and a seamless experience. Here's why so many customers continue to choose us:",
      "Over a Decade of Experience": "Over a Decade of Experience",
      "Since 2011, we've built a strong reputation for reliability and excellence. Our long-standing\npresence reflects our commitment to doing things the right way—legally, ethically, and\nefficiently.":
        "Since 2011, we've built a strong reputation for reliability and excellence. Our long-standing\npresence reflects our commitment to doing things the right way—legally, ethically, and\nefficiently.",
      "Customer-Centric Approach": "Customer-Centric Approach",
      "Your satisfaction is our top priority. We listen, we care, and we tailor our\nservices to meet\nyour unique needs. With friendly support and clear communication, we ensure you always feel\nvalued.":
        "Your satisfaction is our top priority. We listen, we care, and we tailor our\nservices to meet\nyour unique needs. With friendly support and clear communication, we ensure you always feel\nvalued.",
      "Fast and Efficient Service": "Fast and Efficient Service",
      "We respect your time. Our streamlined processes are designed to deliver fast\nturnarounds without\ncompromising quality—so you get what you need, when you need it.":
        "We respect your time. Our streamlined processes are designed to deliver fast\nturnarounds without\ncompromising quality—so you get what you need, when you need it.",
      "Professionalism with a Creative Touch":
        "Professionalism with a Creative Touch",
      "We blend professionalism with creativity to bring your ideas to life. Whether\nit's a creative\nproject or a technical service, we approach every task with passion and precision.":
        "We blend professionalism with creativity to bring your ideas to life. Whether\nit's a creative\nproject or a technical service, we approach every task with passion and precision.",
      "Trust and Transparency": "Trust and Transparency",
      "We believe in building lasting relationships based on trust. No hidden charges,\nno shortcuts—just\nhonest service you can count on.":
        "We believe in building lasting relationships based on trust. No hidden charges,\nno shortcuts—just\nhonest service you can count on.",
      "The Benefits You Get When You Choose Us":
        "The Benefits You Get When You Choose Us",
      "Choosing Awarjana Creations and Studio means gaining more than just a service—it means\ngaining a trusted partner. Here's what you can expect when you work with us:":
        "Choosing Awarjana Creations and Studio means gaining more than just a service—it means\ngaining a trusted partner. Here's what you can expect when you work with us:",
      "Peace of Mind": "Peace of Mind",
      "Our legal and transparent processes ensure you never have to worry about hidden\nissues or surprises. You can relax, knowing everything is handled the right way.":
        "Our legal and transparent processes ensure you never have to worry about hidden\nissues or surprises. You can relax, knowing everything is handled the right way.",
      "Speed Without Stress": "Speed Without Stress",
      "We deliver results quickly, without cutting corners. Our efficient systems make\nsure you get what you need—fast and hassle-free.":
        "We deliver results quickly, without cutting corners. Our efficient systems make\nsure you get what you need—fast and hassle-free.",
      "Friendly, Personalized Service": "Friendly, Personalized Service",
      "We treat every client like family. You'll always be met with respect, clear\ncommunication, and service tailored to your specific needs.":
        "We treat every client like family. You'll always be met with respect, clear\ncommunication, and service tailored to your specific needs.",
      "Proven Experience & Reliability": "Proven Experience & Reliability",
      "With over a decade of consistent performance, our track record speaks for\nitself.\nWe've earned the trust of countless satisfied customers—and we're ready to earn yours.":
        "With over a decade of consistent performance, our track record speaks for\nitself.\nWe've earned the trust of countless satisfied customers—and we're ready to earn yours.",
      "Creative Excellence": "Creative Excellence",
      "Whether it's design, media, or branding, we bring fresh ideas to the table. You\nget innovative solutions backed by technical skill and creative flair.":
        "Whether it's design, media, or branding, we bring fresh ideas to the table. You\nget innovative solutions backed by technical skill and creative flair.",
      "Long-Term Support": "Long-Term Support",
      "We're with you every step of the way—before, during, and after your project.\nYou'll never feel left behind or out of touch.":
        "We're with you every step of the way—before, during, and after your project.\nYou'll never feel left behind or out of touch.",
      Hours: "Hours",
      "We're open everyday!": "We're open everyday!",
      "We're open everyday from 8:30 AM to 6:30 PM\nand we're not open on public holidays.":
        "We're open everyday from 8:30 AM to 6:30 PM\nand we're not open on public holidays.",
      "Day/Period": "Day/Period",
      "Opening time": "Opening time",
      "Closing time": "Closing time",
      Status: "Status",
      Monday: "Monday",
      Tuesday: "Tuesday",
      Wednesday: "Wednesday",
      Thursday: "Thursday",
      Friday: "Friday",
      Saturday: "Saturday",
      Sunday: "Sunday",
      "Legend:": "Legend:",
      "Current Day": "Current Day",
      Holiday: "Holiday",
      Contacts: "Contacts",
      "Stay with us in many ways!": "Stay with us in many ways!",
      "Get in touch with us for any inquiries or\nto request a quote.":
        "Get in touch with us for any inquiries or\nto request a quote.",
      "Where to meet us?": "Where to meet us?",
      "We are in No. 64, Muslim Church Road, 24 Veyangoda Rd, Minuwangoda 11550,\nSri Lanka.":
        "We are in No. 64, Muslim Church Road, 24 Veyangoda Rd, Minuwangoda 11550,\nSri Lanka.",
      "How to contact us?": "How to contact us?",
      "You can contact us in many ways, through phone and emails!":
        "You can contact us in many ways, through phone and emails!",
      "+94 077 176 0459": "+94 077 176 0459",
      "+94 011 228 3020": "+94 011 228 3020",
      "awarjanacreation1@gmail.com": "awarjanacreation1@gmail.com",
      "Copyright ©": "Copyright ©",
      "by Awarjana Creation and Studio, Inc. All rights\nreserved.":
        "by Awarjana Creation and Studio, Inc. All rights\nreserved.",
    },
    si: {
      "ABOUT US": "අප ගැන",
      PRODUCTS: "නිෂ්පාදන",
      "WHY US": "ඇයි අපි",
      HOURS: "පැය",
      CONTACTS: "සබඳතා",
      "Get what you need with Awarjana!":
        "ඔබට අවශ්‍ය දේ Awarjana වෙතින් ලබාගන්න!",
      "At Awarjana Creations and Studio, we believe in the power of creativity and innovation. Our mission is to bring your ideas to life through exceptional design and craftsmanship. Whether you're looking for bespoke artwork, custom designs, or professional studio services, we are here to exceed your expectations.":
        "Awarjana Creations and Studio හි, අපි නිර්මාණශීලිත්වයේ සහ නවෝත්පාදනයේ බලය විශ්වාස කරමු. අපගේ මෙහෙවර වන්නේ සුවිශේෂී නිර්මාණ සහ කලාත්මක හැකියාවන් තුළින් ඔබේ අදහස්වලට ජීවය ලබා දීමයි. ඔබ සුවිශේෂී කලා කෘති, අභිරුචි නිර්මාණ හෝ වෘත්තීය චිත්‍රාගාර සේවා සොයමින් සිටියත්, ඔබගේ අපේක්ෂාවන් ඉක්මවා යාමට අපි මෙහි සිටිමු.",
      "Contact us right now!": "දැන්ම අප අමතන්න!",
      "Learn more ↓": "වැඩිදුර තොරතුරු ↓",
      "Trusted by": "විශ්වාස කළ අය",
      "About us": "අප ගැන",
      "Our Story": "අපගේ කතාව",
      "Welcome to Awarjana Creations and Studio, where creativity meets commitment. Established on October 22, 2011, we have been proudly serving our clients with passion, integrity, and efficiency for over a decade.":
        "නිර්මාණශීලිත්වය කැපවීම හමුවන Awarjana Creations and Studio වෙත සාදරයෙන් පිළිගනිමු. 2011 ඔක්තෝබර් 22 දින ස්ථාපිත කරන ලද අපි, දශකයකට වැඩි කාලයක් තිස්සේ අපගේ ගනුදෙනුකරුවන්ට උද්යෝගය, අවංකභාවය සහ කාර්යක්ෂමතාවයෙන් සේවය කරමින් සිටිමු.",
      "Our Mission & Client Focus": "අපගේ මෙහෙවර සහ පාරිභෝගික අවධානය",
      "Since our inception, our mission has remained clear: to deliver legal, customer-friendly, and fast services that not only meet but exceed expectations. Our dedication to quality and our customer-first approach have earned us the trust and love of our growing client base.":
        "අප ආරම්භ කළ දා සිට, අපගේ මෙහෙවර පැහැදිලිව පැවතුනි: අපේක්ෂාවන් සපුරාලනවා පමණක් නොව ඒවා ඉක්මවා යන නීත්‍යානුකූල, පාරිභෝගික හිතකාමී සහ වේගවත් සේවාවන් සැපයීම. ගුණාත්මකභාවය සහ පාරිභෝගිකයින්ට මුල් තැන දෙන අපගේ ප්‍රවේශය අපගේ වර්ධනය වන පාරිභෝගික පදනමේ විශ්වාසය හා ආදරය දිනා ඇත.",
      "Our Values & Approach": "අපගේ වටිනාකම් සහ ප්‍රවේශය",
      "At Awarjana, we believe in building relationships that last—powered by transparency, professionalism, and a relentless pursuit of excellence. Whether you're a returning client or visiting us for the first time, we're here to provide solutions tailored to your needs with a touch of creativity and a heart full of care.\nExperience the Awarjana difference—where service is not just a promise, but a tradition.":
        "Awarjana හි, අපි පාරදෘශ්‍යභාවය, වෘත්තීයභාවය සහ විශිෂ්ටත්වය සඳහා නොපසුබට උත්සාහය මත පදනම් වූ කල් පවතින සබඳතා ගොඩනැගීම විශ්වාස කරමු. ඔබ නැවත පැමිණෙන සේවාදායකයෙකු වුවත්, පළමු වරට අප වෙත පැමිණියත්, නිර්මාණශීලිත්වයේ ස්පර්ශයක් හා පූර්ණ සැලකිල්ලක් සහිතව ඔබේ අවශ්‍යතාවලට ගැළපෙන විසඳුම් ලබා දීමට අපි මෙහි සිටිමු.\nAwarjana වෙනස අත්විඳින්න—සේවාව යනු පොරොන්දුවක් පමණක් නොව, සම්ප්‍රදායකි.",
      "Our products": "අපගේ නිෂ්පාදන",
      "Your satisfaction is our top priority. Let us help you create something special.":
        "ඔබගේ තෘප්තිය අපගේ ප්‍රමුඛතාවයයි. විශේෂ දෙයක් නිර්මාණය කිරීමට අපි ඔබට උදව් කරමු.",
      "Explore our wide range of products designed to meet all your needs:":
        "ඔබගේ සියලු අවශ්‍යතා සපුරාලීම සඳහා නිර්මාණය කර ඇති අපගේ පුළුල් පරාසයක නිෂ්පාදන ගවේෂණය කරන්න:",
      "Digital printing": "ඩිජිටල් මුද්‍රණය",
      "Photo printing": "ඡායාරූප මුද්‍රණය",
      "Mug printing": "මග් මුද්‍රණය",
      "Visiting cards": "නාම කාඩ්පත්",
      "Wedding cards": "මංගල කාඩ්පත්",
      "Rubber/Flash Seals": "රබර්/ෆ්ලෑෂ් මුද්‍රා",
      "Why us and benefits": "ඇයි අපි සහ වාසි",
      "Why Choose Awarjana Creations and Studio?":
        "Awarjana Creations and Studio තෝරා ගන්නේ ඇයි?",
      "At Awarjana Creations and Studio, we don't just offer services—we deliver trust, quality, and a seamless experience. Here's why so many customers continue to choose us:":
        "Awarjana Creations and Studio හි, අපි සේවා පමණක් නොව—විශ්වාසය, ගුණාත්මකභාවය සහ බාධාවකින් තොර අත්දැකීමක් ලබා දෙන්නෙමු. බොහෝ පාරිභෝගිකයින් අපව තෝරා ගැනීමට හේතු කිහිපයක් මෙන්න:",
      "Over a Decade of Experience": "දශකයකට වැඩි පළපුරුද්ද",
      "Since 2011, we've built a strong reputation for reliability and excellence. Our long-standing\npresence reflects our commitment to doing things the right way—legally, ethically, and\nefficiently.":
        "2011 සිට, අපි විශ්වසනීයත්වය සහ විශිෂ්ටත්වය සඳහා ශක්තිමත් කීර්තියක් ගොඩනඟා ගෙන ඇත. අපගේ දිගුකාලීන පැවැත්ම නීත්‍යානුකූලව, සදාචාරාත්මකව සහ කාර්යක්ෂමව දේවල් නිවැරදිව කිරීමට අපගේ කැපවීම පිළිබිඹු කරයි.",
      "Customer-Centric Approach": "පාරිභෝගික කේන්ද්‍රීය ප්‍රවේශය",
      "Your satisfaction is our top priority. We listen, we care, and we tailor our\nservices to meet\nyour unique needs. With friendly support and clear communication, we ensure you always feel\nvalued.":
        "ඔබගේ තෘප්තිය අපගේ ප්‍රමුඛතාවයයි. අපි සවන් දෙමු, අපි සැලකිලිමත් වෙමු, ඔබේ සුවිශේෂී අවශ්‍යතාවයන්ට ගැළපෙන පරිදි අපගේ සේවාවන් සකස් කරමු. මිත්‍රශීලී සහයෝගය සහ පැහැදිලි සන්නිවේදනය සමඟින්, ඔබට සැමවිටම අගය කරන බවක් දැනෙන බව අපි සහතික කරමු.",
      "Fast and Efficient Service": "වේගවත් හා කාර්යක්ෂම සේවාව",
      "We respect your time. Our streamlined processes are designed to deliver fast\nturnarounds without\ncompromising quality—so you get what you need, when you need it.":
        "අපි ඔබේ කාලය අගය කරමු. අපගේ විධිමත් ක්‍රියාවලීන් සැලසුම් කර ඇත්තේ ගුණාත්මකභාවය අඩාල නොකර වේගවත් ප්‍රතිඵල ලබා දීමටයි—එබැවින් ඔබට අවශ්‍ය දේ, ඔබට අවශ්‍ය විටදී ලැබේ.",
      "Professionalism with a Creative Touch":
        "නිර්මාණාත්මක ස්පර්ශයක් සහිත වෘත්තීයභාවය",
      "We blend professionalism with creativity to bring your ideas to life. Whether\nit's a creative\nproject or a technical service, we approach every task with passion and precision.":
        "ඔබේ අදහස්වලට පණ දීමට අපි වෘත්තීයභාවය නිර්මාණශීලිත්වය සමඟ මුසු කරමු. එය නිර්මාණාත්මක ව්‍යාපෘතියක් හෝ තාක්ෂණික සේවාවක් වුවත්, අපි සෑම කාර්යයකටම උද්යෝගයෙන් හා නිරවද්‍යතාවයෙන් ප්‍රවේශ වෙමු.",
      "Trust and Transparency": "විශ්වාසය සහ විනිවිදභාවය",
      "We believe in building lasting relationships based on trust. No hidden charges,\nno shortcuts—just\nhonest service you can count on.":
        "අපි විශ්වාසය මත පදනම් වූ කල් පවතින සබඳතා ගොඩනැගීම විශ්වාස කරමු. සැඟවුණු ගාස්තු නැත, කෙටිමං නැත—ඔබට විශ්වාස කළ හැකි අවංක සේවාවක් පමණි.",
      "The Benefits You Get When You Choose Us":
        "ඔබ අපව තෝරාගත් විට ඔබට ලැබෙන ප්‍රතිලාභ",
      "Choosing Awarjana Creations and Studio means gaining more than just a service—it means\ngaining a trusted partner. Here's what you can expect when you work with us:":
        "Awarjana Creations and Studio තෝරා ගැනීම යනු සේවාවක් පමණක් නොව—විශ්වාසවන්ත හවුල්කරුවෙකු ලබා ගැනීමයි. ඔබ අප සමඟ වැඩ කරන විට ඔබට අපේක්ෂා කළ හැකි දේ මෙන්න:",
      "Peace of Mind": "සිතේ සැනසීම",
      "Our legal and transparent processes ensure you never have to worry about hidden\nissues or surprises. You can relax, knowing everything is handled the right way.":
        "අපගේ නීත්‍යානුකූල සහ විනිවිද පෙනෙන ක්‍රියාවලීන් මඟින් සැඟවුණු ගැටළු හෝ පුදුම දේවල් ගැන ඔබට කිසි විටෙකත් කරදර විය යුතු නැත. සියල්ල නිවැරදිව සිදු කරන බව දැන ඔබ සැහැල්ලුවෙන් සිටින්න.",
      "Speed Without Stress": "ආතතියකින් තොර වේගය",
      "We deliver results quickly, without cutting corners. Our efficient systems make\nsure you get what you need—fast and hassle-free.":
        "අපි කෙටිමං භාවිතා නොකර ඉක්මනින් ප්‍රතිඵල ලබා දෙමු. අපගේ කාර්යක්ෂම පද්ධති මඟින් ඔබට අවශ්‍ය දේ—වේගවත් හා කරදරයකින් තොරව ලැබෙන බව සහතික කරයි.",
      "Friendly, Personalized Service": "මිත්‍රශීලී, පුද්ගලීකරණය කළ සේවාව",
      "We treat every client like family. You'll always be met with respect, clear\ncommunication, and service tailored to your specific needs.":
        "අපි සෑම සේවාදායකයෙකුටම පවුලේ සාමාජිකයෙකු ලෙස සලකමු. ඔබට සැමවිටම ගෞරවයෙන්, පැහැදිලි සන්නිවේදනයකින් සහ ඔබේ විශේෂිත අවශ්‍යතාවයන්ට ගැළපෙන සේවාවකින් යුතුව පිළිගැනීම ලැබේ.",
      "Proven Experience & Reliability":
        "පළපුරුද්ද සහ විශ්වසනීයත්වය සනාථ කර ඇත",
      "With over a decade of consistent performance, our track record speaks for\nitself.\nWe've earned the trust of countless satisfied customers—and we're ready to earn yours.":
        "දශකයකට වැඩි අඛණ්ඩ කාර්යසාධනයක් සමඟින්, අපගේ වාර්තාව ඒ ගැන කථා කරයි.\nඅපි අසංඛ්‍යාත තෘප්තිමත් පාරිභෝගිකයින්ගේ විශ්වාසය දිනාගෙන ඇත්තෙමු—තවද අපි ඔබේ විශ්වාසය දිනා ගැනීමට සූදානම්.",
      "Creative Excellence": "නිර්මාණාත්මක විශිෂ්ටත්වය",
      "Whether it's design, media, or branding, we bring fresh ideas to the table. You\nget innovative solutions backed by technical skill and creative flair.":
        "එය සැලසුම්, මාධ්‍ය හෝ වෙළඳ නාමකරණය වේවා, අපි නැවුම් අදහස් ඉදිරිපත් කරමු. තාක්ෂණික කුසලතා සහ නිර්මාණාත්මක හැකියාවන්ගෙන් පිරිපුන් නව්‍ය විසඳුම් ඔබට ලැබේ.",
      "Long-Term Support": "දිගුකාලීන සහාය",
      "We're with you every step of the way—before, during, and after your project.\nYou'll never feel left behind or out of touch.":
        "ඔබගේ ව්‍යාපෘතියට පෙර, අතරතුර සහ පසුව සෑම පියවරකදීම අපි ඔබ සමඟ සිටිමු. ඔබ කිසි විටෙකත් අතහැර දමා ඇති බවක් හෝ සම්බන්ධයක් නැති බවක් ඔබට දැනෙන්නේ නැත.",
      Hours: "පැය",
      "We're open everyday!": "අපි හැමදාම විවෘතයි!",
      "We're open everyday from 8:30 AM to 6:30 PM\nand we're not open on public holidays.":
        "අපි හැමදාම උදේ 8:30 සිට සවස 6:30 දක්වා විවෘතයි\nතවද රජයේ නිවාඩු දිනවල විවෘත නැත.",
      "Day/Period": "දිනය/කාලය",
      "Opening time": "විවෘත කරන වේලාව",
      "Closing time": "වසන වේලාව",
      Status: "තත්ත්වය",
      Monday: "සඳුදා",
      Tuesday: "අඟහරුවාදා",
      Wednesday: "බදාදා",
      Thursday: "බ්‍රහස්පතින්දා",
      Friday: "සිකුරාදා",
      Saturday: "සෙනසුරාදා",
      Sunday: "ඉරිදා",
      "Legend:": "ප්‍රවාදය:",
      "Current Day": "වත්මන් දිනය",
      Holiday: "නිවාඩු දිනය",
      Contacts: "සබඳතා",
      "Stay with us in many ways!": "බොහෝ ආකාරවලින් අප සමඟ රැඳී සිටින්න!",
      "Get in touch with us for any inquiries or\nto request a quote.":
        "ඕනෑම විමසීමක් සඳහා හෝ මිල ගණන් ඉල්ලීමට අප හා සම්බන්ධ වන්න.",
      "Where to meet us?": "අපව හමුවිය හැක්කේ කොහේද?",
      "We are in No. 64, Muslim Church Road, 24 Veyangoda Rd, Minuwangoda 11550,\nSri Lanka.":
        "අපි අංක 64, මුස්ලිම් පල්ලිය පාර, 24 වේයන්ගොඩ පාර, මිනුවන්ගොඩ 11550, ශ්‍රී ලංකාවෙහි සිටිමු.",
      "How to contact us?": "අප හා සම්බන්ධ වන්නේ කෙසේද?",
      "You can contact us in many ways, through phone and emails!":
        "ඔබට දුරකථන සහ විද්‍යුත් තැපෑල හරහා බොහෝ ආකාරවලින් අප හා සම්බන්ධ විය හැක!",
      "+94 077 176 0459": "+94 077 176 0459",
      "+94 011 228 3020": "+94 011 228 3020",
      "awarjanacreation1@gmail.com": "awarjanacreation1@gmail.com",
      "Copyright ©": "ප්‍රකාශන හිමිකම ©",
      "by Awarjana Creation and Studio, Inc. All rights\nreserved.":
        "Awarjana Creation and Studio, Inc. විසිනි. සියලුම හිමිකම් ඇවිරිණි.",
    },
  };
  function translatePage(lang) {
    const elements = document.querySelectorAll("[data-translate]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-translate");
      if (translations[key] && translations[key][lang]) {
        element.textContent = translations[key][lang];
      }
    });
  }

  function setLanguage(lang) {
    localStorage.setItem("language", lang);
    translatePage(lang);
    // Update UI to reflect selected language if needed
  }

  document.addEventListener("DOMContentLoaded", () => {
    const storedLanguage = localStorage.getItem("language") || "en";
    translatePage(storedLanguage);

    const langDropdown = document.querySelector(".dropdown-menu");
    if (langDropdown) {
      langDropdown.addEventListener("click", (event) => {
        const target = event.target.closest("a");
        if (target) {
          const lang = target.getAttribute("data-lang");
          if (lang) {
            setLanguage(lang);
          }
        }
      });
    }
  });
});
