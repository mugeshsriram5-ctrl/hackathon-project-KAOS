export interface ChennaiWeather {
  temperature: number;
  condition: string;
  icon: string;
  weatherCode: number;
  isNight: boolean;
}

export async function fetchChennaiWeather(): Promise<ChennaiWeather> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current=temperature_2m,is_day,weather_code',
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    const temp = Math.round(data.current?.temperature_2m ?? 32);
    const isDay = data.current?.is_day === 1;
    const code = data.current?.weather_code ?? 0;

    let condition = 'Sunny';
    let icon = '☀️';

    if (code >= 1 && code <= 3) {
      condition = 'Partly Cloudy';
      icon = isDay ? '⛅' : '☁️';
    } else if (code >= 45 && code <= 48) {
      condition = 'Hazy / Humid';
      icon = '🌫️';
    } else if (code >= 51 && code <= 67) {
      condition = 'Monsoon Showers';
      icon = '🌧️';
    } else if (code >= 95 && code <= 99) {
      condition = 'Thunderstorm';
      icon = '⚡';
    } else if (!isDay) {
      condition = 'Clear Night';
      icon = '🌙';
    }

    return {
      temperature: temp,
      condition,
      icon,
      weatherCode: code,
      isNight: !isDay,
    };
  } catch (err) {
    // Fallback default Chennai weather
    return {
      temperature: 32,
      condition: 'Tropical & Humid',
      icon: '☀️',
      weatherCode: 0,
      isNight: false,
    };
  }
}
