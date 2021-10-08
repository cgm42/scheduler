const SET_DAY = "SET_DAY";
const SET_APPLICATION_DATA = "SET_APPLICATION_DATA";
const SET_INTERVIEW_ONE = "SET_INTERVIEW_ONE";

export default function reducer(state, action) {
  switch (action.type) {
    case SET_DAY:
      return {
        ...state,
        day: action.value,
      };
    case SET_APPLICATION_DATA:
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

function updateSpotsInDays(state, appointments) {
  let counter = 0;
  let nullCounter = 0;
  let newSpotsArr = [];
  for (let appKey in appointments) {
    let app = appointments[appKey];
    if (state.days[counter].appointments.indexOf(app.id) !== -1) {
      if (app.interview === null) nullCounter++;
    } else {
      newSpotsArr.push(nullCounter);
      nullCounter = 0;
      if (app.interview === null) nullCounter++;
      counter++;
    }
  }
  newSpotsArr.push(nullCounter);
  const newDays = state.days.map((dayObj, index) => {
    return { ...dayObj, spots: newSpotsArr[index] };
  });
  newDays.sort((a, b) => a.id - b.id);
  return [...newDays];
}
