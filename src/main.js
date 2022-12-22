/*
 * Copyright © 2020. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

//@ts-check - Get type warnings from the TypeScript language server. Remove if not wanted.

// Get access to the Spotfire Mod API by providing a callback to the initialize method.
Spotfire.initialize(async (mod) => {
    const context = mod.getRenderContext();
    const reader = mod.createReader(mod.visualization.data(), mod.windowSize());

    // This Mod does not rely on data outside the
    // mod itself so no read errors are expected.
    //reader.subscribe(render);
    // Setup reader/rendering loop
    reader.subscribe(async (dataView) => {
        // Do the actual rendering
        await render(dataView);

        // Always signal to the framework that rendering has completed
        // or export rendering (to PDF or dxp file thumbnail image) will hang.
        context.signalRenderComplete();
    });

    /**
     *
     * @param {Spotfire.DataView} dataView
     */
    async function render(dataView) {
        // Initialise mod-container
        document.getElementById("mod-container").innerHTML = " ";

        /**
         * Check for any errors.
         */
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            mod.controls.errorOverlay.show(errors, "dataView");
            // TODO clear DOM
            return;
        }

        mod.controls.errorOverlay.hide("dataView");

        //Hide tooltip
        mod.controls.tooltip.hide();

        let colorHierarchy = await dataView.hierarchy("Color");
        const colorLeafNodes = (await colorHierarchy.root()).leaves();

        let limit = 20; // limit for total city names that OpenWeatherMap API support
        let totalCityCount = 0;

        var cards = [];
        for (const colorLeaf of colorLeafNodes) {
            if (totalCityCount < limit) {
                const cityID = Number(colorLeaf.rows().map((cat) => cat.categorical("City ID").formattedValue())[0]);
                const colorHex = colorLeaf.rows().map((row) => row.color().hexCode);

                cards.push(createWatherCard(cityID, colorHex));
            } else {
                mod.controls.errorOverlay.show(errors, "dataView");
            }
            totalCityCount++;
        }

        await Promise.all(cards);
    }

    async function createWatherCard(_cityID, _colorHex) {
        const appID = (await mod.document.property("propApiKey")).value();
        let units = "metric";

        // Current Weather

        let baseURL = "https://api.openweathermap.org/data/2.5/weather?";
        let weatherObject = await fetch(baseURL + "id=" + _cityID + "&appid=" + appID + "&units=" + units);

        let weatherText = await weatherObject.text();
        let weatherJSON = JSON.parse(weatherText);

        let _lat = weatherJSON["coord"]["lat"];
        let _lon = weatherJSON["coord"]["lon"];

        let location = weatherJSON["name"];
        let country = weatherJSON["sys"]["country"];

        let weatherDescription = weatherJSON["weather"][0]["description"];
        let visibility = weatherJSON["visibility"];

        let localDateTime = weatherJSON["dt"] * 1000;
        let timeZone = weatherJSON["timezone"];

        // get formatted Date and Time
        unixTimeConverter(localDateTime, timeZone);

        let windDirection = weatherJSON["wind"]["deg"];
        let wind = weatherJSON["wind"]["speed"];
        let humidity = weatherJSON["main"]["humidity"];

        let weatherIcon = weatherJSON["weather"][0]["icon"];
        let currentTemp = Math.round(weatherJSON["main"]["temp"]);

        // 7 Days Forecast

        //Forecast Example URL: https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}
        let forecastBaseURL = "https://api.openweathermap.org/data/2.5/onecall?";
        let excludeOptions = "current,minutely,hourly,alerts"; // excluding all except 'daily'
        let fWeatherObject = await fetch(
            forecastBaseURL +
                "lat=" +
                _lat +
                "&lon=" +
                _lon +
                "&exclude=" +
                excludeOptions +
                "&appid=" +
                appID +
                "&units=" +
                units
        );

        let fWeatherText = await fWeatherObject.text();
        let fWeatherJSON = JSON.parse(fWeatherText);
        let dailyForecast = fWeatherJSON.daily;

        // Create HTML Tags
        let weatherContainerTag = document.createElement("div");
        weatherContainerTag.className = "weather-container";
        weatherContainerTag.style.backgroundColor = _colorHex;

        let locationWeatherTypeTag = document.createElement("div");
        locationWeatherTypeTag.className = "loc-weather-type-box";

        let locationTag = document.createElement("div");
        locationTag.className = "location";
        locationTag.innerHTML = location + ", " + country;

        let weatherTypeTag = document.createElement("div");
        weatherTypeTag.className = "weather-type";
        weatherTypeTag.innerHTML = weatherDescription + ". Visibility " + Math.round(visibility / 1000) + " KM";

        let timeWindHumidityTag = document.createElement("div");
        timeWindHumidityTag.className = "time-wind-humid-box";

        let timeTag = document.createElement("div");
        timeTag.className = "time";
        //timeTag.innerHTML = localDateTime.toString();
        timeTag.innerHTML = unixTimeConverter(localDateTime, timeZone);

        let humidityTag = document.createElement("div");
        humidityTag.className = "humidity";
        humidityTag.innerHTML = "Humidity: " + Math.round(humidity) + " %";

        let windTag = document.createElement("div");
        windTag.className = "wind";
        windTag.innerHTML = "Wind: " + getCardinalDirection(windDirection) + " " + wind + " m/s";

        let currentWeatherIconTag = document.createElement("div");
        currentWeatherIconTag.className = "weather-icon";

        let weatherImgTag = document.createElement("img");
        weatherImgTag.src = "https://openweathermap.org/img/wn/" + weatherIcon + "@4x.png";

        let temperatureTag = document.createElement("div");
        temperatureTag.className = "temperature";

        let tempValueTag = document.createElement("div");
        tempValueTag.className = "temp-value";
        tempValueTag.id = "cValue";
        tempValueTag.innerHTML = currentTemp.toString();

        let fValueTag = document.createElement("div");
        fValueTag.className = "temp-value";
        fValueTag.id = "fValue";
        fValueTag.innerHTML = Math.round((currentTemp * 9) / 5 + 32).toString();

        let cTempTag = document.createElement("div");
        cTempTag.className = "temp-unit active";
        cTempTag.innerHTML = "°C";
        cTempTag.id = "c-temp";

        let seperatorTag = document.createElement("div");
        seperatorTag.className = "seperator";

        let fTempTag = document.createElement("div");
        fTempTag.className = "temp-unit";
        fTempTag.innerHTML = "°F";
        fTempTag.id = "f-temp";

        let weatherForcastTag = document.createElement("div");
        weatherForcastTag.className = "weather-forecast";
        weatherForcastTag.id = "day-forecast";

        // Append tags

        weatherContainerTag.appendChild(locationWeatherTypeTag);
        locationWeatherTypeTag.appendChild(locationTag);
        locationWeatherTypeTag.appendChild(weatherTypeTag);

        weatherContainerTag.appendChild(timeWindHumidityTag);
        timeWindHumidityTag.appendChild(timeTag);
        timeWindHumidityTag.appendChild(windTag);
        timeWindHumidityTag.appendChild(humidityTag);

        weatherContainerTag.appendChild(currentWeatherIconTag);
        currentWeatherIconTag.appendChild(weatherImgTag);

        weatherContainerTag.appendChild(temperatureTag);
        temperatureTag.appendChild(tempValueTag);
        temperatureTag.appendChild(fValueTag);
        temperatureTag.appendChild(cTempTag);
        temperatureTag.appendChild(seperatorTag);
        temperatureTag.appendChild(fTempTag);

        weatherContainerTag.appendChild(weatherForcastTag);

        let day, today, dayOfWeek, icon, highTemp, lowTemp;

        for (let i = 1; i < dailyForecast.length; i++) {
            day = dailyForecast[i];
            today = new Date().getDay() + i;
            if (today > 6) {
                today = today - 7;
            }
            dayOfWeek = getDayOfWeek(today);
            icon = day.weather[0].icon;
            highTemp = Math.round(day.temp.max);
            lowTemp = Math.round(day.temp.min);

            let forecastContainerTag = document.createElement("div");
            forecastContainerTag.className = "forecast-container";

            let forecastDay = document.createElement("div");
            forecastDay.className = "day";
            forecastDay.innerHTML = dayOfWeek;

            let forecastIcon = document.createElement("div");
            forecastIcon.className = "forecast-icon";

            let imgTag = document.createElement("img");
            imgTag.src = "https://openweathermap.org/img/wn/" + icon + ".png";

            let forecastMinMaxTag = document.createElement("div");
            forecastMinMaxTag.className = "forecast-min-max";
            forecastMinMaxTag.id = "forecast-c-value";
            forecastMinMaxTag.innerHTML = highTemp + " / " + lowTemp;

            let fForecastMinMaxTag = document.createElement("div");
            fForecastMinMaxTag.className = "forecast-min-max";
            fForecastMinMaxTag.id = "forecast-f-value";
            fForecastMinMaxTag.innerHTML =
                Math.round((highTemp * 9) / 5 + 32) + " / " + Math.round((lowTemp * 9) / 5 + 32);

            forecastContainerTag.appendChild(forecastDay);
            forecastContainerTag.appendChild(forecastIcon);
            forecastIcon.appendChild(imgTag);
            forecastContainerTag.appendChild(forecastMinMaxTag);
            forecastContainerTag.appendChild(fForecastMinMaxTag);

            weatherForcastTag.appendChild(forecastContainerTag);
        }

        // append all Tags to mod-container
        document.getElementById("mod-container").append(weatherContainerTag);

        // Adding event listners to toggle F to C and vice-versa
        const fTag = document.querySelectorAll("#f-temp");
        const cTag = document.querySelectorAll("#c-temp");

        fTag.forEach((element) => {
            element.addEventListener("click", temperatureConvertor);
        });

        cTag.forEach((element) => {
            element.addEventListener("click", temperatureConvertor);
        });
    }

    function temperatureConvertor(event) {
        let selectedTag = event.target.id;

        let allCTags = document.querySelectorAll("#cValue");
        let allFTags = document.querySelectorAll("#fValue");

        let allForcastCTag = document.querySelectorAll("#forecast-c-value");
        let allForcastFTag = document.querySelectorAll("#forecast-f-value");

        let allCTempUnit = document.querySelectorAll("#c-temp");
        let allFTempUnit = document.querySelectorAll("#f-temp");

        if (selectedTag == "f-temp") {
            for (let index = 0; index < allCTags.length; index++) {
                // @ts-ignore
                allCTags[index].style.display = "none";
                // @ts-ignore
                allFTags[index].style.display = "block";

                allCTempUnit[index].classList.remove("active");
                allFTempUnit[index].classList.add("active");
            }

            for (let index = 0; index < allForcastCTag.length; index++) {
                // @ts-ignore
                allForcastCTag[index].style.display = "none";
                // @ts-ignore
                allForcastFTag[index].style.display = "block";
            }
        }

        if (selectedTag == "c-temp") {
            for (let index = 0; index < allFTags.length; index++) {
                // @ts-ignore
                allFTags[index].style.display = "none";
                // @ts-ignore
                allCTags[index].style.display = "block";

                allFTempUnit[index].classList.remove("active");
                allCTempUnit[index].classList.add("active");
            }

            for (let index = 0; index < allForcastCTag.length; index++) {
                // @ts-ignore
                allForcastFTag[index].style.display = "none";
                // @ts-ignore
                allForcastCTag[index].style.display = "block";
            }
        }
    }

    function getDayOfWeek(dayNum) {
        var weekday = new Array(7);
        weekday[0] = "Sun";
        weekday[1] = "Mon";
        weekday[2] = "Tue";
        weekday[3] = "Wed";
        weekday[4] = "Thur";
        weekday[5] = "Fri";
        weekday[6] = "Sat";
        return weekday[dayNum];
    }
    function getCardinalDirection(angle) {
        const directions = ["↑ N", "↗ NE", "→ E", "↘ SE", "↓ S", "↙ SW", "← W", "↖ NW"];
        return directions[Math.round(angle / 45) % 8];
    }

    function unixTimeConverter(_unixTimestamp, _timezone) {
        let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let dateTimezoneObject = new Date(_unixTimestamp / 1000 + _timezone);
        let localDatetime = new Date(dateTimezoneObject.getTime() * 1000);

        var day = localDatetime.getUTCDate();
        var month = localDatetime.getUTCMonth();
        var hours = localDatetime.getUTCHours();
        var minutes = localDatetime.getUTCMinutes();

        var ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        // @ts-ignore
        minutes = minutes < 10 ? "0" + minutes : minutes;

        var strTime = hours + ":" + minutes + " " + ampm;
        var formattedTime = monthNames[month] + " " + day + ", " + strTime;

        return formattedTime;
    }
});