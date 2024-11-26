"use strict";
import { test } from "./module1.js";
console.log(test);

import { fontSizer } from "./fontSizer.js";

const button = document.getElementById("fontSizer");

button.addEventListener("click", () => {
  const resizeFont = fontSizer(); // Initialize the function
  resizeFont(); // Execute the changeFontSize logic
});
