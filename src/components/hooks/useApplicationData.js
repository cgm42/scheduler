import { useEffect, useReducer } from "react";
import axios from "axios";
import { getAppointmentsForDay } from "helpers/selectors.js";
function useApplicationData() {
  const SET_DAY = "SET_DAY";
  const SET_APPLICATION_DATA = "SET_APPLICATION_DATA";
  const SET_INTERVIEW = "SET_INTERVIEW";
  const SET_INTERVIEW_ONE = "SET_INTERVIEW_ONE";
  const [state, dispatch] = useReducer(reducer, {
    day: "Monday",
    days: [],
    appointments: {},
    interviewers: {},
  });
  function reducer(state, action) {
    switch (action.type) {
      case SET_DAY:
        return {
          ...state,
          day: action.value,
        };
      case SET_APPLICATION_DATA:
        console.log("{...state, ...action.value} :>> ", {
          ...state,
          ...action.value,
        });
        return {
          ...state,
          ...action.value,
        };
      case SET_INTERVIEW_ONE:
        const appointments = {
          ...state.appointments,
          [action.id]: {
            ...state.appointments[action.id],
            interview: action.interview,
          },
        };
        const days = updateSpotsInDays(state, appointments);
        const newState = {
          ...state,
          days,
          appointments,
        };
        return newState;
      default:
        throw new Error(
          `Tried to reduce with unsupported action type: ${action.type}`
        );
    }
  }

  const setDay = (day) => dispatch({ type: SET_DAY, value: day });
  useEffect(() => {
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then((all) => {
      dispatch({
        type: SET_APPLICATION_DATA,
        value: {
          days: all[0].data,
          appointments: all[1].data,
          interviewers: all[2].data,
        },
      });
    });
    let socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    socket.onmessage = (event) => {
      console.log(`message received: ${event.data}`);
      var msg = JSON.parse(event.data);
      dispatch(msg);
    };
    return () => {
      socket.close();
    };
  }, []);

  function bookInterview(id, interview) {
    const appointment = {
      ...state.appointments[id],
      interview: { ...interview },
    };
    const appointments = {
      ...state.appointments,
      [id]: appointment,
    };
    return axios
      .put(`/api/appointments/${id}`, appointment)
      .then((response) => {});
  }

  function getSpotsForDay(state, appointments) {
    const apps = getAppointmentsForDay({ ...state, appointments }, state.day);
    let counter = 0;
    for (const eachApp in apps) {
      if (apps[eachApp]["interview"] === null) counter++;
    }
    return counter;
  }

  function updateSpotsInDays(state, appointments) {
    const spot = getSpotsForDay(state, appointments);
    const dayObj = state.days.find((dayObj) => dayObj.name === state.day);
    const newDay = { ...dayObj };
    newDay["spots"] = spot;
    const newDays = [...state.days].filter(
      (dayObj) => dayObj.name !== state.day
    );
    newDays.push(newDay);
    newDays.sort((a, b) => a.id - b.id);
    return [...newDays];
  }

  function cancelInterview(id) {
    console.log(id);
    const appointment = {
      ...state.appointments[id],
      interview: null,
    };
    const appointments = {
      ...state.appointments,
      [id]: appointment,
    };
    return axios.delete(`/api/appointments/${id}`);
  }
  return { state, setDay, bookInterview, cancelInterview };
}

export default useApplicationData;
