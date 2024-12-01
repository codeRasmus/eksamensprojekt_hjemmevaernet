"use strict";

// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { handleUserPrompt } from "./modules/promptHandler.js";
import { storeDataLocal } from "./modules/storageModule.js";
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { toggleBurgerMenu } from "./modules/burgerMenu.js";

// GLOBALE VARIABLER & KONSTANTER
const increaseButton = document.getElementById("increaseFont");
const decreaseButton = document.getElementById("decreaseFont");

const scalingFactorUp = 1.1;
const scalingFactorDown = 0.9;

increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

toggleBurgerMenu();

window.addEventListener("load", async function () {
  loadAni();
  try {
    // fake fetching data
    await fetchData();
  } finally {
    stopLoadAni();
  }
});

async function fetchData() {
  // fake a fetch call
  return new Promise((resolve) => setTimeout(resolve, 2000));
}

handleUserPrompt("userprompt", "sendprompt_btn");
