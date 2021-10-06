import { useEffect, useReducer } from "react";
import axios from "axios";
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
        if (action.interview === undefined) action.interview = null;
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
      .then((response) => {
        dispatch({ type: SET_INTERVIEW_ONE, id, interview });
      });
  }

  function updateSpotsInDays(state, appointments) {
    let counter = 1;
    let nullCounter = 0;
    let newSpotsArr = [];
    for (let appKey in appointments) {
      let app = appointments[appKey];
      counter++;
      if (app.interview === null) nullCounter++;
      if (counter % 5 === 0) {
        newSpotsArr.push(nullCounter);
        nullCounter = 0;
      }
    }
    console.log("newSpotsArr :>> ", newSpotsArr);
    const newDays = state.days.map((dayObj, index) => {
      return { ...dayObj, spots: newSpotsArr[index] };
    });
    newDays.sort((a, b) => a.id - b.id);
    console.log("newDays :>> ", newDays);
    return newDays;
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
    return axios.delete(`/api/appointments/${id}`).then(() => {
      dispatch({ type: SET_INTERVIEW_ONE, id });
    });
  }

  return { state, setDay, bookInterview, cancelInterview };
}

export function updateSpotsInDays2(state, appointments) {
  let counter = 1;
  let nullCounter = 0;
  let newSpotsArr = [];
  for (let appKey in appointments) {
    let app = appointments[appKey];
    counter++;
    if (app.interview === null) nullCounter++;
    if (counter % 5 === 0) {
      newSpotsArr.push(nullCounter);
      nullCounter = 0;
    }
  }
  console.log("newSpotsArr :>> ", newSpotsArr);
  const newDays = state.days.map((dayObj, index) => {
    return { ...dayObj, spots: newSpotsArr[index] };
  });
  newDays.sort((a, b) => a.id - b.id);
  return newDays;
}

export default useApplicationData;
