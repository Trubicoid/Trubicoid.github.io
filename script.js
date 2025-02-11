// Generate a random number between 1 and 100
let randomNumber = Math.floor(Math.random() * 100) + 1;

// Get references to HTML elements
const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const message = document.getElementById('message');
const restartButton = document.getElementById('restartButton');
const attemptsDisplay = document.getElementById('attempts'); // Get attempts display element

// Initialize attempts counter
let attempts = 0;

// Function to check the guess
function checkGuess() {
    const userGuess = parseInt(guessInput.value); // Convert input to a number
    attempts++; // Increment attempts
    attemptsDisplay.textContent = "Attempts: " + attempts;  //display attempts

    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        message.textContent = 'Please enter a valid number between 1 and 100.';
        return; // Exit the function if the input is invalid
    }

    if (userGuess === randomNumber) {
        message.textContent = `Congratulations! You guessed the number in ${attempts} attempts!`;
        guessInput.disabled = true; // Disable input after winning
        guessButton.disabled = true; // Disable button after winning
        restartButton.style.display = 'block'; // Show restart button
    } else if (userGuess < randomNumber) {
        message.textContent = 'Too low! Try again.';
    } else {
        message.textContent = 'Too high! Try again.';
    }
}

// Function to restart the game
function restartGame() {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    attemptsDisplay.textContent = ''; //clear the attempts display
    guessInput.value = '';
    message.textContent = '';
    guessInput.disabled = false;
    guessButton.disabled = false;
    restartButton.style.display = 'none';
}

// Event listener for the guess button
guessButton.addEventListener('click', checkGuess);

// Event Listener for Enter Key
guessInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    checkGuess();
  }
});

// Event listener for the restart button
restartButton.addEventListener('click', restartGame);