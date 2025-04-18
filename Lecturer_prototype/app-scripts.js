// Initialize global variables
let students = { students: [] };
let quizzes = {}; // To store quiz data

// Fetch students data from the JSON file
fetch('student-data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    students = data; // Assign the fetched data to the students object
    console.log("Student data loaded successfully:", students);
  })
  .catch(error => {
    console.error("Error loading student data:", error);
  });

// Fetch quizzes data from the JSON file
fetch('quizzes-data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    quizzes = data; // Assign the fetched data to the quizzes object
    console.log("Quiz data loaded successfully:", quizzes);
  })
  .catch(error => {
    console.error("Error loading quiz data:", error);
  });

// Register Functionality
document.getElementById("register-form")?.addEventListener("submit", function (e) {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();

  // Check if email already exists
  const emailExists = students.students.some(student => student.email === email);
  if (emailExists) {
    alert("This email is already registered. Please use a different email.");
    return;
  }

  // Add new student to the fake database
  const newStudent = {
    id: students.students.length + 1,
    name: name,
    email: email,
    password: password,
    classes: []
  };
  students.students.push(newStudent);

  // Save updated data back to JSON (optional, requires a backend in real-world scenarios)
  console.log("Updated student data:", students);

  // Clear form
  document.getElementById("register-form").reset();

  // Success message
  alert("Registration successful!");
});

// Login Functionality
document.getElementById("login-form")?.addEventListener("submit", function (e) {
  e.preventDefault();

  // Get form values
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  // Find user in the fake database
  const user = students.students.find(student => student.email === email && student.password === password);
  if (user) {
    alert(`Hello, ${user.name}! You are now logged in.`);
    console.log("User logged in:", user);

    // Store user data in sessionStorage
    sessionStorage.setItem("loggedInUser", JSON.stringify(user));
    console.log("Stored in sessionStorage:", sessionStorage.getItem("loggedInUser"));

    // Redirect to dashboard
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid login details. Please try again.");
  }

  // Clear form
  document.getElementById("login-form").reset();
});

// Dashboard Logic
document.addEventListener("DOMContentLoaded", () => {
    // Check if we're already on the login page to prevent infinite loops
    if (window.location.href.includes("login-register.html")) {
      console.log("Already on login page. Skipping redirection.");
      return;
    }
  
    let loggedInUser = null;
  
    try {
      // Safely retrieve and parse the loggedInUser from sessionStorage
      const storedUser = sessionStorage.getItem("loggedInUser");
      if (storedUser) {
        loggedInUser = JSON.parse(storedUser);
        console.log("Retrieved from sessionStorage:", loggedInUser);
      } else {
        console.error("No user data found in sessionStorage.");
      }
    } catch (error) {
      console.error("Error parsing loggedInUser from sessionStorage:", error);
    }
  
    // Check if the user is logged in
    if (!loggedInUser) {
      alert("You must log in first.");
      console.log("Redirecting to login page...");
      window.location.replace("login-register.html"); // Redirect to login page
      return; // Exit the function to prevent further execution
    }
  
    // Load the dashboard for the logged-in user
    loadDashboard(loggedInUser);
  });

// Function to load the dashboard for a specific user
function loadDashboard(user) {
  console.log("Loading dashboard for:", user);

  // Skill Map Section
  const skillCardsContainer = document.getElementById("skill-cards");
  user.classes.forEach(cls => {
    const averageScore =
      (cls.performance.quizzes.reduce((a, b) => a + b, 0) +
       cls.performance.assignments.reduce((a, b) => a + b, 0) +
       cls.performance.finalExam) /
      (cls.performance.quizzes.length + cls.performance.assignments.length + 1);

    const color = averageScore >= 80 ? "bg-green-500" : averageScore >= 50 ? "bg-yellow-500" : "bg-red-500";

    skillCardsContainer.innerHTML += `
      <div class="p-4 rounded-lg ${color} text-white text-center">
        <h3 class="font-bold">${cls.className}</h3>
        <p>Average Score: ${averageScore.toFixed(2)}%</p>
        <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700" onclick="loadQuiz('${cls.className}')">Take Quiz</button>
      </div>
    `;
  });

// Progress Tracking Section
const ctx = document.getElementById("progress-chart")?.getContext("2d");
if (ctx) {
  const progressChart = new Chart(ctx, {
    type: "line",
    data: {
      // Dynamically generate labels for quizzes and final exam
      labels: Array.from({ length: Math.max(3, user.classes[0].performance.quizzes.length) }, (_, i) => `Quiz ${i + 1}`)
                  .concat(user.classes[0].performance.finalExam > 0 ? ["Final Exam"] : []),
      datasets: user.classes.map(cls => {
        // Combine quiz scores and final exam score (if available)
        const scores = [...cls.performance.quizzes];
        if (cls.performance.finalExam > 0) {
          scores.push(cls.performance.finalExam); // Add final exam score if available
        }

        return {
          label: cls.className,
          data: scores, // Use quiz scores and final exam score (if available)
          borderColor: getRandomColor(),
          borderWidth: 2,
          fill: false,
        };
      }),
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
    },
  });
}

// Recommendations Section
const recommendationList = document.getElementById("recommendation-list");
user.classes.forEach(cls => {
  const averageScore =
    (cls.performance.quizzes.reduce((a, b) => a + b, 0) +
     cls.performance.assignments.reduce((a, b) => a + b, 0) +
     cls.performance.finalExam) /
    (cls.performance.quizzes.length + cls.performance.assignments.length + 1);

  if (averageScore < 70) {
    recommendationList.innerHTML += `
      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="font-bold">${cls.className} Recommendations</h3>
        <ul class="list-disc ml-6">
          <li><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(cls.className)}" target="_blank" class="text-blue-600 hover:underline">Watch YouTube Tutorials</a></li>
          <li><a href="https://www.google.com/search?q=${encodeURIComponent(cls.className + ' practice problems')}" target="_blank" class="text-blue-600 hover:underline">Practice Problems</a></li>
          <li><a href="https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(cls.className)}" target="_blank" class="text-blue-600 hover:underline">Khan Academy Lessons</a></li>
        </ul>
      </div>
    `;
  }
});
}

// Helper function to generate random colors for charts
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Function to load quizzes dynamically
function loadQuiz(subject) {
    console.log("Loading quiz for subject:", subject);
  
    // Log the quizzes data for debugging
    console.log("Quizzes data:", quizzes);
  
    const quizSection = document.getElementById("quiz-section");
    const quizForm = document.getElementById("quiz-form");
    quizSection.setAttribute("data-subject", subject); // Store the current subject
    // Clear previous content
    quizForm.innerHTML = "";
  
    // Check if the subject exists in the quizzes data
    if (!quizzes[subject]) {
      console.error(`No quiz data found for subject: ${subject}`);
      alert(`No quiz available for ${subject}.`);
      return;
    }
  
    // Dynamically generate quiz questions
    quizzes[subject]?.forEach((question, index) => {
      console.log("Adding question:", question.question);
  
      // Create a container for the question
      const questionDiv = document.createElement("div");
  
      // Add the question text
      const questionText = document.createElement("p");
      questionText.className = "font-bold";
      questionText.textContent = `${index + 1}. ${question.question}`;
      questionDiv.appendChild(questionText);
  
      // Add the options as radio buttons
      question.options.forEach(option => {
        const label = document.createElement("label");
        label.className = "block";
  
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `q${index}`; // Unique name for each question
        radio.value = option;
        radio.required = true;
  
        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${option}`));
        questionDiv.appendChild(label);
      });
  
      // Append the question to the quiz form
      quizForm.appendChild(questionDiv);
    });
  
    // Add submit button
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "w-full bg-green-600 text-white py-2 rounded hover:bg-green-700";
    submitButton.textContent = "Submit Quiz";
    quizForm.appendChild(submitButton);
  
    // Show the quiz section
    quizSection.classList.remove("hidden");
  
    // Automatically scroll to the quiz section
    quizSection.scrollIntoView({ behavior: "smooth" });
  }
  
 // Handle quiz submission
document.getElementById("quiz-form")?.addEventListener("submit", function (e) {
    e.preventDefault();
  
    const loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
      alert("You must log in first.");
      window.location.href = "login-register.html";
      return;
    }
  
    const resultsContainer = document.getElementById("results-container");
    resultsContainer.innerHTML = ""; // Clear previous results
  
    let score = 0;
    const quizSection = document.getElementById("quiz-section");
    const currentSubject = quizSection.getAttribute("data-subject"); // Get the current subject dynamically
  
    if (!currentSubject || !quizzes[currentSubject]) {
      console.error("No subject selected or invalid subject.");
      alert("An error occurred while loading the quiz results.");
      return;
    }
  
    const totalQuestions = quizzes[currentSubject].length; // Total number of questions in the quiz
  
    quizzes[currentSubject]?.forEach((question, index) => {
      const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
      const isCorrect = selectedOption && selectedOption.value === question.correctAnswer;
      if (isCorrect) {
        score++;
      }
  
      // Determine feedback color
      const feedbackColor = isCorrect ? "bg-green-200" : "bg-red-200";
  
      // Display each question and result with explanation
      resultsContainer.innerHTML += `
        <div class="p-4 rounded-lg ${feedbackColor}">
          <p class="font-bold">${question.question}</p>
          <p>Your answer: ${selectedOption ? selectedOption.value : "Not answered"}</p>
          <p>Correct answer: ${question.correctAnswer}</p>
          <p class="italic text-sm">${question.explanation}</p>
        </div>
      `;
    });
  
    // Calculate percentage score
    const percentageScore = (score / totalQuestions) * 100;
  
    // Display final score as a percentage
    resultsContainer.innerHTML += `
      <div class="p-4 bg-blue-200 rounded-lg text-center">
        <h3 class="font-bold text-lg">Final Score: ${percentageScore.toFixed(2)}%</h3>
      </div>
    `;
  
    // Show results section
    document.getElementById("results-section").classList.remove("hidden");
  
    // Update user's performance data
    const cls = loggedInUser.classes.find(c => c.className === currentSubject);
    if (cls) {
      cls.performance.quizzes.push(percentageScore); // Store raw score for further calculations
      sessionStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
      console.log("Updated user performance:", loggedInUser);
    }
});
