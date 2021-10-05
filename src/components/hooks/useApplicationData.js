import { useEffect, useState, useReducer } from "react";
import axios from "axios";
import { getAppointmentsForDay } from "helpers/selectors.js";
function useApplicationData() {
  const SET_DAY = "SET_DAY";
  const SET_APPLICATION_DATA = "SET_APPLICATION_DATA";
  const SET_INTERVIEW = "SET_INTERVIEW";
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
        console.log("state :>> ", state);
        console.log("{...state, ...action.value} :>> ", {
          ...state,
          ...action.value,
        });
        return {
          ...state,
          ...action.value,
        };
      case SET_INTERVIEW:
        console.log("state :>> ", state);
        return {
          ...state,
          days: action.value.days,
          appointments: action.value.appointments,
        };
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
    console.log("state :>> ", state);
    return axios
      .put(`/api/appointments/${id}`, appointment)
      .then((response) => {
        const days = updateSpotsInDays(appointments);

        dispatch({
          type: SET_INTERVIEW,
          value: {
            appointments,
            days,
          },
        });
      });
  }

  function getSpotsForDay(appointments) {
    const apps = getAppointmentsForDay({ ...state, appointments }, state.day);
    let counter = 0;
    for (const eachApp in apps) {
      if (apps[eachApp]["interview"] === null) counter++;
    }
    return counter;
  }

  function updateSpotsInDays(appointments) {
    const spot = getSpotsForDay(appointments);
    const dayObj = state.days.find((dayObj) => dayObj.name === state.day);
    const newDay = { ...dayObj };
    newDay["spots"] = spot;
    const newDays = [...state.days].filter(
      (dayObj) => dayObj.name !== state.day
    );
    newDays.push(newDay);
    newDays.sort((a, b) => a.id - b.id);
    console.log("newDays :>> ", newDays);
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
    return axios.delete(`/api/appointments/${id}`).then((response) => {
      const days = updateSpotsInDays(appointments);
      dispatch({ type: SET_INTERVIEW, value: { appointments, days } });
    });
  }
  return { state, setDay, bookInterview, cancelInterview };
}

export default useApplicationData;
