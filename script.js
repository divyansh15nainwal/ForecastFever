
const apiKey = 'f04579bf863f797070916bc883cf064d'; //Api key

document.addEventListener('DOMContentLoaded', () => {
    const userLocation = document.getElementById('userLocation');
    const searchIcon = document.querySelector('.fa-search');
    const temperatureElement = document.querySelector('.temperature');
    const feelsLikeElement = document.querySelector('.feelsLike');
    const descriptionElement = document.querySelector('.description');
    const dateElement = document.querySelector('.date');
    const cityElement = document.querySelector('.city');
    const humidityElement = document.getElementById('Hvalue');
    const windSpeedElement = document.getElementById('Wvalue');
    const srValueElement = document.getElementById('SRValue');
    const ssValueElement = document.getElementById('SsValue');
    const cloudsElement = document.getElementById('Cvalue');
    const uvIndexElement = document.getElementById('uvvalue');
    const pressureElement = document.getElementById('pvalue');
    const converter = document.getElementById('converter');
    const forecastElement = document.querySelector('.forecast');
    const recentSearchesDropdown = document.getElementById('recentSearchesDropdown'); 

    const loadFromLocalStorage = () => {    //store data in local storage
        const savedLocation = localStorage.getItem('location');
        const savedUnit = localStorage.getItem('unit');
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

        if (savedLocation) userLocation.value = savedLocation;
        if (savedUnit) converter.value = savedUnit === 'metric' ? '°C' : '°F';
        populateRecentSearchesDropdown(recentSearches);

        if (savedLocation && savedUnit) {
            searchWeather(savedLocation, savedUnit);
        }
    };

    const saveToLocalStorage = (location, unit) => {
        localStorage.setItem('location', location);
        localStorage.setItem('unit', unit);
        updateRecentSearches(location);
    };

    const updateRecentSearches = (location) => {
        let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

       
        recentSearches = recentSearches.filter(search => search !== location);

        
        recentSearches.unshift(location);


        if (recentSearches.length > 5) recentSearches.pop();

        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        populateRecentSearchesDropdown(recentSearches);
    };

    const populateRecentSearchesDropdown = (recentSearches) => {
        recentSearchesDropdown.innerHTML = ''; 

        recentSearches.forEach(search => {
            const option = document.createElement('option');
            option.value = search;
            option.textContent = search;
            recentSearchesDropdown.appendChild(option);
        });
    };

    const getWeatherData = async (location, unit = 'metric') => {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${unit}&appid=${apiKey}`;  //weather api
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Location not found');
            const data = await response.json();
            return data;
        } catch (error) {
            alert(error.message);
        }
    };

    const getForecastData = async (location, unit = 'metric') => {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${unit}&appid=${apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Forecast data not available');
            const data = await response.json();
            return data;
        } catch (error) {
            alert(error.message);
        }
    };

    const getUVIndex = async (lat, lon) => {
        const url = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('UV Index data not available');
            const data = await response.json();
            return data.value;
        } catch (error) {
            alert(error.message);
        }
    };

    const updateWeatherUI = async (data, unit) => {
        const temperature = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const description = data.weather[0].description;
        const date = new Date().toLocaleDateString();
        const city = data.name;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
        const clouds = data.clouds.all;
        const pressure = data.main.pressure;
        
        const uvIndex = await getUVIndex(data.coord.lat, data.coord.lon);

        temperatureElement.textContent = `${temperature}°${unit === 'metric' ? 'C' : 'F'}`;
        feelsLikeElement.textContent = `Feels Like: ${feelsLike}°${unit === 'metric' ? 'C' : 'F'}`;
        descriptionElement.textContent = description;
        dateElement.textContent = date;
        cityElement.textContent = city;
        humidityElement.textContent = `${humidity}%`;
        windSpeedElement.textContent = `${windSpeed} m/s`;
        srValueElement.textContent = sunrise;
        ssValueElement.textContent = sunset;
        cloudsElement.textContent = `${clouds}%`;
        pressureElement.textContent = `${pressure} hPa`;
        uvIndexElement.textContent = uvIndex !== undefined ? uvIndex : 'N/A';
    };

    const updateForecastUI = (forecastData, unit) => {
        const dailyForecast = {};

        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!dailyForecast[date]) {
                dailyForecast[date] = {
                    minTemp: item.main.temp_min,
                    maxTemp: item.main.temp_max,
                };
            } else {
                dailyForecast[date].minTemp = Math.min(dailyForecast[date].minTemp, item.main.temp_min);
                dailyForecast[date].maxTemp = Math.max(dailyForecast[date].maxTemp, item.main.temp_max);
            }
        });

        forecastElement.innerHTML = '';

        Object.keys(dailyForecast).slice(0, 5).forEach(date => {
            const forecastDiv = document.createElement('div');
            forecastDiv.classList.add('forecast-day');
            forecastDiv.innerHTML = `
                <h3>${date}</h3>
                <p>Min: ${Math.round(dailyForecast[date].minTemp)}°${unit === 'metric' ? 'C' : 'F'}</p>
                <p>Max: ${Math.round(dailyForecast[date].maxTemp)}°${unit === 'metric' ? 'C' : 'F'}</p>
            `;
            forecastElement.appendChild(forecastDiv);
        });
    };

    const searchWeather = async (location = userLocation.value, unit = converter.value === '°C' ? 'metric' : 'imperial') => {
        const weatherData = await getWeatherData(location, unit);
        const forecastData = await getForecastData(location, unit);
        if (weatherData) updateWeatherUI(weatherData, unit);
        if (forecastData) updateForecastUI(forecastData, unit);
        saveToLocalStorage(location, unit);
    };

    searchIcon.addEventListener('click', () => searchWeather());
    converter.addEventListener('change', () => searchWeather());
    userLocation.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });

    
    recentSearchesDropdown.addEventListener('change', () => {
        const selectedLocation = recentSearchesDropdown.value;
        userLocation.value = selectedLocation;
        searchWeather(selectedLocation);
    });

    loadFromLocalStorage(); 
});
