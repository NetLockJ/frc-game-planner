const TBA_OPTS = {
  headers: {
    "X-TBA-Auth-Key":
      "ekEUcDb4JYLbiVENUZ0FM8gGQ0hPy5ocBARAfGGWrreyKi0rtGnCkSv91wRANYZY",
  },
};

// TBA's base API URL
const BASE_URL = "https://www.thebluealliance.com/api/v3";

// Current competition year
const YEAR = new Date().getFullYear();

// Array of all year's events
events = getEvents();
matches = null;

selectedEvent = null;
eventKey = null;

function setEvent(element) {
  selectedEvent = element.value;
  updateEventKey();
  getMatches();
}

function updateEventKey() {
  events.forEach((regional) => {
    if (regional.name == selectedEvent) {
      eventKey = regional.key;
    }
  });
}

async function getEvents() {
  fetch(`${BASE_URL}/events/${YEAR}`, TBA_OPTS)
    .then((r) => r.json())
    .then((data) => {
      events = data;
      datalist = document.getElementById("events");
      for (i = 0; i < data.length; ++i) {
        element = document.createElement("option");
        element.value = data[i].name;
        datalist.appendChild(element);
      }
    })
    .catch(() => {
      alert("TBA fetch failed! Check your internet connection.");
    });
}

async function getMatches() {
  fetch(`${BASE_URL}/event/${eventKey}/matches/simple`, TBA_OPTS)
    .then((r) => r.json())
    .then((data) => {
      matches = data;
      datalist = document.getElementById("match-select");
      for(i = 0; i < data.length; ++i) {
        element = document.createElement("option");
        // remove event key before match
        value = data[i].key.split("_")[1];
        element.value = value;
        element.innerHTML = value;
        datalist.appendChild(element);
      }
    })
    .catch("TBA fetch failed! Check your internet connection.");
}


function updateTeams(element) {
    selectedMatch = element.value;
    matches.forEach((match) => {
        if(selectedMatch == match.key.split("_")[1]) {
            alliances = match.alliances;
            for(i = 1; i <= 3; i++) {
                // put team numbers in robot number elements
                document.getElementById("r" + i).value = alliances.red.team_keys[i - 1].split("frc")[1];
                document.getElementById("b" + i).value = alliances.blue.team_keys[i - 1].split("frc")[1];
            }
        }
    })
}
