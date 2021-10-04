import { useEffect, useState } from "react";
import axios from "axios";
import {
  getAppointmentsForDay,
  getInterviewersForDay,
} from "helpers/selectors.js";
function useApplicationData() {
  const [state, setState] = useState({
    day: "Monday",
    days: [],
    appointments: {},
    interviewers: {},
  });

  const setDay = (day) => setState({ ...state, day });
  useEffect(() => {
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then((all) => {
      setState((prev) => ({
        ...prev,
        days: [...all[0].data],
        appointments: { ...all[1].data },
        interviewers: { ...all[2].data },
      }));
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
        setState({
          ...state,
          appointments,
          days,
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
      setState({ ...state, appointments, days });
    });
  }
  return { state, setDay, bookInterview, cancelInterview };
}

export default useApplicationData;
