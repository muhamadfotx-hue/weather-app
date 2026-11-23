
const button = document.getElementById("searchBtn");
const cityInput = document.getElementById("city");

// XABAR ELEMENTI
let statusMessage = document.getElementById("weatherStatus");

if (!statusMessage) {
  statusMessage = document.createElement("p");
  statusMessage.id = "weatherStatus";
  statusMessage.className = "status-message";
  button.parentElement.appendChild(statusMessage);
}

// XABAR CHIQARISH
function showMessage(message, type = "error") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message " + type;
}

function clearMessage() {
  statusMessage.textContent = "";
  statusMessage.className = "status-message";
}

// OB-HAVO IKONLARI
function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

// OB-HAVO TAVSIFI
function getWeatherDescription(code) {
  if (code === 0) return "Quyoshli";
  if (code === 1) return "Asosan ochiq";
  if (code === 2) return "Qisman bulutli";
  if (code === 3) return "Bulutli";
  if (code >= 45 && code <= 48) return "Tuman";
  if (code >= 51 && code <= 55) return "Mayda yomg'ir";
  if (code >= 56 && code <= 67) return "Yomg'ir";
  if (code >= 71 && code <= 77) return "Qor";
  if (code >= 80 && code <= 82) return "Jala";
  if (code >= 95) return "Momaqaldiroq";
  return "Ob-havo ma'lumoti";
}

// OB-HAVO ANIMATSIYASI
function setWeatherAnimation(code) {
  document.body.classList.remove(
    "rainy", "snowy", "sunny", "cloudy", "stormy"
  );

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    document.body.classList.add("rainy");
  } else if (code >= 71 && code <= 77) {
    document.body.classList.add("snowy");
  } else if (code === 0 || code === 1) {
    document.body.classList.add("sunny");
  } else if (code === 2 || code === 3 || (code >= 45 && code <= 48)) {
    document.body.classList.add("cloudy");
  } else if (code >= 95) {
    document.body.classList.add("stormy");
  }
}

// VAQTNI FORMATLASH
function formatTime(time) {
  if (!time) return "--:--";
  return time.slice(11, 16);
}

// ASOSIY OB-HAVO FUNKSIYASI
async function getWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    showMessage("Iltimos, shahar nomini kiriting!");
    cityInput.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "⏳ Yuklanmoqda...";
  button.classList.add("loading");
  showMessage("Ob-havo yuklanmoqda...", "loading");

  try {
    // SHAHARNI TOPISH
    const geoURL =
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(city) +
      "&count=1&language=uz&format=json";

    const geoResponse = await fetch(geoURL);

    if (!geoResponse.ok) {
      throw new Error("Shaharni qidirishda xatolik!");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("😕 Bunday shahar topilmadi!");
    }

    const place = geoData.results[0];

    // OB-HAVO API
    const weatherURL =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      place.latitude +
      "&longitude=" +
      place.longitude +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&hourly=temperature_2m,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset" +
      "&forecast_days=8&timezone=auto";

    const weatherResponse = await fetch(weatherURL);

    if (!weatherResponse.ok) {
      throw new Error("Ob-havo xizmatida xatolik!");
    }

    const data = await weatherResponse.json();

    if (!data.current || !data.hourly || !data.daily) {
      throw new Error("Ob-havo ma'lumotlari to'liq kelmadi!");
    }

    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    // SHAHAR NOMI
    document.getElementById("cityName").textContent =
      place.name + ", " + (place.country || "");

    // HARORAT
    document.getElementById("temperature").textContent =
      Math.round(current.temperature_2m) + "°C";

    // OB-HAVO
    document.getElementById("description").textContent =
      getWeatherIcon(current.weather_code) +
      " " +
      getWeatherDescription(current.weather_code);

    // SHAMOL
    document.getElementById("wind").textContent =
      "💨 Shamol: " +
      Math.round(current.wind_speed_10m) +
      " km/soat";

    // NAMLIK
    document.getElementById("humidity").textContent =
      current.relative_humidity_2m + "%";

    // QUYOSH CHIQISHI
    document.getElementById("sunrise").textContent =
      formatTime(daily.sunrise[0]);

    // QUYOSH BOTISHI
    document.getElementById("sunset").textContent =
      formatTime(daily.sunset[0]);

    // ANIMATSIYA
    setWeatherAnimation(current.weather_code);

    // 8 KUNLIK PROGNOZ
    const forecastList = document.getElementById("forecastList");
    forecastList.innerHTML = "";

    const days = [
      "Yakshanba",
      "Dushanba",
      "Seshanba",
      "Chorshanba",
      "Payshanba",
      "Juma",
      "Shanba"
    ];

    for (let i = 0; i < daily.time.length; i++) {
      const date = new Date(daily.time[i] + "T12:00:00");
      const day = i === 0 ? "Bugun" : days[date.getDay()];

      const max = Math.round(daily.temperature_2m_max[i]);
      const min = Math.round(daily.temperature_2m_min[i]);
      const icon = getWeatherIcon(daily.weather_code[i]);

      const item = document.createElement("div");
      item.className = "forecast-day";

      item.innerHTML = `
        <p>${day}</p>
        <h2>${icon}</h2>
        <p>${max}°C / ${min}°C</p>
      `;

      forecastList.appendChild(item);
    }

    // 24 SOATLIK PROGNOZ
    const hourlyList = document.getElementById("hourlyList");
    hourlyList.innerHTML = "";

    const currentTime = current.time.slice(0, 13) + ":00";
    let count = 0;

    for (let i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i] < currentTime) continue;

      const hour = hourly.time[i].slice(11, 16);
      const temp = Math.round(hourly.temperature_2m[i]);
      const icon = getWeatherIcon(hourly.weather_code[i]);

      const item = document.createElement("div");
      item.className = "hourly-item";

      item.innerHTML = `
        <p>${count === 0 ? "Hozir" : hour}</p>
        <h2>${icon}</h2>
        <p>${temp}°C</p>
      `;

      hourlyList.appendChild(item);

      count++;
      if (count === 24) break;
    }

    showMessage("Ob-havo muvaffaqiyatli yuklandi! ☀️", "success");

    console.log("Prognoz yuklandi!");

  } catch (error) {
    console.error("XATO:", error);
    showMessage(error.message || "Noma'lum xatolik yuz berdi!");

  } finally {
    button.disabled = false;
    button.textContent = "Qidirish";
    button.classList.remove("loading");
  }
}

// QIDIRISH TUGMASI
button.addEventListener("click", getWeather);

// ENTER TUGMASI
cityInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    getWeather();
  }
});

// SAYT OCHILGANDA BO'SH TURADI
cityInput.value = "";
clearMessage();

cityInput.addEventListener("input", function() {
  clearMessage();
});

console.log("Premium Weather App ishga tushdi!");
