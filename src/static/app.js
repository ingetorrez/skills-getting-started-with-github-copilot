document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with formal icon, hidden by default
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section hidden">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants.map(email => `<li><span class="participant-icon">🧑‍🎓</span>${email}</li>`).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section hidden">
              <strong>Participants:</strong>
              <span class="no-participants">No participants yet</span>
            </div>
          `;
        }

        // Add toggle icon for participants panel (👥 for show, ❌ for hide)
        const toggleHTML = `
          <span class="participants-toggle" title="Show participants" style="cursor:pointer;float:right;font-size:1.2em;">👥</span>
        `;

        activityCard.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h4 style="margin-bottom:0;">${name}</h4>
            ${toggleHTML}
          </div>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Add toggle event for participants panel
        const toggleBtn = activityCard.querySelector(".participants-toggle");
        const participantsSection = activityCard.querySelector(".participants-section");
        let visible = false;
        toggleBtn.addEventListener("click", () => {
          visible = !visible;
          if (visible) {
            participantsSection.classList.remove("hidden");
            toggleBtn.textContent = "❌";
            toggleBtn.title = "Hide participants";
          } else {
            participantsSection.classList.add("hidden");
            toggleBtn.textContent = "👥";
            toggleBtn.title = "Show participants";
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper to update participants list in the UI for a given activity
  function addParticipantToUI(activityName, email) {
    // Find the activity card
    const card = Array.from(document.querySelectorAll(".activity-card"))
      .find(div => div.dataset.activityName === activityName);
    if (!card) return;

    // Update spots left
    const availabilityP = card.querySelector(".availability");
    if (availabilityP) {
      // Extract current spots left, subtract 1
      const match = availabilityP.textContent.match(/(\d+)\s+spots left/);
      if (match) {
        const newSpots = Math.max(0, parseInt(match[1], 10) - 1);
        availabilityP.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;
      }
    }

    // Update participants section
    let participantsSection = card.querySelector(".participants-section");
    let participantsList = card.querySelector(".participants-list");
    if (participantsList) {
      // Remove "no participants" if present
      const noPart = participantsSection.querySelector(".no-participants");
      if (noPart) noPart.remove();
      // Add new participant
      const li = document.createElement("li");
      li.innerHTML = `<span class="participant-icon">🧑‍🎓</span>${email}`;
      participantsList.appendChild(li);
    } else if (participantsSection) {
      // If no list yet, create it
      const ul = document.createElement("ul");
      ul.className = "participants-list";
      ul.innerHTML = `<li><span class="participant-icon">🧑‍🎓</span>${email}</li>`;
      participantsSection.appendChild(ul);
      // Remove "no participants" if present
      const noPart = participantsSection.querySelector(".no-participants");
      if (noPart) noPart.remove();
    }

    // Show participants section if it was hidden and just got its first participant
    if (participantsSection && participantsSection.classList.contains("hidden")) {
      // Optionally, you can auto-show or leave hidden; here we leave hidden
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
        signupForm.reset();
        // Update UI immediately
        addParticipantToUI(activity, email);
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
