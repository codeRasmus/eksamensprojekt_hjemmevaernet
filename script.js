"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";

// GLOBALE VARIABLER & KONSTANTER
const resizerButton = document.getElementById("fontSizer");
const resizeFont = fontSizer();

// EVENTLISTENER SETUP
resizerButton.addEventListener("click", resizeFont);
