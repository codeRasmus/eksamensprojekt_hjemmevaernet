"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";

// GLOBALE VARIABLER & KONSTANTER
const increaseButton = document.getElementById("increaseFont");
const decreaseButton = document.getElementById("decreaseFont");

const scalingFactorUp = 1.1;
const scalingFactorDown = 0.9;

increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));
