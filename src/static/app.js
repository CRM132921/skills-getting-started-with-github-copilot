document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activityDetails = {};

  function renderActivityCards() {
    activitiesList.innerHTML = "";

    Object.entries(activityDetails).forEach(([name, details]) => {
      const activityCard = document.createElement("article");
      activityCard.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      activityCard.appendChild(title);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule:";
      schedule.append(scheduleLabel, ` ${details.schedule}`);
      activityCard.appendChild(schedule);

      const spotsLeft = details.max_participants - details.participants.length;
      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability:";
      availability.append(availabilityLabel, ` ${spotsLeft} spots left`);
      activityCard.appendChild(availability);

      const participantsSection = document.createElement("div");
      participantsSection.className = "participants";

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      participantsSection.appendChild(participantsHeading);

      if (details.participants.length > 0) {
        const participantsList = document.createElement("ul");
        details.participants.forEach((participant) => {
          const listItem = document.createElement("li");

          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = participant;
          listItem.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove";
          removeButton.setAttribute(
            "aria-label",
            `Unregister ${participant} from ${name}`
          );
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
            </svg>
          `;
          listItem.appendChild(removeButton);
          participantsList.appendChild(listItem);
        });
        participantsSection.appendChild(participantsList);
      } else {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "participants-empty";
        emptyMessage.textContent = "No participants yet";
        participantsSection.appendChild(emptyMessage);
      }

      activityCard.appendChild(participantsSection);
      activitiesList.appendChild(activityCard);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }

      activityDetails = await response.json();
      renderActivityCards();

      if (activitySelect.options.length === 1) {
        Object.keys(activityDetails).forEach((name) => {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        });
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");
    if (!removeButton) {
      return;
    }

    const listItem = removeButton.closest("li");
    const activityCard = removeButton.closest(".activity-card");
    const activityName = activityCard.querySelector("h4").textContent;
    const email = listItem.querySelector(".participant-email").textContent;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to unregister participant");
      }

      const participants = activityDetails[activityName].participants;
      participants.splice(participants.indexOf(email), 1);
      renderActivityCards();
      messageDiv.textContent = result.message;
      messageDiv.className = "success";
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
