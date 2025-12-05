// DOM elements: simple names for parts of the webpage we use often (like shortcuts)
const el = {
  wordDisplay: document.querySelector(".word-display"), // The box that shows the word with blanks or letters
  guessesText: document.querySelector(".guesses-text b"), // The text that shows how many wrong guesses you have
  keyboardDiv: document.querySelector(".keyboard"), // The area that holds the on-screen letter buttons
  hangmanImage: document.querySelector(".hangman-box img"), // The picture that shows the hangman drawing as you guess wrong
  gameModal: document.querySelector(".game-modal"), // The pop-up box that appears when you win or lose
  playAgainBtn: document.querySelector(".game-modal button"), // The button in the pop-up to start a new game
  hintText: document.querySelector(".hint-text b"), // The text that shows a clue for the word
  lbModal: document.querySelector(".leaderboard-modal"), // The leaderboard pop-up
  viewLbBtn: document.getElementById("view-leaderboard"), // Button to open leaderboard
  closeLbBtn: document.querySelector(".close-lb"), // Button to close leaderboard
  topScoresUl: document.querySelector(".top-scores"), // List for top scores
  nameModal: document.querySelector(".name-modal"), // Modal for entering name
  nameInput: document.getElementById("user-name-input"), // Input for name
  setNameBtn: document.getElementById("set-name") // Button to set name
};

// Sounds: audio clips we play for different things in the game
const s = {
  win: document.getElementById("win-sound"), // The happy sound when you win
  lose: document.getElementById("lose-sound"), // The sad sound when you lose
  correct: document.getElementById("correct-sound"), // The sound when you guess a letter right
  wrong: document.getElementById("wrong-sound") // The sound when you guess a letter wrong
};

// Play sound: plays one of our sound clips from the beginning
const playSound = (type) => {
  const sound = s[type]; // Pick the sound we want to play
  sound.pause(); // Stop it if it's already playing
  sound.currentTime = 0; // Go back to the start
  sound.play(); // Start playing it
}; // That's the end of the playSound function

// Stop all sounds: turns off every sound in the game
const stopSounds = () => Object.values(s).forEach(sound => { // Go through each sound one by one
  sound.pause(); // Stop it
  sound.currentTime = 0; // Reset it to the beginning
}); // That's the end of the stopSounds function

// State: keeps track of important game details (like variables that remember things)
let currentWord = '', correctLetters = [], wrongGuessCount = 0; // Start with empty word, no correct letters, and zero wrong guesses
let currentUser = localStorage.getItem('currentUser') || ''; // Persistent user name
const maxGuesses = 6; // You can make up to 6 wrong guesses before losing

// Save score: adds the game score to the user's total in storage
const saveScore = (score) => {
  if (!currentUser) return; // Don't save if no user
  try {
    let scores = JSON.parse(localStorage.getItem('hangmanScores') || '{}');
    scores[currentUser] = (scores[currentUser] || 0) + score;
    localStorage.setItem('hangmanScores', JSON.stringify(scores));
  } catch (e) {
    console.error('Error saving score:', e);
  }
};

// Update leaderboard: loads scores from storage, sorts, and displays top 10
const updateLeaderboard = () => {
  try {
    const scores = JSON.parse(localStorage.getItem('hangmanScores') || '{}');
    const sorted = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, score]) => `<li>${name}: <b>${score}</b> points</li>`)
      .join('');
    el.topScoresUl.innerHTML = sorted || '<li>No scores yet!</li>';
  } catch (e) {
    el.topScoresUl.innerHTML = '<li>Error loading scores</li>';
  }
};

// Show name modal: displays the modal for entering name
const showNameModal = () => {
  el.nameInput.value = '';
  el.nameModal.classList.add('show');
};

// Set user: saves the name and starts the game
const setUser = () => {
  const name = el.nameInput.value.trim();
  if (name) {
    currentUser = name;
    localStorage.setItem('currentUser', currentUser);
    el.nameModal.classList.remove('show');
    getRandomWord(); // Start the game
  } else {
    alert('Please enter a name');
  }
};

// Name modal event listeners
el.setNameBtn.addEventListener('click', setUser);
el.nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') setUser();
});

// Leaderboard event listeners
el.viewLbBtn.addEventListener('click', () => {
  updateLeaderboard();
  el.lbModal.classList.add('show');
});
el.closeLbBtn.addEventListener('click', () => {
  el.lbModal.classList.remove('show');
});

// New game: chooses a random word and sets everything back to the start
const getRandomWord = () => {
  const { word, hint } = wordList[Math.floor(Math.random() * wordList.length)]; // Pick a random word and its hint from our list
  currentWord = word.toUpperCase(); // Make the word all uppercase letters
  el.hintText.innerText = hint; // Show the hint on the screen
  correctLetters = []; // Clear out the list of correct letters
  wrongGuessCount = 0; // Reset the wrong guess count to zero
  el.hangmanImage.src = "images/hangman-0.svg"; // Show the empty hangman picture (no drawing yet)
  el.guessesText.innerText = `0 / ${maxGuesses}`; // Show "0 / 6" for guesses
  el.wordDisplay.innerHTML = currentWord.split('').map(() => `<li class="letter"></li>`).join(''); // Make a row of blank spots (like _ _ _ _) for each letter in the word
  el.keyboardDiv.querySelectorAll('button').forEach(btn => btn.disabled = false); // Turn on all the letter buttons so you can click them
  el.gameModal.classList.remove('show'); // Hide the win/lose pop-up
}; // That's the end of the getRandomWord function

// Game over: plays a sound and shows the end screen for win or lose
const gameOver = (isVictory) => {
  const score = correctLetters.length * 2 - wrongGuessCount; // Calculate score: +2 per unique correct letter, -1 per wrong guess
  if (currentUser) {
    saveScore(score); // Automatically save if user is set
  }
  playSound(isVictory ? 'win' : 'lose'); // Play the win sound if you won, or lose sound if you lost
  setTimeout(() => { // Wait 400 milliseconds (a short pause) before showing the pop-up
    const content = el.gameModal.querySelector('.content');
    // Remove any temporary elements from previous game
    content.querySelectorAll('.temp-element').forEach(el => el.remove());
    const key = isVictory ? 'victory' : 'lost', // Pick the right picture name (victory or lost)
      title = isVictory ? 'Congrats!' : 'Game Over!', // Pick the right title
      text = isVictory ? 'You found the word:' : 'The correct word was:'; // Pick the right message
    content.querySelector('img').src = `images/${key}.gif`; // Show the win or lose animated picture
    content.querySelector('h4').innerText = title; // Put the title in the pop-up
    content.querySelector('p').innerHTML = `${text} <b>${currentWord}</b>`; // Put the message and the word in the pop-up (make the word bold)
    
    // Add score display
    const scoreP = document.createElement('p');
    scoreP.innerHTML = `Game Score: <b>${score}</b>`;
    if (currentUser) {
      scoreP.innerHTML += ` (Total: <b>${JSON.parse(localStorage.getItem('hangmanScores') || '{}')[currentUser] || 0}</b>)`;
    }
    scoreP.classList.add('temp-element');
    content.appendChild(scoreP);
    
    // If no user, prompt to join
    if (!currentUser) {
      const joinP = document.createElement('p');
      joinP.innerHTML = 'Enter your name below to join the leaderboard and save your scores!';
      joinP.classList.add('temp-element');
      content.appendChild(joinP);
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Enter your name';
      nameInput.classList.add('temp-element');
      content.appendChild(nameInput);
      
      const joinBtn = document.createElement('button');
      joinBtn.innerText = 'Join Leaderboard';
      joinBtn.classList.add('temp-element');
      joinBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
          currentUser = name;
          localStorage.setItem('currentUser', currentUser);
          saveScore(score);
          joinBtn.innerText = 'Joined!';
          joinBtn.disabled = true;
          // Refresh score display
          scoreP.innerHTML = `Game Score: <b>${score}</b> (Total: <b>${JSON.parse(localStorage.getItem('hangmanScores') || '{}')[currentUser] || 0}</b>)`;
        } else {
          alert('Please enter a name');
        }
      });
      content.appendChild(joinBtn);
    }
    
    el.gameModal.classList.add('show'); // Make the pop-up appear
  }, 400); // End of the wait timer
}; // That's the end of the gameOver function

// Guess handler: checks if a letter is right or wrong and updates the game
const initGame = (button, letter) => {
  letter = letter.toUpperCase(); // Make sure the letter is uppercase
  button.disabled = true; // Turn off the button so you can't click it again
  if (currentWord.includes(letter)) { // If the word has this letter somewhere
    playSound('correct'); // Play the "yay!" sound
    [...currentWord].forEach((l, i) => { // Look at each letter in the word, one by one
      if (l === letter) { // If this spot in the word matches the guessed letter
        const li = el.wordDisplay.querySelectorAll('li')[i]; // Find the blank spot for this position
        li.innerText = l; // Fill in the letter there
        li.classList.add('guessed'); // Add a style to make it look filled in
      } // End of the "if it matches" check
    }); // End of looking at each letter
    correctLetters.push(letter); // Remember that this letter was guessed correctly
  } else { // If the letter is not in the word
    playSound('wrong'); // Play the "oops" sound
    wrongGuessCount++; // Add 1 to the wrong guess count
    el.hangmanImage.src = `images/hangman-${wrongGuessCount}.svg`; // Show the next stage of the hangman drawing
  } // End of the "wrong guess" part
  el.guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`; // Update the screen to show the new wrong guess count
  if (wrongGuessCount === maxGuesses) return gameOver(false); // If you reached 6 wrong guesses, end the game (you lose)
  if (correctLetters.length === new Set(currentWord).size) return gameOver(true); // If you've guessed all the unique letters in the word, end the game (you win)
}; // That's the end of the initGame function

// Keyboard buttons: makes buttons for every letter from A to Z
for (let i = 97; i <= 122; i++) { // Loop through the numbers that make lowercase a to z (97 to 122)
  const button = document.createElement('button'), // Make a new button
    letter = String.fromCharCode(i).toUpperCase(); // Turn the number into a letter (like 'a' becomes 'A')
  button.innerText = letter; // Put the letter on the button
  el.keyboardDiv.appendChild(button); // Add the button to the keyboard area
  button.addEventListener('click', () => initGame(button, letter)); // When clicked, run the guess checker with this button and letter
} // End of the loop that makes all the buttons

// Keydown listener: lets you type letters on your real keyboard to guess
document.addEventListener('keydown', e => { // Listen for any key press on the page
  const letter = e.key.toUpperCase(); // Get what key was pressed and make it uppercase
  if (letter >= 'A' && letter <= 'Z') { // If it's a letter key (A to Z)
    const button = [...el.keyboardDiv.querySelectorAll('button')].find(b => b.innerText === letter); // Find the on-screen button that matches this letter
    if (button && !button.disabled) initGame(button, letter); // If the button exists and isn't turned off yet, make the guess
  } // End of the "if it's a letter" check
}); // End of the key press listener

// Play again: starts a whole new game when you click the button
el.playAgainBtn.addEventListener('click', () => { // Listen for clicks on the "play again" button
  stopSounds(); // Turn off all sounds first
  getRandomWord(); // Start a fresh game with a new word
}); // End of the click listener

// Start: kicks off the very first game when the page loads
if (currentUser) {
  getRandomWord(); // If user already set, start game
} else {
  showNameModal(); // Otherwise, show name entry modal
}