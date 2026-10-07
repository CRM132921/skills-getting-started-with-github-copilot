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
          listItem.textContent = participant;
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
      const response = await fetch("/activities");
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
        activityDetails[activity].participants.push(email);
        renderActivityCards();
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
