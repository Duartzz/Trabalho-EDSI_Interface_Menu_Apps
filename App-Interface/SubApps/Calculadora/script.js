const OP_SYMBOLS = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "^": "^",
};

const BINARY_OPS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => (b === 0 ? null : a / b),
  "^": (a, b) => {
    const result = Math.pow(a, b);
    return Number.isFinite(result) ? result : null;
  },
};

const UNARY_OPS = {
  negate: {
    label: "±",
    apply: (n) => -n,
    valid: () => true,
  },
  pow2: {
    label: "sqr",
    apply: (n) => Math.pow(n, 2),
    valid: (n) => Number.isFinite(n),
  },
  sqrt: {
    label: "√",
    apply: (n) => (n < 0 ? null : Math.sqrt(n)),
    valid: (n) => n >= 0,
  },
  log: {
    label: "log",
    apply: (n) => (n <= 0 ? null : Math.log10(n)),
    valid: (n) => n > 0,
  },
  ln: {
    label: "ln",
    apply: (n) => (n <= 0 ? null : Math.log(n)),
    valid: (n) => n > 0,
  },
  round2: {
    label: "round2",
    apply: (n) => Math.round(n * 100) / 100,
    valid: () => true,
  },
  floor: {
    label: "floor",
    apply: (n) => Math.floor(n),
    valid: () => true,
  },
  ceil: {
    label: "ceil",
    apply: (n) => Math.ceil(n),
    valid: () => true,
  },
};

function formatNumber(value) {
  if (!Number.isFinite(value)) return null;
  const rounded = parseFloat(value.toPrecision(12));
  const text = String(rounded);
  return text.replace(".", ",");
}

function parseDisplay(text) {
  return parseFloat(String(text).replace(",", "."));
}

class Calculator {
  constructor() {
    this.clearAll();
  }

  clearAll() {
    this.accumulator = null;
    this.pendingOperator = null;
    this.display = "0";
    this.expression = "0";
    this.replaceDisplay = false;
    this.afterEquals = false;
    this.error = false;
  }

  getState() {
    return {
      expression: this.error ? "Erro" : this.expression,
      display: this.error ? "Erro" : this.display,
      isError: this.error,
    };
  }

  setError() {
    this.error = true;
    this.expression = "Erro";
    this.display = "Erro";
    this.accumulator = null;
    this.pendingOperator = null;
    this.replaceDisplay = false;
    this.afterEquals = false;
  }

  currentValue() {
    return parseDisplay(this.display);
  }

  applyBinary(a, op, b) {
    const fn = BINARY_OPS[op];
    if (!fn) return null;
    const result = fn(a, b);
    if (result === null || !Number.isFinite(result)) return null;
    return result;
  }

  updateExpressionWithCurrentValue() {
    if (this.accumulator === null || !this.pendingOperator) {
      this.expression = this.display;
      return;
    }

    const opSymbol = OP_SYMBOLS[this.pendingOperator];
    const left = formatNumber(this.accumulator);

    if (this.replaceDisplay) {
      this.expression = `${left} ${opSymbol}`;
      return;
    }

    this.expression = `${left} ${opSymbol} ${this.display}`;
  }

  inputDigit(digit) {
    if (this.error) return this.getState();

    if (this.afterEquals) {
      this.accumulator = null;
      this.pendingOperator = null;
      this.display = digit;
      this.expression = digit;
      this.replaceDisplay = false;
      this.afterEquals = false;
      return this.getState();
    }

    if (this.replaceDisplay) {
      this.display = digit;
      this.replaceDisplay = false;
      this.updateExpressionWithCurrentValue();
      return this.getState();
    }

    if (this.display === "0") {
      this.display = digit;
    } else {
      this.display += digit;
    }

    this.updateExpressionWithCurrentValue();
    return this.getState();
  }

  inputDecimal() {
    if (this.error) return this.getState();

    if (this.afterEquals) {
      this.clearAll();
      this.display = "0,";
      this.expression = "0,";
      return this.getState();
    }

    if (this.replaceDisplay) {
      this.display = "0,";
      this.replaceDisplay = false;
      this.updateExpressionWithCurrentValue();
      return this.getState();
    }

    if (!this.display.includes(",")) {
      this.display += ",";
      this.updateExpressionWithCurrentValue();
    }

    return this.getState();
  }

  inputOperator(op) {
    if (this.error) return this.getState();

    const inputValue = this.currentValue();
    if (!Number.isFinite(inputValue)) {
      this.setError();
      return this.getState();
    }

    if (this.afterEquals) {
      this.expression = `${this.display} ${OP_SYMBOLS[op]}`;
      this.accumulator = inputValue;
      this.pendingOperator = op;
      this.replaceDisplay = true;
      this.afterEquals = false;
      return this.getState();
    }

    if (this.accumulator === null) {
      this.accumulator = inputValue;
    } else if (!this.replaceDisplay) {
      const result = this.applyBinary(this.accumulator, this.pendingOperator, inputValue);
      if (result === null) {
        this.setError();
        return this.getState();
      }
      this.accumulator = result;
      this.display = formatNumber(result);
    }

    if (this.replaceDisplay && this.pendingOperator) {
      this.expression = this.expression.replace(/\s[+\−×÷^]\s?$/, ` ${OP_SYMBOLS[op]}`);
    } else if (this.accumulator !== null && !this.replaceDisplay) {
      this.expression = `${this.expression} ${OP_SYMBOLS[op]}`;
    } else {
      this.expression = `${this.display} ${OP_SYMBOLS[op]}`;
    }

    this.pendingOperator = op;
    this.replaceDisplay = true;
    return this.getState();
  }

  equals() {
    if (this.error) return this.getState();

    if (this.accumulator === null || !this.pendingOperator) {
      this.expression = this.display;
      this.afterEquals = true;
      return this.getState();
    }

    if (this.replaceDisplay) {
      this.expression = `${this.display} = ${this.display}`;
      this.afterEquals = true;
      return this.getState();
    }

    const inputValue = this.currentValue();
    const result = this.applyBinary(this.accumulator, this.pendingOperator, inputValue);

    if (result === null) {
      this.setError();
      return this.getState();
    }

    this.expression = `${this.expression} = ${formatNumber(result)}`;
    this.display = formatNumber(result);
    this.accumulator = result;
    this.pendingOperator = null;
    this.replaceDisplay = true;
    this.afterEquals = true;
    return this.getState();
  }

  applyUnary(fnName) {
    if (this.error) return this.getState();

    const unary = UNARY_OPS[fnName];
    if (!unary) return this.getState();

    const value = this.currentValue();
    if (!Number.isFinite(value) || !unary.valid(value)) {
      this.setError();
      return this.getState();
    }

    const result = unary.apply(value);
    if (result === null || !Number.isFinite(result)) {
      this.setError();
      return this.getState();
    }

    const formatted = formatNumber(result);

    if (fnName === "negate") {
      if (this.accumulator !== null && this.pendingOperator && !this.replaceDisplay) {
        const opSymbol = OP_SYMBOLS[this.pendingOperator];
        const left = formatNumber(this.accumulator);
        this.expression = `${left} ${opSymbol} ${formatted}`;
      } else {
        this.expression = formatted;
      }
    } else if (unary.label === "sqr") {
      const operand = this.display;
      const unaryExpr = `${operand}²`;
      if (this.accumulator !== null && this.pendingOperator && !this.replaceDisplay) {
        const opSymbol = OP_SYMBOLS[this.pendingOperator];
        const left = formatNumber(this.accumulator);
        this.expression = `${left} ${opSymbol} ${unaryExpr}`;
      } else {
        this.expression = `${unaryExpr} = ${formatted}`;
      }
    } else {
      const unaryExpr = `${unary.label}(${this.display})`;
      if (this.accumulator !== null && this.pendingOperator && !this.replaceDisplay) {
        const opSymbol = OP_SYMBOLS[this.pendingOperator];
        const left = formatNumber(this.accumulator);
        this.expression = `${left} ${opSymbol} ${unaryExpr}`;
      } else {
        this.expression = `${unaryExpr} = ${formatted}`;
      }
    }

    this.display = formatted;
    this.afterEquals = false;
    return this.getState();
  }

  backspace() {
    if (this.error) return this.getState();

    if (this.afterEquals || this.replaceDisplay) {
      this.clearAll();
      return this.getState();
    }

    if (this.display.length <= 1 || (this.display.length === 2 && this.display.startsWith("-"))) {
      this.display = "0";
    } else {
      this.display = this.display.slice(0, -1);
    }

    this.updateExpressionWithCurrentValue();
    return this.getState();
  }
}

const calculator = new Calculator();
const expressionEl = document.getElementById("expression");
const displayEl = document.getElementById("display");
const keypad = document.querySelector(".keypad");

function render() {
  const state = calculator.getState();
  expressionEl.textContent = state.expression;
  displayEl.textContent = state.display;
  displayEl.classList.toggle("error", state.isError);
}

function handleAction(action, target) {
  switch (action) {
    case "clear":
      calculator.clearAll();
      break;
    case "backspace":
      calculator.backspace();
      break;
    case "digit":
      calculator.inputDigit(target.dataset.digit);
      break;
    case "decimal":
      calculator.inputDecimal();
      break;
    case "operator":
      calculator.inputOperator(target.dataset.op);
      break;
    case "equals":
      calculator.equals();
      break;
    case "unary":
      calculator.applyUnary(target.dataset.fn);
      break;
    default:
      break;
  }

  render();
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  handleAction(button.dataset.action, button);
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^\d$/.test(key)) {
    event.preventDefault();
    calculator.inputDigit(key);
    render();
    return;
  }

  if (key === "," || key === ".") {
    event.preventDefault();
    calculator.inputDecimal();
    render();
    return;
  }

  if (key === "+") {
    event.preventDefault();
    calculator.inputOperator("+");
    render();
    return;
  }

  if (key === "-") {
    event.preventDefault();
    calculator.inputOperator("-");
    render();
    return;
  }

  if (key === "*") {
    event.preventDefault();
    calculator.inputOperator("*");
    render();
    return;
  }

  if (key === "/") {
    event.preventDefault();
    calculator.inputOperator("/");
    render();
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculator.equals();
    render();
    return;
  }

  if (key === "Escape") {
    event.preventDefault();
    calculator.clearAll();
    render();
    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    calculator.backspace();
    render();
  }
});

render();
