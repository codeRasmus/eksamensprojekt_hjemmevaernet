"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";

// GLOBALE VARIABLER & KONSTANTER
const increaseButton = document.getElementById("increaseFont");
const decreaseButton = document.getElementById("decreaseFont");

// SCALINGFACTOR
const increaseFont = fontSizer(1.2);
const decreaseFont = fontSizer(0.8);

// EVENTLISTENERS
increaseButton.addEventListener("click", increaseFont);
decreaseButton.addEventListener("click", decreaseFont);
