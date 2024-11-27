export function handleUserPrompt(inputSelector, buttonSelector) {
  const inputField = document.getElementById(inputSelector);
  const button = document.getElementById(buttonSelector);
  button.addEventListener("click", () => {
    const userPrompt = inputField.value;
    console.log(userPrompt);
    inputField.value = "";
  });
}
