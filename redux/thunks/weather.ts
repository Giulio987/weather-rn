import { setCallState, setWeather } from '../reducers/weather';
import { AppDispatch } from '../store';
import { CityToDispatch, CityWeather } from '../../models/weather';
import getImageAndStyleFromWeather, {
  getHourlyFormat,
} from '../../modules/utilities';
//@ts-ignore
import { REACT_APP_OPEN_WEATHER_API_KEY } from 'react-native-dotenv';

const getWeather = (city: CityToDispatch) => async (dispatch: AppDispatch) => {
  dispatch(setCallState({ isLoading: true, error: null }));
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${city.coord.lat}&lon=${city.coord.lon}&exclude=minutely,&units=metric&appid=${REACT_APP_OPEN_WEATHER_API_KEY}`
    );
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const data = await response.json();
    const additionalData = getImageAndStyleFromWeather(
      data.current.weather[0].id,
      data.current.weather[0].main,
      city.id
    );
    //Formattazione data e ora
    const { dt } = data.current;
    const dateTime = new Date(dt * 1000);
    const date = dateTime.toLocaleString('en-GB', {
      day: 'numeric',
      weekday: 'long',
      month: 'long',
    });
    const hour = dateTime.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    //Creazione oggetto
    const cityWeather: CityWeather = {
      id: city.id,
      name: city.name,
      mainWeather: {
        main: data.current.weather[0].main,
        temperature: data.current.temp,
        localeDate: date,
        localTime: hour,
        image: additionalData.image,
        style: additionalData.style,
      },
      hourlyTemperatures: data.hourly.map((hour: any) => ({
        temperature: hour.temp,
        localTime: getHourlyFormat(hour.dt),
      })),
      dailyWeather: data.daily.map((day: any) => ({
        main: day.weather[0].main,
        temperature: day.temp.day,
        localeDate: new Date(day.dt * 1000)
          .toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
          .split(',')[0],
        image: getImageAndStyleFromWeather(
          day.weather[0].id,
          day.weather[0].main,
          city.id
        ).image,
      })),
    };
    dispatch(setWeather(cityWeather));
    dispatch(setCallState({ isLoading: false, error: null }));
  } catch (err: any) {
    dispatch(setCallState({ isLoading: false, error: err.message }));
    throw new Error(err.message || 'Something went wrong');
  }
};

const getCityLocation = (city: string) => async (dispatch: AppDispatch) => {
  dispatch(setCallState({ isLoading: true, error: null }));
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${REACT_APP_OPEN_WEATHER_API_KEY}`
    );
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const data = await response.json();
    dispatch(setCallState({ isLoading: false, error: null }));
    return data;
  } catch (err: any) {
    dispatch(setCallState({ isLoading: false, error: err.message }));
    throw new Error(err.message || 'Something went wrong');
  }
};

export { getWeather, getCityLocation };
