import dataReducer from "./dataReducer";

import deepFreeze from "deep-freeze";

describe("dataReducer", () => {
  test("returns new state with action SET_INTERVIEW_ONE", () => {
    const oldState = require("./testState.json");
    const state = JSON.parse(JSON.stringify(oldState));
    const id = 1;
    const interview = { student: "Test Student", interviewer: 1 };
    const action = {
      type: "SET_INTERVIEW_ONE",
      id,
      interview,
    };

    deepFreeze(state);
    const newState = dataReducer(state, action);

    expect(newState.appointments[id]["interview"]).toEqual(action.interview);
  });
});
