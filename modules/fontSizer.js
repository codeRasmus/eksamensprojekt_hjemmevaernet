export function fontSizer(rootElement = document.documentElement) {
  function changeFontSize() {
    const vars = [
      "--header1",
      "--header2",
      "--header3",
      "--header4",
      "--header5",
      "--paragraph",
    ];
    vars.forEach((variable) => {
      let size = parseFloat(
        getComputedStyle(rootElement)
          .getPropertyValue(variable)
          .replace("rem", "")
      );
      rootElement.style.setProperty(variable, `${size * 1.1}rem`);
    });
  }
  return changeFontSize;
}
