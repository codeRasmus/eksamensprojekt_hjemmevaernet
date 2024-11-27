export function handleUserPrompt(inputSelector, buttonSelector) {
  const inputField = document.getElementById(inputSelector);
  const button = document.getElementById(buttonSelector);
  const userQuestion = document.querySelector(".user_question");
  const botAnswer = document.querySelector(".bot_answer");

  function handleInput() {
    const userPrompt = inputField.value;
    userQuestion.textContent = userPrompt;
    document.getElementById("chat").classList.add("show-username");
    botAnswer.textContent = "Hello, I am far from intelligent yet";
    inputField.value = "";
  }

  function handleKeydown(event) {
    if (event.key === "Enter") {
      handleInput();
    }
  }

  button.addEventListener("click", handleInput);
  inputField.addEventListener("keydown", handleKeydown);
}
